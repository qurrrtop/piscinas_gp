class ComprobanteVenta extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._venta = null;
    }

    set venta(valor) {
        this._venta = valor;
        this.render();
    }

    connectedCallback() {
        this.render();
    }

    close() {
        this.remove();
    }

    obtenerNombreCliente(c) {
        return c.nombre ? `${c.nombre} ${c.apellido}` : c.razonSocial;
    }

    obtenerCuitCuil(c) {
        return c.cuil || c.cuit || "Sin dato";
    }

    render() {
        if (!this._venta) return;
        const v = this._venta;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                }

                .overlay {
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,.65);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    gap: 1.2rem;
                    overflow-y: auto;
                    padding: 3rem 1rem;
                }

                .btn-cerrar {
                    position: fixed;
                    top: 1.2rem;
                    right: 1.5rem;
                    background: rgba(255,255,255,.15);
                    border: none;
                    color: white;
                    width: 2.2rem;
                    height: 2.2rem;
                    border-radius: 50%;
                    font-size: 1.3rem;
                    cursor: pointer;
                    line-height: 1;
                }

                .btn-cerrar:hover {
                    background: rgba(255,255,255,.25);
                }

                .acciones {
                    display: flex;
                    gap: .8rem;
                }

                .acciones button {
                    padding: .6rem 1.3rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                    border: 1px solid rgba(255,255,255,.3);
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                #btnImprimir { background: transparent; color: white; }
                #btnImprimir:hover { background: rgba(255,255,255,.1); }
                #btnDescargar { background: #37E0E0; color: #05448D; border: none; }
                #btnDescargar:hover { background: rgba(55,224,224,.85); }

                ${this.estilosTicket()}
            </style>

            <div class="overlay">
                <button class="btn-cerrar" id="btnCerrar">&times;</button>

                <div class="ticket">${this.generarHtmlTicket(v)}</div>

                <div class="acciones">
                    <button type="button" id="btnImprimir">🖨️ Imprimir</button>
                    <button type="button" id="btnDescargar">⬇ Descargar PDF</button>
                </div>
            </div>
        `;

        this.shadowRoot.querySelector(".overlay").addEventListener("click", (e) => {
            if (e.target.classList.contains("overlay")) this.close();
        });
        this.shadowRoot.querySelector("#btnCerrar").addEventListener("click", () => this.close());
        this.shadowRoot.querySelector("#btnImprimir").addEventListener("click", () => this.abrirVentanaImpresion());
        this.shadowRoot.querySelector("#btnDescargar").addEventListener("click", () => this.abrirVentanaImpresion());
    }

    abrirVentanaImpresion() {
        const ventana = window.open("", "_blank", "width=400,height=750");
        ventana.document.write(this.generarDocumentoCompleto(this._venta));
        ventana.document.close();
        ventana.focus();
        ventana.onload = () => ventana.print();
    }

    generarDocumentoCompleto(v) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Comprobante ${v.id}</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        margin: 0;
                        padding: 1.5rem 0;
                        background: #e9e9e9;
                    }
                    ${this.estilosTicket()}
                    @media print {
                        body { background: white; padding: 0; }
                        .ticket { box-shadow: none; width: 100%; max-width: 320px; }
                    }
                </style>
            </head>
            <body><div class="ticket">${this.generarHtmlTicket(v)}</div></body>
            </html>
        `;
    }

    generarHtmlTicket(v) {
        const c = v.cliente;
        const subtotal = v.detallesVenta.reduce((acc, d) => acc + (d.precioUnitario * d.cantidad), 0);
        const montoDescuento = subtotal * (v.descuentoGlobal / 100);
        const fecha = new Date(v.fecha).toLocaleDateString("es-AR", { year: "numeric", month: "2-digit", day: "2-digit" });
        const hora = new Date(v.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

        return `
            <div class="centro">
                <div class="marca">PISCINASGP</div>
                <div class="linea-fina">Comprobante interno de venta</div>
            </div>

            <div class="separador-asteriscos">****************************</div>

            <div class="fila"><span>N° comprobante</span><span>${String(v.id).padStart(6, "0")}</span></div>
            <div class="fila"><span>Fecha</span><span>${fecha} ${hora}</span></div>
            <div class="fila"><span>Cliente</span><span>${this.obtenerNombreCliente(c)}</span></div>
            <div class="fila"><span>CUIT/CUIL</span><span>${this.obtenerCuitCuil(c)}</span></div>

            <div class="separador-asteriscos">****************************</div>

            <div class="encabezado-items"><span>Producto</span><span>Cant.</span><span>Total</span></div>

            ${v.detallesVenta.map(d => `
                <div class="item">
                    <div class="item-nombre">${d.producto.nombre}</div>
                    <div class="item-detalle">
                        <span>$${Number(d.precioUnitario).toLocaleString("es-AR")} c/u</span>
                        <span>x${d.cantidad}</span>
                        <span>$${Number(d.precioUnitario * d.cantidad).toLocaleString("es-AR")}</span>
                    </div>
                </div>
            `).join("")}

            <div class="separador-linea"></div>

            <div class="fila"><span>Subtotal</span><span>$${subtotal.toLocaleString("es-AR")}</span></div>
            <div class="fila"><span>Descuento (${v.descuentoGlobal}%)</span><span>-$${montoDescuento.toLocaleString("es-AR")}</span></div>
            <div class="fila total"><span>TOTAL A PAGAR</span><span>$${Number(v.total).toLocaleString("es-AR")}</span></div>

            <div class="separador-asteriscos">****************************</div>

            <div class="fila"><span>Método de pago</span><span>${v.metodoPago.nombre}</span></div>
            ${v.observacion ? `<div class="observacion">${v.observacion}</div>` : ""}

            <div class="separador-asteriscos">****************************</div>

            <div class="centro pie">
                <div>¡Gracias por su compra!</div>
                <div class="aviso-legal">Comprobante interno — sin validez fiscal</div>
            </div>
        `;
    }

    estilosTicket() {
        return `
            .ticket {
                width: 300px;
                background: white;
                color: #111;
                padding: 1.4rem 1.1rem;
                box-shadow: 0 4px 20px rgba(0,0,0,.4);
                font-family: 'Courier New', Courier, monospace;
                font-size: .78rem;
                line-height: 1.6;
            }

            .centro { text-align: center; }

            .marca {
                font-size: 1.15rem;
                font-weight: 700;
                letter-spacing: .08em;
            }

            .linea-fina {
                font-size: .68rem;
                color: #555;
                margin-top: .1rem;
            }

            .separador-asteriscos {
                text-align: center;
                letter-spacing: -.05em;
                margin: .6rem 0;
                color: #333;
                overflow: hidden;
                white-space: nowrap;
            }

            .separador-linea {
                border-top: 1px dashed #333;
                margin: .6rem 0;
            }

            .fila {
                display: flex;
                justify-content: space-between;
                gap: .5rem;
            }

            .fila.total {
                font-weight: 700;
                font-size: .88rem;
                margin-top: .3rem;
            }

            .encabezado-items {
                display: flex;
                justify-content: space-between;
                font-size: .68rem;
                color: #555;
                margin-bottom: .3rem;
                text-transform: uppercase;
            }

            .item { margin-bottom: .5rem; }

            .item-nombre {
                white-space: normal;
                word-break: break-word;
                font-weight: 600;
            }

            .item-detalle {
                display: flex;
                justify-content: space-between;
                color: #444;
                font-size: .74rem;
            }

            .observacion {
                font-style: italic;
                font-size: .74rem;
                color: #444;
                margin-top: .4rem;
            }

            .pie { font-size: .74rem; }

            .aviso-legal {
                font-size: .64rem;
                color: #888;
                margin-top: .3rem;
            }
        `;
    }
}

customElements.define("comprobante-venta", ComprobanteVenta);