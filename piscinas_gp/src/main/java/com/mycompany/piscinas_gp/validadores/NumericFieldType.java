package com.mycompany.piscinas_gp.validadores;

import com.mycompany.piscinas_gp.utils.FieldType;
import java.math.BigDecimal;

public enum NumericFieldType implements FieldType< Number > {
    
    //cliente
    CODIGO_POSTAL("codigo postal", 4, 5, true),
    
    //producto
    STOCK("stock", 0, 999999, false),
    UMBRAL_STOCK("umbral de stock", 0, 999999, false),
    PRECIO_ACTUAL("precio actual", 0, 999999999, false),
    
    //detalleVenta
    CANTIDAD("cantidad", 1, 999999, false),
    PRECIO_UNITARIO("precio unitario", 0, 999999999, false),
    
    //venta
    TOTAL("total", 0, 999999999, false),
    
    //ventaProducto
    DESCUENTO_GLOBAL("descuento global", 0, 100, false),
    
    //ventaAsesoramiento
    MONTO("monto", 0, 99999999, false),
    
    //ventaServTecnico
    MANO_OBRA("mano de obra", 0, 99999999, false);
 
    private final String displayName;
    private final double minLength;
    private final double maxLength;
    private final boolean validateByLength;
    
    private NumericFieldType(String displayName, double minLength, double maxLength,
            boolean validateByLength) {
        this.displayName = displayName;
        this.minLength = minLength;
        this.maxLength = maxLength;
        this.validateByLength = validateByLength;
    }

@Override
    public String getDisplayName() { return displayName; }
    public double getMinLength() { return minLength; }
    public double getMaxLength() { return maxLength; }
    public boolean isValidateByLength() { return validateByLength; }
    
    
@Override
    public String getValidationError(Number value) {
        if (value == null) {
            return "El " + displayName + " no puede ser nulo";
        }

        BigDecimal bdValue = new BigDecimal(value.toString());

        if (validateByLength) {
            long integerPart = bdValue.longValue();
            int length = String.valueOf(Math.abs(integerPart)).length();

            if (length < minLength || length > maxLength) {
                return String.format(
                    "%s debe tener entre %.0f y %.0f digitos",
                    displayName, minLength, maxLength
                );
            }
        } else {
            BigDecimal minBD = BigDecimal.valueOf(minLength);
            BigDecimal maxBD = BigDecimal.valueOf(maxLength);

            if (bdValue.compareTo(minBD) < 0 || bdValue.compareTo(maxBD) > 0) {
                String fmt = minLength == Math.floor(minLength) ? "%.0f" : "%.2f";

                return String.format(
                    "%s debe estar entre " + fmt + " y " + fmt,
                    displayName, minLength, maxLength
                );
            }
        }

        return null;
    }
    
}
