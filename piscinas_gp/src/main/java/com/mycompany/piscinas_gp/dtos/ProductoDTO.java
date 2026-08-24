package com.mycompany.piscinas_gp.dtos;

import java.math.BigDecimal;

public class ProductoDTO {
    private Long id;
    private String nombre;
    private String descripcion;
    private int stock;
    private int stockMin;
    private BigDecimal precio;
    private BigDecimal contenido;
    private Long uniMedidaId;
    private Long marcaId;
    private Long categoriaId;

    public ProductoDTO() {
    }
    
    public Long getId() {
        return id;
    }

    public String getNombre() {
        return nombre;
    }
    
    public void setId(Long id) {
        this.id = id;
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

    public Long getUniMedidaId() {
        return uniMedidaId;
    }

    public void setUniMedidaId(Long uniMedidaId) {
        this.uniMedidaId = uniMedidaId;
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