package com.mycompany.piscinas_gp.controladores;

import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet(name = "AuthController", urlPatterns = {"/auth", "/auth/*"})
public class AutorizacionControlador extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String accion = request.getPathInfo();
        if (accion == null) { accion = "/login"; }

        switch (accion) {
            case "/login" ->
                request.getRequestDispatcher("/WEB-INF/vistas/login.jsp")
                       .forward(request, response);
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

        // TODO EL CÓDIGO DE ABAJO DEBERÁ ESTAR EN UN TRY CATCH
        
        // Email y password de prueba
        boolean credencialesValidas = email.equals("admin@pool.com") && password.equals("Adminpool1");

        if (credencialesValidas) {
            HttpSession session = request.getSession(true);
            session.setAttribute("usuarioLogueado", email);
            response.sendRedirect(request.getContextPath() + "/dashboard");
        } else {
            request.setAttribute("errorMessage", "Correo electrónico o contraseña incorrectos");
            request.getRequestDispatcher("/WEB-INF/vistas/login.jsp")
                   .forward(request, response);
        }
    }

    @Override
    public String getServletInfo() {
        return "Short description";
    }
}