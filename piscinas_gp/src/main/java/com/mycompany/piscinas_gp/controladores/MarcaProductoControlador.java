package com.mycompany.piscinas_gp.controladores;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.MarcaProductoDAO;
import com.mycompany.piscinas_gp.dtos.MarcaProductoDTO;
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.MarcaProducto;
import com.mycompany.piscinas_gp.servicios.MarcaProductoServicio;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet(name = "MarcaProductoControlador", urlPatterns = {"/marcas", "/marcas/*"})
public class MarcaProductoControlador extends HttpServlet {

    private MarcaProductoServicio marcaProductoServicio;

    @Override
    public void init() throws ServletException {
        marcaProductoServicio = new MarcaProductoServicio(
                new MarcaProductoDAO(DbConnection.getInstance())
        );
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        try {
            boolean incluirInactivas = "true".equalsIgnoreCase(request.getParameter("incluirInactivas"));

            List<MarcaProducto> marcas = incluirInactivas
                    ? marcaProductoServicio.buscarTodas()
                    : marcaProductoServicio.buscarActivas();

            sendJsonResponse(marcas, response, HttpServletResponse.SC_OK);

        } catch (ServiceException e) {
            sendJsonResponse(Map.of("error", "Error interno al obtener las marcas"),
                    response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String pathInfo = request.getPathInfo();

        if (pathInfo != null && pathInfo.endsWith("/reactivar")) {
            try {
                Long id = Long.parseLong(pathInfo.replace("/reactivar", "").substring(1));
                marcaProductoServicio.reactivarMarca(id);
                sendJsonResponse(Map.of("mensaje", "Marca reactivada correctamente"), response, HttpServletResponse.SC_OK);
            } catch (NumberFormatException e) {
                sendJsonResponse(Map.of("error", "El ID debe ser un numero"), response, HttpServletResponse.SC_BAD_REQUEST);
            } catch (BusinessException e) {
                sendJsonResponse(Map.of("error", e.getMessage()), response, HttpServletResponse.SC_NOT_FOUND);
            } catch (ServiceException e) {
                sendJsonResponse(Map.of("error", "Error interno al reactivar la marca"), response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
            return;
        }

        request.setCharacterEncoding("UTF-8");
        ObjectMapper mapper = new ObjectMapper();

        try {
            MarcaProductoDTO dto = mapper.readValue(request.getReader(), MarcaProductoDTO.class);

            MarcaProducto marca = new MarcaProducto();
            marca.setNombre(dto.getNombre());

            MarcaProducto creada = marcaProductoServicio.crearMarca(marca);
            sendJsonResponse(creada, response, HttpServletResponse.SC_CREATED);

        } catch (IllegalArgumentException | BusinessException e) {
            sendJsonResponse(Map.of("error", e.getMessage()), response, HttpServletResponse.SC_BAD_REQUEST);
        } catch (ServiceException e) {
            sendJsonResponse(Map.of("error", "Error interno al crear la marca"), response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        ObjectMapper mapper = new ObjectMapper();

        try {
            MarcaProductoDTO dto = mapper.readValue(request.getReader(), MarcaProductoDTO.class);

            if (dto.getId() == null) {
                sendJsonResponse(Map.of("error", "El ID de la marca es requerido para actualizar"),
                        response, HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            MarcaProducto marca = new MarcaProducto();
            
            marca.setId(dto.getId());
            marca.setNombre(dto.getNombre());
            if (dto.getActivo() != null) {
                marca.setActivo(dto.getActivo());
            }

            MarcaProducto actualizada = marcaProductoServicio.actualizarMarca(marca);
            sendJsonResponse(actualizada, response, HttpServletResponse.SC_OK);

        } catch (IllegalArgumentException | BusinessException e) {
            sendJsonResponse(Map.of("error", e.getMessage()), response, HttpServletResponse.SC_BAD_REQUEST);
        } catch (ServiceException e) {
            sendJsonResponse(Map.of("error", "Error interno al actualizar la marca"), response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String pathInfo = request.getPathInfo();

        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                sendJsonResponse(Map.of("error", "El ID de la marca es requerido"), response, HttpServletResponse.SC_BAD_REQUEST);
                return;
            }
            Long id = Long.parseLong(pathInfo.substring(1));
            marcaProductoServicio.darDeBajaMarca(id);
            sendJsonResponse(Map.of("mensaje", "Marca dada de baja correctamente"), response, HttpServletResponse.SC_OK);

        } catch (NumberFormatException e) {
            sendJsonResponse(Map.of("error", "El ID debe ser un numero"), response, HttpServletResponse.SC_BAD_REQUEST);
        } catch (BusinessException e) {
            sendJsonResponse(Map.of("error", e.getMessage()), response, HttpServletResponse.SC_NOT_FOUND);
        } catch (ServiceException e) {
            sendJsonResponse(Map.of("error", "Error interno al dar de baja la marca"), response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
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