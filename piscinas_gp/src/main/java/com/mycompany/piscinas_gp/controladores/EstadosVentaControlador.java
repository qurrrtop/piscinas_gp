package com.mycompany.piscinas_gp.controladores;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.EstadoVentaDAO;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.modelos.EstadoVenta;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

@WebServlet(name = "EstadosVentaControlador", urlPatterns = {"/estados-venta"})
public class EstadosVentaControlador extends HttpServlet {

    private final EstadoVentaDAO estadoVentaDAO =
            new EstadoVentaDAO(DbConnection.getInstance());

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        ObjectMapper mapper = new ObjectMapper();

        try {
            List<EstadoVenta> estadosVenta = estadoVentaDAO.buscarTodos();

            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");

            mapper.writeValue(response.getWriter(), estadosVenta);

        } catch (PersistenceException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write(
                    "{\"error\":\"Error al obtener los estados de venta\"}"
            );
        }
    }
}