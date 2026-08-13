package com.mycompany.piscinas_gp.controladores;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.UnidadMedidaDAO;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.modelos.UnidadMedida;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

@WebServlet(name = "UnidadMedidaControlador", urlPatterns = {"/unidades-medida"})
public class UnidadMedidaControlador extends HttpServlet {

    private final UnidadMedidaDAO unidadMedidaDAO = new UnidadMedidaDAO(DbConnection.getInstance());

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        ObjectMapper mapper = new ObjectMapper();

        try {
            List<UnidadMedida> unidades = unidadMedidaDAO.buscarTodos();
            response.setStatus(HttpServletResponse.SC_OK);
            mapper.writeValue(response.getWriter(), unidades);
        } catch (PersistenceException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\":\"Error al obtener las unidades de medida\"}");
        }
    }
}