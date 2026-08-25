package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.ClienteEmpresa;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ClienteEmpresaDAO extends GenericoDAO<ClienteEmpresa> {

    private static final String TABLE_NAME = "clientes_empresas";
    private static final String PRIMARY_KEY = "cliente_id";
    private static final String[] COLUMNS_FOR_INSERT = { "razon_social", "nombre_fantasia", "rubro", "cuit" };
    private static final String[] PLACEHOLDER_VALUES = { "?", "?", "?", "?" };
    private static final String[] COLUMNS_FOR_SELECT = { "cliente_id", "razon_social", "nombre_fantasia", "rubro", "cuit" };
    private static final String[] COLUMNS_FOR_UPDATE = { "razon_social = ?", "nombre_fantasia = ?", "rubro = ?", "cuit = ?" };

    private static final String SQL_JOIN =
            "SELECT c.id, c.email, c.telefono, c.calle_numero, c.ciudad, c.provincia, c.codigo_postal, c.observaciones, "
            + "ce.razon_social, ce.nombre_fantasia, ce.rubro, ce.cuit "
            + "FROM clientes c JOIN clientes_empresas ce ON c.id = ce.cliente_id ";

    public ClienteEmpresaDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public List<ClienteEmpresa> buscarTodos() throws PersistenceException {
        List<ClienteEmpresa> resultado = new ArrayList<>();

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(SQL_JOIN + "ORDER BY ce.razon_social");
                ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                resultado.add(mapResultSet(rs));
            }

        } catch (SQLException e) {
            throw new PersistenceException("Error al recuperar los clientes empresa", e);
        }

        return resultado;
    }

    public ClienteEmpresa buscarPorId(Long id) throws PersistenceException {
        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(SQL_JOIN + "WHERE c.id = ?")) {

            pstmt.setLong(1, id);

            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return mapResultSet(rs);
                }
            }

        } catch (SQLException e) {
            throw new PersistenceException("Error al buscar el cliente empresa con ID " + id, e);
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
    protected void setInsertParams(PreparedStatement pstmt, ClienteEmpresa entity) throws PersistenceException {
        throw new PersistenceException("crear() de ClienteEmpresa requiere logica transaccional en dos tablas - pendiente");
    }

    @Override
    protected void setUpdateParams(PreparedStatement pstmt, ClienteEmpresa entity) throws PersistenceException {
        throw new PersistenceException("actualizar() de ClienteEmpresa requiere logica transaccional en dos tablas - pendiente");
    }

    @Override
    protected ClienteEmpresa mapResultSet(ResultSet rs) throws PersistenceException {
        try {
            return new ClienteEmpresa(
                    rs.getLong("id"),
                    rs.getString("razon_social"),
                    rs.getString("nombre_fantasia"),
                    rs.getString("rubro"),
                    rs.getString("cuit"),
                    rs.getString("email"),
                    rs.getString("telefono"),
                    rs.getString("calle_numero"),
                    rs.getString("ciudad"),
                    rs.getString("provincia"),
                    rs.getString("codigo_postal"),
                    rs.getString("observaciones")
            );
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear el cliente empresa", e);
        }
    }
}