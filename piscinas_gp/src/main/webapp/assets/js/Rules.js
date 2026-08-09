export default class Rules {
        
    static provisions = {
        NAME: {
            type: "string",
            min: 3,
            max: 80,
            regex: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/
        },
        LAST_NAME: {
            type: "string",
            min: 3,
            max: 50,
            regex: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/
        },
        DNI: {
            type: "string",
            min: 7,
            max: 8,
            regex: /^[0-9]+$/
        },
        EMAIL: {
            type: "string",
            min: 10,
            max: 30,
            regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
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
            type: "string"
        },

        MARCA: {
            validation: "marca",
            type: "string"
        },

        UNIDAD_MEDIDA: {
            validation: "unidadMedida",
            type: "string"
        },

        DESCRIPCION: {
            validation: "descripcion",
            type: "string",
            min: 0,
            max: 500
        }
        
    }

}


