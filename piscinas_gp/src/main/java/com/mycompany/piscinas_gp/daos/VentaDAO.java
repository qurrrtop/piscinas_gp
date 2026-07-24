
package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.Cliente;
import com.mycompany.piscinas_gp.modelos.EstadoVenta;
import com.mycompany.piscinas_gp.modelos.MetodoPago;
import com.mycompany.piscinas_gp.modelos.Venta;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class VentaDAO extends GenericoDAO<Venta> {

    private static final String TABLE_NAME = "ventas";
    private static final String PRIMARY_KEY = "id";

    private static final String[] COLUMNS_FOR_INSERT = {
        "idCliente",
        "idEstadoVenta",
        "fecha",
        "idMetodoPago",
        "observacion",
        "total",
        "fechaInicio",
        "fechaCierre"
    };

    private static final String[] PLACEHOLDER_VALUES = {
        "?",
        "?",
        "?",
        "?",
        "?",
        "?",
        "?",
        "?"
    };

    private static final String[] COLUMNS_FOR_SELECT = {
        "idVenta",
        "idCliente",
        "idEstadoVenta",
        "fecha",
        "idMetodoPago",
        "observacion",
        "total",
        "fechaInicio",
        "fechaCierre"
    };

    private static final String[] COLUMNS_FOR_UPDATE = {
        "idCliente = ?",
        "idEstadoVenta = ?",
        "fecha = ?",
        "idMetodoPago = ?",
        "observacion = ?",
        "total = ?",
        "fechaInicio = ?",
        "fechaCierre = ?"
    };

    public VentaDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public Venta buscarPorId(Long idVenta) throws PersistenceException {
        return findById(idVenta);
    }

    public Venta crear(Venta venta) throws PersistenceException {
        return createObject(venta);
    }

    public Venta actualizar(Venta venta) throws PersistenceException {
        return updateObject(PRIMARY_KEY, venta);
    }

    public boolean eliminarPorId(Long idVenta) throws PersistenceException {
        return deleteObject(PRIMARY_KEY, idVenta);
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
    protected void setInsertParams(PreparedStatement pstmt, Venta venta) throws PersistenceException {
        setVentaParams(pstmt, venta);
    }

    @Override
    protected void setUpdateParams(PreparedStatement pstmt, Venta venta) throws PersistenceException {
        setVentaParams(pstmt, venta);
    }
    
  @Override
protected Venta mapResultSet(ResultSet rs) throws PersistenceException {
    try {

        ClienteDAO clienteDAO = new ClienteDAO(dbConn);

        Cliente cliente = clienteDAO.buscarPorId(rs.getLong("cliente_id"));

        EstadoVenta estadoVenta = new EstadoVenta(
                rs.getLong("estado_venta_id"),
                null
        );

        MetodoPago metodoPago = new MetodoPago(
                rs.getLong("metodo_pago_id"),
                null,
                null
        );

        return new Venta(
                rs.getLong("id"),
                cliente,
                estadoVenta,
                rs.getDate("fecha").toLocalDate(),
                metodoPago,
                rs.getString("observacion"),
                rs.getBigDecimal("total"),
                rs.getDate("fecha_inicio").toLocalDate(),
                rs.getDate("fecha_cierre") != null
                        ? rs.getDate("fecha_cierre").toLocalDate()
                        : null
        );

    } catch (SQLException e) {
        throw new PersistenceException(
                "Error al mapear la venta desde la base de datos", e);
    }
}

    private void setVentaParams(PreparedStatement pstmt, Venta venta) throws PersistenceException {

        validarRelaciones(venta);

        try {

            pstmt.setLong(1, venta.getCliente().getId());
            pstmt.setLong(2, venta.getEstadoVenta().getId());
            pstmt.setDate(3, java.sql.Date.valueOf(venta.getFecha()));
            pstmt.setLong(4, venta.getMetodoPago().getId());
            pstmt.setString(5, venta.getObservacion());
            pstmt.setBigDecimal(6, venta.getTotal());
            pstmt.setDate(7, java.sql.Date.valueOf(venta.getFechaInicio()));

            if (venta.getFechaCierre() != null) {
                pstmt.setDate(8, java.sql.Date.valueOf(venta.getFechaCierre()));
            } else {
                pstmt.setNull(8, java.sql.Types.DATE);
            }

        } catch (SQLException e) {
            throw new PersistenceException("Error al asignar los parámetros de la venta", e);
        }
    }

    private void validarRelaciones(Venta venta) throws PersistenceException {

        if (venta.getCliente() == null || venta.getCliente().getId() == null) {
            throw new PersistenceException("La venta debe tener un cliente con ID asignado");
        }

        if (venta.getEstadoVenta() == null || venta.getEstadoVenta().getId() == null) {
            throw new PersistenceException("La venta debe tener un estado de venta con ID asignado");
        }

        if (venta.getMetodoPago() == null || venta.getMetodoPago().getId() == null) {
            throw new PersistenceException("La venta debe tener un método de pago con ID asignado");
        }
    }
}