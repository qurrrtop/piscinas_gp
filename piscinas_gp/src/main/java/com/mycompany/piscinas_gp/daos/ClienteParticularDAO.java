package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.ClienteParticular;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ClienteParticularDAO extends GenericoDAO<ClienteParticular> {

    private static final String TABLE_NAME = "clientes_particulares";
    private static final String PRIMARY_KEY = "cliente_id";
    private static final String[] COLUMNS_FOR_INSERT = { "nombre", "apellido", "cuil" };
    private static final String[] PLACEHOLDER_VALUES = { "?", "?", "?" };
    private static final String[] COLUMNS_FOR_SELECT = { "cliente_id", "nombre", "apellido", "cuil" };
    private static final String[] COLUMNS_FOR_UPDATE = { "nombre = ?", "apellido = ?", "cuil = ?" };

    private static final String SQL_JOIN =
            "SELECT c.id, c.email, c.telefono, c.calle_numero, c.ciudad, c.provincia, c.codigo_postal, c.observaciones, "
            + "cp.nombre, cp.apellido, cp.cuil "
            + "FROM clientes c JOIN clientes_particulares cp ON c.id = cp.cliente_id ";

    public ClienteParticularDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public List<ClienteParticular> buscarTodos() throws PersistenceException {
        List<ClienteParticular> resultado = new ArrayList<>();

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(SQL_JOIN + "ORDER BY cp.apellido, cp.nombre");
                ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                resultado.add(mapResultSet(rs));
            }

        } catch (SQLException e) {
            throw new PersistenceException("Error al recuperar los clientes particulares", e);
        }

        return resultado;
    }

    public ClienteParticular buscarPorId(Long id) throws PersistenceException {
        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(SQL_JOIN + "WHERE c.id = ?")) {

            pstmt.setLong(1, id);

            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSet(rs);
                }
            }

        } catch (SQLException e) {
            throw new PersistenceException("Error al buscar el cliente particular con ID " + id, e);
        }

        return null;
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
    protected void setInsertParams(PreparedStatement pstmt, ClienteParticular entity) throws PersistenceException {
        throw new PersistenceException("crear() de ClienteParticular requiere logica transaccional en dos tablas - pendiente");
    }

    @Override
    protected void setUpdateParams(PreparedStatement pstmt, ClienteParticular entity) throws PersistenceException {
        throw new PersistenceException("actualizar() de ClienteParticular requiere logica transaccional en dos tablas - pendiente");
    }

    @Override
    protected ClienteParticular mapResultSet(ResultSet rs) throws PersistenceException {
        try {
            return new ClienteParticular(
                    rs.getLong("id"),
                    rs.getString("nombre"),
                    rs.getString("apellido"),
                    rs.getString("cuil"),
                    rs.getString("email"),
                    rs.getString("telefono"),
                    rs.getString("calle_numero"),
                    rs.getString("ciudad"),
                    rs.getString("provincia"),
                    rs.getString("codigo_postal"),
                    rs.getString("observaciones")
            );
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear el cliente particular", e);
        }
    }
}