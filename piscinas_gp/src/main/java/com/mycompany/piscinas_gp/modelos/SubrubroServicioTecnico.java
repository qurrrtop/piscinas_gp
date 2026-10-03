package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;

public class SubrubroServicioTecnico implements Identifiable {

    private Long idSubrubro;
    private String nombre;

    public SubrubroServicioTecnico() {
    }

    public SubrubroServicioTecnico(String nombre) {
        setNombre(nombre);
    }

    public SubrubroServicioTecnico(Long idSubrubro, String nombre) {
        this.idSubrubro = idSubrubro;
        this.nombre = nombre;
    }

    @Override
    public Long getId() { return idSubrubro; }
    public String getNombre() { return nombre; }

    @Override
    public void setId(Long id) {
        if (idSubrubro != null && !idSubrubro.equals(0L)) {
            throw new IllegalArgumentException("el id ya fue asignado y no puede ser modificado");
        }
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("el id no puede ser nulo / valor negativo");
        }
        this.idSubrubro = id;
    }

    public void setNombre(String nombre) {
        SetValidator.validar(nombre, StringFieldType.NOMBRE);
        this.nombre = nombre;
    }
}