package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.Localidad;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

public class LocalidadDAO extends GenericoDAO<Localidad> {

    private static final String TABLE_NAME = "localidades";
    private static final String PRIMARY_KEY = "id";
    private static final String[] COLUMNS_FOR_INSERT = { "nombre" };
    private static final String[] PLACEHOLDER_VALUES = { "?" };
    private static final String[] COLUMNS_FOR_SELECT = { "id", "nombre" };
    private static final String[] COLUMNS_FOR_UPDATE = { "nombre = ?" };

    public LocalidadDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public List<Localidad> buscarTodos() throws PersistenceException {
        return findAllObjects("nombre");
    }
    
    public Localidad buscarPorId(Long id) throws PersistenceException {
        return findById(id);
    }

    @Override
    protected String getTableName() { return TABLE_NAME; }
    @Override
    protected String[] getColumnsForInsert() { return COLUMNS_FOR_INSERT; }
    @Override
    protected String[] getPlaceHolderValues() { return PLACEHOLDER_VALUES; }
    @Override
    protected String[] getColumnsForSelect() { return COLUMNS_FOR_SELECT; }
    @Override
    protected String[] getColumnsForUpdate() { return COLUMNS_FOR_UPDATE; }
    @Override
    protected String getPrimaryKey() { return PRIMARY_KEY; }

    @Override
    protected void setInsertParams(PreparedStatement pstmt, Localidad entity) throws PersistenceException {
        try {
            pstmt.setString(1, entity.getNombre());
        } catch (SQLException e) {
            throw new PersistenceException("Error al asignar los parametros de la localidad", e);
        }
    }

    @Override
    protected void setUpdateParams(PreparedStatement pstmt, Localidad entity) throws PersistenceException {
        setInsertParams(pstmt, entity);
    }

    @Override
    protected Localidad mapResultSet(ResultSet rs) throws PersistenceException {
        try {
            return new Localidad(rs.getLong("id"), rs.getString("nombre"));
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear la localidad", e);
        }
    }
}