package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.validadores.LocalDateFieldType;
import com.mycompany.piscinas_gp.validadores.NumericFieldType;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class VentaServTecnico extends Venta {
    
    private String problema;
    private String diagnostico;
    private BigDecimal manoObra;
    private LocalDate fechaEntrega;
    private SubrubroServicioTecnico subrubroServicio;
    private int descuentoGlobal;
    private List<DetalleVenta> detallesVenta;

    public VentaServTecnico() {
        super();
    }

    public VentaServTecnico(String problema, String diagnostico, BigDecimal manoObra, LocalDate fechaEntrega, SubrubroServicioTecnico subrubroServicio, int descuentoGlobal, List<DetalleVenta> detallesVenta, Cliente cliente, EstadoVenta estadoVenta, LocalDateTime fecha, MetodoPago metodoPago, String observacion, BigDecimal total, LocalDateTime fechaInicio, LocalDate fechaCierre) {
        super(cliente, estadoVenta, fecha, metodoPago, observacion, total, fechaInicio, fechaCierre);
        setProblema(problema);
        setDiagnostico(diagnostico);
        setManoObra(manoObra);
        setFechaEntrega(fechaEntrega);
        setSubrubroServicio(subrubroServicio);
        setDescuentoGlobal(descuentoGlobal);
        setDetallesVenta(detallesVenta);
    }

    public VentaServTecnico(String problema, String diagnostico, BigDecimal manoObra, LocalDate fechaEntrega, SubrubroServicioTecnico subrubroServicio, int descuentoGlobal, List<DetalleVenta> detallesVenta, Long idVenta, Cliente cliente, EstadoVenta estadoVenta, LocalDateTime fecha, MetodoPago metodoPago, String observacion, BigDecimal total, LocalDateTime fechaInicio, LocalDate fechaCierre) {
        super(idVenta, cliente, estadoVenta, fecha, metodoPago, observacion, total, fechaInicio, fechaCierre);
        this.problema = problema;
        this.diagnostico = diagnostico;
        this.manoObra = manoObra;
        this.fechaEntrega = fechaEntrega;
        this.subrubroServicio = subrubroServicio;
        this.descuentoGlobal = descuentoGlobal;
        this.detallesVenta = detallesVenta;
    }

    
    
    public String getProblema() { return problema; }
    public String getDiagnostico() { return diagnostico; }
    public BigDecimal getManoObra() { return manoObra; }
    public LocalDate getFechaEntrega() { return fechaEntrega; }
    public SubrubroServicioTecnico getSubrubroServicio() { return subrubroServicio; }
    public int getDescuentoGlobal() { return descuentoGlobal; }
    public List<DetalleVenta> getDetallesVenta() { return detallesVenta; }

    
    
    public void setProblema(String problema) {
        SetValidator.validar(problema, StringFieldType.PROBLEMA);
        
        this.problema = problema;
    }

    public void setDiagnostico(String diagnostico) {
        if (diagnostico != null) {
            SetValidator.validar(diagnostico, StringFieldType.DIAGNOSTICO);
        }
        
        this.diagnostico = diagnostico;
    }

    public void setManoObra(BigDecimal manoObra) {
        SetValidator.validar(manoObra, NumericFieldType.MANO_OBRA);
        
        this.manoObra = manoObra;
    }

    public void setFechaEntrega(LocalDate fechaEntrega) {
        if (fechaEntrega != null) {
            SetValidator.validar(fechaEntrega, LocalDateFieldType.FECHA_ENTREGA);
        }
        
        this.fechaEntrega = fechaEntrega;
    }

    public void setSubrubroServicio(SubrubroServicioTecnico subrubroServicio) {
        if (subrubroServicio == null) {
            throw new IllegalArgumentException("El subrubro del servicio tecnico no puede ser nulo");
        }
        
        this.subrubroServicio = subrubroServicio;
    }

    public void setDescuentoGlobal(int descuentoGlobal) {
        SetValidator.validar(descuentoGlobal, NumericFieldType.DESCUENTO_GLOBAL);
        
        this.descuentoGlobal = descuentoGlobal;
    }

    //explique en venta producto 
    public void setDetallesVenta(List<DetalleVenta> detallesVenta) {
        if (detallesVenta == null) {
            this.detallesVenta = new ArrayList<>();
            return;
        }

        for (DetalleVenta detalleVenta : detallesVenta) {
            if (detalleVenta == null) {
                throw new IllegalArgumentException(
                    "La lista de detalles de venta no puede contener elementos nulos"
                );
            }
        }

        this.detallesVenta = detallesVenta;
    }

}