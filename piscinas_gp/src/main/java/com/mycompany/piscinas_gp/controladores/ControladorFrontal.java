package com.mycompany.piscinas_gp.controladores;

import java.io.IOException;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebFilter(filterName = "ControladorFrontal", urlPatterns = {"/*"})
public class ControladorFrontal implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {}

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        HttpServletRequest request = (HttpServletRequest) req;
        HttpServletResponse response = (HttpServletResponse) res;

        String uri = request.getRequestURI();
        String contextPath = request.getContextPath();
        String path = uri.substring(contextPath.length());

        // Si el usuario entra a "/" lo redirigimos al login.
        if (path == null || path.equals("/") || path.isEmpty()) {
            response.sendRedirect(request.getContextPath() + "/auth/login");
            return;
        }

        // Rutas públicas: auth y recursos estáticos (css, js, imágenes)
        boolean esRutaPublica = path.startsWith("/auth")
                              || path.startsWith("/assets/");

        HttpSession session = request.getSession(false);
        boolean estaLogueado = (session != null && session.getAttribute("usuarioLogueado") != null);

        if (!esRutaPublica && !estaLogueado) {
            response.sendRedirect(request.getContextPath() + "/auth/login");
            return;
        }

        chain.doFilter(req, res);
    }

    @Override
    public void destroy() {}
}