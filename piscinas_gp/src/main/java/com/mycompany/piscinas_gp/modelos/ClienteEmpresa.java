package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;

public class ClienteEmpresa extends Cliente {

    private String razonSocial;
    private String nombreFantasia;
    private String rubro;
    private String cuit;

    public ClienteEmpresa() {
        super();
    }

    public ClienteEmpresa(String razonSocial, String nombreFantasia, String rubro, String cuit,
                          String email, String telefono, String calleYnumero, String ciudad,
                          String observaciones) {

        super(email, telefono, calleYnumero, ciudad, observaciones);

        setRazonSocial(razonSocial);
        setNombreFantasia(nombreFantasia);
        setRubro(rubro);
        setCuit(cuit);
    }

    public ClienteEmpresa(Long idCliente, String razonSocial, String nombreFantasia, String rubro,
                             String cuit, String email, String telefono, String calleYnumero,
                             String ciudad, String observaciones) {

        super(idCliente, email, telefono, calleYnumero, ciudad, observaciones);

        this.razonSocial = razonSocial;
        this.nombreFantasia = nombreFantasia;
        this.rubro = rubro;
        this.cuit = cuit;
    }

    public String getRazonSocial() { return razonSocial; }
    public String getNombreFantasia() { return nombreFantasia; }
    public String getRubro() { return rubro; }
    public String getCuit() { return cuit; }

    public void setRazonSocial(String razonSocial) {
        SetValidator.validar(razonSocial, StringFieldType.RAZON_SOCIAL);
        this.razonSocial = razonSocial;
    }

    public void setNombreFantasia(String nombreFantasia) {
        SetValidator.validar(nombreFantasia, StringFieldType.NOMBRE_FANTASIA);
        this.nombreFantasia = nombreFantasia;
    }

    public void setRubro(String rubro) {
        SetValidator.validar(rubro, StringFieldType.RUBRO);
        this.rubro = rubro;
    }

    public void setCuit(String cuit) {
        SetValidator.validar(cuit, StringFieldType.CUIT);
        this.cuit = cuit;
    }
}