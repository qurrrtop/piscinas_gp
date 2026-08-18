class TarjetasResumen extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._tarjetas = [];
    }

    set tarjetas(valor) {
        this._tarjetas = valor || [];
        this.render();
    }

    get tarjetas() {
        return this._tarjetas;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .grid-tarjetas {
                    display: grid;
                    grid-template-columns: repeat(${this._tarjetas.length || 1}, 1fr);
                    gap: 1rem;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                .tarjeta {
                    padding: 1rem;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,.15);
                    background: rgba(1, 49, 104, 1);
                    border: 1px solid rgba(255,255,255,0.4);
                    color: white;
                    display: flex;
                    flex-direction: column;
                    gap: .35rem;
                }

                .tarjeta .valor {
                    font-size: 1.6rem;
                    font-weight: 700;
                }

                .tarjeta .titulo {
                    font-size: .8rem;
                    color: rgba(255,255,255,.7);
                    text-transform: uppercase;
                }
            </style>

            <div class="grid-tarjetas">
                ${this._tarjetas.map(t => `
                    <div class="tarjeta">
                        <span class="valor">${t.valor}</span>
                        <span class="titulo">${t.titulo}</span>
                    </div>
                `).join("")}
            </div>
        `;
    }
}

customElements.define("tarjetas-resumen", TarjetasResumen);