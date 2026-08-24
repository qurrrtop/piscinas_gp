package com.mycompany.piscinas_gp.generico;

import com.mycompany.piscinas_gp.utils.Identifiable;
import com.mycompany.piscinas_gp.config.DbConnection;
import com.mycompany.piscinas_gp.exceptions.PersistenceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.sql.Connection;
import java.sql.ParameterMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public abstract class GenericoDAO< T extends Identifiable> {
      private static final Logger logger = LoggerFactory.getLogger( GenericoDAO.class );
    
    protected final DbConnection dbConn;
    
    protected abstract String getTableName();
    protected abstract String[] getColumnsForInsert();
    protected abstract String[] getPlaceHolderValues();
    protected abstract String[] getColumnsForSelect();
    protected abstract String[] getColumnsForUpdate();
    protected abstract String getPrimaryKey();
    //protected abstract void setInsertParams( PreparedStatement pstmt, T entity ) throws SQLException;    
    protected abstract void setInsertParams( PreparedStatement pstmt, T entity ) throws PersistenceException;
    //protected abstract void setUpdateParams( PreparedStatement pstmt, T entity ) throws SQLException;
    protected abstract void setUpdateParams( PreparedStatement pstmt, T entity ) throws PersistenceException;
    //protected abstract T mapResultSet( ResultSet rs ) throws SQLException;    
    protected abstract T mapResultSet( ResultSet rs ) throws PersistenceException;
    
    public GenericoDAO( DbConnection dbConn ) { this.dbConn = dbConn; }
    
    public T findByField( String fieldName, Object value ) throws PersistenceException {
        String sql = "SELECT " + String.join(", ", getColumnsForSelect() ) +
                     " FROM " + getTableName() +
                     " WHERE " + fieldName + " = ?";
        
    try( Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement( sql ) ) {
            
            pstmt.setObject(1, value);
            
            try( ResultSet rs = pstmt.executeQuery() ) {
                if( rs.next() ) {
                    logger.debug("Fila obtenida: {}", rs.getString(fieldName));
                    return mapResultSet( rs );
                }
            }
            
        logger.info("Consulta realizada en la tabla {}", getTableName());
            
        } catch( SQLException e ) {
            logger.error("Error al buscar en la tabla {} con el valor {}" + getTableName(), value, e);
            //throw e;
            throw new PersistenceException("Error al buscar en la tabla [ " + getTableName() + " ] con el valor [ " + value + " ] ", e);
        }
        
        return null;
    }
    
    public T findById( Long id ) throws PersistenceException {
        return findByField( getPrimaryKey(), id);
    }
    
    public boolean checkExistenceByField( String fieldName, Object value ) throws PersistenceException {
        String sql = "SELECT COUNT(*) FROM " + getTableName() + " WHERE " + fieldName + " = ?";
        
        try( Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement( sql ) ) {
            
            pstmt.setObject(1, value);
            
            try( ResultSet rs = pstmt.executeQuery() ) {
                if( rs.next() ) {
                    logger.debug("Fila obtenida {}: {}", fieldName, rs.getInt(1));
                    return rs.getInt(1) > 0;
                }
            }
            
            logger.info("Consulta realizada en la tabla {}", getTableName());
            
        } catch( SQLException e ) {
            logger.error("Error al buscar en la tabla {} con el valor {}" + getTableName(), value, e);
            throw new PersistenceException("Error al buscar en la tabla [ " + getTableName() + " ] con el valor [ " + value + " ] ", e);
        }
        
        return false;
    }
    
    public List<T> findAllByField( String fieldName, Object value ) throws PersistenceException {
        String sql = "SELECT " + String.join(", ", getColumnsForSelect() ) +
                     " FROM " + getTableName() +
                     " WHERE " + fieldName + " = ?";
        
        List<T> allFields = new ArrayList<>();
        
        try( Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement( sql ) ) {
            
            pstmt.setObject(1, value);
            
            try( ResultSet rs = pstmt.executeQuery() ) {
                while( rs.next() ) {
                    allFields.add( mapResultSet( rs ) );
                }
            }
            
            logger.info("Se recuperaron los registros de la categoria {}", fieldName);
            
        } catch( SQLException e ) {
            logger.error("Error al recuperar registros de la categoria {} en la tabla {}" + fieldName, getTableName(), e);
            throw new PersistenceException("Error al recuperar los registros de la categoría [ " + fieldName + " ] de la tabla [ " + getTableName() + " ] ", e);
        }
        
        return allFields;
    }
    
    public List<T> findAllObjects( String fieldName ) throws PersistenceException {
        String sql = "SELECT " + String.join(", ", getColumnsForSelect() ) +
                     " FROM " + getTableName() + 
                     " ORDER BY " + fieldName;
        
        List<T> allObjects = new ArrayList<>();
        
        try( Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement( sql );
                ResultSet rs = pstmt.executeQuery() ) {
            
            while( rs.next() ) {
                allObjects.add( mapResultSet( rs ) );
            }

            logger.info("Se recuperaron los registros de la tabla {}", getTableName());
            
        } catch( SQLException e ) {
            logger.error("Error al recuperar datos de la tabla {}, ordenado por {}" + getTableName(), fieldName, e);
            throw new PersistenceException("Error al recuperar los registros de la tabla [ " + getTableName() + " ] ", e);
        }
        
        return allObjects;
    }
    
    public T createObject( T entity ) throws PersistenceException {
        String sql = "INSERT INTO " + getTableName() +
                     "( " + String.join(", ", getColumnsForInsert() ) + " )" +
                     " VALUES ( " + String.join(", ", getPlaceHolderValues() ) + " )";
        
        try( Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement( sql, Statement.RETURN_GENERATED_KEYS ) ) {
            
            setInsertParams(pstmt, entity);
            
            pstmt.executeUpdate();
            
            try( ResultSet generatedKey = pstmt.getGeneratedKeys() ) {
                if( generatedKey.next() ) {
                    logger.info("Registro creado con exito en la tabla {}, con el ID {}", generatedKey, getTableName() );
                    Long id = generatedKey.getLong(1);
                    entity.setId(id);
                    return entity;
                    
                } else {
                    logger.error("Error al crear el id {} para el regitstro en la tabla {}", generatedKey, getTableName() );
                    throw new PersistenceException("Error al intentar crear el registro en la tabla [ " + getTableName() + " ] ");
                }
                
            } catch( SQLException e ) {
                logger.error("Error al crear registro en tabla {}, con id {}" + getTableName(), entity.getId(), e);
                throw new PersistenceException("Eror al crear el registro con ID [ " + entity.getId() + " ], en la tabla [ " + getTableName() + " ] ", e);
            }
            
        } catch( SQLException e ) {
            logger.error("Error al preparar la inserción en la tabla {}", getTableName(), e);
            throw new PersistenceException("Error al intentar crear el registro en la tabla [ " + getTableName() + " ] ", e);
        }
    }
        
    public T updateObject(String fieldName, T entity) throws PersistenceException {
        String[] columns = getColumnsForUpdate();
    
        // 1. Construir el SQL
        String sql = "UPDATE " + getTableName() + 
                    " SET " + String.join(", ", columns) +
                    " WHERE " + fieldName + " = ?";
    
        // 2. Log para depuración
        logger.debug("SQL UPDATE: {}", sql);
        logger.debug("Entity ID a actualizar: {}", entity.getId());
    
        try (Connection conn = dbConn.getConnection();
            PreparedStatement pstmt = conn.prepareStatement(sql)) {
        
            // 3. Establecer los parámetros del SET (posiciones 1 a N)
            setUpdateParams(pstmt, entity);
        
            // 4. Establecer el ID en la última posición (N + 1)
            int idIndex = columns.length + 1;
            pstmt.setLong(idIndex, entity.getId());
        
            logger.debug("Parámetros: {} para SET, ID en posición {}", columns.length, idIndex);
        
            // 5. Ejecutar la actualización
            int affectedRows = pstmt.executeUpdate();
        
            // 6. Verificar resultado
            if (affectedRows > 0) {
                logger.info("✅ Registro actualizado en tabla {}, ID: {}", getTableName(), entity.getId());
                return entity;
            } else {
                logger.warn("⚠️ No se encontró registro para actualizar en tabla {}, ID: {}", getTableName(), entity.getId());
                return null;
            }
        
        } catch (SQLException e) {
            logger.error("❌ Error al actualizar en tabla {}, ID: {}", getTableName(), entity.getId(), e);
            throw new PersistenceException(
                String.format("Error al actualizar registro ID %d en tabla %s: %s", 
                    entity.getId(), getTableName(), e.getMessage()),e
            );
        }
    }
    
    public boolean deleteObject( String fieldName, Object value ) throws  PersistenceException {
        String sql = "DELETE FROM " + getTableName() +
                     " WHERE " + fieldName + " = ?";
        
        try( Connection conn = dbConn.getConnection();
                PreparedStatement pstmt = conn.prepareStatement( sql ) ) {
            
            pstmt.setObject(1, value);
            
            int affectedRow = pstmt.executeUpdate();
            
            if( affectedRow > 0 ) {
                logger.info("Información: el registro de la tabla {} fue eliminado exitosamente", getTableName() );
                return true;
            } else {
                logger.warn("Advertencia: no pued ser eliminado el registro de la tabla {} con el id {}", getTableName(), value );
                return false;
            }
            
        } catch( SQLException e ) {
            logger.error("Error: el registro de la tabla {}, con id {} no pudo ser eliminado" + getTableName(), value, e);
            throw new PersistenceException("Error al intentar eliminar el registro con ID: [ " + value + " ], de la tabla [ " + getTableName() + " ] " , e);
        }
    }
    
}

