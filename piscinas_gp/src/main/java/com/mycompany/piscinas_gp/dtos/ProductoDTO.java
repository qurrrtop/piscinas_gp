package com.mycompany.piscinas_gp.dtos;

import java.math.BigDecimal;

public class ProductoDTO {
    private String nombre;
    private String descripcion;
    private int stock;
    private int stockMin;
    private BigDecimal precio;
    private BigDecimal contenido;
    private String uniMedida;
    private Long marcaId;
    private Long categoriaId;

    public ProductoDTO() {
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public int getStockMin() {
        return stockMin;
    }

    public void setStockMin(int stockMin) {
        this.stockMin = stockMin;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public BigDecimal getContenido() {
        return contenido;
    }

    public void setContenido(BigDecimal contenido) {
        this.contenido = contenido;
    }

    public String getUniMedida() {
        return uniMedida;
    }

    public void setUniMedida(String uniMedida) {
        this.uniMedida = uniMedida;
    }

    public Long getMarcaId() {
        return marcaId;
    }

    public void setMarcaId(Long marcaId) {
        this.marcaId = marcaId;
    }

    public Long getCategoriaId() {
        return categoriaId;
    }

    public void setCategoriaId(Long categoriaId) {
        this.categoriaId = categoriaId;
    }
}