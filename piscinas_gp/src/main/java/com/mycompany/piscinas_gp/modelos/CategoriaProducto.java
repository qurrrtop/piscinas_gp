package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;

public class CategoriaProducto implements Identifiable {
    
    private Long idCategoriaProducto;
    private String nombre;
    private CategoriaProducto categoriaProductoPadre;

    public CategoriaProducto() {
    }

    public CategoriaProducto(String nombre, CategoriaProducto categoriaProductoPadre) {
        setNombre(nombre);
        setCategoriaProductoPadre(categoriaProductoPadre);
    }

    public CategoriaProducto(Long idCategoriaProducto, String nombre, CategoriaProducto categoriaProductoPadre) {
        this.idCategoriaProducto = idCategoriaProducto;
        this.nombre = nombre;
        this.categoriaProductoPadre = categoriaProductoPadre;
    }

    
@Override
    public Long getId() { return idCategoriaProducto; }
    public String getNombre() { return nombre; }    
    public CategoriaProducto getCategoriaProductoPadre() { return categoriaProductoPadre; }

    
@Override
    public void setId(Long id) {
        if(idCategoriaProducto != null && !idCategoriaProducto.equals(0L)){
            throw new IllegalArgumentException ("el id ya fue asignado y no puede ser modificado");
        }
        if (id == null || id <= 0 ){
            throw new IllegalArgumentException ("el id no puede ser nulo / valor negativo");
        }
        this.idCategoriaProducto = id;

    }

    public void setNombre(String nombre) {
        SetValidator.validar(nombre, StringFieldType.NOMBRE);
        
        this.nombre = nombre;
    }

    public void setCategoriaProductoPadre(CategoriaProducto categoriaProductoPadre) {
        //esto para que no sea A tiene padre A
        if (categoriaProductoPadre == this) {
            throw new IllegalArgumentException(
                "La categoria padre no puede ser la misma categoria"
            );
        }

        if (categoriaProductoPadre != null 
                && categoriaProductoPadre.getCategoriaProductoPadre() == this) {
            throw new IllegalArgumentException(
                "No puede existir una relacion circular entre categorias"
            );
        }
        //este es para que no pase esto:
        //A tiene padre B
        //B tiene padre A

        this.categoriaProductoPadre = categoriaProductoPadre;
    }
    
}
