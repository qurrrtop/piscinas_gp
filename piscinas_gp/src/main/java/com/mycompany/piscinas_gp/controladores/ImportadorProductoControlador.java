package com.mycompany.piscinas_gp.controladores;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.ProductoDAO;
import com.mycompany.piscinas_gp.dtos.ProductoImportDTO;
import com.mycompany.piscinas_gp.dtos.EstadoImportacion;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.servicios.ImportadorExcelServicio;
import com.mycompany.piscinas_gp.servicios.ImportadorProductoServicio;
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

@WebServlet(name = "ImportadorProductoControlador",
        urlPatterns = {"/productos/importar/preview", "/productos/importar/confirmar"})
@MultipartConfig(maxFileSize = 10 * 1024 * 1024) // 10MB, de sobra para un archivo de ~5MB
public class ImportadorProductoControlador extends HttpServlet {

    private ImportadorExcelServicio importadorExcelServicio;
    private ImportadorProductoServicio importadorProductoServicio;

    @Override
    public void init() throws ServletException {
        importadorExcelServicio = new ImportadorExcelServicio();
        importadorProductoServicio = new ImportadorProductoServicio(
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

    // recibe multipart: parte "archivo" (el .xlsx) + parametro "marcaId"
    private void manejarPreview(HttpServletRequest request, HttpServletResponse response) throws IOException {

        try {
            Part archivoPart = request.getPart("archivo");
            String marcaIdParam = request.getParameter("marcaId");

            if (archivoPart == null) {
                sendJsonResponse(Map.of("error", "Debe adjuntar un archivo"), response, HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            Long marcaId = (marcaIdParam != null && !marcaIdParam.isBlank())
                    ? Long.parseLong(marcaIdParam)
                    : null;

            List<ProductoImportDTO> productos;
            try (InputStream is = archivoPart.getInputStream()) {
                productos = importadorExcelServicio.parsear(is, marcaId);
            }

            productos = importadorProductoServicio.validarDuplicados(productos);

            sendJsonResponse(productos, response, HttpServletResponse.SC_OK);

        } catch (IllegalArgumentException e) {
            sendJsonResponse(Map.of("error", e.getMessage()), response, HttpServletResponse.SC_BAD_REQUEST);
        } catch (ServiceException e) {
            sendJsonResponse(Map.of("error", "Error interno al validar los productos"),
                    response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            sendJsonResponse(Map.of("error", "No se pudo leer el archivo. Verifique que sea un .xlsx valido"),
                    response, HttpServletResponse.SC_BAD_REQUEST);
        }
    }

    // recibe JSON: la lista de ProductoImportDTO tal como salio del preview (el usuario pudo haber editado alguna fila)
    private void manejarConfirmacion(HttpServletRequest request, HttpServletResponse response) throws IOException {

        request.setCharacterEncoding("UTF-8");
        ObjectMapper mapper = new ObjectMapper();

        try {
            List<ProductoImportDTO> productos = mapper.readValue(
                    request.getReader(),
                    new TypeReference<List<ProductoImportDTO>>() {}
            );

            List<ProductoImportDTO> resultado = importadorProductoServicio.confirmarImportacion(productos);
            long insertados = resultado.stream().filter(p -> p.getEstado() == EstadoImportacion.VALIDO).count();

            sendJsonResponse(Map.of(
                    "mensaje", "Importacion finalizada",
                    "insertados", insertados,
                    "productos", resultado
            ), response, HttpServletResponse.SC_OK);

        } catch (ServiceException e) {
            sendJsonResponse(Map.of("error", "Error interno al importar los productos"),
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