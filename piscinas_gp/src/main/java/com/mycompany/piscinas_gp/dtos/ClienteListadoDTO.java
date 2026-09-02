package com.mycompany.piscinas_gp.dtos;

public class ClienteListadoDTO {

    private Long id;
    private String nombreCompleto;
    private String tipo;
    private String cuitCuil;
    private String telefono;
    private String email;
    private Boolean activo;
    private int cantidadVentas;

    public ClienteListadoDTO(Long id, String nombreCompleto, String tipo, String cuitCuil, String telefono, String email, Boolean activo, int cantidadVentas) {
        this.id = id;
        this.nombreCompleto = nombreCompleto;
        this.tipo = tipo;
        this.cuitCuil = cuitCuil;
        this.telefono = telefono;
        this.email = email;
        this.activo = activo;
        this.cantidadVentas = cantidadVentas;
    }

    public Long getId() { return id; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getTipo() { return tipo; }
    public String getCuitCuil() { return cuitCuil; }
    public String getTelefono() { return telefono; }
    public String getEmail() { return email; }
    public Boolean isActivo() { return activo; }
    public int getCantidadVentas() { return cantidadVentas; }
}