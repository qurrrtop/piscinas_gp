class DetalleCliente extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._cliente = null;
    }

    set cliente(valor) {
        this._cliente = valor;
        this.render();
    }

    get cliente() {
        return this._cliente;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        if (!this._cliente) {
            this.shadowRoot.innerHTML = `<p style="color:white">Cargando...</p>`;
            return;
        }

        const c = this._cliente;
        const esParticular = c.tipo === "Particular";
        const colorTipo = esParticular ? "#2387FA" : "#FE1BD4";

        this.shadowRoot.innerHTML = `
            <style>
                .detalle {
                    display: flex;
                    flex-direction: column;
                    gap: 1.4rem;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                .badge-tipo {
                    align-self: flex-start;
                    background: ${colorTipo}44;
                    color: ${colorTipo};
                    padding: .3rem .9rem;
                    border-radius: 20px;
                    font-size: 1rem;
                    font-weight: 700;
                }

                .fila-stats {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                    padding-bottom: 1.2rem;
                    border-bottom: 1px solid rgba(196, 196, 196, .5);
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
                    grid-template-columns: 1fr 1fr;
                    gap: 1.2rem;
                }

                .campo.full-width {
                    grid-column: 1 / -1;
                }

                .campo label,
                .stat label {
                    display: block;
                    font-size: .8rem;
                    font-weight: 600;
                    color: #B8D7FF;
                    text-transform: uppercase;
                    letter-spacing: .05em;
                    margin-bottom: .5rem;
                }

                .campo .valor-box,
                .stat .valor-box {
                    padding: .6rem .8rem;
                    background: rgba(255, 255, 255, .12);
                    border: 1px solid rgba(196, 196, 196, .4);
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
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
                <span class="badge-tipo">${c.tipo}</span>

                <div class="fila-stats">
                    <div class="stat">
                        <label>Ventas realizadas</label>
                        <div class="valor-box">${c.cantidadVentas}</div>
                    </div>
                    <div class="stat">
                        <label>${esParticular ? "CUIL" : "CUIT"}</label>
                        <div class="valor-box">${esParticular ? c.cuil : c.cuit}</div>
                    </div>
                </div>

                <div class="titulo-seccion">${esParticular ? "Datos personales" : "Datos de la empresa"}</div>

                <div class="grid-info">
                    ${esParticular ? `
                        <div class="campo">
                            <label>Nombre</label>
                            <div class="valor-box">${c.nombre}</div>
                        </div>
                        <div class="campo">
                            <label>Apellido</label>
                            <div class="valor-box">${c.apellido}</div>
                        </div>
                    ` : `
                        <div class="campo">
                            <label>Razón social</label>
                            <div class="valor-box">${c.razonSocial}</div>
                        </div>
                        <div class="campo">
                            <label>Nombre de fantasía</label>
                            <div class="valor-box">${c.nombreFantasia || "No registrado."}</div>
                        </div>
                        <div class="campo full-width">
                            <label>Rubro</label>
                            <div class="valor-box">${c.rubro || "No registrado."}</div>
                        </div>
                    `}
                </div>

                <div class="titulo-seccion">Contacto y ubicación</div>

                <div class="grid-info">
                    <div class="campo">
                        <label>Email</label>
                        <div class="valor-box">${c.email || "No registrado."}</div>
                    </div>
                    <div class="campo">
                        <label>Teléfono</label>
                        <div class="valor-box">${c.telefono || "No registrado."}</div>
                    </div>
                    <div class="campo">
                        <label>Localidad</label>
                        <div class="valor-box">${c.localidadNombre}</div>
                    </div>
                    <div class="campo">
                        <label>Calle y número</label>
                        <div class="valor-box">${c.calleYnumero}</div>
                    </div>
                    <div class="campo full-width">
                        <label>Observaciones</label>
                        <div class="valor-box" style="font-weight:400">${c.observaciones || "No registrado."}</div>
                    </div>
                </div>

                <div class="acciones">
                    <button class="btn-editar">✎ Editar</button>
                </div>
            </div>
        `;

        this.shadowRoot.querySelector(".btn-editar").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("editar-cliente", {
                detail: this._cliente,
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define("detalle-cliente", DetalleCliente);