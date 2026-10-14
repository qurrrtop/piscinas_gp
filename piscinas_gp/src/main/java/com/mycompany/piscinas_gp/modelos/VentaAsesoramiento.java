package com.mycompany.piscinas_gp.modelos;

import com.mycompany.piscinas_gp.validadores.NumericFieldType;
import com.mycompany.piscinas_gp.validadores.SetValidator;
import com.mycompany.piscinas_gp.validadores.StringFieldType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class VentaAsesoramiento extends Venta {

    private String problema;
    private String diagnostico;
    private boolean cobrado;
    private BigDecimal monto;
    private List<String> imagenesEvidencia;

    public VentaAsesoramiento() {
        super();
    }

    public VentaAsesoramiento(String problema, String diagnostico, boolean cobrado, BigDecimal monto, List<String> imagenesEvidencia, Cliente cliente, EstadoVenta estadoVenta, LocalDateTime fecha, MetodoPago metodoPago, String observacion, BigDecimal total, LocalDateTime fechaInicio, LocalDate fechaCierre) {
        super(cliente, estadoVenta, fecha, metodoPago, observacion, total, fechaInicio, fechaCierre);
        setProblema(problema);
        setDiagnostico(diagnostico);
        setCobrado(cobrado);
        setMonto(monto);
        setImagenesEvidencia(imagenesEvidencia);
    }

    public VentaAsesoramiento(String problema, String diagnostico, boolean cobrado, BigDecimal monto, List<String> imagenesEvidencia, Long idVenta, Cliente cliente, EstadoVenta estadoVenta, LocalDateTime fecha, MetodoPago metodoPago, String observacion, BigDecimal total, LocalDateTime fechaInicio, LocalDate fechaCierre) {
        super(idVenta, cliente, estadoVenta, fecha, metodoPago, observacion, total, fechaInicio, fechaCierre);
        this.problema = problema;
        this.diagnostico = diagnostico;
        this.cobrado = cobrado;
        this.monto = monto;
        this.imagenesEvidencia = imagenesEvidencia != null ? imagenesEvidencia : new ArrayList<>();
    }

    public String getProblema() { return problema; }
    public String getDiagnostico() { return diagnostico; }
    public boolean isCobrado() { return cobrado; }
    public BigDecimal getMonto() { return monto; }
    public List<String> getImagenesEvidencia() { return imagenesEvidencia; }

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

    // nombres de los archivos guardados en disco; lista vacia si no se adjunto ninguna imagen
    // (la cantidad maxima se controla en el servicio)
    public void setImagenesEvidencia(List<String> imagenesEvidencia) {
        if (imagenesEvidencia == null) {
            this.imagenesEvidencia = new ArrayList<>();
            return;
        }

        for (String imagen : imagenesEvidencia) {
            if (imagen == null || imagen.isBlank()) {
                throw new IllegalArgumentException(
                    "La lista de imagenes no puede contener nombres vacios"
                );
            }
        }

        this.imagenesEvidencia = imagenesEvidencia;
    }

}