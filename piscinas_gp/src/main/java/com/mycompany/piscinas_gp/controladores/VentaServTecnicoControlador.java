package com.mycompany.piscinas_gp.controladores;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.ClienteEmpresaDAO;
import com.mycompany.piscinas_gp.daos.ClienteParticularDAO;
import com.mycompany.piscinas_gp.daos.DetalleVentaDAO;
import com.mycompany.piscinas_gp.daos.EstadoVentaDAO;
import com.mycompany.piscinas_gp.daos.MetodoPagoDAO;
import com.mycompany.piscinas_gp.daos.ProductoDAO;
import com.mycompany.piscinas_gp.daos.SubrubroServicioTecnicoDAO;
import com.mycompany.piscinas_gp.daos.VentaServTecnicoDAO;
import com.mycompany.piscinas_gp.dtos.DetalleVentaDTO;
import com.mycompany.piscinas_gp.dtos.VentaDTO;
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.ClienteEmpresa;
import com.mycompany.piscinas_gp.modelos.ClienteParticular;
import com.mycompany.piscinas_gp.modelos.DetalleVenta;
import com.mycompany.piscinas_gp.modelos.Producto;
import com.mycompany.piscinas_gp.modelos.SubrubroServicioTecnico;
import com.mycompany.piscinas_gp.modelos.VentaServTecnico;
import com.mycompany.piscinas_gp.servicios.VentaServTecnicoServicio;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@WebServlet(
        name = "VentaServTecnicoControlador",
        urlPatterns = {"/servicios/tecnicos", "/servicios/tecnicos/*"}
)
public class VentaServTecnicoControlador extends HttpServlet {

    private VentaServTecnicoServicio ventaServTecnicoServicio;

    @Override
    public void init() throws ServletException {
        DbConnection db = DbConnection.getInstance();

        ventaServTecnicoServicio = new VentaServTecnicoServicio(
                new VentaServTecnicoDAO(db),
                new DetalleVentaDAO(db),
                new ProductoDAO(db),
                new SubrubroServicioTecnicoDAO(db),
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
                List<VentaServTecnico> servicios = ventaServTecnicoServicio.listarServicios();
                sendJsonResponse(servicios, response, HttpServletResponse.SC_OK);
                return;
            }

            Long id = Long.parseLong(pathInfo.substring(1));
            VentaServTecnico servicio = ventaServTecnicoServicio.buscarServicioPorId(id);
            sendJsonResponse(servicio, response, HttpServletResponse.SC_OK);

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
                VentaServTecnico servicioCerrado = ventaServTecnicoServicio.cerrarServicio(id);
                sendJsonResponse(servicioCerrado, response, HttpServletResponse.SC_OK);

            } catch (NumberFormatException e) {
                sendJsonResponse(java.util.Map.of("error", "El ID debe ser un numero"),
                        response, HttpServletResponse.SC_BAD_REQUEST);
            } catch (BusinessException e) {
                sendJsonResponse(java.util.Map.of("error", e.getMessage()),
                        response, HttpServletResponse.SC_NOT_FOUND);
            } catch (ServiceException e) {
                sendJsonResponse(java.util.Map.of("error", "Error interno al cerrar el servicio"),
                        response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            }
            return;
        }

        request.setCharacterEncoding("UTF-8");
        ObjectMapper mapper = crearMapper();

        try {
            VentaDTO dto = mapper.readValue(request.getReader(), VentaDTO.class);

            VentaServTecnico servicio = crearServicioDesdeDTO(dto);

            VentaServTecnico servicioCreado = ventaServTecnicoServicio.crearServicio(
                    servicio, dto.getClienteId(), dto.getEstadoVentaId(),
                    dto.getMetodoPagoId(), dto.getSubrubroServicioId()
            );

            sendJsonResponse(servicioCreado, response, HttpServletResponse.SC_CREATED);

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
                sendJsonResponse(java.util.Map.of("error", "El ID del servicio es requerido"),
                        response, HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            VentaServTecnico servicio = crearServicioDesdeDTO(dto);
            servicio.setId(dto.getId());

            VentaServTecnico servicioActualizado = ventaServTecnicoServicio.actualizarServicio(
                    servicio, dto.getClienteId(), dto.getEstadoVentaId(),
                    dto.getMetodoPagoId(), dto.getSubrubroServicioId()
            );

            sendJsonResponse(servicioActualizado, response, HttpServletResponse.SC_OK);

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
                sendJsonResponse(java.util.Map.of("error", "El ID del servicio es requerido"),
                        response, HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            Long id = Long.parseLong(pathInfo.substring(1));
            VentaServTecnico servicioCancelado = ventaServTecnicoServicio.cancelarServicio(id);
            sendJsonResponse(servicioCancelado, response, HttpServletResponse.SC_OK);

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

    private VentaServTecnico crearServicioDesdeDTO(VentaDTO dto) {
        VentaServTecnico servicio = new VentaServTecnico();

        LocalDateTime fechaInicio = dto.getFechaInicio() != null
                ? dto.getFechaInicio()
                : LocalDateTime.now();

        servicio.setFecha(dto.getFecha() != null ? dto.getFecha() : fechaInicio);
        servicio.setFechaInicio(fechaInicio);
        servicio.setFechaCierre(dto.getFechaCierre());
        servicio.setFechaEntrega(dto.getFechaEntrega());

        servicio.setObservacion(
                dto.getObservacion() == null || dto.getObservacion().isBlank()
                        ? "Sin observaciones"
                        : dto.getObservacion()
        );

        servicio.setProblema(dto.getProblema());
        servicio.setDiagnostico(dto.getDiagnostico());
        servicio.setImagenEvidencia(dto.getImagenEvidencia());
        servicio.setManoObra(dto.getManoObra() != null ? dto.getManoObra() : java.math.BigDecimal.ZERO);
        servicio.setDescuentoGlobal(dto.getDescuentoGlobal());

        // subrubro se resuelve y valida de verdad en el Servicio (buscarPorId);
        // acá solo armamos un objeto "cascarón" para que el setter obligatorio no falle.
        servicio.setSubrubroServicio(new SubrubroServicioTecnico(
                dto.getSubrubroServicioId() != null ? dto.getSubrubroServicioId() : 1L, null
        ));

        servicio.setDetallesVenta(convertirDetalles(dto.getDetallesVenta()));

        return servicio;
    }

    private List<DetalleVenta> convertirDetalles(List<DetalleVentaDTO> detallesDTO) {
        if (detallesDTO == null) {
            return Collections.emptyList();
        }

        List<DetalleVenta> detalles = new ArrayList<>();

        for (DetalleVentaDTO detalleDTO : detallesDTO) {
            if (detalleDTO == null || detalleDTO.getProductoId() == null) {
                throw new IllegalArgumentException("Cada detalle debe indicar un producto");
            }

            Producto producto = new Producto();
            producto.setId(detalleDTO.getProductoId());

            DetalleVenta detalle = new DetalleVenta();

            if (detalleDTO.getId() != null) {
                detalle.setId(detalleDTO.getId());
            }

            detalle.setProducto(producto);
            detalle.setCantidad(detalleDTO.getCantidad());

            detalles.add(detalle);
        }

        return detalles;
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
        return "Controlador de servicios tecnicos";
    }
}