package com.mycompany.piscinas_gp.controladores;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.ProductoDAO;
import com.mycompany.piscinas_gp.dtos.ActualizacionPrecioDTO;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.servicios.ActualizadorPrecioServicio;
import com.mycompany.piscinas_gp.servicios.ImportadorExcelServicio;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

@WebServlet(name = "ActualizadorPrecioControlador",
        urlPatterns = {"/productos/actualizar-precios/preview", "/productos/actualizar-precios/confirmar"})
@MultipartConfig(maxFileSize = 10 * 1024 * 1024)
public class ActualizadorPrecioControlador extends HttpServlet {

    private ActualizadorPrecioServicio actualizadorPrecioServicio;

    @Override
    public void init() throws ServletException {
        actualizadorPrecioServicio = new ActualizadorPrecioServicio(
                new ImportadorExcelServicio(),
                new ProductoDAO(DbConnection.getInstance())
        );
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String path = request.getServletPath();

        if (path.endsWith("/preview")) {
            manejarPreview(request, response);
        } else if (path.endsWith("/confirmar")) {
            manejarConfirmacion(request, response);
        } else {
            sendJsonResponse(Map.of("error", "Ruta no encontrada"), response, HttpServletResponse.SC_NOT_FOUND);
        }
    }

    private void manejarPreview(HttpServletRequest request, HttpServletResponse response) throws IOException {

        try {
            Part archivoPart = request.getPart("archivo");
            String marcaIdParam = request.getParameter("marcaId");

            if (archivoPart == null) {
                sendJsonResponse(Map.of("error", "Debe adjuntar un archivo"), response, HttpServletResponse.SC_BAD_REQUEST);
                return;
            }
            if (marcaIdParam == null || marcaIdParam.isBlank()) {
                sendJsonResponse(Map.of("error", "Debe seleccionar una marca"), response, HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            Long marcaId = Long.parseLong(marcaIdParam);

            List<ActualizacionPrecioDTO> cambios;
            try (InputStream is = archivoPart.getInputStream()) {
                cambios = actualizadorPrecioServicio.previsualizarActualizacion(is, marcaId);
            }

            sendJsonResponse(cambios, response, HttpServletResponse.SC_OK);

        } catch (IllegalArgumentException e) {
            sendJsonResponse(Map.of("error", e.getMessage()), response, HttpServletResponse.SC_BAD_REQUEST);
        } catch (ServiceException e) {
            sendJsonResponse(Map.of("error", "Error interno al comparar los precios"),
                    response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            sendJsonResponse(Map.of("error", "No se pudo leer el archivo. Verifique que sea un .xlsx valido"),
                    response, HttpServletResponse.SC_BAD_REQUEST);
        }
    }

    private void manejarConfirmacion(HttpServletRequest request, HttpServletResponse response) throws IOException {

        request.setCharacterEncoding("UTF-8");
        ObjectMapper mapper = new ObjectMapper();

        try {
            List<ActualizacionPrecioDTO> seleccionadas = mapper.readValue(
                    request.getReader(),
                    new TypeReference<List<ActualizacionPrecioDTO>>() {}
            );

            List<ActualizacionPrecioDTO> actualizados = actualizadorPrecioServicio.confirmarActualizacion(seleccionadas);

            sendJsonResponse(Map.of(
                    "mensaje", "Actualizacion de precios finalizada",
                    "actualizados", actualizados.size()
            ), response, HttpServletResponse.SC_OK);

        } catch (ServiceException e) {
            sendJsonResponse(Map.of("error", "Error interno al actualizar los precios"),
                    response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private void sendJsonResponse(Object value, HttpServletResponse response, int statusCode) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(value);
        response.setStatus(statusCode);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(json);
    }
}