package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;

public class ClienteParticular extends Cliente {

    private String nombre;
    private String apellido;
    private String cuil;

    public ClienteParticular() {
        super();
    }

    public ClienteParticular(String nombre, String apellido, String cuil,
                             String email, String telefono, String calleYnumero,
                             String ciudad, String observaciones) {

        super(email, telefono, calleYnumero, ciudad, observaciones);

        setNombre(nombre);
        setApellido(apellido);
        setCuil(cuil);
    }

    public ClienteParticular(Long idCliente, String nombre, String apellido, String cuil,
                             String email, String telefono, String calleYnumero,
                             String ciudad, String observaciones) {

        super(idCliente, email, telefono, calleYnumero, ciudad, observaciones);

        this.nombre = nombre;
        this.apellido = apellido;
        this.cuil = cuil;
    }

    public String getNombre() { return nombre; }
    public String getCuil() { return cuil; }
    public String getApellido() { return apellido; }

    public void setNombre(String nombre) {
        SetValidator.validar(nombre, StringFieldType.NOMBRE);
        this.nombre = nombre;
    }

    public void setApellido(String apellido) {
        SetValidator.validar(apellido, StringFieldType.APELLIDO);
        this.apellido = apellido;
    }

    public void setCuil(String cuil) {
        SetValidator.validar(cuil, StringFieldType.CUIL);
        this.cuil = cuil;
    }
}