package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.ClienteParticular;
import com.mycompany.piscinas_gp.modelos.Localidad;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import com.mycompany.piscinas_gp.dtos.ClienteListadoDTO;

public class ClienteParticularDAO extends GenericoDAO<ClienteParticular> {

    private static final String TABLE_NAME = "clientes_particulares";
    private static final String PRIMARY_KEY = "cliente_id";
    private static final String[] COLUMNS_FOR_INSERT = { "nombre", "apellido", "cuil" };
    private static final String[] PLACEHOLDER_VALUES = { "?", "?", "?" };
    private static final String[] COLUMNS_FOR_SELECT = { "cliente_id", "nombre", "apellido", "cuil" };
    private static final String[] COLUMNS_FOR_UPDATE = { "nombre = ?", "apellido = ?", "cuil = ?" };

    private static final String SQL_JOIN =
            "SELECT c.id, c.email, c.telefono, c.calle_numero, c.observaciones, c.activo, "
            + "l.id AS localidad_id, l.nombre AS localidad_nombre, "
            + "cp.nombre, cp.apellido, cp.cuil "
            + "FROM clientes c "
            + "JOIN clientes_particulares cp ON c.id = cp.cliente_id "
            + "LEFT JOIN localidades l ON c.localidad_id = l.id ";
    
    private static final String FROM_LISTADO =
            "FROM ( "
            + "SELECT c.id, CONCAT(cp.nombre, ' ', cp.apellido) AS nombre_completo, 'Particular' AS tipo, "
            + "cp.cuil AS documento, c.telefono, c.email, c.activo "
            + "FROM clientes c JOIN clientes_particulares cp ON c.id = cp.cliente_id "
            + "UNION ALL "
            + "SELECT c.id, ce.razon_social, 'Empresa', ce.cuit, c.telefono, c.email, c.activo "
            + "FROM clientes c JOIN clientes_empresas ce ON c.id = ce.cliente_id "
            + ") t ";

