package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.SubrubroServicioTecnico;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

public class SubrubroServicioTecnicoDAO extends GenericoDAO<SubrubroServicioTecnico> {

    private static final String TABLE_NAME = "subrubros_servicio_tecnico";
    private static final String PRIMARY_KEY = "id";
    private static final String[] COLUMNS_FOR_INSERT = { "nombre" };
    private static final String[] PLACEHOLDER_VALUES = { "?" };
    private static final String[] COLUMNS_FOR_SELECT = { "id", "nombre" };
    private static final String[] COLUMNS_FOR_UPDATE = { "nombre = ?" };

    public SubrubroServicioTecnicoDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public SubrubroServicioTecnico buscarPorId(Long id) throws PersistenceException {
        return findById(id);
    }

    public List<SubrubroServicioTecnico> buscarTodos() throws PersistenceException {
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
    protected void setInsertParams(PreparedStatement pstmt, SubrubroServicioTecnico subrubro) throws PersistenceException {
        try {
            pstmt.setString(1, subrubro.getNombre());
        } catch (SQLException e) {
            throw new PersistenceException("Error al asignar los parametros del subrubro", e);
        }
    }

    @Override
    protected void setUpdateParams(PreparedStatement pstmt, SubrubroServicioTecnico subrubro) throws PersistenceException {
        setInsertParams(pstmt, subrubro);
    }

    @Override
    protected SubrubroServicioTecnico mapResultSet(ResultSet rs) throws PersistenceException {
        try {
            return new SubrubroServicioTecnico(rs.getLong("id"), rs.getString("nombre"));
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear el subrubro desde la base de datos", e);
        }
    }
}