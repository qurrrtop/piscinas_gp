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
import com.mycompany.piscinas_gp.daos.VentaProductoDAO;
import com.mycompany.piscinas_gp.dtos.DetalleVentaDTO;
import com.mycompany.piscinas_gp.dtos.VentaDTO;
import com.mycompany.piscinas_gp.dtos.VentaListadoDTO;
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.DetalleVenta;
import com.mycompany.piscinas_gp.modelos.Producto;
import com.mycompany.piscinas_gp.modelos.VentaProducto;
import com.mycompany.piscinas_gp.modelos.ClienteEmpresa;
import com.mycompany.piscinas_gp.modelos.ClienteParticular;
import com.mycompany.piscinas_gp.servicios.VentaProductoServicio;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@WebServlet(
        name = "VentaProductoControlador",
        urlPatterns = {"/ventas/productos", "/ventas/productos/*"}
)

public class VentaProductoControlador extends HttpServlet {

    private VentaProductoServicio ventaProductoServicio;

    //clase controlador, Se ejecuta al inicializar el Servlet.
    //obtiene conexion a bd y instancia el service
    //inyecta DAOs necesarios (ventas, detalles, productos, clientes)
    @Override
    public void init() throws ServletException {
        DbConnection db = DbConnection.getInstance();

        ventaProductoServicio = new VentaProductoServicio(
                new VentaProductoDAO(db),
                new DetalleVentaDAO(db),
                new ProductoDAO(db),
                new ClienteParticularDAO(db),
                new ClienteEmpresaDAO(db),
                new EstadoVentaDAO(db),
                new MetodoPagoDAO(db)
        );
    }

