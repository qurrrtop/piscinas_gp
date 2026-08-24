class DetalleProducto extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._producto = null;
    }

    static COLORES_CATEGORIA = {
        "Químico": "#4ADE80",
        "Repuesto": "#E39B00",
        "Accesorios de Instalación": "#E83FE5"
    };

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
        const colorCategoria = DetalleProducto.COLORES_CATEGORIA[p.categoriaProducto.nombre] || "#888888";

        this.shadowRoot.innerHTML = `
            <style>
                .detalle {
                    display: flex;
                    flex-direction: column;
                    gap: 1.4rem;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                .badge-categoria {
                    align-self: flex-start;
                    background: ${colorCategoria}44;
                    color: ${colorCategoria};
                    padding: .3rem .9rem;
                    border-radius: 20px;
                    font-size: .8rem;
                    font-weight: 700;
                }

                .fila-stats {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    padding-bottom: 1.2rem;
                    border-bottom: 1px solid rgba(196, 196, 196, .5);
                }

                .stat label,
                .campo label {
                    display: block;
                    font-size: .8rem;
                    font-weight: 600;
                    color: #B8D7FF;
                    text-transform: uppercase;
                    letter-spacing: .05em;
                    margin-bottom: .5rem;
                }

                .stat .valor-box,
                .campo .valor-box {
                    padding: .6rem .8rem;
                    background: rgba(255, 255, 255, .12);
                    border: 1px solid rgba(196, 196, 196, .4);
                    border-radius: 8px;
                    font-size: 1.1rem;
                    font-weight: 700;
                }

                .stat small {
                    display: block;
                    margin-top: .4rem;
                    font-size: .75rem;
                    color: rgba(255, 255, 255, .7);
                }

                .titulo-seccion {
                    font-size: .85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: .05em;
                    color: #B8D7FF;
                }
        
                .grid-info {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.2rem;
                }

                .campo .valor-box.texto-libre {
                    font-size: .95rem;
                    font-weight: 400;
                    line-height: 1.4;
                }

                .acciones {
                    display: flex;
                    justify-content: flex-end;
                }

                .btn-editar {
                    display: flex;
                    align-items: center;
                    gap: .4rem;
                    background: #37E0E0;
                    color: #05448D;
                    border: none;
                    padding: .65rem 1.6rem;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: .2s;
                }

                .btn-editar:hover {
                    background: #29C9C9;
                }
            </style>

            <div class="detalle">
                <span class="badge-categoria">${p.categoriaProducto.nombre}</span>

                <div class="fila-stats">
                    <div class="stat">
                        <label>Unidades en stock</label>
                        <div class="valor-box">${p.stock}</div>
                    </div>
                    <div class="stat">
                        <label>Stock mínimo (alerta)</label>
                        <div class="valor-box">${p.umbralStock}</div>
                        <small>Cuando el stock baje de este número, aparece la alerta.</small>
                    </div>
                    <div class="stat">
                        <label>Precio unitario</label>
                        <div class="valor-box">$${Number(p.precioActual).toLocaleString("es-AR")}</div>
                    </div>
                </div>

                <div class="titulo-seccion">Información del producto</div>

                <div class="grid-info">
                    <div class="campo">
                        <label>Nombre del producto</label>
                        <div class="valor-box">${p.nombre}</div>
                    </div>
                    <div class="campo">
                        <label>Categoría</label>
                        <div class="valor-box">${p.categoriaProducto.nombre}</div>
                    </div>

                    <div class="campo full-width">
                        <label>Marca</label>
                        <div class="valor-box">${p.marcaProducto.nombre}</div>
                    </div>

                    <div class="campo full-width">
                        <label>Descripción</label>
                        <div class="valor-box texto-libre">${p.descripcion || "Sin descripción"}</div>
                    </div>
                </div>

                <div class="acciones">
                    <button class="btn-editar">✎ Editar</button>
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