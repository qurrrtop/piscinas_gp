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
}