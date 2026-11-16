package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.utils.Identifiable;

public class Usuario implements Identifiable {

    private Long idUsuario;
    private String email;
    private String passwordHash;
    // hash del código de recuperación; se usa más adelante, puede ser null
    private String codigoRecuperacionHash;
    private boolean activo = true;

    public Usuario() {
    }

    public Usuario(Long idUsuario, String email, String passwordHash, String codigoRecuperacionHash, boolean activo) {
        this.idUsuario = idUsuario;
        this.email = email;
        this.passwordHash = passwordHash;
        this.codigoRecuperacionHash = codigoRecuperacionHash;
        this.activo = activo;
    }

    @Override
    public Long getId() { return idUsuario; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getCodigoRecuperacionHash() { return codigoRecuperacionHash; }
    public boolean isActivo() { return activo; }

    @Override
    public void setId(Long id) {
        if (idUsuario != null && !idUsuario.equals(0L)) {
            throw new IllegalArgumentException("el id ya fue asignado y no puede ser modificado");
        }
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("el id no puede ser nulo / valor negativo");
        }
        this.idUsuario = id;
    }

    public void setEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("El email del usuario no puede estar vacío");
        }
        this.email = email.trim().toLowerCase();
    }

    public void setPasswordHash(String passwordHash) {
        if (passwordHash == null || passwordHash.isBlank()) {
            throw new IllegalArgumentException("El hash de la contraseña no puede estar vacío");
        }
        this.passwordHash = passwordHash;
    }

    public void setCodigoRecuperacionHash(String codigoRecuperacionHash) {
        this.codigoRecuperacionHash = codigoRecuperacionHash;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}