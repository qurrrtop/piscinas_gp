package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;

public class MarcaProducto implements Identifiable {
    
    private Long idMarcaProducto;
    private String nombre;

    public MarcaProducto() {
    }

    public MarcaProducto(String nombre) {
        setNombre(nombre);
    }

    public MarcaProducto(Long idMarcaProducto, String nombre) {
        this.idMarcaProducto = idMarcaProducto;
        this.nombre = nombre;
    }
    
    
@Override
    public Long getId() { return idMarcaProducto; }
    public String getNombre() { return nombre; }
    
    
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
    
}