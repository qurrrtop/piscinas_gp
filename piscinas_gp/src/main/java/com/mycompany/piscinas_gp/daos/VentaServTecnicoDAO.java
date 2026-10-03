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
import com.mycompany.piscinas_gp.modelos.SubrubroServicioTecnico;
import com.mycompany.piscinas_gp.modelos.VentaServTecnico;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class VentaServTecnicoDAO extends GenericoDAO<VentaServTecnico> {

    private static final String TABLE_NAME = "ventas";
    private static final String PRIMARY_KEY = "id";

    private static final String[] COLUMNS_FOR_INSERT = {
        "fecha_inicio", "observacion", "fecha_cierre", "problema",
        "diagnostico", "mano_obra", "monto", "descuento_global",
        "fecha_entrega", "subrubro_servicio_id", "metodo_pago_id",
        "estado_venta_id", "tipo_venta_id", "cliente_id"
    };

    private static final String[] PLACEHOLDER_VALUES = {
        "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?",
        "(SELECT id FROM tipo_ventas WHERE nombre = 'servicio_tecnico')", // TODO: confirmar valor real
        "?"
    };

    private static final String[] COLUMNS_FOR_SELECT = {
        "id", "fecha_inicio", "observacion", "fecha_cierre", "problema",
        "diagnostico", "mano_obra", "fecha_entrega", "subrubro_servicio_id",
        "descuento_global", "monto", "metodo_pago_id", "estado_venta_id", "cliente_id"
    };

    private static final String[] COLUMNS_FOR_UPDATE = {
        "fecha_inicio = ?", "observacion = ?", "fecha_cierre = ?",
        "problema = ?", "diagnostico = ?", "mano_obra = ?", "monto = ?",
        "fecha_entrega = ?", "subrubro_servicio_id = ?",
        "metodo_pago_id = ?", "estado_venta_id = ?", "cliente_id = ?"
    };

    public VentaServTecnicoDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public VentaServTecnico crear(VentaServTecnico venta) throws PersistenceException {
        return createObject(venta);
    }

    public VentaServTecnico crear(VentaServTecnico venta, Connection conn) throws PersistenceException {

        String sql = "INSERT INTO " + TABLE_NAME
                + " (" + String.join(", ", COLUMNS_FOR_INSERT) + ")"
                + " VALUES (" + String.join(", ", PLACEHOLDER_VALUES) + ")";

        try (PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            setInsertParams(pstmt, venta);
            pstmt.executeUpdate();

            try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    venta.setId(generatedKeys.getLong(1));
                    return venta;
                }
            }

            throw new PersistenceException("No se pudo generar el ID de la venta de servicio tecnico");

        } catch (SQLException e) {
            throw new PersistenceException("Error al crear la venta de servicio tecnico", e);
        }
    }

    public VentaServTecnico actualizar(VentaServTecnico venta, Connection conn) throws PersistenceException {

        String sql = "UPDATE " + TABLE_NAME
                + " SET " + String.join(", ", COLUMNS_FOR_UPDATE)
                + " WHERE " + PRIMARY_KEY + " = ?";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            setUpdateParams(pstmt, venta);
            pstmt.setLong(COLUMNS_FOR_UPDATE.length + 1, venta.getId());

            if (pstmt.executeUpdate() == 0) {
                throw new PersistenceException("No existe el servicio tecnico a actualizar");
            }

            return venta;

        } catch (SQLException e) {
            throw new PersistenceException("Error al actualizar el servicio tecnico", e);
        }
    }

    public boolean eliminarPorId(Long id) throws PersistenceException {
        return deleteObject(PRIMARY_KEY, id);
    }

    public VentaServTecnico buscarPorId(Long id) throws PersistenceException {
        String sql = getSqlVentasConRelaciones() + " AND v.id = ?";

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, id);

            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next() ? mapResultSetConRelaciones(rs) : null;
            }
        } catch (SQLException e) {
            throw new PersistenceException("Error al buscar la venta de servicio tecnico con ID " + id, e);
        }
    }

    public List<VentaServTecnico> buscarTodos() throws PersistenceException {
        String sql = getSqlVentasConRelaciones() + " ORDER BY v.fecha_inicio DESC, v.id DESC";
        List<VentaServTecnico> ventas = new ArrayList<>();

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);
                ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                ventas.add(mapResultSetConRelaciones(rs));
            }
            return ventas;
        } catch (SQLException e) {
            throw new PersistenceException("Error al recuperar el historial de servicios tecnicos", e);
        }
    }

        private String getSqlVentasConRelaciones() {
        return "SELECT v.id AS venta_id, v.fecha_inicio, v.observacion, v.fecha_cierre, "
                + "v.problema, v.diagnostico, v.mano_obra, v.fecha_entrega, v.descuento_global, "
                + "v.monto, "
                + "st.id AS subrubro_id, st.nombre AS subrubro_nombre, "
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
                + "JOIN metodo_pagos mp ON mp.id = v.metodo_pago_id "
                + "JOIN clientes c ON c.id = v.cliente_id "
                + "LEFT JOIN subrubros_servicio_tecnico st ON st.id = v.subrubro_servicio_id "
                + "LEFT JOIN localidades l ON l.id = c.localidad_id "
                + "LEFT JOIN clientes_particulares cp ON cp.cliente_id = c.id "
                + "LEFT JOIN clientes_empresas ce ON ce.cliente_id = c.id "
                + "WHERE tv.nombre = 'servicio_tecnico'";
    }

    private VentaServTecnico mapResultSetConRelaciones(ResultSet rs) throws PersistenceException {
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
            MetodoPago metodoPago = new MetodoPago(
                    rs.getLong("metodo_pago_id"), rs.getString("metodo_pago_nombre"));

            SubrubroServicioTecnico subrubro = rs.getObject("subrubro_id") == null ? null
                    : new SubrubroServicioTecnico(rs.getLong("subrubro_id"), rs.getString("subrubro_nombre"));

            LocalDateTime fechaInicio = rs.getTimestamp("fecha_inicio").toLocalDateTime();
            Date fechaCierreSql = rs.getDate("fecha_cierre");
            LocalDate fechaCierre = fechaCierreSql == null ? null : fechaCierreSql.toLocalDate();

            Date fechaEntregaSql = rs.getDate("fecha_entrega");
            LocalDate fechaEntrega = fechaEntregaSql == null ? null : fechaEntregaSql.toLocalDate();

            return new VentaServTecnico(
                    rs.getString("problema"), rs.getString("diagnostico"),
                    rs.getBigDecimal("mano_obra"), fechaEntrega, subrubro,
                    rs.getInt("descuento_global"),
                    Collections.emptyList(),
                    rs.getLong("venta_id"), cliente, estadoVenta, fechaInicio,
                    metodoPago, rs.getString("observacion"), rs.getBigDecimal("monto"),
                    fechaInicio, fechaCierre);

        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear la venta de servicio tecnico", e);
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
    protected void setInsertParams(PreparedStatement pstmt, VentaServTecnico venta) throws PersistenceException {
        try {
            pstmt.setTimestamp(1, Timestamp.valueOf(venta.getFechaInicio()));
            pstmt.setString(2, venta.getObservacion());
            setFechaOpcional(pstmt, 3, venta.getFechaCierre());
            pstmt.setString(4, venta.getProblema());
            pstmt.setString(5, venta.getDiagnostico());
            pstmt.setBigDecimal(6, venta.getManoObra());
            pstmt.setBigDecimal(7, venta.getTotal());
            pstmt.setInt(8, 0); // descuento_global no aplica a servicio tecnico
            setFechaOpcional(pstmt, 9, venta.getFechaEntrega());
            pstmt.setLong(10, venta.getSubrubroServicio().getId());
            pstmt.setLong(11, venta.getMetodoPago().getId());
            pstmt.setLong(12, venta.getEstadoVenta().getId());
            pstmt.setLong(13, venta.getCliente().getId());
        } catch (SQLException e) {
            throw new PersistenceException("Error al asignar los parametros de la venta de servicio tecnico", e);
        }
    }

    @Override
    protected void setUpdateParams(PreparedStatement pstmt, VentaServTecnico venta) throws PersistenceException {
        try {
            pstmt.setTimestamp(1, Timestamp.valueOf(venta.getFechaInicio()));
            pstmt.setString(2, venta.getObservacion());
            setFechaOpcional(pstmt, 3, venta.getFechaCierre());
            pstmt.setString(4, venta.getProblema());
            pstmt.setString(5, venta.getDiagnostico());
            pstmt.setBigDecimal(6, venta.getManoObra());
            pstmt.setBigDecimal(7, venta.getTotal());
            setFechaOpcional(pstmt, 8, venta.getFechaEntrega());
            pstmt.setLong(9, venta.getSubrubroServicio().getId());
            pstmt.setLong(10, venta.getMetodoPago().getId());
            pstmt.setLong(11, venta.getEstadoVenta().getId());
            pstmt.setLong(12, venta.getCliente().getId());
        } catch (SQLException e) {
            throw new PersistenceException("Error al asignar los parametros para actualizar el servicio tecnico", e);
        }
    }

    private void setFechaOpcional(PreparedStatement pstmt, int index, LocalDate fecha) throws SQLException {
        if (fecha == null) {
            pstmt.setNull(index, java.sql.Types.DATE);
        } else {
            pstmt.setDate(index, Date.valueOf(fecha));
        }
    }

    @Override
    protected VentaServTecnico mapResultSet(ResultSet rs) throws PersistenceException {
        try {
            Cliente cliente = new ClienteParticular(
                    rs.getLong("cliente_id"), null, null, null,
                    null, null, null, null, null, true);
            EstadoVenta estadoVenta = new EstadoVenta(
                    rs.getLong("estado_venta_id"), "sin especificar");
            MetodoPago metodoPago = new MetodoPago(
                    rs.getLong("metodo_pago_id"), "sin especificar");
            SubrubroServicioTecnico subrubro = rs.getObject("subrubro_servicio_id") == null ? null
                    : new SubrubroServicioTecnico(rs.getLong("subrubro_servicio_id"), null);

            LocalDateTime fechaInicio = rs.getTimestamp("fecha_inicio").toLocalDateTime();
            Date fechaCierreSql = rs.getDate("fecha_cierre");
            LocalDate fechaCierre = fechaCierreSql == null ? null : fechaCierreSql.toLocalDate();
            Date fechaEntregaSql = rs.getDate("fecha_entrega");
            LocalDate fechaEntrega = fechaEntregaSql == null ? null : fechaEntregaSql.toLocalDate();

            return new VentaServTecnico(
                    rs.getString("problema"), rs.getString("diagnostico"),
                    rs.getBigDecimal("mano_obra"), fechaEntrega, subrubro,
                    rs.getInt("descuento_global"),
                    Collections.emptyList(),
                    rs.getLong("venta_id"), cliente, estadoVenta, fechaInicio,
                    metodoPago, rs.getString("observacion"), rs.getBigDecimal("monto"),
                    fechaInicio, fechaCierre);

        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear el servicio tecnico desde la base de datos", e);
        }
    }
}