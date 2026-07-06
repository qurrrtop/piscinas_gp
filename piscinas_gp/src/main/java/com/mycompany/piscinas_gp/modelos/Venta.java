package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.validadores.LocalDateFieldType;
import com.mycompany.piscinas_gp.validadores.NumericFieldType;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;
import java.math.BigDecimal;
import java.time.LocalDate;

public class Venta implements Identifiable {
    
    private Long idVenta;
    private Cliente cliente;
    private String estadoVenta; //no vamos a cargar nuevos estados
    private LocalDate fecha;
    private String metodoPago; //ni tampoco metodos de pago
    private String observacion;
    private BigDecimal total;
    private LocalDate fechaInicio;
    private LocalDate fechaCierre;

    public Venta() {
    }

    public Venta(Cliente cliente, String estadoVenta, LocalDate fecha, String metodoPago, String observacion, BigDecimal total, LocalDate fechaInicio, LocalDate fechaCierre) {
        setCliente(cliente);
        setEstadoVenta(estadoVenta);
        setFecha(fecha);
        setMetodoPago(metodoPago);
        setObservacion(observacion);
        setTotal(total);
        setFechaInicio(fechaInicio);
        setFechaCierre(fechaCierre);
    }

    public Venta(Long idVenta, Cliente cliente, String estadoVenta, LocalDate fecha, String metodoPago, String observacion, BigDecimal total, LocalDate fechaInicio, LocalDate fechaCierre) {
        this.idVenta = idVenta;
        this.cliente = cliente;
        this.estadoVenta = estadoVenta;
        this.fecha = fecha;
        this.metodoPago = metodoPago;
        this.observacion = observacion;
        this.total = total;
        this.fechaInicio = fechaInicio;
        this.fechaCierre = fechaCierre;
    }

    
@Override
    public Long getId() { return idVenta; }
    public Cliente getCliente() { return cliente; }
    public String getEstadoVenta() { return estadoVenta; }
    public LocalDate getFecha() { return fecha; }
    public String getMetodoPago() { return metodoPago; }
    public String getObservacion() { return observacion; }
    public BigDecimal getTotal() { return total; }
    public LocalDate getFechaInicio() { return fechaInicio; }
    public LocalDate getFechaCierre() { return fechaCierre; }

    
@Override
    public void setId(Long id) {
        if(idVenta != null && !idVenta.equals(0L)){
            throw new IllegalArgumentException ("el id ya fue asignado y no puede ser modificado");
        }
        if (id == null || id <= 0 ){
            throw new IllegalArgumentException ("el id no puede ser nulo / valor negativo");
        }
        this.idVenta = id;
    }

    public void setCliente(Cliente cliente) {
        if(cliente == null) {
            throw new IllegalArgumentException("El cliente no puede ser nulo");
        }
        
        this.cliente = cliente;
    }

    public void setEstadoVenta(String estadoVenta) {
        if (estadoVenta == null || estadoVenta.isBlank()) {
            throw new IllegalArgumentException("El estado de venta no puede estar vacio");
        }
        //cambiar/agregar si falta alguno
        if (!estadoVenta.equalsIgnoreCase("Pendiente")
                    && !estadoVenta.equalsIgnoreCase("Cerrada")
                && !estadoVenta.equalsIgnoreCase("Cancelada")) {
            throw new IllegalArgumentException("El estado de venta seleccionado no es valido");
        }

        this.estadoVenta = estadoVenta;
    }

    public void setFecha(LocalDate fecha) {
        SetValidator.validar(fecha, LocalDateFieldType.FECHA);
        
        this.fecha = fecha;
    }

    public void setMetodoPago(String metodoPago) {
        if (metodoPago == null || metodoPago.isBlank()) {
            throw new IllegalArgumentException("El metodo de pago no puede estar vacio");
        }
            //lo mismo
        if (!metodoPago.equalsIgnoreCase("Efectivo")
                && !metodoPago.equalsIgnoreCase("Tarjeta")
                && !metodoPago.equalsIgnoreCase("Transferencia")
                && !metodoPago.equalsIgnoreCase("Mercado Pago")) {
            throw new IllegalArgumentException("El metodo de pago seleccionado no es valido");
        }

        this.metodoPago = metodoPago;
    }

    public void setObservacion(String observacion) {
        SetValidator.validar(observacion, StringFieldType.OBSERVACIONES);
        
        this.observacion = observacion;
    }

    public void setTotal(BigDecimal total) {
        SetValidator.validar(total, NumericFieldType.TOTAL);
        
        this.total = total;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        SetValidator.validar(fecha, LocalDateFieldType.FECHA_INICIO);
        
        this.fechaInicio = fechaInicio;
    }

    public void setFechaCierre(LocalDate fechaCierre) {
        if ("Pendiente".equalsIgnoreCase(estadoVenta) && fechaCierre != null) {
            throw new IllegalArgumentException(
                "La fecha de cierre debe ser nula si la venta esta pendiente"
            );
        } //si el estado de la venta es pendiente, no deja poner fecha de cierre

        if (fechaCierre != null) {
            SetValidator.validar(fechaCierre, LocalDateFieldType.FECHA_CIERRE);
        }

        this.fechaCierre = fechaCierre;
    }
    
}

