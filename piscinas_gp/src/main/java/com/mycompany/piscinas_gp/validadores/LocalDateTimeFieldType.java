package com.mycompany.piscinas_gp.validadores;

import com.mycompany.piscinas_gp.utils.FieldType;
import java.time.LocalDateTime;

public enum LocalDateTimeFieldType implements FieldType<LocalDateTime> {

    FECHA("fecha de venta") {
        @Override
        protected String validateSpecificRules(LocalDateTime fecha) {
            return fecha.isAfter(LocalDateTime.now())
                    ? String.format("La %s no puede ser futura", getDisplayName())
                    : null;
        }
    },

    FECHA_INICIO("fecha de inicio") {
        @Override
        protected String validateSpecificRules(LocalDateTime fecha) {
            return fecha.isAfter(LocalDateTime.now())
                    ? String.format("La %s no puede ser futura", getDisplayName())
                    : null;
        }
    };

    private final String displayName;

    private LocalDateTimeFieldType(String displayName) {
        this.displayName = displayName;
    }

    @Override
    public String getDisplayName() { return displayName; }

    @Override
    public String getValidationError(LocalDateTime value) {
        if (value == null) {
            return String.format("La %s no puede estar vacia", displayName);
        }
        return validateSpecificRules(value);
    }

    protected abstract String validateSpecificRules(LocalDateTime fecha);
}