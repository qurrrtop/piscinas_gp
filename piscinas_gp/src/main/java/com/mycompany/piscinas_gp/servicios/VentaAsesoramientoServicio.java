package com.mycompany.piscinas_gp.servicios;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.ClienteEmpresaDAO;
import com.mycompany.piscinas_gp.daos.ClienteParticularDAO;
import com.mycompany.piscinas_gp.daos.EstadoVentaDAO;
import com.mycompany.piscinas_gp.daos.ImagenVentaDAO;
import com.mycompany.piscinas_gp.daos.MetodoPagoDAO;
import com.mycompany.piscinas_gp.daos.VentaAsesoramientoDAO;
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.Cliente;
import com.mycompany.piscinas_gp.modelos.ClienteEmpresa;
import com.mycompany.piscinas_gp.modelos.ClienteParticular;
import com.mycompany.piscinas_gp.modelos.EstadoVenta;
import com.mycompany.piscinas_gp.modelos.MetodoPago;
import com.mycompany.piscinas_gp.modelos.VentaAsesoramiento;
import com.mycompany.piscinas_gp.utils.AlmacenImagenes;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class VentaAsesoramientoServicio {

    private static final Logger logger = LoggerFactory.getLogger(VentaAsesoramientoServicio.class);

    // Regla de negocio: el modulo de servicios solo muestra los asesoramientos ya resueltos
    // (completados y cancelados). Los pendientes se ven en el modulo de pendientes.
    private static final List<String> ESTADOS_HISTORIAL = List.of("cerrada", "cancelada");
    private static final List<String> ESTADOS_PENDIENTES = List.of("pendiente");

    private static final int MAX_IMAGENES_EVIDENCIA = 5;

    private final VentaAsesoramientoDAO ventaAsesoramientoDAO;
    private final ClienteParticularDAO clienteParticularDAO;
    private final ClienteEmpresaDAO clienteEmpresaDAO;
    private final EstadoVentaDAO estadoVentaDAO;
    private final MetodoPagoDAO metodoPagoDAO;
    private final ImagenVentaDAO imagenVentaDAO;
    private final DbConnection dbConn;

    public VentaAsesoramientoServicio(
            VentaAsesoramientoDAO ventaAsesoramientoDAO,
            ClienteParticularDAO clienteParticularDAO,
            ClienteEmpresaDAO clienteEmpresaDAO,
            EstadoVentaDAO estadoVentaDAO,
            MetodoPagoDAO metodoPagoDAO,
            ImagenVentaDAO imagenVentaDAO
    ) {
        this.ventaAsesoramientoDAO = ventaAsesoramientoDAO;
        this.clienteParticularDAO = clienteParticularDAO;
        this.clienteEmpresaDAO = clienteEmpresaDAO;
        this.estadoVentaDAO = estadoVentaDAO;
        this.metodoPagoDAO = metodoPagoDAO;
        this.imagenVentaDAO = imagenVentaDAO;
        this.dbConn = DbConnection.getInstance();
    }

    public List<VentaAsesoramiento> listarAsesoramientos() throws ServiceException {
        try {
            return ventaAsesoramientoDAO.buscarTodos();
        } catch (PersistenceException e) {
            logger.error("Error al listar asesoramientos", e);
            throw new ServiceException("Error al recuperar el historial de asesoramientos", e);
        }
    }

    // El listado no carga las imagenes; eso se ve en el detalle (buscarAsesoramientoPorId)
    public List<VentaAsesoramiento> listarHistorial() throws ServiceException {
        try {
            return ventaAsesoramientoDAO.buscarPorEstados(ESTADOS_HISTORIAL);
        } catch (PersistenceException e) {
            logger.error("Error al listar el historial de asesoramientos", e);
            throw new ServiceException("Error al recuperar el historial de asesoramientos", e);
        }
    }

    public List<VentaAsesoramiento> listarPendientes() throws ServiceException {
        try {
            return ventaAsesoramientoDAO.buscarPorEstados(ESTADOS_PENDIENTES);
        } catch (PersistenceException e) {
            logger.error("Error al listar los asesoramientos pendientes", e);
            throw new ServiceException("Error al recuperar los asesoramientos pendientes", e);
        }
    }

    public VentaAsesoramiento buscarAsesoramientoPorId(Long id) throws ServiceException, BusinessException {
        if (id == null || id <= 0) {
            throw new BusinessException("El id del asesoramiento es invalido");
        }

        try {
            VentaAsesoramiento asesoramiento = ventaAsesoramientoDAO.buscarPorId(id);

            if (asesoramiento == null) {
                throw new BusinessException("No existe un asesoramiento con id " + id);
            }

            asesoramiento.setImagenesEvidencia(imagenVentaDAO.buscarPorVentaId(id));

            return asesoramiento;

        } catch (PersistenceException e) {
            logger.error("Error al buscar el asesoramiento con id {}", id, e);
            throw new ServiceException("Error al buscar el asesoramiento", e);
        }
    }

    public VentaAsesoramiento crearAsesoramiento(
            VentaAsesoramiento asesoramiento,
            Long clienteId,
            Long estadoVentaId,
            Long metodoPagoId
    ) throws ServiceException, BusinessException {

        if (asesoramiento == null) {
            throw new BusinessException("El asesoramiento es requerido");
        }

        try {
            prepararAsesoramiento(asesoramiento, clienteId, estadoVentaId, metodoPagoId, true);

            VentaAsesoramiento asesoramientoCreado = crearEnTransaccion(asesoramiento);

            logger.info("Asesoramiento creado correctamente con id {}", asesoramientoCreado.getId());

            return asesoramientoCreado;

        } catch (PersistenceException | SQLException e) {
            logger.error("Error al crear el asesoramiento", e);
            throw new ServiceException("Error al crear el asesoramiento", e);
        }
    }

    public VentaAsesoramiento actualizarAsesoramiento(
            VentaAsesoramiento asesoramiento,
            Long clienteId,
            Long estadoVentaId,
            Long metodoPagoId
    ) throws ServiceException, BusinessException {

        if (asesoramiento == null || asesoramiento.getId() == null) {
            throw new BusinessException("El ID del asesoramiento es requerido para actualizar");
        }

        try {
            VentaAsesoramiento existente = buscarAsesoramientoPorId(asesoramiento.getId());

            if ("cancelada".equalsIgnoreCase(existente.getEstadoVenta().getNombre())) {
                throw new BusinessException("No se puede editar un asesoramiento cancelado");
            }

            prepararAsesoramiento(asesoramiento, clienteId, estadoVentaId, metodoPagoId, false);

            VentaAsesoramiento asesoramientoActualizado = actualizarEnTransaccion(asesoramiento, existente);

            // recien con el guardado confirmado se borran del disco las imagenes que se quitaron
            borrarImagenesQuitadas(existente.getImagenesEvidencia(), asesoramiento.getImagenesEvidencia());

            logger.info("Asesoramiento actualizado correctamente con id {}", asesoramientoActualizado.getId());

            return asesoramientoActualizado;

        } catch (PersistenceException | SQLException e) {
            logger.error("Error al actualizar el asesoramiento con id {}", asesoramiento.getId(), e);
            throw new ServiceException("Error al actualizar el asesoramiento", e);
        }
    }

    public VentaAsesoramiento cancelarAsesoramiento(Long id) throws ServiceException, BusinessException {
        return cambiarEstado(id, "cancelada");
    }

    public VentaAsesoramiento cerrarAsesoramiento(Long id) throws ServiceException, BusinessException {
        VentaAsesoramiento asesoramiento = buscarAsesoramientoPorId(id);

        // Regla de negocio: la recomendacion/diagnostico es obligatoria recien al cerrar.
        if (asesoramiento.getDiagnostico() == null || asesoramiento.getDiagnostico().isBlank()) {
            throw new BusinessException("Debe cargar una recomendacion antes de cerrar el asesoramiento");
        }

        return cambiarEstado(id, "cerrada");
    }

    private VentaAsesoramiento cambiarEstado(Long id, String nombreEstado) throws ServiceException, BusinessException {
        try {
            VentaAsesoramiento asesoramiento = buscarAsesoramientoPorId(id);

            if (nombreEstado.equalsIgnoreCase(asesoramiento.getEstadoVenta().getNombre())) {
                throw new BusinessException("El asesoramiento ya se encuentra en estado " + nombreEstado);
            }

            EstadoVenta nuevoEstado = estadoVentaDAO.buscarPorNombre(nombreEstado);

            if (nuevoEstado == null) {
                throw new BusinessException("No existe el estado de venta '" + nombreEstado + "'");
            }

            asesoramiento.setEstadoVenta(nuevoEstado);
            asesoramiento.setFechaCierre(LocalDate.now());

            VentaAsesoramiento actualizado = ventaAsesoramientoDAO.actualizar(asesoramiento);

            logger.info("Asesoramiento id {} cambiado a estado {}", id, nombreEstado);

            return actualizado;

        } catch (PersistenceException e) {
            logger.error("Error al cambiar el estado del asesoramiento con id {}", id, e);
            throw new ServiceException("Error al actualizar el estado del asesoramiento", e);
        }
    }

    private void prepararAsesoramiento(
            VentaAsesoramiento asesoramiento,
            Long clienteId,
            Long estadoVentaId,
            Long metodoPagoId,
            boolean esNuevo
    ) throws PersistenceException, BusinessException {

        validarImagenes(asesoramiento.getImagenesEvidencia());

        Cliente cliente = buscarClienteReal(clienteId);
        EstadoVenta estadoVenta = resolverEstadoVenta(estadoVentaId);

        if (esNuevo && "cancelada".equalsIgnoreCase(estadoVenta.getNombre())) {
            throw new BusinessException("No se puede crear un asesoramiento con estado cancelada");
        }

        if (asesoramiento.isCobrado()
                && (asesoramiento.getMonto() == null || asesoramiento.getMonto().compareTo(BigDecimal.ZERO) <= 0)) {
            throw new BusinessException("Debe indicar un monto valido si el asesoramiento se cobra");
        }

        if ("cerrada".equalsIgnoreCase(estadoVenta.getNombre())
                && (asesoramiento.getDiagnostico() == null || asesoramiento.getDiagnostico().isBlank())) {
            throw new BusinessException("Debe cargar una recomendacion para cerrar el asesoramiento");
        }

        // Metodo de pago solo tiene sentido si hay cobro real.
        MetodoPago metodoPago = asesoramiento.isCobrado()
                ? resolverMetodoPago(metodoPagoId)
                : null;

        asesoramiento.setCliente(cliente);
        asesoramiento.setEstadoVenta(estadoVenta);
        asesoramiento.setMetodoPago(metodoPago);

        BigDecimal total = asesoramiento.isCobrado() && asesoramiento.getMonto() != null
                ? asesoramiento.getMonto()
                : BigDecimal.ZERO;

        asesoramiento.setTotal(total);
    }

    private void validarImagenes(List<String> archivos) throws BusinessException {
        if (archivos == null || archivos.isEmpty()) {
            return;
        }

        if (archivos.size() > MAX_IMAGENES_EVIDENCIA) {
            throw new BusinessException("Se pueden adjuntar hasta " + MAX_IMAGENES_EVIDENCIA + " imagenes de evidencia");
        }

        if (new HashSet<>(archivos).size() != archivos.size()) {
            throw new BusinessException("No se puede adjuntar la misma imagen mas de una vez");
        }
    }

    // recien con el guardado confirmado se borran del disco las imagenes que se quitaron
    private void borrarImagenesQuitadas(List<String> anteriores, List<String> nuevas) {
        if (anteriores == null) {
            return;
        }

        for (String archivo : anteriores) {
            if (nuevas == null || !nuevas.contains(archivo)) {
                AlmacenImagenes.borrar(archivo);
            }
        }
    }

    private Cliente buscarClienteReal(Long clienteId) throws PersistenceException, BusinessException {
        if (clienteId == null || clienteId <= 0) {
            throw new BusinessException("El cliente es requerido");
        }

        ClienteParticular particular = clienteParticularDAO.buscarPorId(clienteId);
        if (particular != null) {
            return particular;
        }

        ClienteEmpresa empresa = clienteEmpresaDAO.buscarPorId(clienteId);
        if (empresa != null) {
            return empresa;
        }

        throw new BusinessException("No existe un cliente con id " + clienteId);
    }

    private EstadoVenta resolverEstadoVenta(Long estadoVentaId) throws PersistenceException, BusinessException {
        if (estadoVentaId == null || estadoVentaId <= 0) {
            throw new BusinessException("El estado de venta es requerido");
        }

        EstadoVenta estadoVenta = estadoVentaDAO.buscarPorId(estadoVentaId);
        if (estadoVenta == null) {
            throw new BusinessException("No existe el estado de venta indicado");
        }

        return estadoVenta;
    }

    private MetodoPago resolverMetodoPago(Long metodoPagoId) throws PersistenceException, BusinessException {
        if (metodoPagoId == null || metodoPagoId <= 0) {
            throw new BusinessException("El metodo de pago es requerido");
        }

        MetodoPago metodoPago = metodoPagoDAO.buscarPorId(metodoPagoId);
        if (metodoPago == null) {
            throw new BusinessException("No existe el metodo de pago indicado");
        }

        return metodoPago;
    }

    private VentaAsesoramiento crearEnTransaccion(VentaAsesoramiento asesoramiento)
            throws PersistenceException, SQLException {

        try (Connection conn = dbConn.getConnection()) {
            conn.setAutoCommit(false);

            try {
                VentaAsesoramiento creado = ventaAsesoramientoDAO.crear(asesoramiento, conn);

                imagenVentaDAO.sincronizar(
                        creado.getId(), Collections.emptyList(), asesoramiento.getImagenesEvidencia(), conn
                );

                conn.commit();

                return creado;

            } catch (PersistenceException | SQLException | RuntimeException e) {
                rollbackTransaccion(conn);
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private VentaAsesoramiento actualizarEnTransaccion(
            VentaAsesoramiento asesoramiento, VentaAsesoramiento existente
    ) throws PersistenceException, SQLException {

        try (Connection conn = dbConn.getConnection()) {
            conn.setAutoCommit(false);

            try {
                VentaAsesoramiento actualizado = ventaAsesoramientoDAO.actualizar(asesoramiento, conn);

                imagenVentaDAO.sincronizar(
                        asesoramiento.getId(),
                        existente.getImagenesEvidencia(),
                        asesoramiento.getImagenesEvidencia(),
                        conn
                );

                conn.commit();

                return actualizado;

            } catch (PersistenceException | SQLException | RuntimeException e) {
                rollbackTransaccion(conn);
                throw e;
            } finally {
                conn.setAutoCommit(true);
            }
        }
    }

    private void rollbackTransaccion(Connection conn) {
        try {
            conn.rollback();
        } catch (SQLException e) {
            logger.error("No se pudo revertir la transaccion del asesoramiento", e);
        }
    }
}