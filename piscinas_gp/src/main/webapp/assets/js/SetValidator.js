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
            
            if (rule.required === false) {
                return null;
            }
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
        
         // Validaciones específicas de cuil o cuit       
        if (rule.validation === "cuil" || rule.validation === "cuit") {
            return this.validateCuilCuit(trimmed, rule.validation);
        }
        
        // Validaciones específicas de telefono       
        if (rule.validation === "telefono") {
            return this.validateTelefono(trimmed);
        }
        
        return null;
    }
    
    static validateCuilCuit(value, validation) {
        if (value == null || value.trim() === "") {
            return "Campo vacío";
        }

        const limpio = value.replace(/\D/g, "");
        if (limpio.length !== 11) {
            return "debe contener 11 dígitos";
        }
    
        const prefijosValidosCuil = ["20", "23", "24", "27"];
        const prefijosValidosCuit = ["20", "23", "24", "27", "30", "33", "34"];
        const prefijosValidos = validation === "cuil" ? prefijosValidosCuil : prefijosValidosCuit;
    
        const prefijo = limpio.substring(0, 2);
        if (!prefijosValidos.includes(prefijo)) {
            return validation === "cuil" ? "El CUIL no tiene un prefijo válido" : "El CUIT no tiene un prefijo válido";
        }

        // Función para calcular dígito verificador
        const calcDigito = (num) => {
            const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
            let s = 0;
            for (let i = 0; i < 10; i++) s += Number(num[i]) * mult[i];
            const r = s % 11;
            if (r === 0) return 0;
            if (r === 1) return 9;
            return 11 - r;
        };

        const digitoCalculado = calcDigito(limpio);
        const digitoIngresado = Number(limpio[10]);

        // Si el dígito calculado es 9 (caso especial), probar con prefijo alternativo
        if (digitoCalculado === 9) {
            const prefijosAlt = {"20":"23","23":"20","24":"27","27":"24","30":"33","33":"30","34":"33"};
            const prefijoAlt = prefijosAlt[prefijo];
            if (prefijoAlt && prefijosValidos.includes(prefijoAlt)) {
                const numAlt = prefijoAlt + limpio.substring(2);
                if (calcDigito(numAlt) === digitoIngresado) {
                    return null;
                }
            }
        }

        if (digitoCalculado !== digitoIngresado) {
            return "El CUIL/CUIT no es válido";
        }

        return null;
    }
    
    static validateTelefono(value) {
        const soloNumeros = value.replace(/\D/g, "");

        if (soloNumeros.length < 8) {
            return "El teléfono debe tener al menos 8 dígitos";
        }

        if (soloNumeros.length > 15) {
            return "El teléfono no puede tener más de 15 dígitos";
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