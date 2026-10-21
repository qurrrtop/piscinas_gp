package com.mycompany.piscinas_gp.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class VentaListadoDTO {

    private Long id;
    private String cliente;
    private String estado;
    private LocalDateTime fecha;
    private BigDecimal total;
    private String observacion;

    public VentaListadoDTO(Long id, String cliente, String estado,
                           LocalDateTime fecha, BigDecimal total, String observacion) {
        this.id = id;
        this.cliente = cliente;
        this.estado = estado;
        this.fecha = fecha;
        this.total = total;
        this.observacion = observacion;
    }

    public Long getId() { return id; }
    public String getCliente() { return cliente; }
    public String getEstado() { return estado; }
    public LocalDateTime getFecha() { return fecha; }
    public BigDecimal getTotal() { return total; }
    public String getObservacion() { return observacion; }
}