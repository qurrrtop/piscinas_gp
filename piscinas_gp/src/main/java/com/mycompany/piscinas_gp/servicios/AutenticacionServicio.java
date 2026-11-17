package com.mycompany.piscinas_gp.servicios;

import at.favre.lib.crypto.bcrypt.BCrypt;
import com.mycompany.piscinas_gp.daos.UsuarioDAO;
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.Usuario;
import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AutenticacionServicio {

    private static final Logger logger = LoggerFactory.getLogger(AutenticacionServicio.class);

    private static final int COSTO_BCRYPT = 12;

    // misma regla que NUEVA_PASSWORD del front
    private static final Pattern PASSWORD_VALIDA =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d@$!%*?&]{8,72}$");
    
    private static final Pattern EMAIL_VALIDO =
            Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    // sin 0/O ni 1/I para que el código se pueda leer y anotar sin confusiones
    private static final String ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int LARGO_CODIGO = 16;

    // intentos fallidos de recuperación permitidos antes de bloquear ese correo por un rato
    private static final int MAX_INTENTOS = 5;
    private static final long BLOQUEO_MS = 10 * 60 * 1000L;

    private final UsuarioDAO usuarioDAO;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, Integer> intentosFallidos = new ConcurrentHashMap<>();
    private final Map<String, Long> bloqueadoHasta = new ConcurrentHashMap<>();

    public AutenticacionServicio(UsuarioDAO usuarioDAO) {
        this.usuarioDAO = usuarioDAO;
    }

    /** Devuelve el usuario si el email existe, está activo y la contraseña coincide; si no, null. */
    public Usuario autenticar(String email, String passwordPlano) throws ServiceException {
        try {
            Usuario usuario = usuarioDAO.buscarPorEmail(email.trim().toLowerCase());

            if (usuario == null || !usuario.isActivo()) {
                return null;
            }

            return coincide(passwordPlano, usuario.getPasswordHash()) ? usuario : null;

        } catch (PersistenceException e) {
            logger.error("Error al autenticar al usuario", e);
            throw new ServiceException("Error al iniciar sesión", e);
        }
    }

    public void cambiarPassword(String email, String passwordActual, String passwordNueva)
            throws ServiceException {
        try {
            Usuario usuario = buscarActivo(email);

            if (!coincide(passwordActual, usuario.getPasswordHash())) {
                throw new BusinessException("La contraseña actual es incorrecta");
            }

            validarPasswordNueva(passwordNueva);

            if (coincide(passwordNueva, usuario.getPasswordHash())) {
                throw new BusinessException("La nueva contraseña debe ser distinta de la actual");
            }

            usuario.setPasswordHash(hashear(passwordNueva));
            usuarioDAO.actualizar(usuario);

            logger.info("Contraseña actualizada para el usuario con ID {}", usuario.getId());

        } catch (PersistenceException e) {
            logger.error("Error al cambiar la contraseña", e);
            throw new ServiceException("Error al cambiar la contraseña", e);
        }
    }
    
    /** Cambia el correo de acceso. Devuelve el correo ya normalizado (sin espacios y en minúsculas). */
    public String cambiarEmail(String emailActual, String passwordActual, String emailNuevo)
            throws ServiceException {
        try {
            Usuario usuario = buscarActivo(emailActual);

            if (!coincide(passwordActual, usuario.getPasswordHash())) {
                throw new BusinessException("La contraseña actual es incorrecta");
            }

            String nuevo = emailNuevo == null ? "" : emailNuevo.trim().toLowerCase();

            if (nuevo.length() < 3 || nuevo.length() > 80 || !EMAIL_VALIDO.matcher(nuevo).matches()) {
                throw new BusinessException("El correo ingresado no es válido");
            }

            if (nuevo.equals(usuario.getEmail())) {
                throw new BusinessException("El correo nuevo debe ser distinto del actual");
            }

            if (usuarioDAO.buscarPorEmail(nuevo) != null) {
                throw new BusinessException("Ese correo ya está en uso");
            }

            usuario.setEmail(nuevo);
            usuarioDAO.actualizar(usuario);

            logger.info("Correo actualizado para el usuario con ID {}", usuario.getId());

            return usuario.getEmail();

        } catch (PersistenceException e) {
            logger.error("Error al cambiar el correo", e);
            throw new ServiceException("Error al cambiar el correo", e);
        }
    }

    /** Genera un código nuevo (reemplaza al anterior). Se devuelve en texto plano una sola vez. */
    public String generarCodigoRecuperacion(String email, String passwordActual) throws ServiceException {
        try {
            Usuario usuario = buscarActivo(email);

            if (!coincide(passwordActual, usuario.getPasswordHash())) {
                throw new BusinessException("La contraseña actual es incorrecta");
            }

            return renovarCodigo(usuario);

        } catch (PersistenceException e) {
            logger.error("Error al generar el código de recuperación", e);
            throw new ServiceException("Error al generar el código de recuperación", e);
        }
    }

    /** Cambia la contraseña con el código de recuperación. Devuelve el código nuevo, que reemplaza al usado. */
    public String recuperarPassword(String email, String codigo, String passwordNueva) throws ServiceException {
        String clave = email.trim().toLowerCase();

        try {
            verificarBloqueo(clave);

            Usuario usuario = usuarioDAO.buscarPorEmail(clave);

            boolean codigoValido = usuario != null
                    && usuario.isActivo()
                    && usuario.getCodigoRecuperacionHash() != null
                    && coincide(normalizarCodigo(codigo), usuario.getCodigoRecuperacionHash());

            if (!codigoValido) {
                registrarFallo(clave);
                // mismo mensaje para "correo inexistente" y "código incorrecto"
                throw new BusinessException("El correo o el código de recuperación son incorrectos");
            }

            validarPasswordNueva(passwordNueva);
            limpiarFallos(clave);

            usuario.setPasswordHash(hashear(passwordNueva));
            String codigoNuevo = renovarCodigo(usuario); // una sola actualización: contraseña y código

            logger.info("Contraseña recuperada con código para el usuario con ID {}", usuario.getId());

            return codigoNuevo;

        } catch (PersistenceException e) {
            logger.error("Error al recuperar la contraseña", e);
            throw new ServiceException("Error al recuperar la contraseña", e);
        }
    }

    // ---------- auxiliares ----------

    private Usuario buscarActivo(String email) throws PersistenceException, BusinessException {
        Usuario usuario = usuarioDAO.buscarPorEmail(email.trim().toLowerCase());

        if (usuario == null || !usuario.isActivo()) {
            throw new BusinessException("No se encontró el usuario");
        }
        return usuario;
    }

    private void validarPasswordNueva(String passwordNueva) throws BusinessException {
        if (passwordNueva == null || !PASSWORD_VALIDA.matcher(passwordNueva).matches()) {
            throw new BusinessException("La nueva contraseña debe tener entre 8 y 72 caracteres, "
                    + "con mayúscula, minúscula y número (solo letras, números y @ $ ! % * ? &)");
        }
    }

    private String renovarCodigo(Usuario usuario) throws PersistenceException {
        String codigo = generarCodigoPlano();
        usuario.setCodigoRecuperacionHash(hashear(normalizarCodigo(codigo)));
        usuarioDAO.actualizar(usuario);
        return codigo;
    }

    private String generarCodigoPlano() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < LARGO_CODIGO; i++) {
            if (i > 0 && i % 4 == 0) {
                sb.append('-');
            }
            sb.append(ALFABETO_CODIGO.charAt(random.nextInt(ALFABETO_CODIGO.length())));
        }
        return sb.toString();
    }

    // acepta el código en minúsculas, con o sin guiones o espacios
    private String normalizarCodigo(String codigo) {
        return codigo == null ? "" : codigo.toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    private String hashear(String texto) {
        return BCrypt.withDefaults().hashToString(COSTO_BCRYPT, texto.toCharArray());
    }

    private boolean coincide(String textoPlano, String hash) {
        try {
            return BCrypt.verifyer().verify(textoPlano.toCharArray(), hash).verified;
        } catch (IllegalArgumentException e) {
            // por si el texto ingresado supera el máximo que soporta BCrypt
            return false;
        }
    }

    // ---------- límite de intentos de recuperación (en memoria: se reinicia al reiniciar el servidor) ----------

    private synchronized void verificarBloqueo(String clave) throws BusinessException {
        Long hasta = bloqueadoHasta.get(clave);

        if (hasta == null) {
            return;
        }

        long restante = hasta - System.currentTimeMillis();
        if (restante > 0) {
            long minutos = restante / 60000 + 1;
            throw new BusinessException("Demasiados intentos fallidos. Vuelva a intentar en "
                    + minutos + " minuto(s)");
        }

        bloqueadoHasta.remove(clave);
        intentosFallidos.remove(clave);
    }

    private synchronized void registrarFallo(String clave) {
        int intentos = intentosFallidos.merge(clave, 1, Integer::sum);

        if (intentos >= MAX_INTENTOS) {
            bloqueadoHasta.put(clave, System.currentTimeMillis() + BLOQUEO_MS);
        }
    }

    private synchronized void limpiarFallos(String clave) {
        intentosFallidos.remove(clave);
        bloqueadoHasta.remove(clave);
    }
}