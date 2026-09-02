
package com.mycompany.piscinas_gp.controladores;

//aca lo que hace es recibir json y arma ventaproducto/ ventaasesoramiento /ventaServTecn


//conexion base dato

//import com.mycompany.piscinas_gp.config.DbConnection;



//clienteDAOS en su variantes de empresa y particulas 
//import com.mycompany.piscinas_gp.daos.ClienteEmpresaDAO;
//import com.mycompany.piscinas_gp.daos.ClienteParticularDAO;

//ventadao
//import com.mycompany.piscinas_gp.daos.VentaDAO;
//dto de ventas 
//import com.mycompany.piscinas_gp.dtos.VentaDTO;
//service de ventas

//modelos
//import com.mycompany.piscinas_gp.modelos.Venta;
//import com.mycompany.piscinas_gp.modelos.VentaAsesoramiento;
//import com.mycompany.piscinas_gp.modelos.VentaProducto;
//import com.mycompany.piscinas_gp.modelos.VentaServTecnico;

//servicio venta
//import com.mycompany.piscinas_gp.servicios.VentaServicio;




// imports traen clases que usa el controlador. necesita el objectMapper para Json
// ventaDao para crear el servicio
//los modelos de venta para instanciar
// y clases servlet de jakarta
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
//import java.util.List;
import java.io.IOException;
//excepciones
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
//mapeador
import com.fasterxml.jackson.databind.ObjectMapper;



