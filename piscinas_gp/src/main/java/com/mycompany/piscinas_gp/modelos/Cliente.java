package com.mycompany.piscinas_gp.modelos;
import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.NumericFieldType;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;

abstract class Cliente implements Identifiable{
    private Long idCliente;
    private String email;
    private String telefono;
    private String calleYnumero;
    private String ciudad;
    private String provincia;
    private int codigoPostal;
    private String observaciones;

    public Cliente() {       
    }

    public Cliente(String email, String telefono, String calleYnumero, String ciudad, String provincia, int codigoPostal, String observaciones) {
        setEmail(email);
        setTelefono (telefono);
        setCalleYnumero(calleYnumero);
        setCiudad(ciudad);
        setProvincia(provincia);
        setCodigoPostal(codigoPostal);
        setObservaciones(observaciones);
    }

    public Cliente(Long idCliente, String email, String telefono, String calleYnumero, String ciudad, String provincia, int codigoPostal, String observaciones) {
        this.idCliente = idCliente;
        this.email = email;
        this.telefono = telefono;
        this.calleYnumero = calleYnumero;
        this.ciudad = ciudad;
        this.provincia = provincia;
        this.codigoPostal = codigoPostal;
        this.observaciones = observaciones;
    }

    //getters
    @Override
    public Long getId() { return idCliente; }
    public String getEmail() { return email; }
    public String getTelefono() { return telefono; }
    public String getCalleYnumero() { return calleYnumero; }
    public String getCiudad() { return ciudad; }
    public String getProvincia() { return provincia; }
    public int getCodigoPostal() { return codigoPostal; }
    public String getObservaciones() { return observaciones; }

    
    //setters
@Override
    public void setId(Long id) {
        if(idCliente != null && !idCliente.equals(0L)){
            throw new IllegalArgumentException ("el id ya fue asignado y no puede ser modificado");
        }
        if (id == null || id <= 0 ){
            throw new IllegalArgumentException ("el id no puede ser nulo / valor negativo");
        }
        this.idCliente = id;
    }

    public void setEmail(String email) {
        SetValidator.validar(email, StringFieldType.EMAIL);
        
        this.email = email;
    }

    public void setTelefono(String telefono) {
        SetValidator.validar(telefono, StringFieldType.TELEFONO);
        this.telefono = telefono;
    }

    public void setCalleYnumero(String calleYnumero) {
        SetValidator.validar(calleYnumero, StringFieldType.CALLE_Y_NUMERO);
        this.calleYnumero = calleYnumero;
    }

    public void setCiudad(String ciudad) {
        SetValidator.validar(ciudad, StringFieldType.CIUDAD);
        this.ciudad = ciudad;
    }

    public void setProvincia(String provincia) {
        SetValidator.validar(provincia, StringFieldType.PROVINCIA);
        this.provincia = provincia;
    }

    public void setCodigoPostal(int codigoPostal) {
        SetValidator.validar(codigoPostal, NumericFieldType.CODIGO_POSTAL);
        
        this.codigoPostal = codigoPostal;
    }

    public void setObservaciones(String observaciones) {
        SetValidator.validar(observaciones, StringFieldType.OBSERVACIONES); //de observar amigo, pensala// 
        this.observaciones = observaciones;                                        //asi se observa chicos
    }
    
}
