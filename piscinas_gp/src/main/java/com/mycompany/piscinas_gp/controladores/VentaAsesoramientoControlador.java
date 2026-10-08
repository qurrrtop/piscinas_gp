package com.mycompany.piscinas_gp.controladores;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.ClienteEmpresaDAO;
import com.mycompany.piscinas_gp.daos.ClienteParticularDAO;
import com.mycompany.piscinas_gp.daos.EstadoVentaDAO;
import com.mycompany.piscinas_gp.daos.MetodoPagoDAO;
import com.mycompany.piscinas_gp.daos.VentaAsesoramientoDAO;
import com.mycompany.piscinas_gp.dtos.VentaDTO;
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.VentaAsesoramiento;
import com.mycompany.piscinas_gp.servicios.VentaAsesoramientoServicio;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@WebServlet(
        name = "VentaAsesoramientoControlador",
        urlPatterns = {"/servicios/asesoramientos", "/servicios/asesoramientos/*"}
)
public class VentaAsesoramientoControlador extends HttpServlet {

    private VentaAsesoramientoServicio ventaAsesoramientoServicio;

    @Override
    public void init() throws ServletException {
        DbConnection db = DbConnection.getInstance();

        ventaAsesoramientoServicio = new VentaAsesoramientoServicio(
                new VentaAsesoramientoDAO(db),
                new ClienteParticularDAO(db),
                new ClienteEmpresaDAO(db),
                new EstadoVentaDAO(db),
                new MetodoPagoDAO(db)
        );
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String pathInfo = request.getPathInfo();

        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                List<VentaAsesoramiento> asesoramientos = ventaAsesoramientoServicio.listarAsesoramientos();
                sendJsonResponse(asesoramientos, response, HttpServletResponse.SC_OK);
                return;
            }

