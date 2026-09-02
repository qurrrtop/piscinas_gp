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
import com.mycompany.piscinas_gp.modelos.VentaProducto;
import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;


// DAO exclusivo para las ventas de productos. Los servicios tecnicos y los
// asesoramientos se administran en sus propios daos, aunque en la bd comparten la misma tabla,
// ventadao tendria que tener metodos generales que afecten a todas las ventas de por si, como el que tiene ahora.

public class VentaProductoDAO extends GenericoDAO<VentaProducto> {

    private static final String TABLE_NAME = "ventas";
    private static final String PRIMARY_KEY = "id";

    private static final String[] COLUMNS_FOR_INSERT = {
        "fecha_inicio", "observacion", "fecha_cierre", "problema",
        "diagnostico", "mano_obra", "monto", "descuento_global",
        "fecha_entrega", "metodo_pago_id", "estado_venta_id",
        "tipo_venta_id", "cliente_id"
    };

    private static final String[] PLACEHOLDER_VALUES = {
        "?", "?", "?", "?", "?", "?", "?", "?", "?", "?", "?",
        "(SELECT id FROM tipo_ventas WHERE nombre = 'producto')", "?"
    };

    private static final String[] COLUMNS_FOR_SELECT = {
        "id", "fecha_inicio", "observacion", "fecha_cierre", "monto",
        "descuento_global", "metodo_pago_id", "estado_venta_id", "cliente_id"
    };

    private static final String[] COLUMNS_FOR_UPDATE = {
        "fecha_inicio = ?", "observacion = ?", "fecha_cierre = ?",
        "monto = ?", "descuento_global = ?", "metodo_pago_id = ?",
        "estado_venta_id = ?", "cliente_id = ?"
    };

    public VentaProductoDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public VentaProducto crear(VentaProducto venta) throws PersistenceException {
        return createObject(venta);
    }

    public VentaProducto actualizar(VentaProducto venta) throws PersistenceException {
        return updateObject(PRIMARY_KEY, venta);
    }

    public boolean eliminarPorId(Long id) throws PersistenceException {
        return deleteObject(PRIMARY_KEY, id);
    }

    public VentaProducto buscarPorId(Long id) throws PersistenceException {
        String sql = getSqlVentasConRelaciones() + " AND v.id = ?";

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, id);

            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next() ? mapResultSetConRelaciones(rs) : null;
            }
        } catch (SQLException e) {
            throw new PersistenceException("Error al buscar la venta de producto con ID " + id, e);
        }
    }

    public List<VentaProducto> buscarTodos() throws PersistenceException {
        String sql = getSqlVentasConRelaciones() + " ORDER BY v.fecha_inicio DESC, v.id DESC";
        List<VentaProducto> ventas = new ArrayList<>();

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);
                ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                ventas.add(mapResultSetConRelaciones(rs));
            }
            return ventas;
        } catch (SQLException e) {
            throw new PersistenceException("Error al recuperar el historial de ventas de productos", e);
        }
    }
