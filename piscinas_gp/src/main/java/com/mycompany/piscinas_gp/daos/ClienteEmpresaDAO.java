package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.ClienteEmpresa;
import com.mycompany.piscinas_gp.modelos.Localidad;
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
            "SELECT c.id, c.email, c.telefono, c.calle_numero, c.observaciones, "
            + "l.id AS localidad_id, l.nombre AS localidad_nombre, "
            + "ce.razon_social, ce.nombre_fantasia, ce.rubro, ce.cuit "
            + "FROM clientes c "
            + "JOIN clientes_empresas ce ON c.id = ce.cliente_id "
            + "JOIN localidades l ON c.localidad_id = l.id ";

    public ClienteEmpresaDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public ClienteEmpresa crear(ClienteEmpresa cliente) throws PersistenceException {
        String sqlCliente = "INSERT INTO clientes (email, telefono, calle_numero, localidad_id, observaciones) VALUES (?, ?, ?, ?, ?)";
        String sqlEmpresa = "INSERT INTO clientes_empresas (cliente_id, razon_social, nombre_fantasia, rubro, cuit) VALUES (?, ?, ?, ?, ?)";

        try (Connection conn = dbConn.getConnection()) {
            conn.setAutoCommit(false);

            try {
                Long idGenerado;

                try (PreparedStatement pstmtCliente = conn.prepareStatement(sqlCliente, java.sql.Statement.RETURN_GENERATED_KEYS)) {
                    pstmtCliente.setString(1, cliente.getEmail());
                    pstmtCliente.setString(2, cliente.getTelefono());
                    pstmtCliente.setString(3, cliente.getCalleYnumero());
                    pstmtCliente.setLong(4, cliente.getLocalidad().getId());
                    pstmtCliente.setString(5, cliente.getObservaciones());
                    pstmtCliente.executeUpdate();

                    try (ResultSet generatedKey = pstmtCliente.getGeneratedKeys()) {
                        if (!generatedKey.next()) {
                            throw new PersistenceException("No se pudo generar el ID del cliente");
                        }
                        idGenerado = generatedKey.getLong(1);
                    }
                }

                try (PreparedStatement pstmtEmpresa = conn.prepareStatement(sqlEmpresa)) {
                    pstmtEmpresa.setLong(1, idGenerado);
                    pstmtEmpresa.setString(2, cliente.getRazonSocial());
                    pstmtEmpresa.setString(3, cliente.getNombreFantasia());
                    pstmtEmpresa.setString(4, cliente.getRubro());
                    pstmtEmpresa.setString(5, cliente.getCuit());
                    pstmtEmpresa.executeUpdate();
                }

                conn.commit();
                cliente.setId(idGenerado);
                return cliente;

            } catch (SQLException e) {
                conn.rollback();
                throw new PersistenceException("Error al crear el cliente empresa, se revirtieron los cambios", e);
            } finally {
                conn.setAutoCommit(true);
            }

        } catch (SQLException e) {
            throw new PersistenceException("Error al conectar para crear el cliente empresa", e);
        }
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

    public ClienteEmpresa actualizar(ClienteEmpresa cliente) throws PersistenceException {
        String sqlCliente = "UPDATE clientes SET email = ?, telefono = ?, calle_numero = ?, localidad_id = ?, observaciones = ? WHERE id = ?";
        String sqlEmpresa = "UPDATE clientes_empresas SET razon_social = ?, nombre_fantasia = ?, rubro = ?, cuit = ? WHERE cliente_id = ?";

        try (Connection conn = dbConn.getConnection()) {
            conn.setAutoCommit(false);

            try {
                try (PreparedStatement pstmtCliente = conn.prepareStatement(sqlCliente)) {
                    pstmtCliente.setString(1, cliente.getEmail());
                    pstmtCliente.setString(2, cliente.getTelefono());
                    pstmtCliente.setString(3, cliente.getCalleYnumero());
                    pstmtCliente.setLong(4, cliente.getLocalidad().getId());
                    pstmtCliente.setString(5, cliente.getObservaciones());
                    pstmtCliente.setLong(6, cliente.getId());
                    pstmtCliente.executeUpdate();
                }

                try (PreparedStatement pstmtEmpresa = conn.prepareStatement(sqlEmpresa)) {
                    pstmtEmpresa.setString(1, cliente.getRazonSocial());
                    pstmtEmpresa.setString(2, cliente.getNombreFantasia());
                    pstmtEmpresa.setString(3, cliente.getRubro());
                    pstmtEmpresa.setString(4, cliente.getCuit());
                    pstmtEmpresa.setLong(5, cliente.getId());
                    pstmtEmpresa.executeUpdate();
                }

                conn.commit();
                return cliente;

            } catch (SQLException e) {
                conn.rollback();
                throw new PersistenceException("Error al actualizar el cliente empresa, se revirtieron los cambios", e);
            } finally {
                conn.setAutoCommit(true);
            }

        } catch (SQLException e) {
            throw new PersistenceException("Error al conectar para actualizar el cliente empresa", e);
        }
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
            Localidad localidad = new Localidad(
                    rs.getLong("localidad_id"),
                    rs.getString("localidad_nombre")
            );

            return new ClienteEmpresa(
                    rs.getLong("id"),
                    rs.getString("razon_social"),
                    rs.getString("nombre_fantasia"),
                    rs.getString("rubro"),
                    rs.getString("cuit"),
                    rs.getString("email"),
                    rs.getString("telefono"),
                    rs.getString("calle_numero"),
                    localidad,
                    rs.getString("observaciones")
            );
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear el cliente empresa", e);
        }
    }
}