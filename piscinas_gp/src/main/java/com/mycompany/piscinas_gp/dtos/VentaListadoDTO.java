package com.mycompany.piscinas_gp.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

public class VentaListadoDTO {

    private Long id;
    private String cliente;
    private Boolean estado;
    private LocalDate fecha;
    private BigDecimal total;

    public VentaListadoDTO(Long id, String cliente, Boolean estado,
                           LocalDate fecha, BigDecimal total) {
        this.id = id;
        this.cliente = cliente;
        this.estado = estado;
        this.fecha = fecha;
        this.total = total;
    }

    public Long getId() { return id; }
    public String getCliente() { return cliente; }
    public Boolean getEstado() { return estado; }
    public LocalDate getFecha() { return fecha; }
    public BigDecimal getTotal() { return total; }
}