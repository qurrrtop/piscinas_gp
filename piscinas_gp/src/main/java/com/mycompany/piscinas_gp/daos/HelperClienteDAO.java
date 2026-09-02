package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class HelperClienteDAO {

    private final DbConnection dbConn;

    public HelperClienteDAO(DbConnection dbConn) {
        this.dbConn = dbConn;
    }

    public boolean darDeBaja(Long id) throws PersistenceException {
        return actualizarActivo(id, false);
    }

    public boolean reactivar(Long id) throws PersistenceException {
        return actualizarActivo(id, true);
    }

    private boolean actualizarActivo(Long id, boolean activo)
            throws PersistenceException {

        String sql = "UPDATE clientes SET activo = ? WHERE id = ?";

        try (Connection conn = dbConn.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setBoolean(1, activo);
            pstmt.setLong(2, id);

            return pstmt.executeUpdate() > 0;

        } catch (SQLException e) {
            throw new PersistenceException(
                    "Error al actualizar el estado del cliente", e);
        }
    }
}