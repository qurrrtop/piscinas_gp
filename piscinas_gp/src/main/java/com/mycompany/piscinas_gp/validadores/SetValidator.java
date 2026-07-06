package com.mycompany.piscinas_gp.validadores;

import com.mycompany.piscinas_gp.utils.FieldType;
import java.time.LocalDate;

public class SetValidator {
    public static <T> void validar( T value, FieldType<?> fieldType ) {
        String error = switch( fieldType ) {
            case StringFieldType stringType -> stringType.getValidationError( (String) value );
            case NumericFieldType numericType -> numericType.getValidationError( (Number) value );
            case LocalDateFieldType localDateType -> localDateType.getValidationError( (LocalDate) value );
            default -> throw new IllegalArgumentException(
                String.format("El tipo de campo %s ingresado, no es soportado ", fieldType.getClass().getSimpleName())
            );
        };
                
        if( error != null ) {
            throw new IllegalArgumentException( error );
        }
    }
}
    

