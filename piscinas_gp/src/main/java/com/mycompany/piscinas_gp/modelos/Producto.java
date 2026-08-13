package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.NumericFieldType;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;
import java.math.BigDecimal;

public class Producto implements Identifiable {
    
    private Long idProducto;
    private String nombre;
    private String descripcion;
    private int stock;
    private int umbralStock;
    private BigDecimal precioActual;
    private UnidadMedida unidadMedida;
    // el nuevo atributo "contenido", sirve para decir la cantidad de esa unidad de medida.
    private BigDecimal contenido;
    private MarcaProducto marcaProducto;
    private CategoriaProducto categoriaProducto;

    public Producto() {
    }

    public Producto(String nombre, String descripcion, int stock, int umbralStock, BigDecimal precioActual, UnidadMedida unidadMedida, BigDecimal contenido, MarcaProducto marcaProducto, CategoriaProducto categoriaProducto) {
        setNombre(nombre);
        setDescripcion(descripcion);
        setStock(stock);
        setUmbralStock(umbralStock);
        setPrecioActual(precioActual);
        setUnidadMedida(unidadMedida);
        setContenido(contenido);
        setMarcaProducto(marcaProducto);
        setCategoriaProducto(categoriaProducto);
    }

    public Producto(Long idProducto, String nombre, String descripcion, int stock, int umbralStock, BigDecimal precioActual, UnidadMedida unidadMedida, BigDecimal contenido, MarcaProducto marcaProducto, CategoriaProducto categoriaProducto) {
        this.idProducto = idProducto;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.stock = stock;
        this.umbralStock = umbralStock;
        this.precioActual = precioActual;
        this.unidadMedida = unidadMedida;
        this.contenido = contenido;
        this.marcaProducto = marcaProducto;
        this.categoriaProducto = categoriaProducto;
    }
    
    
@Override
    public Long getId() { return idProducto; }
    public String getNombre() { return nombre; }
    public String getDescripcion() { return descripcion; }
    public int getStock() { return stock; }
    public int getUmbralStock() { return umbralStock; }
    public BigDecimal getPrecioActual() { return precioActual; }
    public UnidadMedida getUnidadMedida() { return unidadMedida; }
    public BigDecimal getContenido() { return contenido; }
    public MarcaProducto getMarcaProducto() { return marcaProducto; }
    public CategoriaProducto getCategoriaProducto() { return categoriaProducto; }

    
@Override
    public void setId(Long id) {
        if(idProducto != null && !idProducto.equals(0L)){
            throw new IllegalArgumentException ("el id ya fue asignado y no puede ser modificado");
        }
        if (id == null || id <= 0 ){
            throw new IllegalArgumentException ("el id no puede ser nulo / valor negativo");
        }
        this.idProducto = id;
    }

    public void setNombre(String nombre) {
        SetValidator.validar(nombre, StringFieldType.NOMBRE);
        
        this.nombre = nombre;
    }

    public void setDescripcion(String descripcion) {
        SetValidator.validar(descripcion, StringFieldType.DESCRIPCION);
        
        this.descripcion = descripcion;
    }

    public void setStock(int stock) {
        SetValidator.validar(stock, NumericFieldType.STOCK);
        
        this.stock = stock;
    }

    public void setUmbralStock(int umbralStock) {
        SetValidator.validar(umbralStock, NumericFieldType.UMBRAL_STOCK);
        
        this.umbralStock = umbralStock;
    }

    public void setPrecioActual(BigDecimal precioActual) {
        SetValidator.validar(precioActual, NumericFieldType.PRECIO_ACTUAL);
        
        this.precioActual = precioActual;
    }

    public void setUnidadMedida(UnidadMedida unidadMedida) {
        if(unidadMedida == null) {
            throw new IllegalArgumentException("La unidad de medida del producto no puede estar vacio");
        }
        
        this.unidadMedida = unidadMedida;
    }
    
    public void setContenido(BigDecimal contenido) {
        SetValidator.validar(contenido, NumericFieldType.CONTENIDO);
        
        this.contenido = contenido;
    }

    public void setMarcaProducto(MarcaProducto marcaProducto) {
        if(marcaProducto == null) {
            throw new IllegalArgumentException("La marca del producto no puede estar vacio");
        }
        
        this.marcaProducto = marcaProducto;
    }

    public void setCategoriaProducto(CategoriaProducto categoriaProducto) {
        if(categoriaProducto == null) {
            throw new IllegalArgumentException("La categoria del producto no puede estar vacio");
        } 
        
        this.categoriaProducto = categoriaProducto;
    }
    
    
            
}

