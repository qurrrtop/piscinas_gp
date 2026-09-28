package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.MarcaProducto;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class MarcaProductoDAO extends GenericoDAO<MarcaProducto> {

    private static final String TABLE_NAME = "marca_productos";
    private static final String PRIMARY_KEY = "id";
    private static final String[] COLUMNS_FOR_INSERT = { "nombre", "activo" };
    private static final String[] PLACEHOLDER_VALUES = { "?", "?" };
    private static final String[] COLUMNS_FOR_SELECT = { "id", "nombre", "activo" };
    private static final String[] COLUMNS_FOR_UPDATE = { "nombre = ?", "activo = ?" };

    public MarcaProductoDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public MarcaProducto buscarPorId(Long id) throws PersistenceException {
        return findById(id);
    }

    public MarcaProducto crear(MarcaProducto marca) throws PersistenceException {
        return createObject(marca);
    }

    public MarcaProducto actualizar(MarcaProducto marca) throws PersistenceException {
        return updateObject(PRIMARY_KEY, marca);
    }

    public List<MarcaProducto> buscarTodos() throws PersistenceException {
        return findAllObjects("nombre");
    }

    /** Solo las marcas activas — para poblar selects de alta (formulario de producto, importador). */
    public List<MarcaProducto> buscarActivas() throws PersistenceException {
        String sql = "SELECT " + String.join(", ", COLUMNS_FOR_SELECT)
                + " FROM " + TABLE_NAME + " WHERE activo = TRUE ORDER BY nombre";

        List<MarcaProducto> marcas = new ArrayList<>();

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);
                ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                marcas.add(mapResultSet(rs));
            }
            return marcas;

        } catch (SQLException e) {
            throw new PersistenceException("Error al recuperar las marcas activas", e);
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
    protected void setInsertParams(PreparedStatement pstmt, MarcaProducto marca) throws PersistenceException {
        try {
            pstmt.setString(1, marca.getNombre());
            pstmt.setBoolean(2, marca.getActivo());
        } catch (SQLException e) {
            throw new PersistenceException("Error al asignar los parametros de la marca", e);
        }
    }

    @Override
    protected void setUpdateParams(PreparedStatement pstmt, MarcaProducto marca) throws PersistenceException {
        setInsertParams(pstmt, marca);
    }

    @Override
    protected MarcaProducto mapResultSet(ResultSet rs) throws PersistenceException {
        try {
            return new MarcaProducto(rs.getLong("id"), rs.getString("nombre"), rs.getBoolean("activo"));
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear la marca desde la base de datos", e);
        }
    }
}