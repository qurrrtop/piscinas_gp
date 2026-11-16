package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.Usuario;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class UsuarioDAO extends GenericoDAO<Usuario> {

    private static final String TABLE_NAME = "usuarios";
    private static final String PRIMARY_KEY = "id";
    private static final String[] COLUMNS_FOR_INSERT = { "email", "password_hash", "codigo_recuperacion_hash", "activo" };
    private static final String[] PLACEHOLDER_VALUES = { "?", "?", "?", "?" };
    private static final String[] COLUMNS_FOR_SELECT = { "id", "email", "password_hash", "codigo_recuperacion_hash", "activo" };
    private static final String[] COLUMNS_FOR_UPDATE = { "email = ?", "password_hash = ?", "codigo_recuperacion_hash = ?", "activo = ?" };

    public UsuarioDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public Usuario buscarPorId(Long id) throws PersistenceException {
        return findById(id);
    }

    public Usuario buscarPorEmail(String email) throws PersistenceException {
        return findByField("email", email);
    }

    public Usuario crear(Usuario usuario) throws PersistenceException {
        return createObject(usuario);
    }

    public Usuario actualizar(Usuario usuario) throws PersistenceException {
        return updateObject(PRIMARY_KEY, usuario);
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
    protected void setInsertParams(PreparedStatement pstmt, Usuario usuario) throws PersistenceException {
        try {
            pstmt.setString(1, usuario.getEmail());
            pstmt.setString(2, usuario.getPasswordHash());
            pstmt.setString(3, usuario.getCodigoRecuperacionHash());
            pstmt.setBoolean(4, usuario.isActivo());
        } catch (SQLException e) {
            throw new PersistenceException("Error al asignar los parametros del usuario", e);
        }
    }

    @Override
    protected void setUpdateParams(PreparedStatement pstmt, Usuario usuario) throws PersistenceException {
        setInsertParams(pstmt, usuario);
    }

    @Override
    protected Usuario mapResultSet(ResultSet rs) throws PersistenceException {
        try {
            return new Usuario(
                    rs.getLong("id"),
                    rs.getString("email"),
                    rs.getString("password_hash"),
                    rs.getString("codigo_recuperacion_hash"),
                    rs.getBoolean("activo")
            );
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear el usuario desde la base de datos", e);
        }
    }
}