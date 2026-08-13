package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.UnidadMedida;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

public class UnidadMedidaDAO extends GenericoDAO<UnidadMedida> {

    private static final String TABLE_NAME = "unidades_medida";
    private static final String PRIMARY_KEY = "id";
    private static final String[] COLUMNS_FOR_INSERT = { "nombre", "abreviatura" };
    private static final String[] PLACEHOLDER_VALUES = { "?", "?" };
    private static final String[] COLUMNS_FOR_SELECT = { "id", "nombre", "abreviatura" };
    private static final String[] COLUMNS_FOR_UPDATE = { "nombre = ?", "abreviatura = ?" };

    public UnidadMedidaDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public UnidadMedida buscarPorId(Long id) throws PersistenceException {
        return findById(id);
    }

    public UnidadMedida crear(UnidadMedida unidadMedida) throws PersistenceException {
        return createObject(unidadMedida);
    }

    public UnidadMedida actualizar(UnidadMedida unidadMedida) throws PersistenceException {
        return updateObject(PRIMARY_KEY, unidadMedida);
    }

    public boolean eliminarPorId(Long id) throws PersistenceException {
        return deleteObject(PRIMARY_KEY, id);
    }

    public List<UnidadMedida> buscarTodos() throws PersistenceException {
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
    protected void setInsertParams(PreparedStatement pstmt, UnidadMedida unidadMedida) throws PersistenceException {
        try {
            pstmt.setString(1, unidadMedida.getNombre());
            pstmt.setString(2, unidadMedida.getAbreviatura());
        } catch (SQLException e) {
            throw new PersistenceException("Error al asignar los parametros de la unidad de medida", e);
        }
    }

    @Override
    protected void setUpdateParams(PreparedStatement pstmt, UnidadMedida unidadMedida) throws PersistenceException {
        setInsertParams(pstmt, unidadMedida);
    }

    @Override
    protected UnidadMedida mapResultSet(ResultSet rs) throws PersistenceException {
        try {
            return new UnidadMedida(
                    rs.getLong("id"),
                    rs.getString("nombre"),
                    rs.getString("abreviatura")
            );
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear la unidad de medida desde la base de datos", e);
        }
    }
}