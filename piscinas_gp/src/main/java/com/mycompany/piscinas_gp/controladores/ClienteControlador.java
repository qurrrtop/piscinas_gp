package com.mycompany.piscinas_gp.controladores;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.ClienteEmpresaDAO;
import com.mycompany.piscinas_gp.daos.ClienteParticularDAO;
import com.mycompany.piscinas_gp.daos.VentaDAO;
import com.mycompany.piscinas_gp.dtos.ClienteListadoDTO;
import com.mycompany.piscinas_gp.dtos.ClienteDetalleDTO;
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
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

    private ClienteServicio clienteServicio;

    @Override
    public void init() throws ServletException {
        clienteServicio = new ClienteServicio(
                new ClienteParticularDAO(DbConnection.getInstance()),
                new ClienteEmpresaDAO(DbConnection.getInstance()),
                new VentaDAO(DbConnection.getInstance())
        );
    }
    
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String pathInfo = request.getPathInfo();

        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                List<ClienteListadoDTO> clientes = clienteServicio.listarClientes();
                this.sendJsonResponse(clientes, response, HttpServletResponse.SC_OK);

            } else {
                Long id = Long.parseLong(pathInfo.substring(1));
                ClienteDetalleDTO cliente = clienteServicio.buscarClientePorId(id);
                this.sendJsonResponse(cliente, response, HttpServletResponse.SC_OK);
            }
        } catch (NumberFormatException e) {
            sendJsonResponse(java.util.Map.of("error", "El ID debe ser un número"),
                    response,
                    HttpServletResponse.SC_BAD_REQUEST
            );
        } catch (BusinessException e) {
            sendJsonResponse(java.util.Map.of("error", e.getMessage()),
                    response,
                    HttpServletResponse.SC_NOT_FOUND
            );

        } catch (ServiceException e) {
            sendJsonResponse(java.util.Map.of("error", "Error interno al procesar la solicitud"),
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );
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