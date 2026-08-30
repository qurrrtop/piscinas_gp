package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;

public class Localidad implements Identifiable {
    private Long idLocalidad;
    private String nombre;

    public Localidad() {
    }

    public Localidad(String nombre) {
        SetValidator.validar(nombre, StringFieldType.NOMBRE_LOCALIDAD);
        this.nombre = nombre;
    }

    public Localidad(Long idLocalidad, String nombre) {
        this.idLocalidad = idLocalidad;
        this.nombre = nombre;
    }

    @Override
    public Long getId() {
        return idLocalidad;
    }

    public String getNombre() {
        return nombre;
    }

    @Override
    public void setId(Long id) {
        if(idLocalidad != null && !idLocalidad.equals(0L)){
            throw new IllegalArgumentException ("el id ya fue asignado y no puede ser modificado");
        }
        if (id == null || id <= 0 ){
            throw new IllegalArgumentException ("el id no puede ser nulo / valor negativo");
        }
        this.idLocalidad = id;
    }

    public void setNombre(String nombre) {
        SetValidator.validar(nombre, StringFieldType.NOMBRE_LOCALIDAD);
        this.nombre = nombre;
    }
}