    protected void processRequest(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {
    }

    //maneja peticiones GET: 
    // Sin id url (ventas/producto) lee parametros, llama service y obtiene listado
    //transforma a un dto simplificado y devuelve un 200 ok con json 
    // con ID (/ventas/producto/{id} extrae id de la ruta y busca venta en el servicio
    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        String pathInfo = request.getPathInfo();

        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                String cliente = request.getParameter("cliente");
                String estado = request.getParameter("estado");
                LocalDate fechaDesde = parseFechaOpcional(request.getParameter("fechaDesde"));
                LocalDate fechaHasta = parseFechaOpcional(request.getParameter("fechaHasta"));

                List<VentaProducto> ventas = ventaProductoServicio.listarVentas(cliente, estado, fechaDesde, fechaHasta);

                List<VentaListadoDTO> listado = new ArrayList<>();
                for (VentaProducto v : ventas) {
                    String nombreCliente = (v.getCliente() instanceof ClienteParticular cp)
                            ? cp.getNombre() + " " + cp.getApellido()
                            : ((ClienteEmpresa) v.getCliente()).getRazonSocial();

                    listado.add(new VentaListadoDTO(
                            v.getId(), nombreCliente, v.getEstadoVenta().getNombre(),
                            v.getFechaInicio(), v.getTotal()
                    ));
                }

                sendJsonResponse(listado, response, HttpServletResponse.SC_OK);
                return;

            } else {
                Long id = Long.parseLong(pathInfo.substring(1));

                VentaProducto venta =
                        ventaProductoServicio.buscarVentaPorId(id);

                sendJsonResponse(
                        venta,
                        response,
                        HttpServletResponse.SC_OK
                );
            }

        } catch (NumberFormatException | DateTimeParseException e) {
            sendJsonResponse(
                    java.util.Map.of(
                            "error",
                            "El ID o la fecha enviada no tiene un formato válido"
                    ),
                    response,
                    HttpServletResponse.SC_BAD_REQUEST
            );

        } catch (BusinessException e) {
            sendJsonResponse(
                    java.util.Map.of("error", e.getMessage()),
                    response,
                    HttpServletResponse.SC_NOT_FOUND
            );

        } catch (ServiceException e) {
            sendJsonResponse(
                    java.util.Map.of(
                            "error",
                            "Error interno al procesar la solicitud"
                    ),
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );
        }
    }
    
    //maneja creacion venta (POST /ventas/producto)
    //lee json recibido de peticion y lo mapea a ventaDTO
    //llama service para dar alta, y retorna objeto
    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        ObjectMapper mapper = crearMapper();

        try {
            VentaDTO dto = mapper.readValue(
                    request.getReader(),
                    VentaDTO.class
            );

            VentaProducto venta = crearVentaDesdeDTO(dto);

            VentaProducto ventaCreada =
                    ventaProductoServicio.crearVenta(
                            venta,
                            dto.getClienteId(),
                            dto.getEstadoVentaId(),
                            dto.getMetodoPagoId()
                    );

            sendJsonResponse(
                    ventaCreada,
                    response,
                    HttpServletResponse.SC_CREATED
            );

        } catch (IllegalArgumentException | BusinessException e) {
            sendJsonResponse(
                    java.util.Map.of("error", e.getMessage()),
                    response,
                    HttpServletResponse.SC_BAD_REQUEST
            );

        } catch (ServiceException e) {
            sendJsonResponse(
                    java.util.Map.of(
                            "error",
                            "Error interno al procesar la solicitud"
                    ),
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );
        }
    }
    
    //maneja actualizacion venta existente (PUT /ventas/productos)
    //parsea json a un VentaDTO, valida que contenga id valido
    //actualiza registro por el servicio
    @Override
    protected void doPut(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        ObjectMapper mapper = crearMapper();

        try {
            VentaDTO dto = mapper.readValue(
                    request.getReader(),
                    VentaDTO.class
            );

            if (dto.getId() == null) {
                sendJsonResponse(
                        java.util.Map.of(
                                "error",
                                "El ID de la venta es requerido"
                        ),
                        response,
                        HttpServletResponse.SC_BAD_REQUEST
                );
                return;
            }

            VentaProducto venta = crearVentaDesdeDTO(dto);
            venta.setId(dto.getId());

            VentaProducto ventaActualizada =
                    ventaProductoServicio.actualizarVenta(
                            venta,
                            dto.getClienteId(),
                            dto.getEstadoVentaId(),
                            dto.getMetodoPagoId()
                    );

            sendJsonResponse(
                    ventaActualizada,
                    response,
                    HttpServletResponse.SC_OK
            );

        } catch (IllegalArgumentException | BusinessException e) {
            sendJsonResponse(
                    java.util.Map.of("error", e.getMessage()),
                    response,
                    HttpServletResponse.SC_BAD_REQUEST
            );

        } catch (ServiceException e) {
            sendJsonResponse(
                    java.util.Map.of(
                            "error",
                            "Error interno al procesar la solicitud"
                    ),
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );
        }
    }
    
    //maneja cancelacion/eliminacion 
    //DELTE /ventas/producto/{id}. extrae el id de la url
    //delega al servicio la accion, y devuelve el resultado con estado
    @Override
    protected void doDelete(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws ServletException, IOException {

        String pathInfo = request.getPathInfo();

        try {
            if (pathInfo == null || pathInfo.equals("/")) {
                sendJsonResponse(
                        java.util.Map.of(
                                "error",
                                "El ID de la venta es requerido"
                        ),
                        response,
                        HttpServletResponse.SC_BAD_REQUEST
                );
                return;
            }

            Long id = Long.parseLong(pathInfo.substring(1));

            VentaProducto ventaCancelada =
                    ventaProductoServicio.cancelarVenta(id);

            sendJsonResponse(
                    ventaCancelada,
                    response,
                    HttpServletResponse.SC_OK
            );

        } catch (NumberFormatException e) {
            sendJsonResponse(
                    java.util.Map.of(
                            "error",
                            "El ID debe ser un número"
                    ),
                    response,
                    HttpServletResponse.SC_BAD_REQUEST
            );

        } catch (BusinessException e) {
            sendJsonResponse(
                    java.util.Map.of("error", e.getMessage()),
                    response,
                    HttpServletResponse.SC_NOT_FOUND
            );

        } catch (ServiceException e) {
            sendJsonResponse(
                    java.util.Map.of(
                            "error",
                            "Error interno al procesar la solicitud"
                    ),
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );
        }
    }
    
    //metodo de conversion y mapeo
    //convierte objeto DTO recibido de la vista y convierte lista de detalles
    private VentaProducto crearVentaDesdeDTO(VentaDTO dto) {
        VentaProducto venta = new VentaProducto();

        LocalDate fechaInicio = dto.getFechaInicio() != null
                ? dto.getFechaInicio()
                : LocalDate.now();

        venta.setFecha(
                dto.getFecha() != null
                        ? dto.getFecha()
                        : fechaInicio
        );

        venta.setFechaInicio(fechaInicio);
        venta.setFechaCierre(dto.getFechaCierre());

        venta.setObservacion(
                dto.getObservacion() == null || dto.getObservacion().isBlank()
                        ? "Sin observaciones"
                        : dto.getObservacion()
        );

        venta.setDescuentoGlobal(dto.getDescuentoGlobal());
        venta.setDetallesVenta(
                convertirDetalles(dto.getDetallesVenta())
        );

        return venta;
    }
    
    //reccore la lista items/lineas de la venta recibida dto
    //mapea lista de objetos, asigna id y los valida q no sea nulo
    private List<DetalleVenta> convertirDetalles(
            List<DetalleVentaDTO> detallesDTO
    ) {
        if (detallesDTO == null) {
            return Collections.emptyList();
        }

        List<DetalleVenta> detalles = new ArrayList<>();

        for (DetalleVentaDTO detalleDTO : detallesDTO) {
            if (detalleDTO == null
                    || detalleDTO.getProductoId() == null) {

                throw new IllegalArgumentException(
                        "Cada detalle debe indicar un producto"
                );
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

    //metodos auxiliares y formato json
    
    //convierte cadena de texto a LOCALDATE, si viene nulo devuelve null
    private LocalDate parseFechaOpcional(String fecha) {
        if (fecha == null || fecha.isBlank()) {
            return null;
        }

        return LocalDate.parse(fecha);
    }
    
    // configura y retorna una instancia de ObjectMapper de jackson
    //para q soporte fechas modernas (javaTimeModule)
    //asegura que la fechas LOCALDATE serialicen en formato iso legible
    // en lugar de TIMESTAMPS
    private ObjectMapper crearMapper() {
        ObjectMapper mapper = new ObjectMapper();

        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        return mapper;
    }
    
    //helper de repuestas https (paginas web)
    //configura cabeceras (application/json) y codificacion UTF-8
    //serializa objeto de java a un string JSON y envia respuesta
    private void sendJsonResponse(
            Object value,
            HttpServletResponse response,
            int statusCode
    ) throws IOException {

        ObjectMapper mapper = crearMapper();

        String json = mapper.writeValueAsString(value);

        response.setStatus(statusCode);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        response.getWriter().write(json);
    }

    @Override
    public String getServletInfo() {
        return "Controlador de ventas de productos";
    }
}

