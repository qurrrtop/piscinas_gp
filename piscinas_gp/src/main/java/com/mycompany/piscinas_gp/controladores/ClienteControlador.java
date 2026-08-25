package com.mycompany.piscinas_gp.controladores;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.ClienteEmpresaDAO;
import com.mycompany.piscinas_gp.daos.ClienteParticularDAO;
import com.mycompany.piscinas_gp.daos.VentaDAO;
import com.mycompany.piscinas_gp.dtos.ClienteListadoDTO;
import com.mycompany.piscinas_gp.exceptions.AppException;
import com.mycompany.piscinas_gp.servicios.ClienteServicio;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;

@WebServlet(name = "ClienteControlador", urlPatterns = {"/clientes"})
public class ClienteControlador extends HttpServlet {

    private final ClienteServicio clienteServicio = new ClienteServicio(
            new ClienteParticularDAO(DbConnection.getInstance()),
            new ClienteEmpresaDAO(DbConnection.getInstance()),
            new VentaDAO(DbConnection.getInstance())
    );

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        ObjectMapper mapper = new ObjectMapper();

        try {
            List<ClienteListadoDTO> clientes = clienteServicio.listarClientes();
            response.setStatus(HttpServletResponse.SC_OK);
            mapper.writeValue(response.getWriter(), clientes);
        } catch (AppException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}