    public ClienteParticularDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public ClienteParticular crear(ClienteParticular cliente) throws PersistenceException {
        String sqlCliente = "INSERT INTO clientes (email, telefono, calle_numero, localidad_id, observaciones, activo) "
                + "VALUES (?, ?, ?, ?, ?, ?)";
        String sqlParticular = "INSERT INTO clientes_particulares (cliente_id, nombre, apellido, cuil) VALUES (?, ?, ?, ?)";

        try (Connection conn = dbConn.getConnection()) {
            conn.setAutoCommit(false);

            try {
                Long idGenerado;

                try (PreparedStatement pstmtCliente = conn.prepareStatement(sqlCliente, java.sql.Statement.RETURN_GENERATED_KEYS)) {
                    pstmtCliente.setString(1, cliente.getEmail());
                    pstmtCliente.setString(2, cliente.getTelefono());
                    pstmtCliente.setString(3, cliente.getCalleYnumero());
                    if (cliente.getLocalidad() != null) {
                        pstmtCliente.setLong(4, cliente.getLocalidad().getId());
                    } else {
                        pstmtCliente.setNull(4, java.sql.Types.BIGINT);
                    }
                    pstmtCliente.setString(5, cliente.getObservaciones());
                    pstmtCliente.setBoolean(6, cliente.isActivo());
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
        String sqlCliente = "UPDATE clientes SET email = ?, telefono = ?, calle_numero = ?, localidad_id = ?, observaciones = ?, activo = ? WHERE id = ?";
        String sqlParticular = "UPDATE clientes_particulares SET nombre = ?, apellido = ?, cuil = ? WHERE cliente_id = ?";

        try (Connection conn = dbConn.getConnection()) {
            conn.setAutoCommit(false);

            try {
                try (PreparedStatement pstmtCliente = conn.prepareStatement(sqlCliente)) {
                    pstmtCliente.setString(1, cliente.getEmail());
                    pstmtCliente.setString(2, cliente.getTelefono());
                    pstmtCliente.setString(3, cliente.getCalleYnumero());
                    if (cliente.getLocalidad() != null) {
                        pstmtCliente.setLong(4, cliente.getLocalidad().getId());
                    } else {
                        pstmtCliente.setNull(4, java.sql.Types.BIGINT);
                    }
                    pstmtCliente.setString(5, cliente.getObservaciones());
                    pstmtCliente.setBoolean(6, cliente.isActivo());
                    pstmtCliente.setLong(7, cliente.getId());
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

    public List<ClienteListadoDTO> buscarListadoPaginado(Map<String, String> filtros, int page, int size)
            throws PersistenceException {

        List<Object> params = new ArrayList<>();
        String sql = "SELECT t.id, t.nombre_completo, t.tipo, t.documento, t.telefono, t.email, t.activo, "
                + "(SELECT COUNT(*) FROM ventas v WHERE v.cliente_id = t.id) AS cantidad_ventas "
                + FROM_LISTADO
                + construirWhereListado(params, filtros)
                + " ORDER BY t.nombre_completo " + ("desc".equals(filtros.get("orden")) ? "DESC" : "ASC") + ", t.id"
                + " LIMIT ? OFFSET ?";
        params.add(size);
        params.add((page - 1) * size);

        List<ClienteListadoDTO> resultado = new ArrayList<>();

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            asignarParamsListado(pstmt, params);

            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    resultado.add(new ClienteListadoDTO(
                            rs.getLong("id"),
                            rs.getString("nombre_completo"),
                            rs.getString("tipo"),
                            rs.getString("documento"),
                            rs.getString("telefono"),
                            rs.getString("email"),
                            rs.getBoolean("activo"),
                            rs.getInt("cantidad_ventas")
                    ));
                }
            }
        } catch (SQLException e) {
            throw new PersistenceException("Error al buscar clientes paginados", e);
        }
        return resultado;
    }

    public long contarListado(Map<String, String> filtros) throws PersistenceException {
        List<Object> params = new ArrayList<>();
        String sql = "SELECT COUNT(*) " + FROM_LISTADO + construirWhereListado(params, filtros);

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            asignarParamsListado(pstmt, params);

            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next() ? rs.getLong(1) : 0;
            }
        } catch (SQLException e) {
            throw new PersistenceException("Error al contar clientes", e);
        }
    }

    public Map<String, Long> obtenerResumen() throws PersistenceException {
        String sql = "SELECT (SELECT COUNT(*) FROM clientes_particulares) AS particulares, "
                + "(SELECT COUNT(*) FROM clientes_empresas) AS empresas";

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql);
                ResultSet rs = pstmt.executeQuery()) {

            Map<String, Long> resumen = new LinkedHashMap<>();
            if (rs.next()) {
                long particulares = rs.getLong("particulares");
                long empresas = rs.getLong("empresas");
                resumen.put("total", particulares + empresas);
                resumen.put("particulares", particulares);
                resumen.put("empresas", empresas);
            }
            return resumen;

        } catch (SQLException e) {
            throw new PersistenceException("Error al obtener el resumen de clientes", e);
        }
    }

    private String construirWhereListado(List<Object> params, Map<String, String> f) {
        StringBuilder where = new StringBuilder("WHERE 1=1");

        String estado = f.get("estado");
        if ("activos".equals(estado)) {
            where.append(" AND t.activo = TRUE");
        } else if ("inactivos".equals(estado)) {
            where.append(" AND t.activo = FALSE");
        }

        if (f.containsKey("tipo")) {
            where.append(" AND t.tipo = ?");
            params.add(f.get("tipo"));
        }

        if (f.containsKey("q")) {
            where.append(" AND (LOWER(t.nombre_completo) LIKE ? OR LOWER(t.documento) LIKE ? "
                    + "OR LOWER(COALESCE(t.email, '')) LIKE ?)");
            String patron = "%" + f.get("q").toLowerCase() + "%";
            params.add(patron);
            params.add(patron);
            params.add(patron);
        }
        return where.toString();
    }

    private void asignarParamsListado(PreparedStatement pstmt, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            pstmt.setObject(i + 1, params.get(i));
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
            Localidad localidad = rs.getObject("localidad_id") == null ? null : new Localidad(
                    rs.getLong("localidad_id"),
                    rs.getString("localidad_nombre")
            );

            return new ClienteParticular(
                    rs.getLong("id"),
                    rs.getString("nombre"),
                    rs.getString("apellido"),
                    rs.getString("cuil"),
                    rs.getString("email"),
                    rs.getString("telefono"),
                    rs.getString("calle_numero"),
                    localidad,
                    rs.getString("observaciones"),
                    rs.getBoolean("activo")
            );
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear el cliente particular", e);
        }
    }
}