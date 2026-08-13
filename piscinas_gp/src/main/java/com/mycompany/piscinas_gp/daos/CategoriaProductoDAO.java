package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.CategoriaProducto;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.List;

public class CategoriaProductoDAO extends GenericoDAO<CategoriaProducto> {

    private static final String TABLE_NAME = "categoria_productos";
    private static final String PRIMARY_KEY = "id";
    private static final String[] COLUMNS_FOR_INSERT = { "nombre", "categoria_producto_padre" };
    private static final String[] PLACEHOLDER_VALUES = { "?", "?" };
    private static final String[] COLUMNS_FOR_SELECT = { "id", "nombre", "categoria_producto_padre" };
    private static final String[] COLUMNS_FOR_UPDATE = { "nombre = ?", "categoria_producto_padre = ?" };

    public CategoriaProductoDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public CategoriaProducto buscarPorId(Long id) throws PersistenceException {
        return findById(id);
    }

    // OPCIONAL
    public CategoriaProducto crear(CategoriaProducto categoria) throws PersistenceException {
        return createObject(categoria);
    }

    // OPCIONAL
    public CategoriaProducto actualizar(CategoriaProducto categoria) throws PersistenceException {
        return updateObject(PRIMARY_KEY, categoria);
    }

    // OPCIONAL
    public boolean eliminarPorId(Long id) throws PersistenceException {
        return deleteObject(PRIMARY_KEY, id);
    }

    public List<CategoriaProducto> buscarTodos() throws PersistenceException {
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
    protected void setInsertParams(PreparedStatement pstmt, CategoriaProducto categoria) throws PersistenceException {
        try {
            pstmt.setString(1, categoria.getNombre());
            if (categoria.getCategoriaProductoPadre() != null) {
                pstmt.setLong(2, categoria.getCategoriaProductoPadre().getId());
            } else {
                pstmt.setNull(2, Types.BIGINT);
            }
        } catch (SQLException e) {
            throw new PersistenceException("Error al asignar los parametros de la categoria", e);
        }
    }

    @Override
    protected void setUpdateParams(PreparedStatement pstmt, CategoriaProducto categoria) throws PersistenceException {
        setInsertParams(pstmt, categoria);
    }

    @Override
    protected CategoriaProducto mapResultSet(ResultSet rs) throws PersistenceException {
        try {
            long padreId = rs.getLong("categoria_producto_padre");
            CategoriaProducto padre = rs.wasNull() ? null : new CategoriaProducto(padreId, null, null);

            return new CategoriaProducto(
                    rs.getLong("id"),
                    rs.getString("nombre"),
                    padre
            );
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear la categoria desde la base de datos", e);
        }
    }
}