package com.mycompany.piscinas_gp.controladores;

import com.google.gson.Gson;
import com.mycompany.piscinas_gp.dtos.MenuItem;
import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.ArrayList;
import java.util.List;

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
        
        System.out.println("URI: " + request.getRequestURI());
        System.out.println("PathInfo: " + request.getPathInfo());
        
        if (action == null || action.equals("/")) {
            action = "/dashboard";
        }
        
        switch (action) {
            case "/dashboard" -> request.getRequestDispatcher("/WEB-INF/vistas/dashboard.jsp").forward(request, response);
            case "/menu" -> handleMenu(request, response);
            case "/principal" -> request.getRequestDispatcher("/WEB-INF/vistas/dashboard/principal/principal.jsp").forward(request, response);
            case "/ventas/historial" -> request.getRequestDispatcher("/WEB-INF/vistas/dashboard/ventas/historial-ventas.jsp").forward(request, response);
            case "/ventas/nueva" -> request.getRequestDispatcher("/WEB-INF/vistas/dashboard/ventas/nueva-venta.jsp").forward(request, response);
            case "/servicios/historial" -> request.getRequestDispatcher("/WEB-INF/vistas/dashboard/servicios/historial-servicios.jsp").forward(request, response);
            case "/servicios/nuevo" -> request.getRequestDispatcher("/WEB-INF/vistas/dashboard/servicios/nuevo-servicio.jsp").forward(request, response);
            case "/pendientes/historial" -> request.getRequestDispatcher("/WEB-INF/vistas/dashboard/pendientes/historial-pendientes.jsp").forward(request, response);
            case "/gestion/productos" -> request.getRequestDispatcher("/WEB-INF/vistas/dashboard/gestion/productos/productos.jsp").forward(request, response);
            case "/gestion/clientes" -> request.getRequestDispatcher("/WEB-INF/vistas/dashboard/gestion/clientes/clientes.jsp").forward(request, response);
            case "/acercade" -> request.getRequestDispatcher("/WEB-INF/vistas/dashboard/acercade/acercade.jsp").forward(request, response);
            default -> response.sendError(HttpServletResponse.SC_NOT_FOUND);
        }
        
    }
    
    protected void handleMenu(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
            
        String path = request.getContextPath();
        
        List <MenuItem> items = new ArrayList<>();
        
        // creamos listas para guardar los items hijos de los menu desplegables
        List <MenuItem> hijosVenta = List.of(
                new MenuItem("Historial", "menu", "notepad-text.svg", "icono de historial", path + "/dashboard/ventas/historial", List.of()),
                new MenuItem("Nueva Venta", "menu", "plus.svg", "icono de signo más", path + "/dashboard/ventas/nueva", List.of())
        );
        
        List <MenuItem> hijosServicio = List.of(
                new MenuItem("Historial", "menu", "notepad-text.svg", "icono de historial", path + "/dashboard/servicios/historial", List.of()),
                new MenuItem("Nuevo Servicio", "menu", "plus.svg", "icono de signo más", path + "/dashboard/servicios/nuevo", List.of())
        );
        
        List <MenuItem> hijosGestion = List.of(
                new MenuItem("Clientes", "menu", "users.svg", "icono clientes", path + "/dashboard/gestion/clientes", List.of()),
                new MenuItem("Productos", "menu", "package.svg", "icono productos", path + "/dashboard/gestion/productos", List.of())
        );
        
        items.add(new MenuItem("Principal", "menu", "house.svg", "icono menu princial", path + "/dashboard/principal", List.of()));
        items.add(new MenuItem("Ventas", "menu", "shopping-cart.svg", "icono ventas", null, hijosVenta));
        items.add(new MenuItem("Servicios", "menu", "hammer.svg", "icono servicios", null, hijosServicio));
        items.add(new MenuItem("Pendientes", "menu", "clipboard-list.svg", "icono pendientes", path + "/dashboard/pendientes/historial", List.of()));
        items.add(new MenuItem("Gestión", "menu", "settings.svg", "icono gestión", null, hijosGestion));
        items.add(new MenuItem("Acerca de", "footer", "info.svg", "icono sugerencia", path + "/dashboard/acercade", List.of()));
        items.add(new MenuItem("Cerrar Sesión", "footer", "log-out.svg", "icono cerrar sesión", path + "/auth/logout", List.of()));
        
        Gson gson = new Gson();
        String json = gson.toJson(items);
        
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(json);
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