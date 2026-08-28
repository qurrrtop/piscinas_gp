export default class Rules {
        
    static provisions = {
        // ----- CLIENTE BASE -----
        EMAIL: {
            type: "string",
            min: 3,
            max: 80,
            regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            required: false
        },
        TELEFONO: {
            validation: "telefono",
            type: "string",
            min: 8,
            max: 15,
            regex: /^[0-9+\-\s()]+$/,
            required: false
        },
        CALLE_Y_NUMERO: {
            validation: "calleYNumero",
            type: "string",
            min: 3,
            max: 60,
            required: false
        },
        CIUDAD: {
            validation: "ciudad",
            type: "list",
            required: false
        },
        PROVINCIA: {
            validation: "provincia",
            type: "list",
            required: false
        },
        OBSERVACIONES: {
            validation: "observaciones",
            type: "string",
            min: 0,
            max: 250,
            required: false
        },
        // CLIENTE PARTICULAR
        NOMBRE: {
            type: "string",
            min: 3,
            max: 80,
            regex: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/
        },
        APELLIDO: {
            type: "string",
            min: 3,
            max: 80,
            regex: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/
        },
        CUIL: {
            validation: "cuil",
            type: "string",
        },
        // ----- CLIENTE EMPRESA -----
        RAZON_SOCIAL: {
            type: "string",
            min: 3,
            max: 150,
            regex: /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s.'&,()-]+$/,
        },
        NOMBRE_FANTASIA: {
            type: "string",
            min: 3,
            max: 100,
            regex: /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s.'&,()-]+$/,
            required: false
        },
        RUBRO: {
            type: "string",
            min: 3,
            max: 100,
            regex: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s&'-]+$/,
        },
        CUIT: {
            validation: "cuit",
            type: "string",
        },
        // ----- OTROS DATOS -----
        DNI: {
            type: "string",
            min: 7,
            max: 8,
            regex: /^[0-9]+$/
        },
        BIRTHDAY: {
            type: "date",
            mode: "age",
            min: 18,
            max: 80
        },
        PERCENTAGE: {
            type: "numeric",
            min: 1.00,
            max: 100.00,
            state: false
        },
        SUBMISSION_DATE: {
            type: "date",
            mode: "calendar",
            min: "2000-02-02"
        },
        PLAIN_PASSWORD: {
            validation: "password",
            type: "string",
            min: 3,
            max: 255,
            // regex estricta (pendiente): /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{4,}$/
            regex: /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{4,}$/
        },
        
        // --------------- PRODUCTO ---------------
        NOMBRE_PRODUCTO: {
            validation: "nombreProducto",
            type: "string",
            min: 3,
            max: 80
        },

        STOCK: {
            validation: "stock",
            type: "numeric",
            min: 0,
            max: 999999
        },

        STOCK_MIN: {
            validation: "stockMin",
            type: "numeric",
            min: 0,
            max: 999999
        },

        PRECIO: {
            validation: "precio",
            type: "numeric",
            min: 0.01,
            max: 999999999
        },

        CONTENIDO: {
            validation: "contenido",
            type: "numeric",
            min: 0.01,
            max: 999999
        },

        CATEGORIA: {
            validation: "categoria",
            type: "list"
        },

        MARCA: {
            validation: "marca",
            type: "list"
        },

        UNIDAD_MEDIDA: {
            validation: "unidadMedida",
            type: "list"
        },

        DESCRIPCION: {
            validation: "descripcion",
            type: "string",
            min: 0,
            max: 500
        }
        
    }

}


