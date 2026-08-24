package com.mycompany.piscinas_gp.controladores;

import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.daos.CategoriaProductoDAO;
import com.mycompany.piscinas_gp.daos.MarcaProductoDAO;
import com.mycompany.piscinas_gp.daos.ProductoDAO;
import com.mycompany.piscinas_gp.daos.UnidadMedidaDAO;
import com.mycompany.piscinas_gp.dtos.ProductoDTO;
import com.mycompany.piscinas_gp.exceptions.AppException;
import com.mycompany.piscinas_gp.modelos.CategoriaProducto;
import com.mycompany.piscinas_gp.modelos.MarcaProducto;
import com.mycompany.piscinas_gp.modelos.Producto;
import com.mycompany.piscinas_gp.modelos.UnidadMedida;
import com.mycompany.piscinas_gp.servicios.ProductoServicio;
import java.util.List;

@WebServlet(name = "ProductoControlador", urlPatterns = {"/productos"})
public class ProductoControlador extends HttpServlet {

    private final ProductoServicio productoServicio = new ProductoServicio(
            new ProductoDAO(DbConnection.getInstance()),
            new MarcaProductoDAO(DbConnection.getInstance()),
            new CategoriaProductoDAO(DbConnection.getInstance()),
            new UnidadMedidaDAO(DbConnection.getInstance())
    );

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        ObjectMapper mapper = new ObjectMapper();

        try {
            ProductoDTO dto = mapper.readValue(request.getReader(), ProductoDTO.class);

            Producto producto = new Producto();
            producto.setNombre(dto.getNombre());

            if (dto.getDescripcion() != null && !dto.getDescripcion().isBlank()) {
                producto.setDescripcion(dto.getDescripcion());
            }

            producto.setStock(dto.getStock());
            producto.setUmbralStock(dto.getStockMin());
            producto.setPrecioActual(dto.getPrecio());
            producto.setContenido(dto.getContenido());
            producto.setUnidadMedida(new UnidadMedida(dto.getUniMedidaId(), null, null));
            producto.setMarcaProducto(new MarcaProducto(dto.getMarcaId(), null));
            producto.setCategoriaProducto(new CategoriaProducto(dto.getCategoriaId(), null, null));

            Producto creado = productoServicio.crearProducto(producto);

            
            response.setStatus(HttpServletResponse.SC_CREATED);
            mapper.writeValue(response.getWriter(), creado);

        } catch (IllegalArgumentException | AppException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        ObjectMapper mapper = new ObjectMapper();

        try {
            List<Producto> productos = productoServicio.buscarTodosLosProductos();
            response.setStatus(HttpServletResponse.SC_OK);
            mapper.writeValue(response.getWriter(), productos);
        } catch (AppException e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
    
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        ObjectMapper mapper = new ObjectMapper();

        try {
            // Leer el DTO desde el cuerpo de la petición
            ProductoDTO dto = mapper.readValue(request.getReader(), ProductoDTO.class);

            // Validar que tenga ID
            if (dto.getId() == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"error\":\"El ID del producto es requerido para actualizar\"}");
                return;
            }

            // Construir objeto Producto con los datos del DTO
            Producto producto = new Producto();
            producto.setId(dto.getId());
            producto.setNombre(dto.getNombre());

            if (dto.getDescripcion() != null && !dto.getDescripcion().isBlank()) {
                producto.setDescripcion(dto.getDescripcion());
            }

            producto.setStock(dto.getStock());
            producto.setUmbralStock(dto.getStockMin());
            producto.setPrecioActual(dto.getPrecio());
            producto.setContenido(dto.getContenido());
            producto.setUnidadMedida(new UnidadMedida(dto.getUniMedidaId(), null, null));
            producto.setMarcaProducto(new MarcaProducto(dto.getMarcaId(), null));
            producto.setCategoriaProducto(new CategoriaProducto(dto.getCategoriaId(), null, null));

            // Actualizar el producto
            Producto actualizado = productoServicio.actualizarProducto(producto);

            response.setStatus(HttpServletResponse.SC_OK);
            mapper.writeValue(response.getWriter(), actualizado);

        } catch (IllegalArgumentException | AppException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
        }
    }
}