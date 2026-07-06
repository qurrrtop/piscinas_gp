package com.mycompany.piscinas_gp.utils;

public interface FieldType<T> {
    
    String getDisplayName();
    
    String getValidationError( T valor );
    
    default String getValidationError( T valor, T valorComparado ) {
        return getValidationError( valor );
    }
    
}