//para lsitar el historial de ventas
// los filtros son opcionales, si no se selecciona un filtro desde la vista, llega como null,
// entonces no se aplica ese filtro y muestra las ventas que correspondan
    public List<VentaProducto> listarHistorial(
            String cliente, String estado, LocalDate fechaDesde, LocalDate fechaHasta
    ) throws PersistenceException {

        StringBuilder sql = new StringBuilder(getSqlVentasConRelaciones());
        List<Object> parametros = new ArrayList<>();

        if (cliente != null && !cliente.isBlank()) {
            sql.append(" AND (CONCAT(COALESCE(cp.nombre, ''), ' ', COALESCE(cp.apellido, '')) LIKE ? "
                    + "OR ce.razon_social LIKE ? OR ce.nombre_fantasia LIKE ?)");
            String texto = "%" + cliente.trim() + "%";
            parametros.add(texto);
            parametros.add(texto);
            parametros.add(texto);
        }

        if (estado != null && !estado.isBlank()) {
            sql.append(" AND LOWER(ev.nombre) = ?");
            parametros.add(estado.trim().toLowerCase());
        }

        if (fechaDesde != null) {
            sql.append(" AND v.fecha_inicio >= ?");
            parametros.add(Date.valueOf(fechaDesde));
        }

        if (fechaHasta != null) {
            sql.append(" AND v.fecha_inicio <= ?");
            parametros.add(Date.valueOf(fechaHasta));
        }

        sql.append(" ORDER BY v.fecha_inicio DESC, v.id DESC");

        List<VentaProducto> ventas = new ArrayList<>();

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql.toString())) {

            for (int i = 0; i < parametros.size(); i++) {
                pstmt.setObject(i + 1, parametros.get(i));
            }

            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    ventas.add(mapResultSetConRelaciones(rs));
                }
            }
            return ventas;
        } catch (SQLException e) {
            throw new PersistenceException("Error al filtrar el historial de ventas de productos", e);
        }
    }

    private String getSqlVentasConRelaciones() {
        return "SELECT v.id AS venta_id, v.fecha_inicio, v.observacion, v.fecha_cierre, "
                + "v.monto, v.descuento_global, "
                + "ev.id AS estado_id, ev.nombre AS estado_nombre, "
                + "mp.id AS metodo_pago_id, mp.nombre AS metodo_pago_nombre, "
                + "c.id AS cliente_id, c.email, c.telefono, c.calle_numero, c.observaciones, "
                + "l.id AS localidad_id, l.nombre AS localidad_nombre, "
                + "cp.nombre AS cliente_nombre, cp.apellido AS cliente_apellido, cp.cuil AS cliente_cuil, "
                + "ce.razon_social, ce.nombre_fantasia, ce.rubro, ce.cuit, "
                + "CASE WHEN cp.cliente_id IS NOT NULL THEN 'particular' ELSE 'empresa' END AS tipo_cliente "
                + "FROM ventas v "
                + "JOIN tipo_ventas tv ON tv.id = v.tipo_venta_id "
                + "JOIN estado_ventas ev ON ev.id = v.estado_venta_id "
                + "JOIN metodo_pagos mp ON mp.id = v.metodo_pago_id "
                + "JOIN clientes c ON c.id = v.cliente_id "
                + "LEFT JOIN localidades l ON l.id = c.localidad_id "
                + "LEFT JOIN clientes_particulares cp ON cp.cliente_id = c.id "
                + "LEFT JOIN clientes_empresas ce ON ce.cliente_id = c.id "
                + "WHERE tv.nombre = 'producto'";
    }

    private VentaProducto mapResultSetConRelaciones(ResultSet rs) throws PersistenceException {
        try {
            Localidad localidad = rs.getObject("localidad_id") == null ? null : new Localidad(
                    rs.getLong("localidad_id"), rs.getString("localidad_nombre"));

            Cliente cliente;
            if ("particular".equals(rs.getString("tipo_cliente"))) {
                cliente = new ClienteParticular(
                        rs.getLong("cliente_id"), rs.getString("cliente_nombre"),
                        rs.getString("cliente_apellido"), rs.getString("cliente_cuil"),
                        rs.getString("email"), rs.getString("telefono"),
                        rs.getString("calle_numero"), localidad, rs.getString("observaciones"));
            } else {
                cliente = new ClienteEmpresa(
                        rs.getLong("cliente_id"), rs.getString("razon_social"),
                        rs.getString("nombre_fantasia"), rs.getString("rubro"),
                        rs.getString("cuit"), rs.getString("email"),
                        rs.getString("telefono"), rs.getString("calle_numero"),
                        localidad, rs.getString("observaciones"));
            }

            EstadoVenta estadoVenta = new EstadoVenta(
                    rs.getLong("estado_id"), rs.getString("estado_nombre"));
            MetodoPago metodoPago = new MetodoPago(
                    rs.getLong("metodo_pago_id"), rs.getString("metodo_pago_nombre"), null);

            LocalDate fechaInicio = rs.getDate("fecha_inicio").toLocalDate();
            Date fechaCierreSql = rs.getDate("fecha_cierre");
            LocalDate fechaCierre = fechaCierreSql == null ? null : fechaCierreSql.toLocalDate();

            return new VentaProducto(
                    rs.getInt("descuento_global"), Collections.emptyList(),
                    rs.getLong("venta_id"), cliente, estadoVenta, fechaInicio,
                    metodoPago, rs.getString("observacion"), rs.getBigDecimal("monto"),
                    fechaInicio, fechaCierre);
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear la venta de producto", e);
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
    protected void setInsertParams(PreparedStatement pstmt, VentaProducto venta)
            throws PersistenceException {
        try {
            pstmt.setDate(1, Date.valueOf(venta.getFechaInicio()));
            pstmt.setString(2, venta.getObservacion());
            setFechaOpcional(pstmt, 3, venta.getFechaCierre());
            pstmt.setNull(4, java.sql.Types.VARCHAR);
            pstmt.setNull(5, java.sql.Types.VARCHAR);
            pstmt.setNull(6, java.sql.Types.DECIMAL);
            pstmt.setBigDecimal(7, venta.getTotal());
            pstmt.setInt(8, venta.getDescuentoGlobal());
            pstmt.setNull(9, java.sql.Types.DATE);
            pstmt.setLong(10, venta.getMetodoPago().getId());
            pstmt.setLong(11, venta.getEstadoVenta().getId());
            pstmt.setLong(12, venta.getCliente().getId());
        } catch (SQLException e) {
            throw new PersistenceException("Error al asignar los parametros de la venta de producto", e);
        }
    }

    @Override
    protected void setUpdateParams(PreparedStatement pstmt, VentaProducto venta)
            throws PersistenceException {
        try {
            pstmt.setDate(1, Date.valueOf(venta.getFechaInicio()));
            pstmt.setString(2, venta.getObservacion());
            setFechaOpcional(pstmt, 3, venta.getFechaCierre());
            pstmt.setBigDecimal(4, venta.getTotal());
            pstmt.setInt(5, venta.getDescuentoGlobal());
            pstmt.setLong(6, venta.getMetodoPago().getId());
            pstmt.setLong(7, venta.getEstadoVenta().getId());
            pstmt.setLong(8, venta.getCliente().getId());
        } catch (SQLException e) {
            throw new PersistenceException("Error al asignar los parametros para actualizar la venta", e);
        }
    }

    private void setFechaOpcional(PreparedStatement pstmt, int index, LocalDate fecha)
            throws SQLException {
        if (fecha == null) {
            pstmt.setNull(index, java.sql.Types.DATE);
        } else {
            pstmt.setDate(index, Date.valueOf(fecha));
        }
    }

    @Override
    protected VentaProducto mapResultSet(ResultSet rs) throws PersistenceException {
        try {
            Cliente cliente = new ClienteParticular(
                    rs.getLong("cliente_id"), null, null, null,
                    null, null, null, null, null);
            EstadoVenta estadoVenta = new EstadoVenta(
                    rs.getLong("estado_venta_id"), "sin especificar");
            MetodoPago metodoPago = new MetodoPago(
                    rs.getLong("metodo_pago_id"), "sin especificar", null);

            LocalDate fechaInicio = rs.getDate("fecha_inicio").toLocalDate();
            Date fechaCierreSql = rs.getDate("fecha_cierre");
            LocalDate fechaCierre = fechaCierreSql == null ? null : fechaCierreSql.toLocalDate();

            return new VentaProducto(
                    rs.getInt("descuento_global"), Collections.emptyList(),
                    rs.getLong("id"), cliente, estadoVenta, fechaInicio,
                    metodoPago, rs.getString("observacion"), rs.getBigDecimal("monto"),
                    fechaInicio, fechaCierre);
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear la venta desde la base de datos", e);
        }
    }
}
