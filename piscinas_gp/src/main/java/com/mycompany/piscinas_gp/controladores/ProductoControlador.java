package com.mycompany.piscinas_gp.controladores;

import java.io.IOException;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import com.mycompany.piscinas_gp.modelos.Producto;
import com.mycompany.piscinas_gp.dtos.ProductoDTO;

@WebServlet(name = "ProductoControlador", urlPatterns = {"/productos"})
public class ProductoControlador extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");

        ObjectMapper mapper = new ObjectMapper();

        ProductoDTO dto = mapper.readValue(
                request.getReader(),
                ProductoDTO.class
        );

        Producto producto = new Producto();
        
        producto.setNombre(dto.getNombre());
        producto.setDescripcion(dto.getDescripcion());
        producto.setStock(dto.getStock());
        producto.setUmbralStock(dto.getStockMin());
        producto.setPrecioActual(dto.getPrecio());
        producto.setContenido(dto.getContenido());
        producto.setUnidadMedida(dto.getUniMedida());

    }

}