class FormularioMarca extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";
        this._modoEdicion = false;
        this._marcaId = null;
    }

    connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        this.render();
    }

    setModoEdicion(marca) {
        this._modoEdicion = true;
        this._marcaId = marca.id;
        this.render();

        this.shadowRoot.querySelector("#nombre").value = marca.nombre;
        this.shadowRoot.querySelector("#activo").checked = marca.activo;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .form-marca {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                label {
                    font-size: .85rem;
                    font-weight: 600;
                    display: block;
                    margin-bottom: .3rem;
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

                ${this._modoEdicion ? `
                    <div class="box-activo">
                        <input type="checkbox" id="activo">
                        <label style="margin:0">Marca activa</label>
                    </div>
                ` : ""}

                <div class="acciones">
                    <button type="button" id="btnCancelar">Cancelar</button>
                    <button type="button" id="btnGuardar">${this._modoEdicion ? "Guardar cambios" : "Crear marca"}</button>
                </div>
            </div>
        `;

        this.shadowRoot.querySelector("#btnCancelar").addEventListener("click", () => {
            this.closest("modal-component")?.remove();
        });

        this.shadowRoot.querySelector("#btnGuardar").addEventListener("click", () => this.guardar());
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
            body.activo = this.shadowRoot.querySelector("#activo").checked;
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