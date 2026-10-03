package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.Cliente;
import com.mycompany.piscinas_gp.modelos.ClienteEmpresa;
import com.mycompany.piscinas_gp.modelos.ClienteParticular;
import com.mycompany.piscinas_gp.modelos.EstadoVenta;
import com.mycompany.piscinas_gp.modelos.Localidad;
import com.mycompany.piscinas_gp.modelos.MetodoPago;
import com.mycompany.piscinas_gp.modelos.VentaAsesoramiento;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class VentaAsesoramientoDAO extends GenericoDAO<VentaAsesoramiento> {

    private static final String TABLE_NAME = "ventas";
    private static final String PRIMARY_KEY = "id";

    private static final String[] COLUMNS_FOR_INSERT = {
        "fecha_inicio", "observacion", "fecha_cierre", "problema",
        "diagnostico", "cobrado", "monto", "metodo_pago_id",
        "estado_venta_id", "tipo_venta_id", "cliente_id"
    };

    private static final String[] PLACEHOLDER_VALUES = {
        "?", "?", "?", "?", "?", "?", "?", "?", "?",
        "(SELECT id FROM tipo_ventas WHERE nombre = 'asesoramiento')", "?"
    };

    private static final String[] COLUMNS_FOR_SELECT = {
        "id", "fecha_inicio", "observacion", "fecha_cierre",
        "problema", "diagnostico", "cobrado", "monto",
        "metodo_pago_id", "estado_venta_id", "cliente_id"
    };

    private static final String[] COLUMNS_FOR_UPDATE = {
        "fecha_inicio = ?", "observacion = ?", "fecha_cierre = ?",
        "problema = ?", "diagnostico = ?", "cobrado = ?", "monto = ?",
        "metodo_pago_id = ?", "estado_venta_id = ?", "cliente_id = ?"
    };

    public VentaAsesoramientoDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public VentaAsesoramiento crear(VentaAsesoramiento venta) throws PersistenceException {
        return createObject(venta);
    }

    public VentaAsesoramiento actualizar(VentaAsesoramiento venta) throws PersistenceException {
        return updateObject(PRIMARY_KEY, venta);
    }

    public VentaAsesoramiento buscarPorId(Long id) throws PersistenceException {
        String sql = getSqlVentasConRelaciones() + " AND v.id = ?";

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, id);

            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next() ? mapResultSetConRelaciones(rs) : null;
            }
        } catch (SQLException e) {
            throw new PersistenceException("Error al buscar el asesoramiento con ID " + id, e);
        }
    }

    public List<VentaAsesoramiento> buscarTodos() throws PersistenceException {
        String sql = getSqlVentasConRelaciones() + " ORDER BY v.fecha_inicio DESC, v.id DESC";
        List<VentaAsesoramiento> ventas = new ArrayList<>();

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);
                ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                ventas.add(mapResultSetConRelaciones(rs));
            }
            return ventas;
        } catch (SQLException e) {
            throw new PersistenceException("Error al recuperar el historial de asesoramientos", e);
        }
    }

    private String getSqlVentasConRelaciones() {
        return "SELECT v.id AS venta_id, v.fecha_inicio, v.observacion, v.fecha_cierre, "
                + "v.problema, v.diagnostico, v.cobrado, v.monto, "
                + "ev.id AS estado_id, ev.nombre AS estado_nombre, "
                + "mp.id AS metodo_pago_id, mp.nombre AS metodo_pago_nombre, "
                + "c.id AS cliente_id, c.email, c.telefono, c.calle_numero, c.observaciones, "
                + "c.activo AS cliente_activo, "
                + "l.id AS localidad_id, l.nombre AS localidad_nombre, "
                + "cp.nombre AS cliente_nombre, cp.apellido AS cliente_apellido, cp.cuil AS cliente_cuil, "
                + "ce.razon_social, ce.nombre_fantasia, ce.rubro, ce.cuit, "
                + "CASE WHEN cp.cliente_id IS NOT NULL THEN 'particular' ELSE 'empresa' END AS tipo_cliente "
                + "FROM ventas v "
                + "JOIN tipo_ventas tv ON tv.id = v.tipo_venta_id "
                + "JOIN estado_ventas ev ON ev.id = v.estado_venta_id "
                + "LEFT JOIN metodo_pagos mp ON mp.id = v.metodo_pago_id "
                + "JOIN clientes c ON c.id = v.cliente_id "
                + "LEFT JOIN localidades l ON l.id = c.localidad_id "
                + "LEFT JOIN clientes_particulares cp ON cp.cliente_id = c.id "
                + "LEFT JOIN clientes_empresas ce ON ce.cliente_id = c.id "
                + "WHERE tv.nombre = 'asesoramiento'";
    }

    private VentaAsesoramiento mapResultSetConRelaciones(ResultSet rs) throws PersistenceException {
        try {
            Localidad localidad = rs.getObject("localidad_id") == null ? null : new Localidad(
                    rs.getLong("localidad_id"), rs.getString("localidad_nombre"));

            Cliente cliente;
            if ("particular".equals(rs.getString("tipo_cliente"))) {
                cliente = new ClienteParticular(
                        rs.getLong("cliente_id"), rs.getString("cliente_nombre"),
                        rs.getString("cliente_apellido"), rs.getString("cliente_cuil"),
                        rs.getString("email"), rs.getString("telefono"),
                        rs.getString("calle_numero"), localidad, rs.getString("observaciones"), rs.getBoolean("cliente_activo"));
            } else {
                cliente = new ClienteEmpresa(
                        rs.getLong("cliente_id"), rs.getString("razon_social"),
                        rs.getString("nombre_fantasia"), rs.getString("rubro"),
                        rs.getString("cuit"), rs.getString("email"),
                        rs.getString("telefono"), rs.getString("calle_numero"),
                        localidad, rs.getString("observaciones"),
                        rs.getBoolean("cliente_activo"));
            }

            EstadoVenta estadoVenta = new EstadoVenta(
                    rs.getLong("estado_id"), rs.getString("estado_nombre"));

            // metodo_pago_id puede ser NULL cuando el asesoramiento no se cobra
            MetodoPago metodoPago = rs.getObject("metodo_pago_id") == null ? null : new MetodoPago(
                    rs.getLong("metodo_pago_id"), rs.getString("metodo_pago_nombre"));

            LocalDateTime fechaInicio = rs.getTimestamp("fecha_inicio").toLocalDateTime();
            Date fechaCierreSql = rs.getDate("fecha_cierre");
            LocalDate fechaCierre = fechaCierreSql == null ? null : fechaCierreSql.toLocalDate();

            boolean cobrado = rs.getBoolean("cobrado"); // false si la columna es NULL

            return new VentaAsesoramiento(
                    rs.getString("problema"), rs.getString("diagnostico"),
                    cobrado, rs.getBigDecimal("monto"),
                    rs.getLong("venta_id"), cliente, estadoVenta, fechaInicio,
                    metodoPago, rs.getString("observacion"), null,
                    fechaInicio, fechaCierre);

        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear el asesoramiento", e);
        }
    }

    @Override
    protected String getTableName() {
        return TABLE_NAME;
    }

    @Override
    protected String[] getColumnsForInsert() {
        return COLUMNS_FOR_INSERT;
    }

    @Override
    protected String[] getPlaceHolderValues() {
        return PLACEHOLDER_VALUES;
    }

    @Override
    protected String[] getColumnsForSelect() {
        return COLUMNS_FOR_SELECT;
    }

    @Override
    protected String[] getColumnsForUpdate() {
        return COLUMNS_FOR_UPDATE;
    }

    @Override
    protected String getPrimaryKey() {
        return PRIMARY_KEY;
    }

    @Override
    protected void setInsertParams(PreparedStatement pstmt, VentaAsesoramiento venta) throws PersistenceException {
        try {
            pstmt.setTimestamp(1, Timestamp.valueOf(venta.getFechaInicio()));
            pstmt.setString(2, venta.getObservacion());
            setFechaOpcional(pstmt, 3, venta.getFechaCierre());
            pstmt.setString(4, venta.getProblema());
            setStringOpcional(pstmt, 5, venta.getDiagnostico());
            pstmt.setBoolean(6, venta.isCobrado());
            setMontoOpcional(pstmt, 7, venta.getMonto());
            if (venta.getMetodoPago() != null) {
                pstmt.setLong(8, venta.getMetodoPago().getId());
            } else {
                pstmt.setNull(8, java.sql.Types.BIGINT);
            }
            pstmt.setLong(9, venta.getEstadoVenta().getId());
            pstmt.setLong(10, venta.getCliente().getId());
        } catch (SQLException e) {
            throw new PersistenceException("Error al asignar los parametros del asesoramiento", e);
        }
    }

    @Override
    protected void setUpdateParams(PreparedStatement pstmt, VentaAsesoramiento venta) throws PersistenceException {
        setInsertParams(pstmt, venta);
    }

    private void setFechaOpcional(PreparedStatement pstmt, int index, LocalDate fecha) throws SQLException {
        if (fecha == null) {
            pstmt.setNull(index, java.sql.Types.DATE);
        } else {
            pstmt.setDate(index, Date.valueOf(fecha));
        }
    }

    private void setStringOpcional(PreparedStatement pstmt, int index, String valor) throws SQLException {
        if (valor == null) {
            pstmt.setNull(index, java.sql.Types.VARCHAR);
        } else {
            pstmt.setString(index, valor);
        }
    }

    private void setMontoOpcional(PreparedStatement pstmt, int index, java.math.BigDecimal valor) throws SQLException {
        if (valor == null) {
            pstmt.setNull(index, java.sql.Types.DECIMAL);
        } else {
            pstmt.setBigDecimal(index, valor);
        }
    }

    @Override
    protected VentaAsesoramiento mapResultSet(ResultSet rs) throws PersistenceException {
        try {
            Cliente cliente = new ClienteParticular(
                    rs.getLong("cliente_id"), null, null, null,
                    null, null, null, null, null, true);
            EstadoVenta estadoVenta = new EstadoVenta(
                    rs.getLong("estado_venta_id"), "sin especificar");
            MetodoPago metodoPago = new MetodoPago(
                    rs.getLong("metodo_pago_id"), "sin especificar");

            LocalDateTime fechaInicio = rs.getTimestamp("fecha_inicio").toLocalDateTime();
            Date fechaCierreSql = rs.getDate("fecha_cierre");
            LocalDate fechaCierre = fechaCierreSql == null ? null : fechaCierreSql.toLocalDate();

            return new VentaAsesoramiento(
                    rs.getString("problema"), rs.getString("diagnostico"),
                    rs.getBoolean("cobrado"), rs.getBigDecimal("monto"),
                    rs.getLong("id"), cliente, estadoVenta, fechaInicio,
                    metodoPago, rs.getString("observacion"), null,
                    fechaInicio, fechaCierre);

        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear el asesoramiento desde la base de datos", e);
        }
    }
}