package com.mycompany.piscinas_gp.dtos;

import java.math.BigDecimal;

public class ProductoImportDTO {

    private int fila;                  // número de fila en el archivo, para mostrar en el preview
    private String codigoProveedor;    // código del proveedor si el archivo lo trae (puede ser null)
    private String descripcionOriginal;// texto crudo de la fila, tal cual vino (soporte/debug)
    private String seccionOriginal;

    private String nombre;
    private String descripcion;        // resto de texto que no se pudo mapear a nombre/unidad/contenido
    private BigDecimal contenido;      // null si no se pudo extraer -> dispara ERROR

    private Long uniMedidaId;          // resuelto contra unidades_medida existentes; null si no matcheó
    private Long marcaId;              // viene del select del modal, o resuelto si el archivo trae marca
    private Long categoriaId;          // resuelto a partir de la sección del archivo

    private int stock = 0;
    private int stockMin = 0;
    private BigDecimal precio = BigDecimal.ZERO;

    private EstadoImportacion estado;
    private String motivo;             // por qué es ERROR o ADVERTENCIA

    public ProductoImportDTO() {
    }

    public int getFila() {
        return fila;
    }

    public void setFila(int fila) {
        this.fila = fila;
    }

    public String getCodigoProveedor() {
        return codigoProveedor;
    }

    public void setCodigoProveedor(String codigoProveedor) {
        this.codigoProveedor = codigoProveedor;
    }

    public String getDescripcionOriginal() {
        return descripcionOriginal;
    }

    public void setDescripcionOriginal(String descripcionOriginal) {
        this.descripcionOriginal = descripcionOriginal;
    }
    
    public String getSeccionOriginal() {
        return seccionOriginal;
    }

    public void setSeccionOriginal(String seccionOriginal) {
        this.seccionOriginal = seccionOriginal;
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

    public EstadoImportacion getEstado() {
        return estado;
    }

    public void setEstado(EstadoImportacion estado) {
        this.estado = estado;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }
}