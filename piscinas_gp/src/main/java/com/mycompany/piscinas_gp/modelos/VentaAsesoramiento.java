package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.validadores.NumericFieldType;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class VentaAsesoramiento extends Venta {
    
    private String problema;
    private String diagnostico;
    private boolean cobrado;
    private BigDecimal monto;
    private String imagenEvidencia;

    public VentaAsesoramiento() {
        super();
    }

    public VentaAsesoramiento(String problema, String diagnostico, boolean cobrado, BigDecimal monto, String imagenEvidencia, Cliente cliente, EstadoVenta estadoVenta, LocalDateTime fecha, MetodoPago metodoPago, String observacion, BigDecimal total, LocalDateTime fechaInicio, LocalDate fechaCierre) {
        super(cliente, estadoVenta, fecha, metodoPago, observacion, total, fechaInicio, fechaCierre);
        setProblema(problema);
        setDiagnostico(diagnostico);
        setCobrado(cobrado);
        setMonto(monto);
        setImagenEvidencia(imagenEvidencia);
    }

    public VentaAsesoramiento(String problema, String diagnostico, boolean cobrado, BigDecimal monto, String imagenEvidencia, Long idVenta, Cliente cliente, EstadoVenta estadoVenta, LocalDateTime fecha, MetodoPago metodoPago, String observacion, BigDecimal total, LocalDateTime fechaInicio, LocalDate fechaCierre) {
        super(idVenta, cliente, estadoVenta, fecha, metodoPago, observacion, total, fechaInicio, fechaCierre);
        this.problema = problema;
        this.diagnostico = diagnostico;
        this.cobrado = cobrado;
        this.monto = monto;
        this.imagenEvidencia = imagenEvidencia;
    }

    
    public String getProblema() { return problema; }
    public String getDiagnostico() { return diagnostico; }
    public boolean isCobrado() { return cobrado; }
    public BigDecimal getMonto() { return monto; }
    public String getImagenEvidencia() { return imagenEvidencia; }

    
    
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

    public void setCobrado(boolean cobrado) {
        this.cobrado = cobrado;
    }

    public void setMonto(BigDecimal monto) {
        if (monto != null) {
            SetValidator.validar(monto, NumericFieldType.MONTO);
        }
        
        this.monto = monto;
    }

    // solo el nombre del archivo guardado en disco; null si no se adjunto ninguna imagen
    public void setImagenEvidencia(String imagenEvidencia) {
        this.imagenEvidencia = imagenEvidencia;
    }

}