
package com.mycompany.piscinas_gp.dtos;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

public class VentaDTO {
    //atributos de venta
    private Long id;
    private String tipo;
    
    private Long clienteId ;
    private Long estadoVentaId;
    private LocalDate fecha;
    private Long metodoPagoId;
    private String observacion;
    private BigDecimal total;
    private LocalDate fechaInicio;
    private LocalDate fechaCierre;

    //atributos de ventaproducto
    private int descuentoGlobal;
    private List<DetalleVentaDTO> detallesVenta;

    //atributos de ventaasesoramento
    private String problema;
    private String diagnostico;
    private boolean cobrado;
    private BigDecimal monto;

    //atributos de venta serv.tecnico
    private BigDecimal manoObra;
    private LocalDate fechaEntrega;

    public VentaDTO() {
    }
    
    public Long getId() {
        return id;
    }
    public String getTipo() {
        return tipo;
    }
    public Long getClienteId() {
        return clienteId;
    }
    public Long getEstadoVentaId() {
        return estadoVentaId;
    }
    public LocalDate getFecha() {
        return fecha;
    }
    public Long getMetodoPagoId() {
        return metodoPagoId;
    }
    public String getObservacion() {
        return observacion;
    }
    public BigDecimal getTotal() {
        return total;
    }
    public LocalDate getFechaInicio() {
        return fechaInicio;
    }
    public LocalDate getFechaCierre() {
        return fechaCierre;
    }
    public int getDescuentoGlobal() {
        return descuentoGlobal;
    }
    public List<DetalleVentaDTO> getDetallesVenta() {
        return detallesVenta;
    }
    public String getProblema() {
        return problema;
    }
    public String getDiagnostico() {
        return diagnostico;
    }
    public boolean isCobrado() {
        return cobrado;
    }
    public BigDecimal getMonto() {
        return monto;
    }
    public BigDecimal getManoObra() {
        return manoObra;
    }
    public LocalDate getFechaEntrega() {
        return fechaEntrega;
    }

    public void setId(Long id) {
        this.id = id;
    }
    public void setTipo(String tipo) {
        this.tipo = tipo;
    }
    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }
    public void setEstadoVentaId(Long estadoVentaId) {
        this.estadoVentaId = estadoVentaId;
    }
    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }
    public void setMetodoPagoId(Long metodoPagoId) {
        this.metodoPagoId = metodoPagoId;
    }
    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }
    public void setTotal(BigDecimal total) {
        this.total = total;
    }
    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }
    public void setFechaCierre(LocalDate fechaCierre) {
        this.fechaCierre = fechaCierre;
    }
    public void setDescuentoGlobal(int descuentoGlobal) {
        this.descuentoGlobal = descuentoGlobal;
    }
    public void setDetallesVenta(List<DetalleVentaDTO> detallesVenta) {
        this.detallesVenta = detallesVenta;
    }
    public void setProblema(String problema) {
        this.problema = problema;
    }
    public void setDiagnostico(String diagnostico) {
        this.diagnostico = diagnostico;
    }
    public void setCobrado(boolean cobrado) {
        this.cobrado = cobrado;
    }
    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }
    public void setManoObra(BigDecimal manoObra) {
        this.manoObra = manoObra;
    }
    public void setFechaEntrega(LocalDate fechaEntrega) {
        this.fechaEntrega = fechaEntrega;
    }
    
    
    
}