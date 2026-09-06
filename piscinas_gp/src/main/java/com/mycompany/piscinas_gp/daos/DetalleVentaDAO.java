package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.CategoriaProducto;
import com.mycompany.piscinas_gp.modelos.DetalleVenta;
import com.mycompany.piscinas_gp.modelos.MarcaProducto;
import com.mycompany.piscinas_gp.modelos.Producto;
import com.mycompany.piscinas_gp.modelos.UnidadMedida;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class DetalleVentaDAO extends GenericoDAO<DetalleVenta> {
    
    private static final String TABLE_NAME = "detalle_ventas";
    private static final String PRIMARY_KEY = "id";
    
    private static final String[] COLUMNS_FOR_INSERT = {
        "precio_unitario", "cantidad", "observacion", "venta_id", "producto_id"
    };
    
    private static final String[] PLACEHOLDER_VALUES = {
        "?", "?", "?", "?", "?"
    };
    
    private static final String[] COLUMNS_FOR_SELECT = {
        "id", "precio_unitario", "cantidad", "observacion", "venta_id", "producto_id"  
    };
    
    private static final String[] COLUMNS_FOR_UPDATE = {
        "cantidad = ?"
    };
    
    public DetalleVentaDAO( DbConnection dbConn ) {
        super( dbConn );
    }
//no usa el del generico porque acepta solo objeto
    public DetalleVenta crear(DetalleVenta detalle, Long ventaId)
            throws PersistenceException {

        String sql = """
            INSERT INTO detalle_ventas
            (precio_unitario, cantidad, observacion, venta_id, producto_id)
            VALUES (?, ?, ?, ?, ?)
            """;

        try (Connection conn = dbConn.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(
                     sql, Statement.RETURN_GENERATED_KEYS)) {

            pstmt.setBigDecimal(1, detalle.getPrecioUnitario());
            pstmt.setInt(2, detalle.getCantidad());
            pstmt.setNull(3, java.sql.Types.VARCHAR);
            pstmt.setLong(4, ventaId);
            pstmt.setLong(5, detalle.getProducto().getId());

            pstmt.executeUpdate();

            try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    detalle.setId(generatedKeys.getLong(1));
                    return detalle;
                }
            }

            throw new PersistenceException(
                    "No se pudo generar el ID del detalle de venta");

        } catch (SQLException e) {
            throw new PersistenceException(
                    "Error al crear el detalle de venta", e);
        }
    }
    
    public DetalleVenta actualizar(DetalleVenta detalle)
            throws PersistenceException {

        return updateObject(PRIMARY_KEY, detalle);
    }
    
    public boolean eliminarPorId(Long id) throws PersistenceException {
        return deleteObject(PRIMARY_KEY, id);
    }
    
    public DetalleVenta buscarPorId(Long id) throws PersistenceException {
        String sql = getSqlDetallesConProducto() + " WHERE dv.id = ?";

        try (Connection conn = dbConn.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, id);

            try (ResultSet rs = pstmt.executeQuery()) {
                return rs.next() ? mapResultSetConProducto(rs) : null;
            }

        } catch (SQLException e) {
            throw new PersistenceException(
                    "Error al buscar el detalle de venta con ID " + id, e);
        }
    }
    
    public List<DetalleVenta> buscarPorVentaId(Long ventaId)
            throws PersistenceException {

        String sql = getSqlDetallesConProducto()
                + " WHERE dv.venta_id = ? ORDER BY dv.id";

        List<DetalleVenta> detalles = new ArrayList<>();

        try (Connection conn = dbConn.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setLong(1, ventaId);

            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    detalles.add(mapResultSetConProducto(rs));
                }
            }

            return detalles;

        } catch (SQLException e) {
            throw new PersistenceException(
                    "Error al recuperar los detalles de la venta " + ventaId, e);
        }
    }
    
    private String getSqlDetallesConProducto() {
        return """
            SELECT
                dv.id,
                dv.precio_unitario,
                dv.cantidad,
                dv.observacion,
                dv.venta_id,
                dv.producto_id,

                p.nombre AS producto_nombre,
                p.descripcion AS producto_descripcion,
                p.stock,
                p.umbral_stock,
                p.precio_actual,
                p.contenido,
                p.activo,

                mp.id AS marca_id,
                mp.nombre AS marca_nombre,

                cp.id AS categoria_id,
                cp.nombre AS categoria_nombre,

                um.id AS unidad_id,
                um.nombre AS unidad_nombre,
                um.abreviatura AS unidad_abreviatura

            FROM detalle_ventas dv
            JOIN productos p ON p.id = dv.producto_id
            JOIN marca_productos mp ON mp.id = p.marca_producto_id
            JOIN categoria_productos cp ON cp.id = p.categoria_producto_id
            JOIN unidades_medida um ON um.id = p.unidad_medida_id
            """;
    }
    
    private DetalleVenta mapResultSetConProducto(ResultSet rs)
            throws PersistenceException {

        try {
            MarcaProducto marca = new MarcaProducto(
                    rs.getLong("marca_id"),
                    rs.getString("marca_nombre")
            );

            CategoriaProducto categoria = new CategoriaProducto(
                    rs.getLong("categoria_id"),
                    rs.getString("categoria_nombre"),
                    null
            );

            UnidadMedida unidad = new UnidadMedida(
                    rs.getLong("unidad_id"),
                    rs.getString("unidad_nombre"),
                    rs.getString("unidad_abreviatura")
            );

            Producto producto = new Producto(
                    rs.getLong("producto_id"),
                    rs.getString("producto_nombre"),
                    rs.getString("producto_descripcion"),
                    rs.getInt("stock"),
                    rs.getInt("umbral_stock"),
                    rs.getBigDecimal("precio_actual"),
                    unidad,
                    rs.getBigDecimal("contenido"),
                    marca,
                    categoria,
                    rs.getBoolean("activo")
            );

            return new DetalleVenta(
                    rs.getLong("id"),
                    producto,
                    rs.getInt("cantidad"),
                    rs.getBigDecimal("precio_unitario")
            );

        } catch (SQLException e) {
            throw new PersistenceException(
                    "Error al mapear el detalle de venta", e);
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
    protected void setInsertParams(
            PreparedStatement pstmt, DetalleVenta detalle
    ) throws PersistenceException {

        throw new PersistenceException(
                "Para crear un detalle use crear(detalle, ventaId)");
    }

    @Override
    protected void setUpdateParams(
            PreparedStatement pstmt, DetalleVenta detalle
    ) throws PersistenceException {

        try {
            pstmt.setInt(1, detalle.getCantidad());

        } catch (SQLException e) {
            throw new PersistenceException(
                "Error al asignar la cantidad del detalle de venta", e);
        }
    }

    @Override
    protected DetalleVenta mapResultSet(ResultSet rs)
            throws PersistenceException {

        try {
            Producto producto = new Producto(
                    rs.getLong("producto_id"),
                    null,
                    null,
                    0,
                    0,
                    BigDecimal.ZERO,
                    null,
                    BigDecimal.ZERO,
                    null,
                    null,
                    true
            );

            return new DetalleVenta(
                    rs.getLong("id"),
                    producto,
                    rs.getInt("cantidad"),
                    rs.getBigDecimal("precio_unitario")
            );

        } catch (SQLException e) {
            throw new PersistenceException(
                    "Error al mapear el detalle desde la base de datos", e);
        }
    }    

}
