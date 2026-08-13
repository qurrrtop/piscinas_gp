package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.CategoriaProducto;
import com.mycompany.piscinas_gp.modelos.MarcaProducto;
import com.mycompany.piscinas_gp.modelos.Producto;
import com.mycompany.piscinas_gp.modelos.UnidadMedida;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

public class ProductoDAO extends GenericoDAO<Producto> {

    private static final String TABLE_NAME = "productos";
    private static final String PRIMARY_KEY = "id";
    private static final String[] COLUMNS_FOR_INSERT = {
        "nombre",
        "descripcion",
        "stock",
        "umbral_stock",
        "precio_actual",
        "contenido",
        "unidad_medida_id",
        "marca_producto_id",
        "categoria_producto_id"
    };
    private static final String[] PLACEHOLDER_VALUES = {
        "?",
        "?",
        "?",
        "?",
        "?",
        "?",
        "?",
        "?",
        "?"
    };
    private static final String[] COLUMNS_FOR_SELECT = {
        "id",
        "nombre",
        "descripcion",
        "stock",
        "umbral_stock",
        "precio_actual",
        "contenido",
        "unidad_medida_id",
        "marca_producto_id",
        "categoria_producto_id"
    };
    private static final String[] COLUMNS_FOR_UPDATE = {
        "nombre = ?",
        "descripcion = ?",
        "stock = ?",
        "umbral_stock = ?",
        "precio_actual = ?",
        "contenido = ?",
        "unidad_medida_id = ?",
        "marca_producto_id = ?",
        "categoria_producto_id = ?"
    };

    public ProductoDAO(DbConnection dbConn) {
        super(dbConn);
    }

    public Producto buscarPorId(Long id) throws PersistenceException {
        return findById(id);
    }

    public Producto crear(Producto producto) throws PersistenceException {
        return createObject(producto);
    }

    public Producto actualizar(Producto producto) throws PersistenceException {
        return updateObject(PRIMARY_KEY, producto);
    }

    public boolean eliminarPorId(Long id) throws PersistenceException {
        return deleteObject(PRIMARY_KEY, id);
    }

    public List<Producto> buscarTodos() throws PersistenceException {
        return findAllObjects("nombre");
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
    protected void setInsertParams(PreparedStatement pstmt, Producto producto) throws PersistenceException {
        setProductoParams(pstmt, producto);
    }

    @Override
    protected void setUpdateParams(PreparedStatement pstmt, Producto producto) throws PersistenceException {
        setProductoParams(pstmt, producto);
    }

    @Override
    protected Producto mapResultSet(ResultSet rs) throws PersistenceException {
        try {
            MarcaProducto marcaProducto = new MarcaProducto(
                    rs.getLong("marca_producto_id"),
                    null
            );
            CategoriaProducto categoriaProducto = new CategoriaProducto(
                    rs.getLong("categoria_producto_id"),
                    null,
                    null
            );
            UnidadMedida unidadMedida = new UnidadMedida(
                    rs.getLong("unidad_medida_id"),
                    null,
                    null
            );

            return new Producto(
                    rs.getLong("id"),
                    rs.getString("nombre"),
                    rs.getString("descripcion"),
                    rs.getInt("stock"),
                    rs.getInt("umbral_stock"),
                    rs.getBigDecimal("precio_actual"),
                    unidadMedida,
                    rs.getBigDecimal("contenido"),
                    marcaProducto,
                    categoriaProducto
            );
        } catch (SQLException e) {
            throw new PersistenceException("Error al mapear el producto desde la base de datos", e);
        }
    }

    private void setProductoParams(PreparedStatement pstmt, Producto producto) throws PersistenceException {
        validarRelaciones(producto);

        try {
            pstmt.setString(1, producto.getNombre());
            pstmt.setString(2, producto.getDescripcion());
            pstmt.setInt(3, producto.getStock());
            pstmt.setInt(4, producto.getUmbralStock());
            pstmt.setBigDecimal(5, producto.getPrecioActual());
            pstmt.setBigDecimal(6, producto.getContenido());
            pstmt.setLong(7, producto.getUnidadMedida().getId());
            pstmt.setLong(8, producto.getMarcaProducto().getId());
            pstmt.setLong(9, producto.getCategoriaProducto().getId());
        } catch (SQLException e) {
            throw new PersistenceException("Error al asignar los parametros del producto", e);
        }
    }

    private void validarRelaciones(Producto producto) throws PersistenceException {
        if (producto.getMarcaProducto() == null || producto.getMarcaProducto().getId() == null) {
            throw new PersistenceException("El producto debe tener una marca con ID asignado");
        }

        if (producto.getCategoriaProducto() == null || producto.getCategoriaProducto().getId() == null) {
            throw new PersistenceException("El producto debe tener una categoria con ID asignado");
        }

        if (producto.getUnidadMedida() == null || producto.getUnidadMedida().getId() == null) {
            throw new PersistenceException("El producto debe tener una unidad de medida con ID asignada");
        }
    }
}