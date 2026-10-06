package com.mycompany.piscinas_gp.dtos;

import java.math.BigDecimal;

public class ActualizacionPrecioDTO {

    private Long productoId;
    private String codigoProveedor;
    private String nombre;
    private BigDecimal precioActual;
    private BigDecimal precioNuevo;

    public ActualizacionPrecioDTO() {
    }

    public ActualizacionPrecioDTO(Long productoId, String codigoProveedor, String nombre,
                                   BigDecimal precioActual, BigDecimal precioNuevo) {
        this.productoId = productoId;
        this.codigoProveedor = codigoProveedor;
        this.nombre = nombre;
        this.precioActual = precioActual;
        this.precioNuevo = precioNuevo;
    }

    public Long getProductoId() {
        return productoId;
    }

    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }

    public String getCodigoProveedor() {
        return codigoProveedor;
    }

    public void setCodigoProveedor(String codigoProveedor) {
        this.codigoProveedor = codigoProveedor;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public BigDecimal getPrecioActual() {
        return precioActual;
    }

    public void setPrecioActual(BigDecimal precioActual) {
        this.precioActual = precioActual;
    }

    public BigDecimal getPrecioNuevo() {
        return precioNuevo;
    }

    public void setPrecioNuevo(BigDecimal precioNuevo) {
        this.precioNuevo = precioNuevo;
    }
}