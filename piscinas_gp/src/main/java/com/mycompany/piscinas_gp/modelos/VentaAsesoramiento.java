package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.validadores.NumericFieldType;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;
import java.math.BigDecimal;
import java.time.LocalDate;

public class VentaAsesoramiento extends Venta {
    
    private String problema;
    private String diagnostico;
    private boolean cobrado;
    private BigDecimal monto;

    public VentaAsesoramiento() {
        super();
    }

    public VentaAsesoramiento(String problema, String diagnostico, boolean cobrado, BigDecimal monto, Cliente cliente, String estadoVenta, LocalDate fecha, String metodoPago, String observacion, BigDecimal total, LocalDate fechaInicio, LocalDate fechaCierre) {
        super(cliente, estadoVenta, fecha, metodoPago, observacion, total, fechaInicio, fechaCierre);
        setProblema(problema);
        setDiagnostico(diagnostico);
        setCobrado(cobrado);
        setMonto(monto);
    }

    public VentaAsesoramiento(String problema, String diagnostico, boolean cobrado, BigDecimal monto, Long idVenta, Cliente cliente, String estadoVenta, LocalDate fecha, String metodoPago, String observacion, BigDecimal total, LocalDate fechaInicio, LocalDate fechaCierre) {
        super(idVenta, cliente, estadoVenta, fecha, metodoPago, observacion, total, fechaInicio, fechaCierre);
        this.problema = problema;
        this.diagnostico = diagnostico;
        this.cobrado = cobrado;
        this.monto = monto;
    }

    
    public String getProblema() { return problema; }
    public String getDiagnostico() { return diagnostico; }
    public boolean isCobrado() { return cobrado; }
    public BigDecimal getMonto() { return monto; }

    
    
    public void setProblema(String problema) {
        SetValidator.validar(problema, StringFieldType.PROBLEMA);
        
        this.problema = problema;
    }

    public void setDiagnostico(String diagnostico) {
        SetValidator.validar(diagnostico, StringFieldType.DIAGNOSTICO);
        
        this.diagnostico = diagnostico;
    }

    public void setCobrado(boolean cobrado) {
        this.cobrado = cobrado;
    }

    public void setMonto(BigDecimal monto) {
        SetValidator.validar(monto, NumericFieldType.MONTO);
        
        this.monto = monto;
    }

}
