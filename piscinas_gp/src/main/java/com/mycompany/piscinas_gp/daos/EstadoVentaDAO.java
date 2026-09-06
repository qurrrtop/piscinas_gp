package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.EstadoVenta;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

public class EstadoVentaDAO extends GenericoDAO<EstadoVenta> {

    private static final String TABLE_NAME = "estado_ventas";
    private static final String PRIMARY_KEY = "id";

    private static final String[] COLUMNS_FOR_INSERT = {
        "nombre"
    };

    private static final String[] PLACEHOLDER_VALUES = {
        "?"
    };

    private static final String[] COLUMNS_FOR_SELECT = {
        "id",
        "nombre"
    };

    private static final String[] COLUMNS_FOR_UPDATE = {
        "nombre = ?"
    };

    public EstadoVentaDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public EstadoVenta buscarPorId(Long id) throws PersistenceException {
        return findById(id);
    }

    public EstadoVenta buscarPorNombre(String nombre)
            throws PersistenceException {

        return findByField("nombre", nombre);
    }

    public List<EstadoVenta> buscarTodos() throws PersistenceException {
        return findAllObjects("nombre");
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
    protected void setInsertParams(
            PreparedStatement pstmt, EstadoVenta estado
    ) throws PersistenceException {

        try {
            pstmt.setString(1, estado.getNombre());

        } catch (SQLException e) {
            throw new PersistenceException(
                    "Error al asignar el nombre del estado de venta", e);
        }
    }

    @Override
    protected void setUpdateParams(
            PreparedStatement pstmt, EstadoVenta estado
    ) throws PersistenceException {

        setInsertParams(pstmt, estado);
    }

    @Override
    protected EstadoVenta mapResultSet(ResultSet rs)
            throws PersistenceException {

        try {
            return new EstadoVenta(
                    rs.getLong("id"),
                    rs.getString("nombre")
            );

        } catch (SQLException e) {
            throw new PersistenceException(
                    "Error al mapear el estado de venta", e);
        }
    }
}
