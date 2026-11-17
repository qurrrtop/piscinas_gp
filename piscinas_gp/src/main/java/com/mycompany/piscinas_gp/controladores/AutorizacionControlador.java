package com.mycompany.piscinas_gp.controladores;

import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.UsuarioDAO;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.Usuario;
import com.mycompany.piscinas_gp.servicios.AutenticacionServicio;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import java.util.Map;

@WebServlet(name = "AuthController", urlPatterns = {"/auth", "/auth/*"})
public class AutorizacionControlador extends HttpServlet {

    private AutenticacionServicio autenticacionServicio;

    @Override
    public void init() throws ServletException {
        autenticacionServicio = new AutenticacionServicio(new UsuarioDAO(DbConnection.getInstance()));
    }
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String accion = request.getPathInfo();
        if (accion == null) { accion = "/login"; }

        switch (accion) {
            case "/login" ->
                request.getRequestDispatcher("/WEB-INF/vistas/login.jsp")
                       .forward(request, response);
            case "/logout" -> cerrarSesion(request, response);
            default ->
                response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String accion = request.getPathInfo();
        if (accion == null) { accion = "/login"; }

        switch (accion) {
            case "/login" -> procesarLogin(request, response);
            case "/cambiar-password" -> cambiarPassword(request, response);
            case "/codigo-recuperacion" -> generarCodigoRecuperacion(request, response);
            case "/recuperar" -> recuperarPassword(request, response);
            case "/cambiar-email" -> cambiarEmail(request, response);
            default -> response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
    }

    private void procesarLogin(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String email = request.getParameter("email");
        String password = request.getParameter("plainPassword");

        // Validación mínima
        if (email == null || email.trim().isEmpty()
                || password == null || password.trim().isEmpty()) {
            request.setAttribute("errorMessage", "Debe completar todos los campos");
            request.getRequestDispatcher("/WEB-INF/vistas/login.jsp")
                   .forward(request, response);
            return;
        }

        try {
            Usuario usuario = autenticacionServicio.autenticar(email, password);

            if (usuario != null) {
                HttpSession session = request.getSession(true);
                request.changeSessionId();
                session.setAttribute("usuarioLogueado", usuario.getEmail());
                response.sendRedirect(request.getContextPath() + "/dashboard");
                return;
            }

            request.setAttribute("errorMessage", "Correo electrónico o contraseña incorrectos");

        } catch (ServiceException e) {
            request.setAttribute("errorMessage", "No se pudo iniciar sesión, intente de nuevo");
        }

        request.getRequestDispatcher("/WEB-INF/vistas/login.jsp")
               .forward(request, response);
    }

    private void cerrarSesion(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        HttpSession sesion = request.getSession(false);
        if (sesion != null) {
            sesion.invalidate();
        }
        response.sendRedirect(request.getContextPath() + "/auth/login");
    }
    
    private void cambiarPassword(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        // /auth es público para el filtro (el login lo necesita), por eso la sesión se verifica acá
        HttpSession sesion = request.getSession(false);
        if (sesion == null || sesion.getAttribute("usuarioLogueado") == null) {
            enviarJson(response, HttpServletResponse.SC_UNAUTHORIZED,
                    Map.of("error", "Sesión expirada, vuelva a iniciar sesión"));
            return;
        }

        request.setCharacterEncoding("UTF-8");
        String email = (String) sesion.getAttribute("usuarioLogueado");
        String passwordActual = request.getParameter("passwordActual");
        String passwordNueva = request.getParameter("passwordNueva");

        if (passwordActual == null || passwordActual.isEmpty()
                || passwordNueva == null || passwordNueva.isEmpty()) {
            enviarJson(response, HttpServletResponse.SC_BAD_REQUEST,
                    Map.of("error", "Debe completar todos los campos"));
            return;
        }

        try {
            autenticacionServicio.cambiarPassword(email, passwordActual, passwordNueva);
            enviarJson(response, HttpServletResponse.SC_OK,
                    Map.of("mensaje", "Contraseña actualizada correctamente"));

        } catch (BusinessException e) {
            enviarJson(response, HttpServletResponse.SC_BAD_REQUEST, Map.of("error", e.getMessage()));
        } catch (ServiceException e) {
            enviarJson(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    Map.of("error", "Error interno al cambiar la contraseña"));
        }
    }
    
    private void generarCodigoRecuperacion(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        // /auth es público para el filtro, por eso la sesión se verifica acá
        HttpSession sesion = request.getSession(false);
        if (sesion == null || sesion.getAttribute("usuarioLogueado") == null) {
            enviarJson(response, HttpServletResponse.SC_UNAUTHORIZED,
                    Map.of("error", "Sesión expirada, vuelva a iniciar sesión"));
            return;
        }

        request.setCharacterEncoding("UTF-8");
        String email = (String) sesion.getAttribute("usuarioLogueado");
        String passwordActual = request.getParameter("passwordActual");

        if (passwordActual == null || passwordActual.isEmpty()) {
            enviarJson(response, HttpServletResponse.SC_BAD_REQUEST,
                    Map.of("error", "Ingrese su contraseña actual"));
            return;
        }

        try {
            String codigo = autenticacionServicio.generarCodigoRecuperacion(email, passwordActual);
            enviarJson(response, HttpServletResponse.SC_OK, Map.of("codigo", codigo));

        } catch (BusinessException e) {
            enviarJson(response, HttpServletResponse.SC_BAD_REQUEST, Map.of("error", e.getMessage()));
        } catch (ServiceException e) {
            enviarJson(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    Map.of("error", "Error interno al generar el código"));
        }
    }
    
    private void cambiarEmail(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        // /auth es público para el filtro, por eso la sesión se verifica acá
        HttpSession sesion = request.getSession(false);
        if (sesion == null || sesion.getAttribute("usuarioLogueado") == null) {
            enviarJson(response, HttpServletResponse.SC_UNAUTHORIZED,
                    Map.of("error", "Sesión expirada, vuelva a iniciar sesión"));
            return;
        }

        request.setCharacterEncoding("UTF-8");
        String emailActual = (String) sesion.getAttribute("usuarioLogueado");
        String passwordActual = request.getParameter("passwordActual");
        String emailNuevo = request.getParameter("emailNuevo");

        if (passwordActual == null || passwordActual.isEmpty()
                || emailNuevo == null || emailNuevo.isBlank()) {
            enviarJson(response, HttpServletResponse.SC_BAD_REQUEST,
                    Map.of("error", "Debe completar todos los campos"));
            return;
        }

        try {
            String emailGuardado = autenticacionServicio.cambiarEmail(emailActual, passwordActual, emailNuevo);

            // la sesión guarda el correo: se actualiza para que "Mi cuenta" siga encontrando al usuario
            sesion.setAttribute("usuarioLogueado", emailGuardado);

            enviarJson(response, HttpServletResponse.SC_OK,
                    Map.of("mensaje", "Correo actualizado correctamente", "email", emailGuardado));

        } catch (BusinessException e) {
            enviarJson(response, HttpServletResponse.SC_BAD_REQUEST, Map.of("error", e.getMessage()));
        } catch (ServiceException e) {
            enviarJson(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    Map.of("error", "Error interno al cambiar el correo"));
        }
    }

    // este sí es público: se usa cuando el usuario no puede iniciar sesión
    private void recuperarPassword(HttpServletRequest request, HttpServletResponse response)
            throws IOException {

        request.setCharacterEncoding("UTF-8");
        String email = request.getParameter("email");
        String codigo = request.getParameter("codigo");
        String passwordNueva = request.getParameter("passwordNueva");

        if (email == null || email.isBlank() || codigo == null || codigo.isBlank()
                || passwordNueva == null || passwordNueva.isEmpty()) {
            enviarJson(response, HttpServletResponse.SC_BAD_REQUEST,
                    Map.of("error", "Debe completar todos los campos"));
            return;
        }

        try {
            String codigoNuevo = autenticacionServicio.recuperarPassword(email, codigo, passwordNueva);
            enviarJson(response, HttpServletResponse.SC_OK, Map.of(
                    "mensaje", "Contraseña actualizada correctamente",
                    "codigoNuevo", codigoNuevo));

        } catch (BusinessException e) {
            enviarJson(response, HttpServletResponse.SC_BAD_REQUEST, Map.of("error", e.getMessage()));
        } catch (ServiceException e) {
            enviarJson(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    Map.of("error", "Error interno al recuperar la contraseña"));
        }
    }

    private void enviarJson(HttpServletResponse response, int estado, Object cuerpo) throws IOException {
        response.setHeader("Cache-Control", "no-store");
        response.setStatus(estado);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        new ObjectMapper().writeValue(response.getWriter(), cuerpo);
    }
    
    @Override
    public String getServletInfo() {
        return "Short description";
    }
}