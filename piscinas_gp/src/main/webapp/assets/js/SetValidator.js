export default class SetValidator {
        
    static validate( value, rule ) {
        if( !rule || !rule.type ) {
            return "Regla de validación no definida";
        }
        
        switch(rule.type) {
            
            case "string": 
                return this.validateString( value, rule );
                
            case "numeric":
                return this.validateNumeric( value, rule );
                
            case "date":
                return this.validateDate( value, rule );
                
            case "list":
                return this.validateList( value, rule );
                
            default:
                return "Tipo no soportado";
        }
    }
    
    static validateString( value, rule ) {
        if( value == null || value.trim() === "" ) {
            return "Campo vacio";
        }
        
        const trimmed = value.trim();
        
        if( trimmed.length < rule.min ) {
            return `Minimo ${rule.min} caracteres`;
        }
        
        if( trimmed.length > rule.max ) {
            return `Maximo ${rule.max} caracteres`;
        }
        
        if (rule.validation === "password") {
            if (!/[A-Z]/.test(trimmed)) {
                return "Debe contener almenos una mayúscula";
            }
            
            if (!/[a-z]/.test(trimmed)) {
                return "Debe contener almenos una minúscula";
            }
            
            if (!/\d/.test(trimmed)) {
                return "Debe contener almenos un número";
            }
        }
        
        if( rule.regex && !rule.regex.test(trimmed) ) {
            return "Formato invalido";
        }
        
        return null;
    }
    
    static validateNumeric( value, rule ) {
        if( value == null || value === "" ) {
            return "campo vacio";
        }
        
        const numericValue = Number(value);
        
        if( isNaN(numericValue) ) {
            return "Debe ser un número";
        }
        
        if( numericValue < rule.min ) {
            return `El valor minimo permitido es ${rule.min}`;
        }
        
        if( numericValue > rule.max ) {
            return `El valor maximo permitido es ${rule.max}`;
        }
        
        return null;
    }
    
    static validateDate( value, rule ) {
        if( !value ) {
            return "Fecha requerida";
        }
        
        const inputDate = new Date(value);
        
        if( isNaN( inputDate.getTime() ) ) {
            return "Fecha invalida"
        }
        
        const today = new Date();
        
        // CASO A: Validación por edad (ejemp. cumpleaños)
        if( rule.mode === "age" ) {
            let age = today.getFullYear() - inputDate.getFullYear();
            let monthDiff = today.getMonth() - inputDate.getMonth();
            
            if( monthDiff < 0 || ( monthDiff === 0 && today.getDate() < inputDate.getDate() ) ) {
                age--;
            }
            
            if( rule.min && age < rule.min ) {
                return `Debe tener al menos ${rule.min} años`;
            }
            
            if( rule.max && age > rule.max ) {
                return `Edada maxima ${rule.max}`;
            }
        }
        
        // CASO B: Validación por calendario (ejemp fecha de contratación)
        if( rule.mode === "calendar") {
            if( rule.min ) {
                const minDate = new Date( rule.min );
                if( inputDate < minDate ) {
                    return `La fecha no pude ser menor a ${rule.min}`;
                }
            }
            
            if( rule.max ) {
                const maxDate = new Date( rule.max );
                if( inputDate > maxDate ) {
                    return `La fecha no puede ser mayor a ${rule.max}`;
                }
            }
        }
        
        return null;
    }
    
    static validateList( value, rule ) {
        if( value == null || value.trim() === "" ) {
            return `Debe seleccionar una opción valida`;
        }
        
        const numericValue = Number( value );
        if( isNaN( numericValue ) ) {
            return "Opción invalida";
        }
        
        return null;
    }
}