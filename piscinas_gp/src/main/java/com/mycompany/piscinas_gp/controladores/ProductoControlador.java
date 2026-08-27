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
import com.mycompany.piscinas_gp.exceptions.BusinessException;
import com.mycompany.piscinas_gp.exceptions.ServiceException;
import com.mycompany.piscinas_gp.modelos.CategoriaProducto;
import com.mycompany.piscinas_gp.modelos.MarcaProducto;
import com.mycompany.piscinas_gp.modelos.Producto;
import com.mycompany.piscinas_gp.modelos.UnidadMedida;
import com.mycompany.piscinas_gp.servicios.ProductoServicio;

import java.util.List;

@WebServlet(name = "ProductoControlador", urlPatterns = {"/productos"})
public class ProductoControlador extends HttpServlet {

    private ProductoServicio productoServicio;

    @Override
    public void init() throws ServletException {
        productoServicio = new ProductoServicio(
                new ProductoDAO(DbConnection.getInstance()),
                new MarcaProductoDAO(DbConnection.getInstance()),
                new CategoriaProductoDAO(DbConnection.getInstance()),
                new UnidadMedidaDAO(DbConnection.getInstance())
        );
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
                        throws ServletException, IOException {

        try {
            List<Producto> productos = productoServicio.buscarTodosLosProductos();

            sendJsonResponse(productos, response, HttpServletResponse.SC_OK);

        } catch (ServiceException e) {

            sendJsonResponse(java.util.Map.of("error", "Error interno al obtener los productos"),
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
                        throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
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

            producto.setUnidadMedida(
                    new UnidadMedida(
                            dto.getUniMedidaId(),
                            null,
                            null
                    )
            );

            producto.setMarcaProducto(
                    new MarcaProducto(
                            dto.getMarcaId(),
                            null
                    )
            );

            producto.setCategoriaProducto(
                    new CategoriaProducto(
                            dto.getCategoriaId(),
                            null,
                            null
                    )
            );

            Producto creado = productoServicio.crearProducto(producto);
            sendJsonResponse(creado, response, HttpServletResponse.SC_CREATED);
        } catch (IllegalArgumentException | BusinessException e) {
            
            sendJsonResponse(java.util.Map.of("error", e.getMessage()),
                    response,
                    HttpServletResponse.SC_BAD_REQUEST
            );

        } catch (ServiceException e) {

            sendJsonResponse(java.util.Map.of("error", "Error interno al crear el producto"),
                    response,
                    HttpServletResponse.SC_INTERNAL_SERVER_ERROR
            );
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) 
                    throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");

        ObjectMapper mapper = new ObjectMapper();

        try {
            ProductoDTO dto = mapper.readValue(request.getReader(), ProductoDTO.class);

            if (dto.getId() == null) {

                sendJsonResponse(
                        java.util.Map.of("error", "El ID del producto es requerido para actualizar"),
                        response,
                        HttpServletResponse.SC_BAD_REQUEST
                );

                return;
            }

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

            producto.setUnidadMedida(
                    new UnidadMedida(
                            dto.getUniMedidaId(),
                            null,
                            null
                    )
            );

            producto.setMarcaProducto(
                    new MarcaProducto(
                            dto.getMarcaId(),
                            null
                    )
            );

            producto.setCategoriaProducto(new CategoriaProducto(
                            dto.getCategoriaId(),
                            null,
                            null
                    )
            );

            Producto actualizado = productoServicio.actualizarProducto(producto);

            sendJsonResponse(actualizado, response, HttpServletResponse.SC_OK);

        } catch (IllegalArgumentException | BusinessException e) {

            sendJsonResponse(java.util.Map.of("error", e.getMessage()),
                    response,
                    HttpServletResponse.SC_BAD_REQUEST
            );

        } catch (ServiceException e) {
            sendJsonResponse(java.util.Map.of("error", "Error interno al actualizar el producto"),
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