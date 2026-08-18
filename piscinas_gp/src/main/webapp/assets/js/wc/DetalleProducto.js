class DetalleProducto extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._producto = null;
    }

    set producto(valor) {
        this._producto = valor;
        this.render();
    }

    get producto() {
        return this._producto;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (!this._producto) {
            this.shadowRoot.innerHTML = "";
            return;
        }

        const p = this._producto;
        const estado = p.stock === 0 ? "Sin stock" : (p.stock <= p.umbralStock ? "Stock bajo" : "Disponible");

        this.shadowRoot.innerHTML = `
            <style>
                .detalle {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                .grid-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .campo {
                    display: flex;
                    flex-direction: column;
                    gap: .25rem;
                }

                .campo.full-width {
                    grid-column: 1 / -1;
                }

                .campo label {
                    font-size: .75rem;
                    text-transform: uppercase;
                    color: rgba(255,255,255,.6);
                }

                .campo span {
                    font-size: 1rem;
                    color: white;
                    letter-spacing: normal;
                    font-weight: 400;
                }

                .acciones {
                    display: flex;
                    justify-content: flex-end;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255,255,255,.2);
                }

                .btn-editar {
                    background: #37A4FF;
                    color: white;
                    border: none;
                    padding: .6rem 1.6rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: .2s;
                }

                .btn-editar:hover {
                    background: #2398FB;
                }
            </style>

            <div class="detalle">
                <div class="grid-info">
                    <div class="campo">
                        <label>Categoría</label>
                        <span>${p.categoriaProducto.nombre}</span>
                    </div>
                    <div class="campo">
                        <label>Marca</label>
                        <span>${p.marcaProducto.nombre}</span>
                    </div>
                    <div class="campo">
                        <label>Precio</label>
                        <span>$${Number(p.precioActual).toLocaleString("es-AR")}</span>
                    </div>
                    <div class="campo">
                        <label>Contenido</label>
                        <span>${p.contenido} ${p.unidadMedida.abreviatura}</span>
                    </div>
                    <div class="campo">
                        <label>Stock</label>
                        <span>${p.stock} (${estado})</span>
                    </div>
                    <div class="campo">
                        <label>Stock mínimo</label>
                        <span>${p.umbralStock}</span>
                    </div>
                    <div class="campo full-width">
                        <label>Descripción</label>
                        <span>${p.descripcion || "Sin descripción"}</span>
                    </div>
                </div>

                <div class="acciones">
                    <button class="btn-editar">Editar producto</button>
                </div>
            </div>
        `;

        this.shadowRoot.querySelector(".btn-editar").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("editar-producto", {
                detail: this._producto,
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define("detalle-producto", DetalleProducto);