//define ruta el webServlet. para usar get/post/put
/*
@WebServlet(name = "VentaControlador", urlPatterns = {"/ventas", "/ventas/*"})
public class VentaControlador extends HttpServlet {

    //guarda servicio como atributo servlet
    //para usar en todos los metodos
    
    private VentaServicio ventaServicio;
    
    //init() ejecuta una sola vez al arrancar servlet. crea ventaServicio
    // y se pasa a sus daos. no creo ventaProducto y sus variantes
    // pq dependen de sus request
    @Override
    public void init() throws ServletException {
        
        ventaServicio = new VentaServicio(
                
                new VentaDAO(DbConnection.getInstance()),
                new ClienteParticularDAO(DbConnection.getInstance()),
                new ClienteEmpresaDAO(DbConnection.getInstance())
        
        );        
    }
    
        protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
    }
    
        
    //doGet sirve para consultas. si url es /ventas, lista todas.
        //                        si es /ventas/5, busca la venta con ID 5.
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        String pathInfo = request.getPathInfo();
        
        try {
            if (pathInfo == null || pathInfo.equals("/")){
                
                List<Venta> ventas = ventaServicio.listarVentas();
                sendJsonResponse(ventas, response, HttpServletResponse.SC_OK);                
            
            } else {
            
                Long id = Long.parseLong(pathInfo.substring(1));
                Venta venta = ventaServicio.buscarVentaPorId(id);
                sendJsonResponse(venta, response, HttpServletResponse.SC_OK);
            }
        } catch (NumberFormatException e) {
            sendJsonResponse(java.util.Map.of("error", "el id debe ser un numero"),
                    response,
                    HttpServletResponse.SC_BAD_REQUEST);
        
        } catch (BusinessException e) {
            sendJsonResponse(java.util.Map.of("error",e.getMessage()),
                    response,
                    HttpServletResponse.SC_NOT_FOUND);
        
        } catch (ServiceException e){
            sendJsonResponse(java.util.Map.of("error","error interno al procesar la solicitud"),
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    //doPost() sirve para crear. lee JSON. convierte a VentaDTO
    // arma venta con metodo "crearVentaDesdeDTO(dto)" 
    //y se lo manda al servicio
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        request.setCharacterEncoding("UTF-8");
        ObjectMapper mapper = new ObjectMapper();
        
        try {
            
            VentaDTO dto = mapper.readValue(request.getReader(), VentaDTO.class);
            
            Venta venta = crearVentaDesdeDTO(dto);
            
            Venta ventaCreada = ventaServicio.crearVenta(venta, dto.getClienteId());
        
            sendJsonResponse(ventaCreada, response, HttpServletResponse.SC_CREATED);
       
        } catch (IllegalArgumentException | BusinessException e) {
            
            sendJsonResponse(java.util.Map.of("error", e.getMessage()),
            response,
            HttpServletResponse.SC_BAD_REQUEST);
            
        } catch (ServiceException e ) {
            sendJsonResponse(java.util.Map.of("error", "error interno al crear la venta"),
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
    
    
    //doPut() para actualizar. parecido al doPost() 
    //pero exige que venga con id
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
       
        request.setCharacterEncoding("UTF-8");
        ObjectMapper mapper = new ObjectMapper();
        
        try {
            VentaDTO dto= mapper.readValue(request.getReader(), VentaDTO.class);
            
            if (dto.getId() == null){
                sendJsonResponse(java.util.Map.of("error", "el id de la venta es requerido"),
                        response,
                        HttpServletResponse.SC_BAD_REQUEST);
                
                return;
            }
            
            Venta venta = crearVentaDesdeDTO(dto);
            venta.setId(dto.getId());
            
            Venta ventaActualizada = ventaServicio.actualizarVenta(venta, dto.getClienteId());
            
            sendJsonResponse(ventaActualizada, response, HttpServletResponse.SC_OK);
            
        } catch (IllegalArgumentException | BusinessException e) {
            
            sendJsonResponse(java.util.Map.of("error", e.getMessage()),
                    response,
                    HttpServletResponse.SC_BAD_REQUEST);    
            
        } catch (ServiceException e) {
            sendJsonResponse(java.util.Map.of("error","error interno al actualizar la venta"),
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
        
        //funcion clave. decide q objeto crear segun su tipo de venta
        // si viene producto crea objeto de "VentaProducto".
        //asi con asesoramiento y servicioTecnico
        private Venta crearVentaDesdeDTO(VentaDTO dto) {
            
            Venta venta;
            
            if ("Producto".equalsIgnoreCase(dto.getTipoVenta())) {
                
                VentaProducto ventaProducto = new VentaProducto();
               
                ventaProducto.setDescuentoGlobal(dto.getDescuentoGlobal());
                ventaProducto.setDetallesVenta(dto.getDetallesVenta());
                
                venta = ventaProducto;
                
            } else if ("Asesoramiento".equalsIgnoreCase(dto.getTipoVenta())) {
                
                VentaAsesoramiento ventaAsesoramiento = new VentaAsesoramiento();
                
                ventaAsesoramiento.setProblema(dto.getProblema());
                ventaAsesoramiento.setDiagnostico(dto.getDiagnostico());
                ventaAsesoramiento.setCobrado(dto.isCobrado());
                ventaAsesoramiento.setMonto(dto.getMonto());
                
                venta = ventaAsesoramiento;
                
            } else if ("ServicioTecnico".equalsIgnoreCase(dto.getTipoVenta())) {
                  VentaServTecnico ventaServTecnico = new VentaServTecnico();

                
                ventaServTecnico.setProblema(dto.getProblema());
                ventaServTecnico.setDiagnostico(dto.getDiagnostico());
                ventaServTecnico.setManoObra(dto.getManoObra());
                ventaServTecnico.setFechaEntrega(dto.getFechaEntrega());
                ventaServTecnico.setDetallesVenta(dto.getDetallesVenta());
                
                venta = ventaServTecnico;
        
        } else {
            throw new IllegalArgumentException("tipo de venta invalido");
            
        }
       
        venta.setFecha(dto.getFecha());
        venta.setFechaInicio(dto.getFechaInicio());
        venta.setFechaCierre(dto.getFechaCierre());
        venta.setObservacion(dto.getObservacion());
        venta.setTotal(dto.getTotal());
        
        return venta;
    
    }
    
        
        //este metodo es la que convierte la respuesta JSON y manda al frontend
    private void sendJsonResponse(Object value, HttpServletResponse response, int statusCode)
            throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        
        String json = mapper.writeValueAsString(value);
        
        response.setStatus(statusCode);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        response.getWriter().write(json);
        
        
        
    }
  
        
        
        
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>

*/

//borrar cuando ya esta dto y service
@WebServlet(name = "VentaControlador", urlPatterns = {"/ventas", "/ventas/*"})
public class VentaControlador extends HttpServlet {

    @Override
    public void init() throws ServletException {
        // Por ahora vacio hasta crear VentaServicio
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String pathInfo = request.getPathInfo();

        if (pathInfo == null || pathInfo.equals("/")) {
            sendJsonResponse(
                    java.util.Map.of("mensaje", "Listado de ventas"),
                    response,
                    HttpServletResponse.SC_OK
            );
            return;
        }

        try {
            Long id = Long.parseLong(pathInfo.substring(1));

            sendJsonResponse(
                    java.util.Map.of("mensaje", "Detalle de venta", "id", id),
                    response,
                    HttpServletResponse.SC_OK
            );

        } catch (NumberFormatException e) {
            sendJsonResponse(
                    java.util.Map.of("error", "El ID debe ser un numero"),
                    response,
                    HttpServletResponse.SC_BAD_REQUEST
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

    @Override
    public String getServletInfo() {
        return "VentaControlador";
    }

}




