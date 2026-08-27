import Rules from '../../Rules.js';
import SetValidator from '../../SetValidator.js';

class FormularioCliente extends HTMLElement {
    
    constructor() {
        super();
        this.attachShadow({mode: "open"});
        this._modo = 'crear'; // 'crear' o 'editar'
        this._clienteId = null;
        this._clienteData = null;
    }
    
    // Método para configurar el formulario en modo edición
    setModoEdicion(cliente) {
        this._modo = 'editar';
        this._clienteId = cliente.id;
        this._clienteData = cliente;
        
        // Esperar a que el DOM esté listo para cargar los datos
        if (this.shadowRoot.querySelector('form')) {
            this.cargarDatosCliente();
        }
    }
    
    // Método para cargar datos del cliente en el formulario
    /*cargarDatosCliente() {
        if (!this._clienteData) return;
        
        const c = this._clienteData;
        
        // Cargar campos del formulario
        const campos = {
            '#nombreProducto': p.nombre,
            '#stock': p.stock,
            '#stockMin': p.umbralStock,
            '#precio': p.precioActual,
            '#contenido': p.contenido,
            '#descripcion': p.descripcion || '',
            '#categoria': p.categoriaProducto?.id,
            '#marca': p.marcaProducto?.id,
            '#uniMedida': p.unidadMedida?.id
        };
        
        Object.entries(campos).forEach(([selector, valor]) => {
            const input = this.shadowRoot.querySelector(selector);
            if (input && valor !== undefined && valor !== null) {
                input.value = valor;
            }
        });
        
        // Actualizar el título del formulario
        const titulo = this.shadowRoot.querySelector('h3');
        if (titulo) {
            titulo.textContent = this._modo === 'editar' 
                ? `EDITANDO: ${p.nombre}` 
                : 'INFORMACIÓN DEL CLIENTE';
        }
        
        // Cambiar texto del botón
        const btnSubmit = this.shadowRoot.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.textContent = this._modo === 'editar' 
                ? 'Actualizar cliente' 
                : 'Guardar cliente';
        }
    }*/
    
    async connectedCallback() {
        console.log("hola entré");
        this.render();
        console.log("hola pasó render");
        await this.cargarSelects();
        console.log("hola ya cargó los select");
        
        // Si hay datos del producto, cargarlos después de que los selects estén listos
        if (this._modo === 'editar' && this._clienteData) {
            this.cargarDatosCliente();
        }
        
        this.setupListeners();
        console.log("hola pasó setup");
    }
    
    setupListeners() {
        const form = this.shadowRoot.querySelector("form");
        const btnVolver = this.shadowRoot.querySelector(".btn-volver");
        
        const fields = [
            // ----- DATOS DE CLIENTE PARTICULAR -----
            { input: "#nombre", rule: Rules.provisions.NOMBRE },
            { input: "#apellido", rule: Rules.provisions.APELLIDO },
            { input: "#cuil", rule: Rules.provisions.CUIL },
            { input: "#email", rule: Rules.provisions.EMAIL },
            { input: "#telefono", rule: Rules.provisions.TELEFONO },
            { input: "#calleYNumero", rule: Rules.provisions.CALLE_Y_NUMERO },
            { input: "#ciudad", rule: Rules.provisions.CIUDAD },
            { input: "#provincia", rule: Rules.provisions.PROVINCIA },
            { input: "#observaciones", rule: Rules.provisions.OBSERVACIONES }

            
  
        ];
        
        fields.forEach(field => {
            const input = this.shadowRoot.querySelector(field.input);

            input?.addEventListener("input", () => {
                const error = SetValidator.validate(
                    input.value,
                    field.rule
                );

                this.checkResult(input, error);
            });

            input?.addEventListener("change", () => {
                const error = SetValidator.validate(
                    input.value,
                    field.rule
                );

                this.checkResult(input, error);
            });

        });
        
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            console.log("submit presionado");
            
            const esValido = this.validarFormulario();

            if (!esValido) {
                return;
            }

            const cliente = this.obtenerDatosDelForm();

            if (this._modo === 'editar') {
                // Agregar ID para la actualización
                cliente.id = this._clienteId;
                await this.actualizarCliente(cliente);
            } else {
                await this.registrarCliente(cliente);
            }
        });
        
        btnVolver.addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("cerrar-modal", {
                bubbles: true,
                composed: true
            }));
        });
    }
}