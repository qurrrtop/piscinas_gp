package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.validadores.NumericFieldType;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class VentaProducto extends Venta {
    
    private int descuentoGlobal;
    private List<DetalleVenta> detallesVenta;

    public VentaProducto() {
    }

    public VentaProducto(int descuentoGlobal, List<DetalleVenta> detallesVenta, Cliente cliente, String estadoVenta, LocalDate fecha, String metodoPago, String observacion, BigDecimal total, LocalDate fechaInicio, LocalDate fechaCierre) {
        super(cliente, estadoVenta, fecha, metodoPago, observacion, total, fechaInicio, fechaCierre);
        setDescuentoGlobal(descuentoGlobal);
        setDetallesVenta(detallesVenta);
    }

    public VentaProducto(int descuentoGlobal, List<DetalleVenta> detallesVenta, Long idVenta, Cliente cliente, String estadoVenta, LocalDate fecha, String metodoPago, String observacion, BigDecimal total, LocalDate fechaInicio, LocalDate fechaCierre) {
        super(idVenta, cliente, estadoVenta, fecha, metodoPago, observacion, total, fechaInicio, fechaCierre);
        this.descuentoGlobal = descuentoGlobal;
        this.detallesVenta = detallesVenta;
    }
    
    

    public int getDescuentoGlobal() { return descuentoGlobal; }
    public List<DetalleVenta> getDetallesVenta() { return detallesVenta; }
    
    

    public void setDescuentoGlobal(int descuentoGlobal) {
        SetValidator.validar(descuentoGlobal, NumericFieldType.DESCUENTO_GLOBAL);
        
        this.descuentoGlobal = descuentoGlobal;
    }
        //yo entendi del diagrama que permitiria que la venta no tenga detalles al inicio digamo
    //si la lista viene null, se guarda como lista vacia para evitar errores
    //si trae objetos, no permite que haya detalles nulos dentro
    public void setDetallesVenta(List<DetalleVenta> detallesVenta) {
        if (detallesVenta == null) {
            this.detallesVenta = new ArrayList<>();
            return;
        }

        for (DetalleVenta detalleVenta : detallesVenta) {
            if (detalleVenta == null) {
                throw new IllegalArgumentException(
                    "La lista de detalles de venta no puede contener elementos nulos"
                );
            }
        }

        this.detallesVenta = detallesVenta;
    }
 
}

