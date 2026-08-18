class TablaGenerica extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._columnas = [];
        this._datos = [];
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
            return valor !== null ? valor[parte] : undefined;
        }, objeto);
    }

    formatearCelda(fila, columna) {
        const valorCrudo = this.obtenerValorAnidado(fila, columna.clave);

        if (columna.formato) {
            return columna.formato(valorCrudo, fila);
        }

        return valorCrudo !== null ? valorCrudo : "";
    }

    render() {
        const hayDatos = this._datos.length > 0;

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
            </style>

            <table>
                <thead>
                    <tr>
                        ${this._columnas.map(col => `<th>${col.titulo}</th>`).join("")}
                    </tr>
                </thead>
                <tbody>
                    ${hayDatos
                        ? this._datos.map((fila, index) => `
                            <tr data-index="${index}">
                                ${this._columnas.map(col => `<td>${this.formatearCelda(fila, col)}</td>`).join("")}
                            </tr>
                        `).join("")
                        : `<tr><td colspan="${this._columnas.length}" class="sin-datos">No hay datos para mostrar</td></tr>`
                    }
                </tbody>
            </table>
        `;

        this.setupListeners();
    }

    setupListeners() {
        this.shadowRoot.querySelectorAll("tbody tr[data-index]").forEach(fila => {
            fila.addEventListener("click", () => {
                const index = Number(fila.dataset.index);
                this.dispatchEvent(new CustomEvent("fila-clickeada", {
                    detail: this._datos[index],
                    bubbles: true,
                    composed: true
                }));
            });
        });
    }
}

customElements.define("tabla-generica", TablaGenerica);