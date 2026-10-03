package com.mycompany.piscinas_gp.controladores;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.SubrubroServicioTecnicoDAO;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.SubrubroServicioTecnico;
import com.mycompany.piscinas_gp.servicios.SubrubroServicioTecnicoServicio;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet(name = "SubrubroServicioTecnicoControlador", urlPatterns = {"/subrubros-servicio-tecnico"})
public class SubrubroServicioTecnicoControlador extends HttpServlet {

    private SubrubroServicioTecnicoServicio subrubroServicio;

    @Override
    public void init() throws ServletException {
        subrubroServicio = new SubrubroServicioTecnicoServicio(
                new SubrubroServicioTecnicoDAO(DbConnection.getInstance())
        );
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        try {
            List<SubrubroServicioTecnico> subrubros = subrubroServicio.buscarTodos();
            sendJsonResponse(subrubros, response, HttpServletResponse.SC_OK);

        } catch (ServiceException e) {
            sendJsonResponse(Map.of("error", "Error interno al obtener los subrubros"),
                    response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private void sendJsonResponse(Object value, HttpServletResponse response, int statusCode)
            throws IOException {

        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(value);

        response.setStatus(statusCode);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(json);
    }
}