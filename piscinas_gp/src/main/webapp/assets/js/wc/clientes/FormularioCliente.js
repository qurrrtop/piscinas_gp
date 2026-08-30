import Rules from '../../Rules.js';
import SetValidator from '../../SetValidator.js';


class FormularioCliente extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._modo = 'crear';
        this._clienteId = null;
        this._clienteData = null;
        this._tipo = 'particular';
        this.basePath = "";
    }

    setModoEdicion(cliente) {
        this._modo = 'editar';
        this._clienteId = cliente.id;
        this._clienteData = cliente;

        if (this.shadowRoot.querySelector('form')) {
            this.cargarDatosCliente();
        }
    }

    async connectedCallback() {
        this.basePath = this.getAttribute('base-path') || "";
        this.render();
        await this.cargarLocalidades();
        this.setupListeners();

        if (this._modo === 'editar' && this._clienteData) {
            this.cargarDatosCliente();
        }
    }
    
    async cargarLocalidades() {
        try {
            this._localidades = await fetch("localidades").then(r => r.json());
            const datalist = this.shadowRoot.querySelector("#listaLocalidades");
            datalist.innerHTML = this._localidades
                .map(loc => `<option value="${loc.nombre}"></option>`)
                .join("");
        } catch (error) {
            console.error("Error al cargar localidades:", error);
        }
    }

    cargarDatosCliente() {
        if (!this._clienteData) return;

        const c = this._clienteData;
        this._tipo = c.tipo === 'Empresa' ? 'empresa' : 'particular';

        this.seleccionarTarjetaTipo(this._tipo);
        this.deshabilitarSeleccionTipo();
        this.toggleSeccionesPorTipo();

        const campos = {
            '#email': c.email,
            '#telefono': c.telefono,
            '#calleYNumero': c.calleYnumero,
            '#localidad': c.localidadNombre,
            '#observaciones': c.observaciones || '',
            '#nombre': c.nombre,
            '#apellido': c.apellido,
            '#cuil': c.cuil,
            '#razonSocial': c.razonSocial,
            '#nombreFantasia': c.nombreFantasia,
            '#rubro': c.rubro,
            '#cuit': c.cuit
        };

        Object.entries(campos).forEach(([selector, valor]) => {
            const input = this.shadowRoot.querySelector(selector);
            if (input && valor !== undefined && valor !== null) {
                input.value = valor;
            }
        });

        const titulo = this.shadowRoot.querySelector('h3');
        if (titulo) {
            titulo.textContent = `EDITANDO: ${c.nombreCompleto || c.nombre || c.razonSocial}`;
        }

        const btnSubmit = this.shadowRoot.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.textContent = 'Actualizar cliente';
        }
    }

    seleccionarTarjetaTipo(tipo) {
        this._tipo = tipo;
        this.shadowRoot.querySelectorAll('.tarjeta-tipo').forEach(tarjeta => {
            tarjeta.classList.toggle('seleccionada', tarjeta.dataset.tipo === tipo);
        });
    }

    deshabilitarSeleccionTipo() {
        this.shadowRoot.querySelectorAll('.tarjeta-tipo').forEach(tarjeta => {
            tarjeta.classList.add('deshabilitada');
        });
    }

    toggleSeccionesPorTipo() {
        const esParticular = this._tipo === 'particular';
        this.shadowRoot.querySelector('.seccion-particular').style.display = esParticular ? 'grid' : 'none';
        this.shadowRoot.querySelector('.seccion-empresa').style.display = esParticular ? 'none' : 'grid';
    }

    setupListeners() {
        const form = this.shadowRoot.querySelector("form");
        const btnVolver = this.shadowRoot.querySelector(".btn-volver");

        const fields = [
            { input: "#email", rule: Rules.provisions.EMAIL },
            { input: "#telefono", rule: Rules.provisions.TELEFONO },
            { input: "#calleYNumero", rule: Rules.provisions.CALLE_Y_NUMERO },
            { input: "#observaciones", rule: Rules.provisions.OBSERVACIONES, optional: true },
            { input: "#nombre", rule: Rules.provisions.NOMBRE },
            { input: "#apellido", rule: Rules.provisions.APELLIDO },
            { input: "#cuil", rule: Rules.provisions.CUIL },
            { input: "#razonSocial", rule: Rules.provisions.RAZON_SOCIAL },
            { input: "#nombreFantasia", rule: Rules.provisions.NOMBRE_FANTASIA },
            { input: "#rubro", rule: Rules.provisions.RUBRO },
            { input: "#cuit", rule: Rules.provisions.CUIT }
        ];

        fields.forEach(field => {
            const input = this.shadowRoot.querySelector(field.input);

            input?.addEventListener("input", () => {
                if (field.optional && input.value === "") {
                    this.checkResult(input, null);
                    return;
                }
                const error = SetValidator.validate(input.value, field.rule);
                this.checkResult(input, error);
            });

            input?.addEventListener("change", () => {
                if (field.optional && input.value === "") {
                    this.checkResult(input, null);
                    return;
                }
                const error = SetValidator.validate(input.value, field.rule);
                this.checkResult(input, error);
            });
        });

        this.shadowRoot.querySelectorAll('.tarjeta-tipo').forEach(tarjeta => {
            tarjeta.addEventListener('click', () => {
                if (tarjeta.classList.contains('deshabilitada')) return;
                this.seleccionarTarjetaTipo(tarjeta.dataset.tipo);
                this.toggleSeccionesPorTipo();
            });
        });

        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const esValido = this.validarFormulario();
            if (!esValido) return;

            const cliente = this.obtenerDatosDelForm();

            if (this._modo === 'editar') {
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

    validarFormulario() {
        let formularioValido = true;

        const camposComunes = [
            { input: "#email", rule: Rules.provisions.EMAIL },
            { input: "#telefono", rule: Rules.provisions.TELEFONO },
            { input: "#calleYNumero", rule: Rules.provisions.CALLE_Y_NUMERO },
            { input: "#observaciones", rule: Rules.provisions.OBSERVACIONES, optional: true }
        ];

        const camposParticular = [
            { input: "#nombre", rule: Rules.provisions.NOMBRE },
            { input: "#apellido", rule: Rules.provisions.APELLIDO },
            { input: "#cuil", rule: Rules.provisions.CUIL }
        ];

        const camposEmpresa = [
            { input: "#razonSocial", rule: Rules.provisions.RAZON_SOCIAL },
            { input: "#nombreFantasia", rule: Rules.provisions.NOMBRE_FANTASIA },
            { input: "#rubro", rule: Rules.provisions.RUBRO },
            { input: "#cuit", rule: Rules.provisions.CUIT }
        ];

        const camposAValidar = this._tipo === 'particular'
            ? [...camposComunes, ...camposParticular]
            : [...camposComunes, ...camposEmpresa];

        camposAValidar.forEach(field => {
            const input = this.shadowRoot.querySelector(field.input);

            if (field.optional && input.value === "") {
                this.checkResult(input, null);
                return;
            }

            const error = SetValidator.validate(input.value, field.rule);
            this.checkResult(input, error);

            if (error) {
                formularioValido = false;
            }
        });
        
        const inputLocalidad = this.shadowRoot.querySelector("#localidad");
        const localidadValida = this._localidades.some(loc => loc.nombre === inputLocalidad.value);

        if (!localidadValida) {
            this.checkResult(inputLocalidad, "Debe seleccionar una localidad de la lista");
            formularioValido = false;
        }

        return formularioValido;
    }

    checkResult(inputElement, error) {
        const container = inputElement.closest(".form-group");
        if (!container) return;
        const errorMessage = container.querySelector(".error-message");
        errorMessage.textContent = error || "";
    }

    obtenerDatosDelForm() {
        const nombreLocalidad = this.shadowRoot.querySelector("#localidad").value;
        const localidadEncontrada = this._localidades.find(loc => loc.nombre === nombreLocalidad);

        const base = {
            tipo: this._tipo === 'particular' ? 'Particular' : 'Empresa',
            email: this.shadowRoot.querySelector("#email").value,
            telefono: this.shadowRoot.querySelector("#telefono").value,
            calleYnumero: this.shadowRoot.querySelector("#calleYNumero").value,
            localidadId: localidadEncontrada ? localidadEncontrada.id : null,
            observaciones: this.shadowRoot.querySelector("#observaciones").value
        };

        if (this._tipo === 'particular') {
            return {
                ...base,
                nombre: this.shadowRoot.querySelector("#nombre").value,
                apellido: this.shadowRoot.querySelector("#apellido").value,
                cuil: this.shadowRoot.querySelector("#cuil").value
            };
        }

        return {
            ...base,
            razonSocial: this.shadowRoot.querySelector("#razonSocial").value,
            nombreFantasia: this.shadowRoot.querySelector("#nombreFantasia").value,
            rubro: this.shadowRoot.querySelector("#rubro").value,
            cuit: this.shadowRoot.querySelector("#cuit").value
        };
    }

    async registrarCliente(cliente) {
        try {
            const response = await fetch("clientes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cliente)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al registrar el cliente");
            }

            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: "Cliente creado correctamente", tipo: "exito" }
            }));

            this.limpiarFormulario();

            this.dispatchEvent(new CustomEvent("cliente-guardado", { bubbles: true, composed: true }));
            this.dispatchEvent(new CustomEvent("cerrar-modal", { bubbles: true, composed: true }));

        } catch (error) {
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: error.message, tipo: "error" }
            }));
        }
    }

    async actualizarCliente(cliente) {
        try {
            const response = await fetch("clientes", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cliente)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al actualizar el cliente");
            }

            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: "Cliente actualizado correctamente", tipo: "exito" }
            }));

            this.dispatchEvent(new CustomEvent("cliente-guardado", { bubbles: true, composed: true }));
            this.dispatchEvent(new CustomEvent("cerrar-modal", { bubbles: true, composed: true }));

        } catch (error) {
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: error.message, tipo: "error" }
            }));
        }
    }

    limpiarFormulario() {
        const form = this.shadowRoot.querySelector("form");
        form.reset();
        this.shadowRoot.querySelectorAll(".error-message").forEach(el => el.textContent = "");
        this.seleccionarTarjetaTipo('particular');
        this.toggleSeccionesPorTipo();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.2rem;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                h3 {
                    margin: 0;
                    font-size: .9rem;
                    font-weight: 600;
                    color: #B8D7FF;
                    text-transform: uppercase;
                    text-align: center;
                }
        
                .left {
                    text-align: left;
                    padding-bottom: .5rem;
                }

                .selector-tipo {
                    width: 90%;
                    margin: .5rem auto .8rem auto;
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.2rem;
                }

                .tarjeta-tipo {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: .5rem;
                    padding: .8rem 1rem;
                    border-radius: 10px;
                    border: 2px solid rgba(255,255,255,.25);
                    background: rgba(255,255,255,.04);
                    cursor: pointer;
                    transition: .2s;
                }

                .tarjeta-tipo:hover:not(.deshabilitada) {
                    border-color: rgba(55,164,255,.9);
                    background: rgba(55,164,255,.08);
                }

                .tarjeta-tipo.seleccionada {
                    border-color: #0CE0F5;
                    background: rgba(55,164,255,.15);
                }

                .tarjeta-tipo.deshabilitada {
                    cursor: default;
                    opacity: .7;
                }

                .tarjeta-tipo img {
                    width: 2rem;
                }

                .tarjeta-tipo .titulo-tipo {
                    font-size: 1.05rem;
                    font-weight: 700;
                }

                .tarjeta-tipo .subtitulo-tipo {
                    font-size: .8rem;
                    color: rgba(255,255,255,.65);
                    font-weight: 600;
                }

                .seccion {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    padding-bottom: 1rem;
                }
        
                .seccion h3 {
                    border-bottom: 1px solid rgba(196, 196, 196, .5);
                }

                .full-width {
                    grid-column: 1 / -1;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: .45rem;
                }

                label {
                    font-size: .8rem;
                    font-weight: 600;
                }

                input, textarea {
                    padding: .5rem .7rem;
                    outline: none;
                    background-color: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(196, 196, 196, 1);
                    border-radius: 5px;
                    color: white;
                    font-family: inherit;
                }
        
                input::placeholder, textarea::placeholder {
                    color: rgba(196, 196, 196, 1);
                }

                .error-message {
                    color: #ff6b6b;
                    font-size: .75rem;
                    min-height: 1rem;
                }

                .required {
                    color: #ff4d4d;
                    font-weight: bold;
                }

                .actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(196, 196, 196, .5);
                }

                .actions button:first-child {
                    background: transparent;
                    color: white;
                    border: 1px solid rgba(255,255,255,.25);
                    padding: .6rem 1.6rem;
                    border-radius: 8px;
                    cursor: pointer;
                }

                .actions button:last-child {
                    background: #37A4FF;
                    color: white;
                    border: none;
                    padding: .6rem 1.8rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }
            </style>

            <form>
                <h3>Tipo de cliente</h3>

                <div class="selector-tipo">
                    <div class="tarjeta-tipo seleccionada" data-tipo="particular">
                        <img class="icono" src="${this.basePath}/assets/img/iconos/users.svg">
                        <span class="titulo-tipo">Particular</span>
                        <span class="subtitulo-tipo">Persona física - CUIL</span>
                    </div>
                    <div class="tarjeta-tipo" data-tipo="empresa">
                        <img class="icono" src="${this.basePath}/assets/img/iconos/building-2.svg">
                        <span class="titulo-tipo">Empresa</span>
                        <span class="subtitulo-tipo">Persona jurídica - CUIT</span>
                    </div>
                </div>

                <div class="seccion seccion-particular">
                    <h3 class="full-width left">Datos personales</h3>
                    
                    <div class="form-group">
                        <label>NOMBRE <span class="required">*</span></label>
                        <input type="text" name="nombre" id="nombre" placeholder="Ej: Juan">
                        <small class="error-message"></small>
                    </div>
                    <div class="form-group">
                        <label>APELLIDO <span class="required">*</span></label>
                        <input type="text" name="apellido" id="apellido" placeholder="Ej: Díaz">
                        <small class="error-message"></small>
                    </div>
                    <div class="form-group full-width">
                        <label>CUIL <span class="required">*</span></label>
                        <input type="text" name="cuil" id="cuil" placeholder="27-12345678-9">
                        <small class="error-message"></small>
                    </div>
                </div>

                <div class="seccion seccion-empresa" style="display:none">
                    <h3 class="full-width left">Datos de la empresa</h3>
                    
                    <div class="form-group">
                        <label>RAZÓN SOCIAL <span class="required">*</span></label>
                        <input type="text" name="razonSocial" id="razonSocial" 
                                placeholder="Ej: Piscinas del Norte S.R.L.">
                        <small class="error-message"></small>
                    </div>
                    <div class="form-group">
                        <label>NOMBRE DE FANTASÍA</label>
                        <input type="text" name="nombreFantasia" id="nombreFantasia" 
                                placeholder="Ej: PisciNorte">
                        <small class="error-message"></small>
                    </div>
                    <div class="form-group">
                        <label>RUBRO <span class="required">*</span></label>
                        <input type="text" name="rubro" id="rubro"
                                placeholder="Ej: Construcción de piscinas">
                        <small class="error-message"></small>
                    </div>
                    <div class="form-group">
                        <label>CUIT <span class="required">*</span></label>
                        <input type="text" name="cuit" id="cuit" placeholder="30-12345678-9">
                        <small class="error-message"></small>
                    </div>
                </div>

                <div class="seccion">
                    <h3 class="full-width left">Datos de contacto</h3>
        
                    <div class="form-group">
                        <label>EMAIL</label>
                        <input type="email" name="email" id="email" placeholder="cliente@ejemplo.com">
                        <small class="error-message"></small>
                    </div>

                    <div class="form-group">
                        <label>TELÉFONO</label>
                        <input type="text" name="telefono" id="telefono" placeholder="Ej: 3794123456">
                        <small class="error-message"></small>
                    </div>

                    <div class="form-group">
                        <label>CALLE Y NÚMERO</label>
                        <input type="text" name="calleYNumero" id="calleYNumero" placeholder="Ej: San Martín 1234">
                        <small class="error-message"></small>
                    </div>

                    <div class="form-group">
                        <label>LOCALIDAD</label>
                        <input type="text" name="localidad" id="localidad" list="listaLocalidades" placeholder="Escribí para buscar...">
                        <datalist id="listaLocalidades"></datalist>
                        <small class="error-message"></small>
                    </div>

                    <div class="form-group full-width">
                        <label>OBSERVACIONES</label>
                        <textarea name="observaciones" id="observaciones" rows="3" 
                                    placeholder="Preferencias, acuerdos especiales, notas del equipo..."
                        ></textarea>
                        <small class="error-message"></small>
                    </div>
                </div>

                <div class="actions">
                    <button class="btn-volver" type="button">Volver</button>
                    <button type="submit">Guardar cliente</button>
                </div>
            </form>
        `;
    }
}

customElements.define("formulario-cliente", FormularioCliente);