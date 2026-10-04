package com.mycompany.piscinas_gp.controladores;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.util.Map;
import java.util.UUID;

@WebServlet(name = "ImagenServicioControlador", urlPatterns = {"/imagenes/servicios", "/imagenes/servicios/*"})
@MultipartConfig(maxFileSize = 10 * 1024 * 1024) // 10MB
public class ImagenServicioControlador extends HttpServlet {

    private static final String DIRECTORIO_IMAGENES = System.getProperty("user.home")
            + File.separator + "piscinas_gp_data" + File.separator + "imagenes_servicios";

    @Override
    public void init() throws ServletException {
        File directorio = new File(DIRECTORIO_IMAGENES);
        if (!directorio.exists()) {
            directorio.mkdirs();
        }
    }

    // sube una imagen nueva, le pone un nombre unico y devuelve ese nombre
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        try {
            Part archivoPart = request.getPart("archivo");

            if (archivoPart == null || archivoPart.getSize() == 0) {
                sendJsonResponse(Map.of("error", "Debe adjuntar una imagen"), response, HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            String nombreOriginal = archivoPart.getSubmittedFileName();
            String extension = "";
            if (nombreOriginal != null && nombreOriginal.contains(".")) {
                extension = nombreOriginal.substring(nombreOriginal.lastIndexOf("."));
            }

            // nombre unico para que dos clientes no se pisen subiendo "foto.jpg" al mismo tiempo
            String nombreArchivo = UUID.randomUUID().toString() + extension;
            File destino = new File(DIRECTORIO_IMAGENES, nombreArchivo);

            try (InputStream is = archivoPart.getInputStream()) {
                Files.copy(is, destino.toPath());
            }

            sendJsonResponse(Map.of("archivo", nombreArchivo), response, HttpServletResponse.SC_CREATED);

        } catch (Exception e) {
            sendJsonResponse(Map.of("error", "No se pudo guardar la imagen"), response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    // sirve una imagen ya guardada, dado su nombre: /imagenes/servicios/{nombreArchivo}
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String pathInfo = request.getPathInfo();

        if (pathInfo == null || pathInfo.equals("/")) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Debe indicar el nombre del archivo");
            return;
        }

        String nombreArchivo = pathInfo.substring(1);
        File archivo = new File(DIRECTORIO_IMAGENES, nombreArchivo);

        // evita que alguien pida "../../algo-sensible" y se salga de la carpeta de imagenes
        if (!archivo.getCanonicalPath().startsWith(new File(DIRECTORIO_IMAGENES).getCanonicalPath())) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN);
            return;
        }

        if (!archivo.exists()) {
            response.sendError(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        String contentType = getServletContext().getMimeType(archivo.getName());
        response.setContentType(contentType != null ? contentType : "application/octet-stream");
        response.setContentLengthLong(archivo.length());

        try (InputStream is = Files.newInputStream(archivo.toPath());
                OutputStream os = response.getOutputStream()) {
            is.transferTo(os);
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