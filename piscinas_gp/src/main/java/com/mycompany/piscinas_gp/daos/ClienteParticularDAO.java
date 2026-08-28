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
            "SELECT c.id, c.email, c.telefono, c.calle_numero, c.ciudad, c.observaciones, "
            + "cp.nombre, cp.apellido, cp.cuil "
            + "FROM clientes c JOIN clientes_particulares cp ON c.id = cp.cliente_id ";

    public ClienteParticularDAO(DbConnection dbConn) {
        super(dbConn);
    }
    
    // MÉTODO CREAR. PARA INSERTAR EN LA TABLA  "clientes" y "clientes_particulares"
    // asegurando que las dos inserciones se realicen juntas o ninguna.
    
    public ClienteParticular crear(ClienteParticular cliente) throws PersistenceException {
        String sqlCliente = "INSERT INTO clientes (email, telefono, calle_numero, ciudad, observaciones) "
                + "VALUES (?, ?, ?, ?, ?)";
        String sqlParticular = "INSERT INTO clientes_particulares (cliente_id, nombre, apellido, cuil) VALUES (?, ?, ?, ?)";

        try (Connection conn = dbConn.getConnection()) {
            conn.setAutoCommit(false);

            try {
                Long idGenerado;

                try (PreparedStatement pstmtCliente = conn.prepareStatement(sqlCliente, java.sql.Statement.RETURN_GENERATED_KEYS)) {
                    pstmtCliente.setString(1, cliente.getEmail());
                    pstmtCliente.setString(2, cliente.getTelefono());
                    pstmtCliente.setString(3, cliente.getCalleYnumero());
                    pstmtCliente.setString(4, cliente.getCiudad());
                    pstmtCliente.setString(5, cliente.getObservaciones());
                    pstmtCliente.executeUpdate();

                    try (ResultSet generatedKey = pstmtCliente.getGeneratedKeys()) {
                        if (!generatedKey.next()) {
                            throw new PersistenceException("No se pudo generar el ID del cliente");
                        }
                        idGenerado = generatedKey.getLong(1);
                    }
                }

                try (PreparedStatement pstmtParticular = conn.prepareStatement(sqlParticular)) {
                    pstmtParticular.setLong(1, idGenerado);
                    pstmtParticular.setString(2, cliente.getNombre());
                    pstmtParticular.setString(3, cliente.getApellido());
                    pstmtParticular.setString(4, cliente.getCuil());
                    pstmtParticular.executeUpdate();
                }

                conn.commit();
                cliente.setId(idGenerado);
                return cliente;

            } catch (SQLException e) {
                conn.rollback();
                throw new PersistenceException("Error al crear el cliente particular, se revirtieron los cambios", e);
            } finally {
                conn.setAutoCommit(true);
            }

        } catch (SQLException e) {
            throw new PersistenceException("Error al conectar para crear el cliente particular", e);
        }
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

    public ClienteParticular actualizar(ClienteParticular cliente) throws PersistenceException {
    String sqlCliente = "UPDATE clientes SET email = ?, telefono = ?, calle_numero = ?, ciudad = ?, observaciones = ? WHERE id = ?";
    String sqlParticular = "UPDATE clientes_particulares SET nombre = ?, apellido = ?, cuil = ? WHERE cliente_id = ?";

    try (Connection conn = dbConn.getConnection()) {
        conn.setAutoCommit(false);

        try {
            try (PreparedStatement pstmtCliente = conn.prepareStatement(sqlCliente)) {
                pstmtCliente.setString(1, cliente.getEmail());
                pstmtCliente.setString(2, cliente.getTelefono());
                pstmtCliente.setString(3, cliente.getCalleYnumero());
                pstmtCliente.setString(4, cliente.getCiudad());
                pstmtCliente.setString(5, cliente.getObservaciones());
                pstmtCliente.setLong(6, cliente.getId());
                pstmtCliente.executeUpdate();
            }

            try (PreparedStatement pstmtParticular = conn.prepareStatement(sqlParticular)) {
                pstmtParticular.setString(1, cliente.getNombre());
                pstmtParticular.setString(2, cliente.getApellido());
                pstmtParticular.setString(3, cliente.getCuil());
                pstmtParticular.setLong(4, cliente.getId());
                pstmtParticular.executeUpdate();
            }

            conn.commit();
            return cliente;

        } catch (SQLException e) {
            conn.rollback();
            throw new PersistenceException("Error al actualizar el cliente particular, se revirtieron los cambios", e);
        } finally {
            conn.setAutoCommit(true);
        }

    } catch (SQLException e) {
        throw new PersistenceException("Error al conectar para actualizar el cliente particular", e);
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
                    rs.getString("observaciones")
            );
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear el cliente particular", e);
        }
    }
}