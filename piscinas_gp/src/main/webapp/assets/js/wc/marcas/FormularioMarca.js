class FormularioMarca extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";
        this._modoEdicion = false;
        this._marcaId = null;
        this._marca = null;
    }

    connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        this.render();
    }

    setModoEdicion(marca) {
        this._modoEdicion = true;
        this._marcaId = marca.id;
        this._marca = marca;
        this.render();

        this.shadowRoot.querySelector("#nombre").value = marca.nombre;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                *,
                *::before,
                *::after {
                    box-sizing: border-box;
                }
            
                .form-marca {
                    display: flex;
                    flex-direction: column;
                    gap: 1.2rem;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    width: 100%;
                }

                label {
                    font-size: .85rem;
                    font-weight: 600;
                    display: block;
                    margin-bottom: .6rem;
                }

                input[type="text"] {
                    width: 100%;
                    padding: .6rem .8rem;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,.25);
                    background: rgba(255,255,255,.06);
                    color: white;
                    font-size: .92rem;
                }
        
                input[type="text"]::placeholder {
                    color: rgba(255,255,255,.5);
                }
        
                input[type="text"]:focus {
                    outline: none;
                    border-color: rgba(70, 214, 242,.8);
                }

                .box-activo {
                    display: flex;
                    align-items: center;
                    gap: .5rem;
                }

                .acciones {
                    display: flex;
                    justify-content: flex-end;
                    gap: .7rem;
                }

                .acciones button {
                    padding: .6rem 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                    border: 1px solid rgba(255,255,255,.25);
                }
        
                .btn {
                    border: 1px solid rgba(255,255,255,.25);
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                    padding: .6rem 1.2rem;
                }

                .btn-estado {
                    background: ${this._marca?.activo
                        ? "rgba(222, 31, 31, .7)"
                        : "rgba(45, 166, 36, .7)"};
                    color: white;
                }

                .btn-estado:hover {
                    background: ${this._marca?.activo
                        ? "rgba(222, 31, 31, .6)"
                        : "rgba(45, 166, 36, .6)"};
                }

                #btnCancelar { background: transparent; color: white; }
                #btnCancelar:hover { background: rgba(255,255,255,.06); }
                #btnGuardar { background: #37E0E0; color: #05448D; border: none; }
                #btnGuardar:hover { background: rgba(55,224,224,.85); }
            </style>

            <div class="form-marca">
                <div>
                    <label>Nombre</label>
                    <input type="text" id="nombre" placeholder="Ej: Vulcano">
                </div>

                <div class="acciones">
                    <button type="button" id="btnCancelar">Cancelar</button>
        
                    ${this._modoEdicion ? `
                        <button type="button" class="btn btn-estado">
                            ${this._marca.activo ? "Dar de baja" : "Reactivar"}
                        </button>
                    ` : ""}
        
                    <button type="button" id="btnGuardar">${this._modoEdicion ? "Guardar cambios" : "Crear marca"}</button>
                </div>
            </div>
        `;

        this.shadowRoot.querySelector("#btnCancelar").addEventListener("click", () => {
            this.closest("modal-component")?.remove();
        });

        this.shadowRoot.querySelector("#btnGuardar").addEventListener("click", () => this.guardar());
        
        if (this._modoEdicion) { this.shadowRoot.querySelector(".btn-estado")?.addEventListener("click", () => this.cambiarEstado());}
    }
    
    async cambiarEstado() {
        try {
            const url = this._marca.activo ? `marcas/${this._marca.id}` : `marcas/${this._marca.id}/reactivar`;

            const method = this._marca.activo ? "DELETE" : "POST";

            const response = await fetch(url, { method });

            const data = await response.json();

            if (!response.ok) {
                throw new Error( data.error || "Error al cambiar el estado de la marca" );
            }

            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: {
                    mensaje: data.mensaje || "Operación exitosa",
                    tipo: "exito"
                }
            }));

            document.dispatchEvent( new CustomEvent("marca-guardada"));

            const modal = this.closest("modal-component") || document.querySelector("modal-component");

            if (modal) { modal.remove(); }

        } catch (error) {
            console.error("Error al cambiar estado de la marca:", error);
            
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: {
                    mensaje: error.message,
                    tipo: "error"
                }
            }));
        }
    }

    async guardar() {
        const nombre = this.shadowRoot.querySelector("#nombre").value.trim();

        if (!nombre) {
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: "El nombre de la marca es obligatorio", tipo: "advertencia" }
            }));
            return;
        }

        const body = { nombre };
        let metodo = "POST";
        let url = "marcas";

        if (this._modoEdicion) {
            body.id = this._marcaId;
            metodo = "PUT";
        }

        try {
            const res = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (!res.ok) {
                document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                    detail: { mensaje: data.error || "No se pudo guardar la marca", tipo: "error" }
                }));
                return;
            }

            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: this._modoEdicion ? "Marca actualizada correctamente" : "Marca creada correctamente", tipo: "exito" }
            }));
            document.dispatchEvent(new CustomEvent("marca-guardada"));

            this.closest("modal-component")?.remove();

        } catch (error) {
            console.error("Error al guardar la marca:", error);
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: "Ocurrió un error al guardar la marca", tipo: "error" }
            }));
        }
    }
}

customElements.define("formulario-marca", FormularioMarca);