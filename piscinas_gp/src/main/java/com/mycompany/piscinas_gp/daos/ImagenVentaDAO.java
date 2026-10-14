package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ImagenVentaDAO {

    private static final String TABLE_NAME = "imagen_ventas";

    private final DbConnection dbConn;

    public ImagenVentaDAO(DbConnection dbConn) {
        this.dbConn = dbConn;
    }

    // devuelve los nombres de archivo en el orden en que se cargaron
    public List<String> buscarPorVentaId(Long ventaId) throws PersistenceException {
        String sql = "SELECT archivo FROM " + TABLE_NAME + " WHERE venta_id = ? ORDER BY id";
        List<String> archivos = new ArrayList<>();

        try (Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, ventaId);

            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    archivos.add(rs.getString("archivo"));
                }
            }

            return archivos;

        } catch (SQLException e) {
            throw new PersistenceException("Error al recuperar las imagenes de la venta " + ventaId, e);
        }
    }

    public void crear(String archivo, Long ventaId, Connection conn) throws PersistenceException {
        String sql = "INSERT INTO " + TABLE_NAME + " (archivo, venta_id) VALUES (?, ?)";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, archivo);
            pstmt.setLong(2, ventaId);
            pstmt.executeUpdate();

        } catch (SQLException e) {
            throw new PersistenceException("Error al guardar la imagen de la venta " + ventaId, e);
        }
    }

    public boolean eliminarPorArchivo(String archivo, Long ventaId, Connection conn) throws PersistenceException {
        String sql = "DELETE FROM " + TABLE_NAME + " WHERE archivo = ? AND venta_id = ?";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, archivo);
            pstmt.setLong(2, ventaId);
            return pstmt.executeUpdate() > 0;

        } catch (SQLException e) {
            throw new PersistenceException("Error al eliminar la imagen de la venta " + ventaId, e);
        }
    }
    
    public void sincronizar(Long ventaId, List<String> anteriores, List<String> nuevas, Connection conn)
            throws PersistenceException {

        Set<String> setAnteriores = new HashSet<>(anteriores);
        Set<String> setNuevas = new HashSet<>(nuevas);

        for (String archivo : anteriores) {
            if (!setNuevas.contains(archivo)) {
                eliminarPorArchivo(archivo, ventaId, conn);
            }
        }

        for (String archivo : nuevas) {
            if (!setAnteriores.contains(archivo)) {
                crear(archivo, ventaId, conn);
            }
        }
    }
}