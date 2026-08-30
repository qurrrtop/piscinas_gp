package com.mycompany.piscinas_gp.modelos;
import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;

public abstract class Cliente implements Identifiable{
    private Long idCliente;
    private String email;
    private String telefono;
    private String calleYnumero;
    private Localidad localidad;
    private String observaciones;

    public Cliente() {       
    }

    public Cliente(String email, String telefono, String calleYnumero, Localidad localidad, String observaciones) {
        setEmail(email);
        setTelefono (telefono);
        setCalleYnumero(calleYnumero);
        setLocalidad(localidad);
        setObservaciones(observaciones);
    }

    public Cliente(Long idCliente, String email, String telefono, String calleYnumero, Localidad localidad, String observaciones) {
        this.idCliente = idCliente;
        this.email = email;
        this.telefono = telefono;
        this.calleYnumero = calleYnumero;
        this.localidad = localidad;
        this.observaciones = observaciones;
    }

    //getters
    @Override
    public Long getId() { return idCliente; }
    public String getEmail() { return email; }
    public String getTelefono() { return telefono; }
    public String getCalleYnumero() { return calleYnumero; }
    public Localidad getLocalidad() { return localidad; }
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

    public void setLocalidad(Localidad localidad) {
        if(localidad == null) {
            throw new IllegalArgumentException("La localidad no puede estar nulo");
        }
        this.localidad = localidad;
    }

    public void setObservaciones(String observaciones) {
        if (observaciones == null || observaciones.isBlank()) {
            this.observaciones = null;
            return;
        }
        SetValidator.validar(observaciones, StringFieldType.OBSERVACIONES);
        this.observaciones = observaciones;
    }
    
}
