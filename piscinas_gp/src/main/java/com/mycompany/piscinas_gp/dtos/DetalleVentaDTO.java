package com.mycompany.piscinas_gp.dtos;

import java.math.BigDecimal;

public class DetalleVentaDTO {
	private Long id;
	private Long productoId;
	private int cantidad;
	private BigDecimal precioUnitario;

	public DetalleVentaDTO() {

	}

    public Long getId() {
        return id;
    }
    public Long getProductoId() {
        return productoId;
    }
    public int getCantidad() {
        return cantidad;
    }
    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }
    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }
    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }
        
    
        
        
        
}