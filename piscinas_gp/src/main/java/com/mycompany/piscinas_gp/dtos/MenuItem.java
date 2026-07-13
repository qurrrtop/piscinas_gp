package com.mycompany.piscinas_gp.dtos;

import java.util.List;

// Esta clase es un DTO (data transfer object), sirve solo para transportar datos.
// Aquí lo que hace es guardar que valores tendrá cada item del sidebar, para que
// sea mas optimo transportarlos desde el DashboardControlador al Wep Component.

public class MenuItem {
    private final String titulo;
    private final String seccion;
    private final String icono;
    private final String alt;
    private final String path;
    private final List<MenuItem> hijos;

    public MenuItem(String titulo, String seccion, String icono, String path, String alt, List<MenuItem> hijos) {
        this.titulo = titulo;
        this.seccion = seccion;
        this.icono = icono;
        this.alt = alt;
        this.path = path;
        this.hijos = hijos;
    }

    public String getTitulo() {
        return titulo;
    }
    
    public String getSeccion() {
        return seccion;
    }

    public String getIcono() {
        return icono;
    }
    
    public String getAlt() {
        return alt;
    }

    public String getPath() {
        return path;
    }

    public List<MenuItem> getHijos() {
        return hijos;
    }
}
