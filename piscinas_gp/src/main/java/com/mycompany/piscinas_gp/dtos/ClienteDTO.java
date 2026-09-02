package com.mycompany.piscinas_gp.dtos;

public class ClienteDTO {

    private Long id;
    private String tipo;

    private String email;
    private String telefono;
    private String calleYnumero;
    private Long localidadId;
    private String observaciones;
    private Boolean activo;

    private String nombre;
    private String apellido;
    private String cuil;

    private String razonSocial;
    private String nombreFantasia;
    private String rubro;
    private String cuit;

    public ClienteDTO() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public String getCalleYnumero() { return calleYnumero; }
    public void setCalleYnumero(String calleYnumero) { this.calleYnumero = calleYnumero; }
    public Long getLocalidadId() { return localidadId; }
    public void setLocalidadId(Long localidadId) { this.localidadId = localidadId; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public Boolean isActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }
    public String getCuil() { return cuil; }
    public void setCuil(String cuil) { this.cuil = cuil; }
    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }
    public String getNombreFantasia() { return nombreFantasia; }
    public void setNombreFantasia(String nombreFantasia) { this.nombreFantasia = nombreFantasia; }
    public String getRubro() { return rubro; }
    public void setRubro(String rubro) { this.rubro = rubro; }
    public String getCuit() { return cuit; }
    public void setCuit(String cuit) { this.cuit = cuit; }
}