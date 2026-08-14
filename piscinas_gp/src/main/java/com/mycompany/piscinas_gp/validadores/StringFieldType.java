package com.mycompany.piscinas_gp.validadores;

import com.mycompany.piscinas_gp.utils.FieldType;
import java.util.regex.Pattern;

public enum StringFieldType implements FieldType< String > { 
    
    //cliente
    EMAIL("email", 3, 80, "^[_a-z0-9-]+(\\\\.[_a-z0-9-]+)*@[a-z0-9-]+(\\\\.[a-z0-9-]+)*(\\\\.[a-z]{2,4})$"),
    TELEFONO("telefono", 8, 15, "^[0-9+]+$"),
    CALLE_Y_NUMERO("calle y numero", 3, 60, "^[A-Za-zÁÉÍÓÚáéíóúÑñ\\s'.-]+$"),
    CIUDAD("ciudad", 3, 60, "^[A-Za-zÁÉÍÓÚáéíóúÑñ\\s'.-]+$"),
    PROVINCIA("provincia", 3, 60, "^[A-Za-zÁÉÍÓÚáéíóúÑñ\\s'.-]+$"),
    OBSERVACIONES("observaciones", 0, 250, "^[a-zA-ZÀ-ÿ0-9\\s:º°',.-]*$"),
    
    //clienteParticular
    NOMBRE("nombre", 3, 80, "^[A-Za-zÁÉÍÓÚáéíóúÑñ\\s'-]+$"),
    APELLIDO("apellido", 3, 80, "^[A-Za-zÁÉÍÓÚáéíóúÑñ\\s'-]+$"),
    CUIL("cuil", 11, 11, "^[0-9]+$"),
    
    //clienteEmpresa
    RAZON_SOCIAL("razon social", 3, 100, "^[a-zA-ZÀ-ÿ0-9\\s:º°'.-]+$"),
    NOMBRE_FANTASIA("nombre de fantasia", 3, 100, "^[a-zA-ZÀ-ÿ0-9\\s:º°'.-]+$"),
    RUBRO("rubro", 3, 80, "^[a-zA-ZÀ-ÿ0-9\\s:º°'.-]+$"),
    CUIT("cuit", 11, 11, "^[0-9]+$"),

    //venta
    PROBLEMA("problema", 3, 250, "^[a-zA-ZÀ-ÿ0-9\\s:º°',.-]+$"),
    DIAGNOSTICO("diagnostico", 3, 250, "^[a-zA-ZÀ-ÿ0-9\\s:º°',.-]+$"),
    
    //producto
    NOMBRE_PRODUCTO("nombre del producto", 3, 100, "^[a-zA-ZÀ-ÿ0-9\\s:º°'.-]+$"),
    DESCRIPCION("descripcion", 3, 250, "^[a-zA-ZÀ-ÿ0-9\\s:º°',.-]+$"),
    
    //marca y categoria
    NOMBRE_MARCA("nombre de la marca", 2, 80, "^[a-zA-ZÀ-ÿ0-9\\s:º°'.-]+$"),
    NOMBRE_CATEGORIA("nombre de la categoria", 3, 80, "^[a-zA-ZÀ-ÿ0-9\\s:º°'.-]+$"),
    
    //unidad de medida
    NOMBRE_UNIDAD_MEDIDA("nombre de la unidad de medida", 3, 50, "^[a-zA-ZÀ-ÿ0-9\\s:º°'.-]+$"),
    ABREVIATURA_UNIDAD_MEDIDA("abreviatura de la unidad de medida", 1, 10, null);
    
    private final String displayName;
    private final int minLength;
    private final int maxLength;
    private final Pattern validPattern;

    private StringFieldType(String displayName, int minLength, int maxLength, String regex) {
        this.displayName = displayName;
        this.minLength = minLength;
        this.maxLength = maxLength;
        this.validPattern = regex != null ? Pattern.compile(regex) : null;
    }
    
@Override
    public String getDisplayName() { return displayName; }
    public int getMinLength() { return minLength; }
    public int getMaxLength() { return maxLength; }
    public Pattern getValidPattern() { return validPattern; }
    
@Override
    public String getValidationError(String value) {
    if (value == null) {
        return displayName + " no puede ser nulo";
    }

    String trimmed = value.trim();

    if (trimmed.isBlank()) {
        return displayName + " no puede estar vacio";
    }

    String processedValue = switch (this) {
        case CUIL, CUIT, TELEFONO -> trimmed.replaceAll("[^0-9+]", "");
        default -> trimmed;
    };

    int lengthValue = processedValue.length();

    if (lengthValue < minLength) {
        return String.format(
            "El %s debe tener al menos %s caracteres (tiene %d)",
            displayName, minLength, lengthValue
        );
    }

    if (lengthValue > maxLength) {
        return String.format(
            "El %s no puede tener mas de %s caracteres (tiene %d)",
            displayName, maxLength, lengthValue
        );
    }

    if (validPattern != null && !validPattern.matcher(processedValue).matches()) {
        return displayName + " contiene caracteres no validos";
    }

    return null;
    }
}
