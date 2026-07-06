package com.mycompany.piscinas_gp.validadores;

import com.mycompany.piscinas_gp.utils.FieldType;
import java.time.LocalDate;

public enum LocalDateFieldType implements FieldType<LocalDate> {
    
    // venta
    FECHA("fecha de venta") {
        @Override
        protected String validateSpecificRules(LocalDate date) {
            return date.isAfter(LocalDate.now())
                ? String.format("La %s no puede ser futura", getDisplayName())
                : null;
        }
    },
    
    FECHA_VENTA("fecha de venta") {
        @Override
        protected String validateSpecificRules( LocalDate date ) {
            return date.isAfter(LocalDate.now())
                    ? String.format("La %s no puede ser futura", getDisplayName())
                    : null;
        }
    },
    
    FECHA_INICIO("fecha de inicio") {
        @Override
        protected String validateSpecificRules( LocalDate date ) {
            return date.isAfter(LocalDate.now())
                    ? String.format("La %s no puede ser futura", getDisplayName())
                    : null;
        }     
    },
    
    FECHA_CIERRE("fecha de cierre") {
        @Override
        protected String validateSpecificRules( LocalDate date ) {
            return date.isAfter(LocalDate.now())
                    ? String.format("La %s no puede ser futura", getDisplayName())
                    : null;
        }
    },
    
    FECHA_ENTREGA("fecha de entrega") {
        @Override
        protected String validateSpecificRules( LocalDate date ) {
            return date.isAfter(LocalDate.now())
                    ? String.format("La %s no puede ser futura", getDisplayName())
                    : null;
        }
    };
    
    private final String displayName;
    
    private LocalDateFieldType(String displayName) {
        this.displayName = displayName;
    }
    
    @Override
    public String getDisplayName() { return displayName; } 
   
@Override
    public String getValidationError(LocalDate value) {
        if (value == null) {
            return String.format("La %s no puede estar vacia", displayName);
        }

        return validateSpecificRules(value);
    }

    protected abstract String validateSpecificRules(LocalDate date);
    
}
