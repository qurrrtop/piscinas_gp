package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.NumericFieldType;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import java.math.BigDecimal;

public class DetalleVenta implements Identifiable {
    
    private Long idDetalleVenta;
    private Producto producto;
    private int cantidad;
    private BigDecimal precioUnitario;

    public DetalleVenta() {
    }

    public DetalleVenta(Producto producto, int cantidad, BigDecimal precioUnitario) {
        setProducto(producto);
        setCantidad(cantidad);
        setPrecioUnitario(precioUnitario);
    }

    public DetalleVenta(Long idDetalleVenta, Producto producto, int cantidad, BigDecimal precioUnitario) {
        this.idDetalleVenta = idDetalleVenta;
        this.producto = producto;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
    }

    
@Override
    public Long getId() { return idDetalleVenta; }
    public Producto getProducto() { return producto; }
    public int getCantidad() { return cantidad; }
    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    
    
@Override
    public void setId(Long id) {
        if(idDetalleVenta != null && !idDetalleVenta.equals(0L)){
            throw new IllegalArgumentException ("el id ya fue asignado y no puede ser modificado");
        }
        if (id == null || id <= 0 ){
            throw new IllegalArgumentException ("el id no puede ser nulo / valor negativo");
        }
        this.idDetalleVenta = id;
    }

    public void setProducto(Producto producto) {
        if (producto == null) {
            throw new IllegalArgumentException("El producto no puede estar vacio");
        }
    }

    public void setCantidad(int cantidad) {
        SetValidator.validar(cantidad, NumericFieldType.CANTIDAD);
        
        this.cantidad = cantidad;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        SetValidator.validar(precioUnitario, NumericFieldType.PRECIO_UNITARIO);
        
        this.precioUnitario = precioUnitario;
    }

}
