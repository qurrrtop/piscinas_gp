package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.modelos.Cliente;
import com.mycompany.piscinas_gp.modelos.ClienteEmpresa;
import com.mycompany.piscinas_gp.modelos.ClienteParticular;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ClienteDAO {

    private final DbConnection dbConn;

    public ClienteDAO(DbConnection dbConn) {
        this.dbConn = dbConn;
    }

    /*
     * Busca un cliente por su ID.
     * Devuelve automáticamente un ClienteParticular o un ClienteEmpresa.
     */
    public Cliente buscarPorId(Long idCliente) throws PersistenceException {

        String sql = """
            SELECT c.*,
                   cp.cliente_id AS idParticular,
                   cp.nombre,
                   cp.apellido,
                   cp.cuil,
                   ce.cliente_id AS idEmpresa,
                   ce.razon_social,
                   ce.nombre_fantasia,
                   ce.rubro,
                   ce.cuit
            FROM clientes c
            LEFT JOIN clientes_particulares cp
                ON c.id = cp.cliente_id
            LEFT JOIN clientes_empresas ce
                ON c.id = ce.cliente_id
            WHERE c.id = ?
            """;

        try (Connection conn = dbConn.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, idCliente);

            try (ResultSet rs = pstmt.executeQuery()) {

                if (rs.next()) {
                    return mapResultSet(rs);
                }

                return null;
            }

        } catch (SQLException e) {
            throw new PersistenceException(
                    "Error al buscar el cliente por ID", e);
        }
    }

    /*
     * Recupera todos los clientes del sistema.
     */
    public List<Cliente> buscarTodos() throws PersistenceException {

        String sql = """
            SELECT c.*,
                   cp.cliente_id AS idParticular,
                   cp.nombre,
                   cp.apellido,
                   cp.cuil,
                   ce.cliente_id AS idEmpresa,
                   ce.razon_social,
                   ce.nombre_fantasia,
                   ce.rubro,
                   ce.cuit
            FROM clientes c
            LEFT JOIN clientes_particulares cp
                ON c.id = cp.cliente_id
            LEFT JOIN clientes_empresas ce
                ON c.id = ce.cliente_id
            ORDER BY c.id
            """;

        List<Cliente> clientes = new ArrayList<>();

        try (Connection conn = dbConn.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {

            while (rs.next()) {
                clientes.add(mapResultSet(rs));
            }

            return clientes;

        } catch (SQLException e) {
            throw new PersistenceException(
                    "Error al recuperar los clientes", e);
        }
    }
        /*
     * Convierte una fila del ResultSet en un objeto Cliente.
     * Si el registro existe en clientes_particulares devuelve
     * un ClienteParticular.
     *
     * Si existe en clientes_empresas devuelve un ClienteEmpresa.
     */
    private Cliente mapResultSet(ResultSet rs) throws SQLException {

        Long id = rs.getLong("id");

        // Si existe un id en la tabla clientes_particulares
        // significa que el cliente es Particular.
        if (rs.getObject("idParticular") != null) {

            return new ClienteParticular(
                    id,
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
        }

        // Si no, corresponde a un ClienteEmpresa.
        return new ClienteEmpresa(
                id,
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
    }
        /*
     * Inserta los datos comunes en la tabla clientes.
     * Devuelve el ID generado para luego insertar
     * en la tabla correspondiente (particular o empresa).
     */
    private Long insertarClienteBase(Connection conn, Cliente cliente)
            throws SQLException {

        String sql = """
            INSERT INTO clientes
            (email, telefono, calle_numero, ciudad,
             provincia, codigo_postal, observaciones)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """;

        try (PreparedStatement pstmt = conn.prepareStatement(
                sql, PreparedStatement.RETURN_GENERATED_KEYS)) {

            pstmt.setString(1, cliente.getEmail());
            pstmt.setString(2, cliente.getTelefono());
            pstmt.setString(3, cliente.getCalleYnumero());
            pstmt.setString(4, cliente.getCiudad());
            pstmt.setString(5, cliente.getProvincia());
            pstmt.setString(6, cliente.getCodigoPostal());
            pstmt.setString(7, cliente.getObservaciones());

            pstmt.executeUpdate();

            try (ResultSet rs = pstmt.getGeneratedKeys()) {

                if (rs.next()) {
                    return rs.getLong(1);
                }

                throw new SQLException("No se pudo obtener el ID generado.");
            }
        }
    }
        /*
     * Crea un ClienteParticular.
     * Primero inserta los datos comunes en la tabla clientes.
     * Luego inserta los datos específicos en clientes_particulares.
     */
    public ClienteParticular crear(ClienteParticular cliente)
            throws PersistenceException {

        String sql = """
            INSERT INTO clientes_particulares
            (cliente_id, nombre, apellido, cuil)
            VALUES (?, ?, ?, ?)
            """;

        try (Connection conn = dbConn.getConnection()) {

            conn.setAutoCommit(false);

            try {

                Long idGenerado = insertarClienteBase(conn, cliente);

                try (PreparedStatement pstmt = conn.prepareStatement(sql)) {

                    pstmt.setLong(1, idGenerado);
                    pstmt.setString(2, cliente.getNombre());
                    pstmt.setString(3, cliente.getApellido());
                    pstmt.setString(4, cliente.getCuil());

                    pstmt.executeUpdate();
                }

                conn.commit();

                cliente.setId(idGenerado);

                return cliente;

            } catch (SQLException e) {

                conn.rollback();
                throw e;
            }

        } catch (SQLException e) {

            throw new PersistenceException(
                    "Error al crear el cliente particular", e);
        }
    }
        /*
     * Crea un ClienteEmpresa.
     * Primero inserta los datos comunes en la tabla clientes.
     * Luego inserta los datos específicos en clientes_empresas.
     */
    public ClienteEmpresa crear(ClienteEmpresa empresa)
            throws PersistenceException {

        String sql = """
            INSERT INTO clientes_empresas
            (cliente_id, razon_social, nombre_fantasia, rubro, cuit)
            VALUES (?, ?, ?, ?, ?)
            """;

        try (Connection conn = dbConn.getConnection()) {

            conn.setAutoCommit(false);

            try {

                Long idGenerado = insertarClienteBase(conn, empresa);

                try (PreparedStatement pstmt = conn.prepareStatement(sql)) {

                    pstmt.setLong(1, idGenerado);
                    pstmt.setString(2, empresa.getRazonSocial());
                    pstmt.setString(3, empresa.getNombreFantasia());
                    pstmt.setString(4, empresa.getRubro());
                    pstmt.setString(5, empresa.getCuit());

                    pstmt.executeUpdate();
                }

                conn.commit();

                empresa.setId(idGenerado);

                return empresa;

            } catch (SQLException e) {

                conn.rollback();
                throw e;
            }

        } catch (SQLException e) {

            throw new PersistenceException(
                    "Error al crear el cliente empresa", e);
        }
    }
        /*
     * Actualiza los datos comunes de cualquier cliente
     * en la tabla clientes.
     */
    private void actualizarClienteBase(Connection conn, Cliente cliente)
            throws SQLException {

        String sql = """
            UPDATE clientes
            SET email = ?,
                telefono = ?,
                calle_numero = ?,
                ciudad = ?,
                provincia = ?,
                codigo_postal = ?,
                observaciones = ?
            WHERE id = ?
            """;

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, cliente.getEmail());
            pstmt.setString(2, cliente.getTelefono());
            pstmt.setString(3, cliente.getCalleYnumero());
            pstmt.setString(4, cliente.getCiudad());
            pstmt.setString(5, cliente.getProvincia());
            pstmt.setString(6, cliente.getCodigoPostal());
            pstmt.setString(7, cliente.getObservaciones());
            pstmt.setLong(8, cliente.getId());

            pstmt.executeUpdate();
        }
    }
        /*
     * Actualiza un ClienteParticular.
     * Primero actualiza la tabla clientes y luego la tabla
     * clientes_particulares.
     */
    public ClienteParticular actualizar(ClienteParticular cliente)
            throws PersistenceException {

        String sql = """
            UPDATE clientes_particulares
            SET nombre = ?,
                apellido = ?,
                cuil = ?
            WHERE cliente_id = ?
            """;

        try (Connection conn = dbConn.getConnection()) {

            conn.setAutoCommit(false);

            try {

                // Actualiza la tabla clientes
                actualizarClienteBase(conn, cliente);

                // Actualiza la tabla clientes_particulares
                try (PreparedStatement pstmt = conn.prepareStatement(sql)) {

                    pstmt.setString(1, cliente.getNombre());
                    pstmt.setString(2, cliente.getApellido());
                    pstmt.setString(3, cliente.getCuil());
                    pstmt.setLong(4, cliente.getId());

                    pstmt.executeUpdate();
                }

                conn.commit();

                return cliente;

            } catch (SQLException e) {

                conn.rollback();
                throw e;
            }

        } catch (SQLException e) {

            throw new PersistenceException(
                    "Error al actualizar el cliente particular", e);
        }
    }
        /*
     * Actualiza un ClienteEmpresa.
     * Primero actualiza la tabla clientes y luego la tabla
     * clientes_empresas.
     */
    public ClienteEmpresa actualizar(ClienteEmpresa empresa)
            throws PersistenceException {

        String sql = """
            UPDATE clientes_empresas
            SET razon_social = ?,
                nombre_fantasia = ?,
                rubro = ?,
                cuit = ?
            WHERE cliente_id = ?
            """;

        try (Connection conn = dbConn.getConnection()) {

            conn.setAutoCommit(false);

            try {

                // Actualiza la tabla clientes
                actualizarClienteBase(conn, empresa);

                // Actualiza la tabla clientes_empresas
                try (PreparedStatement pstmt = conn.prepareStatement(sql)) {

                    pstmt.setString(1, empresa.getRazonSocial());
                    pstmt.setString(2, empresa.getNombreFantasia());
                    pstmt.setString(3, empresa.getRubro());
                    pstmt.setString(4, empresa.getCuit());
                    pstmt.setLong(5, empresa.getId());

                    pstmt.executeUpdate();
                }

                conn.commit();

                return empresa;

            } catch (SQLException e) {

                conn.rollback();
                throw e;
            }

        } catch (SQLException e) {

            throw new PersistenceException(
                    "Error al actualizar el cliente empresa", e);
        }
    }
        /*
     * Elimina un cliente por su ID.
     * Gracias al ON DELETE CASCADE también se elimina
     * automáticamente el registro de la tabla
     * clientes_particulares o clientes_empresas.
     */
    public boolean eliminarPorId(Long idCliente)
            throws PersistenceException {

        String sql = "DELETE FROM clientes WHERE id = ?";

        try (Connection conn = dbConn.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, idCliente);

            int filasAfectadas = pstmt.executeUpdate();

            return filasAfectadas > 0;

        } catch (SQLException e) {

            throw new PersistenceException(
                    "Error al eliminar el cliente con ID: " + idCliente, e);
        }
    }
}
