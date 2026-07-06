package com.mycompany.piscinas_gp.controladores;

import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "ControladorDashboard", urlPatterns = {"/dashboard", "/dashboard/*"})
public class DashboardControlador extends HttpServlet {

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // ESTO ES PARA SEGURIDAD
        // obtenemos la sesión actual, si no existe le colocamos false para
        // que no cree una nueva, solo queremos saber si existe o no.
        jakarta.servlet.http.HttpSession sesion = request.getSession(false);
        
        // si no hay sesión, o si falta el atributo "usuarioLogueado" redirigimos al login.
        if (sesion == null || sesion.getAttribute("usuarioLogueado") == null) {
            response.sendRedirect(request.getContextPath() + "/auth/login");
            return; // Cortamos la ejecución acá para que no muestre nada más
        }
        
        // si está logueado, manejamos la ruta.
        String action = request.getPathInfo();
        if (action == null || action.equals("/")) {
            action = "/dashboard";
        }
        
        switch (action) {
            case "/dashboard" -> request.getRequestDispatcher("/WEB-INF/vistas/dashboard.jsp").forward(request, response);
            default -> response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
        
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    @Override
    public String getServletInfo() {
        return "Short description";
    }
}