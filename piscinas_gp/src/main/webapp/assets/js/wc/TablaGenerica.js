class TablaGenerica extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._columnas = [];
        this._datos = [];
        this._porPagina = 10;
        this._paginaActual = 0;
    }

    set columnas(valor) {
        this._columnas = valor || [];
        this.render();
    }

    get columnas() {
        return this._columnas;
    }

    set datos(valor) {
        this._datos = valor || [];
        this._paginaActual = 0;
        this.render();
    }

    get datos() {
        return this._datos;
    }

    connectedCallback() {
        this.render();
    }

    obtenerValorAnidado(objeto, clave) {
        return clave.split(".").reduce((valor, parte) => {
            return valor != null ? valor[parte] : undefined;
        }, objeto);
    }

    formatearCelda(fila, columna) {
        const valorCrudo = this.obtenerValorAnidado(fila, columna.clave);

        if (columna.formato) {
            return columna.formato(valorCrudo, fila);
        }

        return valorCrudo != null ? valorCrudo : "";
    }

    get totalPaginas() {
        return Math.max(1, Math.ceil(this._datos.length / this._porPagina));
    }

    get datosPaginaActual() {
        const inicio = this._paginaActual * this._porPagina;
        return this._datos.slice(inicio, inicio + this._porPagina);
    }

    irAPagina(numero) {
        if (numero < 0 || numero >= this.totalPaginas) return;
        this._paginaActual = numero;
        this.render();
    }

    render() {
        const datosPagina = this.datosPaginaActual;
        const hayDatos = datosPagina.length > 0;

        this.shadowRoot.innerHTML = `
            <style>
                table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    border-radius: 10px;
                    overflow: hidden;
                    color: black;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    font-size: .9rem;
                }
        
                thead { 
                    background-color: rgba(1, 49, 104, 1);
                }

                thead th {
                    text-align: left;
                    text-transform: uppercase;
                    font-size: .75rem;
                    font-weight: 600;
                    color: #B8D7FF;
                    padding: .75rem .5rem;
                    border-bottom: 1px solid rgba(196, 196, 196, .5);
                }
        
                tbody {
                    background-color: rgba(188,188,188,0.9);
                }

                tbody td {
                    padding: .65rem .5rem;
                    border-bottom: 1px solid rgba(196, 196, 196, .2);
                }

                tbody tr {
                    cursor: pointer;
                }

                tbody tr:hover {
                    background: rgba(255, 255, 255, .08);
                }

                .sin-datos {
                    text-align: center;
                    padding: 2rem;
                    color: rgba(255, 255, 255, .6);
                    cursor: default;
                }
        
                .paginacion {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem 0 .25rem;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    color: white;
                    font-size: .85rem;
                }

                .paginacion button {
                    background: rgba(1, 49, 104, 1);
                    border: 1px solid rgba(255,255,255,.2);
                    color: white;
                    width: 2.2rem;
                    height: 2.2rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: .2s;
                }

                .paginacion button:hover:not(:disabled) {
                    background: rgba(1, 49, 104, .5);
                }

                .paginacion button:disabled {
                    opacity: .35;
                    cursor: default;
                }
            </style>

            <table>
                <thead>
                    <tr>
                        ${this._columnas.map(col => `<th>${col.titulo}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    ${hayDatos
                        ? datosPagina.map((fila, index) => `
                            <tr data-index="${index}">
                                ${this._columnas.map(col => `<td>${this.formatearCelda(fila, col)}</td>`).join("")}
                            </tr>
                        `).join("")
                        : `<tr><td colspan="${this._columnas.length}" class="sin-datos">No hay datos para mostrar</td></tr>`
                    }
                </tbody>
            </table>

            ${this._datos.length > this._porPagina ? `
                <div class="paginacion">
                    <button class="btn-anterior" ${this._paginaActual === 0 ? "disabled" : ""}>&larr;</button>
                    <span>Página ${this._paginaActual + 1} de ${this.totalPaginas}</span>
                    <button class="btn-siguiente" ${this._paginaActual >= this.totalPaginas - 1 ? "disabled" : ""}>&rarr;</button>
                </div>
            ` : ""}
        `;

        this.setupListeners();
    }

    setupListeners() {
        this.shadowRoot.querySelectorAll("tbody tr[data-index]").forEach(fila => {
            fila.addEventListener("click", () => {
                const index = Number(fila.dataset.index);
                this.dispatchEvent(new CustomEvent("fila-clickeada", {
                    detail: this.datosPaginaActual[index],
                    bubbles: true,
                    composed: true
                }));
            });
        });

        this.shadowRoot.querySelector(".btn-anterior")?.addEventListener("click", () => {
            this.irAPagina(this._paginaActual - 1);
        });

        this.shadowRoot.querySelector(".btn-siguiente")?.addEventListener("click", () => {
            this.irAPagina(this._paginaActual + 1);
        });
    }
}

customElements.define("tabla-generica", TablaGenerica);