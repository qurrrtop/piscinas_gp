package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;

public class MarcaProducto implements Identifiable {
    
    private Long idMarcaProducto;
    private String nombre;
    private Boolean activo = true;

    public MarcaProducto() {
    }
    
    public MarcaProducto(Long idMarcaProducto, String nombre) {
        this.idMarcaProducto = idMarcaProducto;
        this.nombre = nombre;
        this.activo = true;
    }

    public MarcaProducto(String nombre, Boolean activo) {
        setNombre(nombre);
        setActivo(activo);
    }

    public MarcaProducto(Long idMarcaProducto, String nombre, Boolean activo) {
        this.idMarcaProducto = idMarcaProducto;
        this.nombre = nombre;
        this.activo = activo;
    }
    
    
@Override
    public Long getId() { return idMarcaProducto; }
    public String getNombre() { return nombre; }
    public Boolean getActivo() { return activo; }
    
    
@Override
    public void setId(Long id) {
        if(idMarcaProducto != null && !idMarcaProducto.equals(0L)){
            throw new IllegalArgumentException ("el id ya fue asignado y no puede ser modificado");
        }
        if (id == null || id <= 0 ){
            throw new IllegalArgumentException ("el id no puede ser nulo / valor negativo");
        }
        this.idMarcaProducto = id;
    }

    public void setNombre(String nombre) {
        SetValidator.validar(nombre, StringFieldType.NOMBRE);
        
        this.nombre = nombre;
    }
    
    public void setActivo(boolean activo) {
        this.activo = activo;
    }
    
}