            Long id = Long.parseLong(pathInfo.substring(1));
            VentaAsesoramiento asesoramiento = ventaAsesoramientoServicio.buscarAsesoramientoPorId(id);
            sendJsonResponse(asesoramiento, response, HttpServletResponse.SC_OK);

        } catch (NumberFormatException e) {
            sendJsonResponse(java.util.Map.of("error", "El ID enviado no tiene un formato valido"),
                    response, HttpServletResponse.SC_BAD_REQUEST);

        } catch (BusinessException e) {
            sendJsonResponse(java.util.Map.of("error", e.getMessage()),
                    response, HttpServletResponse.SC_NOT_FOUND);

        } catch (ServiceException e) {
            sendJsonResponse(java.util.Map.of("error", "Error interno al procesar la solicitud"),
                    response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String pathInfo = request.getPathInfo();

        if (pathInfo != null && pathInfo.endsWith("/cerrar")) {
            try {
                Long id = Long.parseLong(pathInfo.replace("/cerrar", "").substring(1));
                VentaAsesoramiento cerrado = ventaAsesoramientoServicio.cerrarAsesoramiento(id);
                sendJsonResponse(cerrado, response, HttpServletResponse.SC_OK);

            } catch (NumberFormatException e) {
                sendJsonResponse(java.util.Map.of("error", "El ID debe ser un numero"),
                        response, HttpServletResponse.SC_BAD_REQUEST);
            } catch (BusinessException e) {
                sendJsonResponse(java.util.Map.of("error", e.getMessage()),
                        response, HttpServletResponse.SC_NOT_FOUND);
            } catch (ServiceException e) {
                sendJsonResponse(java.util.Map.of("error", "Error interno al cerrar el asesoramiento"),
                        response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
            return;
        }

        request.setCharacterEncoding("UTF-8");
        ObjectMapper mapper = crearMapper();

        try {
            VentaDTO dto = mapper.readValue(request.getReader(), VentaDTO.class);

            VentaAsesoramiento asesoramiento = crearAsesoramientoDesdeDTO(dto);

            VentaAsesoramiento creado = ventaAsesoramientoServicio.crearAsesoramiento(
                    asesoramiento, dto.getClienteId(), dto.getEstadoVentaId(), dto.getMetodoPagoId()
            );

            sendJsonResponse(creado, response, HttpServletResponse.SC_CREATED);

        } catch (IllegalArgumentException | BusinessException e) {
            sendJsonResponse(java.util.Map.of("error", e.getMessage()),
                    response, HttpServletResponse.SC_BAD_REQUEST);

        } catch (ServiceException e) {
            sendJsonResponse(java.util.Map.of("error", "Error interno al procesar la solicitud"),
                    response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        ObjectMapper mapper = crearMapper();

        try {
            VentaDTO dto = mapper.readValue(request.getReader(), VentaDTO.class);

            if (dto.getId() == null) {
                sendJsonResponse(java.util.Map.of("error", "El ID del asesoramiento es requerido"),
                        response, HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            VentaAsesoramiento asesoramiento = crearAsesoramientoDesdeDTO(dto);
            asesoramiento.setId(dto.getId());

            VentaAsesoramiento actualizado = ventaAsesoramientoServicio.actualizarAsesoramiento(
                    asesoramiento, dto.getClienteId(), dto.getEstadoVentaId(), dto.getMetodoPagoId()
            );

            sendJsonResponse(actualizado, response, HttpServletResponse.SC_OK);

        } catch (IllegalArgumentException | BusinessException e) {
            sendJsonResponse(java.util.Map.of("error", e.getMessage()),
                    response, HttpServletResponse.SC_BAD_REQUEST);

        } catch (ServiceException e) {
            sendJsonResponse(java.util.Map.of("error", "Error interno al procesar la solicitud"),
                    response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String pathInfo = request.getPathInfo();

        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                sendJsonResponse(java.util.Map.of("error", "El ID del asesoramiento es requerido"),
                        response, HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            Long id = Long.parseLong(pathInfo.substring(1));
            VentaAsesoramiento cancelado = ventaAsesoramientoServicio.cancelarAsesoramiento(id);
            sendJsonResponse(cancelado, response, HttpServletResponse.SC_OK);

        } catch (NumberFormatException e) {
            sendJsonResponse(java.util.Map.of("error", "El ID debe ser un numero"),
                    response, HttpServletResponse.SC_BAD_REQUEST);

        } catch (BusinessException e) {
            sendJsonResponse(java.util.Map.of("error", e.getMessage()),
                    response, HttpServletResponse.SC_NOT_FOUND);

        } catch (ServiceException e) {
            sendJsonResponse(java.util.Map.of("error", "Error interno al procesar la solicitud"),
                    response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private VentaAsesoramiento crearAsesoramientoDesdeDTO(VentaDTO dto) {
        VentaAsesoramiento asesoramiento = new VentaAsesoramiento();

        LocalDateTime fechaInicio = dto.getFechaInicio() != null
                ? dto.getFechaInicio()
                : LocalDateTime.now();

        asesoramiento.setFecha(dto.getFecha() != null ? dto.getFecha() : fechaInicio);
        asesoramiento.setFechaInicio(fechaInicio);
        asesoramiento.setFechaCierre(dto.getFechaCierre());

        asesoramiento.setObservacion(
                dto.getObservacion() == null || dto.getObservacion().isBlank()
                        ? "Sin observaciones"
                        : dto.getObservacion()
        );

        asesoramiento.setProblema(dto.getProblema());
        asesoramiento.setDiagnostico(dto.getDiagnostico());
        asesoramiento.setCobrado(dto.isCobrado());
        asesoramiento.setMonto(dto.getMonto());
        asesoramiento.setImagenEvidencia(dto.getImagenEvidencia());

        return asesoramiento;
    }

    private ObjectMapper crearMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }

    private void sendJsonResponse(Object value, HttpServletResponse response, int statusCode)
            throws IOException {

        ObjectMapper mapper = crearMapper();
        String json = mapper.writeValueAsString(value);

        response.setStatus(statusCode);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(json);
    }

    @Override
    public String getServletInfo() {
        return "Controlador de asesoramientos";
    }
}