package com.mycompany.piscinas_gp.daos;

import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import com.mycompany.piscinas_gp.generico.GenericoDAO;
import com.mycompany.piscinas_gp.modelos.DetalleVenta;

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
        "precio_unitario", "cantidad", "observacion", "venta_id", "producto_id"  
    };
    
    public DetalleVentaDAO( DbConnection dbConn ) {
        super( dbConn );
    }
    
    public DetalleVenta crear( DetalleVenta detalle ) throws PersistenceException {
        return createObject( detalle );
    }
    
    public DetalleVenta actualizar( DetalleVenta detalle ) throws PersistenceException {
        return updateObject(PRIMARY_KEY, detalle);
    }
    
    public boolean eliminarPorId( Long id ) throws PersistenceException {
        return deleteObject( PRIMARY_KEY, id );
    }
    
    public DetalleVenta buscarPorId( Long id ) throws PersistenceException {
        String sql = getS
                
    }
    
}
