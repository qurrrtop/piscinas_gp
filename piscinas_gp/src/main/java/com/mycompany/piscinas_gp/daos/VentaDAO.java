package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class VentaDAO {

    private final DbConnection dbConn;

    public VentaDAO(DbConnection dbConn) {
        this.dbConn = dbConn;
    }

    public int contarVentasPorCliente(Long clienteId) throws PersistenceException {
        String sql = "SELECT COUNT(*) FROM ventas WHERE cliente_id = ?";

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, clienteId);

            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1);
                }
            }

        } catch (SQLException e) {
            throw new PersistenceException("Error al contar las ventas del cliente " + clienteId, e);
        }

        return 0;
    }
}