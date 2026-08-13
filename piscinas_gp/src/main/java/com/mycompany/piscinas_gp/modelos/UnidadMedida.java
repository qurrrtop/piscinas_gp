package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;

public class UnidadMedida implements Identifiable {

    private Long idUnidadMedida;
    private String nombre;
    private String abreviatura;

    public UnidadMedida() {
    }

    public UnidadMedida(String nombre, String abreviatura) {
        setNombre(nombre);
        setAbreviatura(abreviatura);
    }

    public UnidadMedida(Long idUnidadMedida, String nombre, String abreviatura) {
        this.idUnidadMedida = idUnidadMedida;
        this.nombre = nombre;
        this.abreviatura = abreviatura;
    }

    @Override
    public Long getId() { return idUnidadMedida; }
    public String getNombre() { return nombre; }
    public String getAbreviatura() { return abreviatura; }

    @Override
    public void setId(Long id) {
        if (idUnidadMedida != null && !idUnidadMedida.equals(0L)) {
            throw new IllegalArgumentException("el id ya fue asignado y no puede ser modificado");
        }
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("el id no puede ser nulo / valor negativo");
        }
        this.idUnidadMedida = id;
    }

    public void setNombre(String nombre) {
        SetValidator.validar(nombre, StringFieldType.NOMBRE_UNIDAD_MEDIDA);
        this.nombre = nombre;
    }

    public void setAbreviatura(String abreviatura) {
        SetValidator.validar(abreviatura, StringFieldType.ABREVIATURA_UNIDAD_MEDIDA);
        this.abreviatura = abreviatura;
    }
}