import Rules from '../../Rules.js';
import SetValidator from '../../SetValidator.js';

class MiCuenta extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";
        this._guardando = false;
        this._generando = false;
    }

    connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        this.render();
        this.setupListeners();
    }

    validarCampo(selector) {
        const input = this.shadowRoot.querySelector(selector);
        const valor = input.value;
        let error = null;

        if (selector === "#passwordActual") {
            error = valor === "" ? "Campo vacio" : null;

        } else if (selector === "#passwordNueva") {
            error = SetValidator.validate(valor, Rules.provisions.NUEVA_PASSWORD);

        } else if (selector === "#passwordConfirmar") {
            if (valor === "") error = "Campo vacio";
            else if (valor !== this.shadowRoot.querySelector("#passwordNueva").value) error = "Las contraseñas no coinciden";
        }

        input.closest(".campo").querySelector(".error").textContent = error || "";
        return !error;
    }

    setupListeners() {
        const campos = ["#passwordActual", "#passwordNueva", "#passwordConfirmar"];

        campos.forEach(selector => {
            this.shadowRoot.querySelector(selector).addEventListener("input", () => {
                this.validarCampo(selector);
                // si ya escribió la confirmación, se revisa de nuevo al cambiar la nueva
                if (selector === "#passwordNueva" && this.shadowRoot.querySelector("#passwordConfirmar").value !== "") {
                    this.validarCampo("#passwordConfirmar");
                }
            });
        });

        this.shadowRoot.querySelector("#mostrar").addEventListener("change", (e) => {
            campos.forEach(selector => {
                this.shadowRoot.querySelector(selector).type = e.target.checked ? "text" : "password";
            });
        });

        this.shadowRoot.querySelector("#btnCancelar").addEventListener("click", () => {
            this.closest("modal-component")?.remove();
        });

        this.shadowRoot.querySelector("#formPassword").addEventListener("submit", (e) => {
            e.preventDefault();
            this.cambiarPassword(campos);
        });

        this.shadowRoot.querySelector("#formCodigo").addEventListener("submit", (e) => {
            e.preventDefault();
            this.generarCodigo();
        });

        this.shadowRoot.querySelector("#btnCopiar").addEventListener("click", () => this.copiarCodigo());
    }

    notificar(mensaje, tipo) {
        document.dispatchEvent(new CustomEvent("mostrar-notificacion", { detail: { mensaje, tipo } }));
    }

    // ---------- cambiar contraseña ----------

    async cambiarPassword(campos) {
        if (this._guardando) return;

        // se validan todos (sin cortar en el primero) para mostrar todos los errores juntos
        const validos = campos.map(selector => this.validarCampo(selector));
        if (validos.includes(false)) return;

        const boton = this.shadowRoot.querySelector("#btnGuardar");
        this._guardando = true;
        boton.disabled = true;
        boton.textContent = "Guardando…";

        try {
            const respuesta = await fetch(`${this.basePath}/auth/cambiar-password`, {
                method: "POST",
                body: new URLSearchParams({
                    passwordActual: this.shadowRoot.querySelector("#passwordActual").value,
                    passwordNueva: this.shadowRoot.querySelector("#passwordNueva").value
                })
            });
            const data = await respuesta.json();

            if (respuesta.status === 401) {
                window.location.href = `${this.basePath}/auth/login`;
                return;
            }

            if (!respuesta.ok) {
                throw new Error(data.error || "No se pudo cambiar la contraseña");
            }

            this.notificar(data.mensaje || "Contraseña actualizada correctamente", "exito");
            this.closest("modal-component")?.remove();

        } catch (error) {
            this.notificar(error.message, "error");
            boton.disabled = false;
            boton.textContent = "Cambiar contraseña";

        } finally {
            this._guardando = false;
        }
    }

    // ---------- código de recuperación ----------

    async generarCodigo() {
        if (this._generando) return;

        const input = this.shadowRoot.querySelector("#passwordCodigo");
        const error = this.shadowRoot.querySelector("#errorCodigo");
        const boton = this.shadowRoot.querySelector("#btnGenerar");
        const resultado = this.shadowRoot.querySelector("#resultadoCodigo");

        if (input.value === "") {
            error.textContent = "Ingrese su contraseña actual";
            return;
        }
        error.textContent = "";

        this._generando = true;
        boton.disabled = true;
        boton.textContent = "Generando…";

        try {
            const respuesta = await fetch(`${this.basePath}/auth/codigo-recuperacion`, {
                method: "POST",
                body: new URLSearchParams({ passwordActual: input.value })
            });
            const data = await respuesta.json();

            if (respuesta.status === 401) {
                window.location.href = `${this.basePath}/auth/login`;
                return;
            }

            if (!respuesta.ok) {
                throw new Error(data.error || "No se pudo generar el código");
            }

            input.value = "";
            this.shadowRoot.querySelector("#codigoTexto").textContent = data.codigo;
            resultado.classList.remove("oculto");

        } catch (e) {
            error.textContent = e.message;

        } finally {
            this._generando = false;
            boton.disabled = false;
            boton.textContent = resultado.classList.contains("oculto") ? "Generar código" : "Generar otro código";
        }
    }

    async copiarCodigo() {
        const codigo = this.shadowRoot.querySelector("#codigoTexto").textContent;

        try {
            await navigator.clipboard.writeText(codigo);
            this.notificar("Código copiado", "exito");
        } catch (error) {
            this.notificar("No se pudo copiar, anotalo a mano", "advertencia");
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                *, *::before, *::after { box-sizing: border-box; }

                form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                h3 {
                    margin: 0;
                    font-size: .9rem;
                    font-weight: 600;
                    color: #B8D7FF;
                    text-transform: uppercase;
                }

                label { display: block; margin-bottom: .4rem; font-size: .85rem; font-weight: 600; }

                input[type="password"], input[type="text"] {
                    width: 100%;
                    padding: .6rem .8rem;
                    border-radius: 8px;
                    border: 1px solid rgba(196, 196, 196, 1);
                    background: rgba(255,255,255,.15);
                    color: white;
                    font-size: .92rem;
                    outline: none;
                }

                input:focus { border-color: rgba(70, 214, 242, .8); }

                .error { min-height: 1rem; margin-top: .3rem; color: #ff6b6b; font-size: .75rem; }
                .ayuda { margin: 0; font-size: .78rem; color: rgba(255,255,255,.75); line-height: 1.4; }
                .mostrar { display: flex; align-items: center; gap: .5rem; font-size: .85rem; cursor: pointer; }

                .separador {
                    margin: 1.4rem 0;
                    border: none;
                    border-top: 1px solid rgba(196, 196, 196, .5);
                }

                .acciones {
                    display: flex;
                    justify-content: flex-end;
                    gap: .7rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(196, 196, 196, .5);
                }

                .acciones button {
                    padding: .6rem 1.4rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                    font-family: inherit;
                }

                #btnCancelar { background: transparent; color: white; border: 1px solid rgba(255,255,255,.25); }
                #btnCancelar:hover { background: rgba(255,255,255,.08); }
                #btnGuardar { background: #37E0E0; color: #05448D; border: none; }
                #btnGuardar:hover:not(:disabled) { background: rgba(55,224,224,.85); }
                #btnGuardar:disabled { opacity: .5; cursor: default; }

                #btnGenerar { background: transparent; color: #37E0E0; border: 1px solid #37E0E0; }
                #btnGenerar:hover:not(:disabled) { background: rgba(55,224,224,.15); }
                #btnGenerar:disabled { opacity: .5; cursor: default; }

                .oculto { display: none; }

                .resultado {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: .7rem;
                    padding: 1rem;
                    border-radius: 10px;
                    border: 1px dashed rgba(55,224,224,.7);
                    background: rgba(55,224,224,.08);
                }

                .codigo {
                    font-family: Consolas, "Courier New", monospace;
                    font-size: 1.4rem;
                    font-weight: 700;
                    letter-spacing: .12em;
                    user-select: all;
                }

                #btnCopiar {
                    padding: .4rem 1.1rem;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,.35);
                    background: transparent;
                    color: white;
                    font-family: inherit;
                    font-weight: 700;
                    cursor: pointer;
                }

                #btnCopiar:hover { background: rgba(255,255,255,.12); }
                .aviso { text-align: center; color: #FCD34D; }
            </style>

            <form id="formPassword">
                <h3>Cambiar contraseña</h3>

                <div class="campo">
                    <label for="passwordActual">Contraseña actual</label>
                    <input type="password" id="passwordActual" autocomplete="current-password">
                    <div class="error"></div>
                </div>

                <div class="campo">
                    <label for="passwordNueva">Contraseña nueva</label>
                    <input type="password" id="passwordNueva" autocomplete="new-password">
                    <div class="error"></div>
                </div>

                <div class="campo">
                    <label for="passwordConfirmar">Repetir contraseña nueva</label>
                    <input type="password" id="passwordConfirmar" autocomplete="new-password">
                    <div class="error"></div>
                </div>

                <p class="ayuda">Entre 8 y 72 caracteres, con mayúscula, minúscula y número. Solo se permiten letras, números y @ $ ! % * ? &</p>

                <label class="mostrar"><input type="checkbox" id="mostrar"> Mostrar contraseñas</label>

                <div class="acciones">
                    <button type="button" id="btnCancelar">Cerrar</button>
                    <button type="submit" id="btnGuardar">Cambiar contraseña</button>
                </div>
            </form>

            <hr class="separador">

            <form id="formCodigo">
                <h3>Código de recuperación</h3>

                <p class="ayuda">Sirve para recuperar el acceso si se olvida la contraseña. Se muestra una sola vez: anotalo y guardalo en un lugar seguro. Si ya generaste uno antes, este lo reemplaza y el anterior deja de funcionar.</p>

                <div class="campo">
                    <label for="passwordCodigo">Contraseña actual</label>
                    <input type="password" id="passwordCodigo" autocomplete="current-password">
                    <div class="error" id="errorCodigo"></div>
                </div>

                <div id="resultadoCodigo" class="resultado oculto">
                    <div class="codigo" id="codigoTexto"></div>
                    <button type="button" id="btnCopiar">Copiar</button>
                    <p class="ayuda aviso">Guardalo ahora: cuando cierres esta ventana no se vuelve a mostrar.</p>
                </div>

                <div class="acciones">
                    <button type="submit" id="btnGenerar">Generar código</button>
                </div>
            </form>
        `;
    }
}

customElements.define("mi-cuenta", MiCuenta);