
package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;
import java.math.BigDecimal;

public class MetodoPago implements Identifiable {
    private Long idMetodoPago;
    private String nombre;
    private BigDecimal descuento;

    public MetodoPago() {
    }

    public MetodoPago(String nombre, BigDecimal descuento) {
        this.nombre = nombre;
        this.descuento = descuento;
    }

    public MetodoPago(Long idMetodoPago, String nombre, BigDecimal descuento) {
        this.idMetodoPago = idMetodoPago;
        this.nombre = nombre;
        this.descuento = descuento;
    }

    @Override
    public Long getId() {
        return idMetodoPago;
    }

    public String getNombre() {
        return nombre;
    }

    public BigDecimal getDescuento() {
        return descuento;
    }

    @Override
    public void setId(Long id) {
    if (idMetodoPago != null && !idMetodoPago.equals(0L)) {
        throw new IllegalArgumentException("El id ya fue asignado y no puede ser modificado");
    }
    if (id == null || id <= 0) {
        throw new IllegalArgumentException("El id no puede ser nulo o menor o igual a cero");
    }
    }
    public void setNombre(String nombre) {
       SetValidator.validar(nombre, StringFieldType.NOMBRE);
        this.nombre = nombre;
    }

    public void setDescuento(BigDecimal descuento) {
        this.descuento = descuento;
    }
    
    
}
