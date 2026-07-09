
package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;

public class EstadoVenta implements Identifiable {
    private Long idEstadoVenta;
    private String nombre;

    public EstadoVenta() {
    }

    public EstadoVenta(String nombre) {
        setNombre(nombre);
    }

    public EstadoVenta(Long idEstadoVenta, String nombre) {
        this.idEstadoVenta = idEstadoVenta;
        setNombre(nombre);
    }

    @Override
    public Long getId() {
        return idEstadoVenta;
    }
    public String getNombre() {
        return nombre;
    }
    
    @Override
    public void setId(Long id) {
    if (idEstadoVenta != null && !idEstadoVenta.equals(0L)) {
        throw new IllegalArgumentException("El id ya fue asignado y no puede ser modificado");
    }
    if (id == null || id <= 0) {
        throw new IllegalArgumentException("El id no puede ser nulo o menor o igual a cero");
    }

    this.idEstadoVenta = id;
    }

    public void setNombre(String nombre) {
        SetValidator.validar(nombre, StringFieldType.NOMBRE);
        this.nombre = nombre;
    }
    
    
    
}
