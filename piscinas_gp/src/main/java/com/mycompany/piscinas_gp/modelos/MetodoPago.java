
package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;

public class MetodoPago implements Identifiable {
    private Long idMetodoPago;
    private String nombre;
    //le saque el descuento que tenia aca, ya que venta producto tiene uno global y la base ed datos no tiene el campo de descuento

    public MetodoPago() {
    }

    public MetodoPago(String nombre ) {
        this.nombre = nombre;
    }

    public MetodoPago(Long idMetodoPago, String nombre ) {
        this.idMetodoPago = idMetodoPago;
        this.nombre = nombre;
    }

    @Override
    public Long getId() {
        return idMetodoPago;
    }

    public String getNombre() {
        return nombre;
    }


    @Override
    public void setId(Long id) {
        if (idMetodoPago != null && !idMetodoPago.equals(0L)) {
            throw new IllegalArgumentException("El id ya fue asignado y no puede ser modificado");
        }
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("El id no puede ser nulo o menor o igual a cero");
        }
        this.idMetodoPago = id;
    }
    public void setNombre(String nombre) {
       SetValidator.validar(nombre, StringFieldType.NOMBRE);
        this.nombre = nombre;
    }

    
}
