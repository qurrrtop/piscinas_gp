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
    
    generarOlas() {
        const olaClara = "M0 0 H300 C275 22 240 44 190 50 C140 56 95 46 55 64 C30 75 12 92 0 110 Z";
        const olaOscura = "M0 0 H205 C185 16 160 32 125 36 C90 40 55 34 28 50 C14 58 5 70 0 82 Z";

        return `
            <div class="olas" aria-hidden="true">

                <svg class="ola ola-superior" viewBox="0 0 300 110" xmlns="http://www.w3.org/2000/svg">
                    <path d="${olaClara}" fill="#D6ECFA" fill-opacity="0.9"/>
                    <path d="${olaOscura}" fill="#B5DCF4" fill-opacity="0.85"/>
                </svg>

                <svg class="ola ola-inferior" viewBox="0 0 300 110" xmlns="http://www.w3.org/2000/svg">
                    <g transform="rotate(180 150 55)">
                        <path d="${olaClara}" fill="#D6ECFA" fill-opacity="0.9"/>
                        <path d="${olaOscura}" fill="#B5DCF4" fill-opacity="0.85"/>
                    </g>
                </svg>

            </div>
        `;
    }

    obtenerNombreCliente(cliente) {
        if (!cliente) {
            return "Consumidor final";
        }

        if (cliente.nombre) {
            return `${cliente.nombre} ${cliente.apellido || ""}`.trim();
        }

        return cliente.razonSocial || "Consumidor final";
    }

    formatearPrecio(valor) {
        return `$${Number(valor || 0).toLocaleString("es-AR")}`;
    }

    formatearFecha(fecha) {
        return new Date(fecha).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    render() {
        if (!this._venta) {
            return;
        }

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
                    box-sizing: border-box;

                    background: rgba(0, 0, 0, .65);

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

                    width: 2.2rem;
                    height: 2.2rem;

                    background: rgba(255, 255, 255, .15);

                    border: none;
                    border-radius: 50%;

                    color: white;

                    font-size: 1.3rem;
                    line-height: 1;

                    cursor: pointer;

                    z-index: 10;
                }

                .btn-cerrar:hover {
                    background: rgba(255, 255, 255, .25);
                }

                .acciones {
                    display: flex;
                    gap: .8rem;
                }

                .acciones button {
                    padding: .6rem 1.3rem;

                    border-radius: 8px;

                    cursor: pointer;

                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    font-weight: 700;

                    border: 1px solid rgba(255, 255, 255, .3);
                }

                #btnImprimir {
                    background: #37E0E0;
                    color: #05448D;
                    border: none;
                }

                #btnImprimir:hover {
                    background: rgba(55, 224, 224, .85);
                }

                ${this.estilosTicket()}
            </style>

            <div class="overlay">

                <button
                    class="btn-cerrar"
                    id="btnCerrar"
                    type="button"
                >
                    &times;
                </button>

                <div class="ticket">
                    ${this.generarHtmlTicket(v)}
                </div>

                <div class="acciones">

                    <button
                        type="button"
                        id="btnImprimir"
                    >
                        🖨️ Imprimir / Guardar PDF
                    </button>

                </div>

            </div>
        `;

        this.shadowRoot
            .querySelector(".overlay")
            .addEventListener("click", (e) => {
                if (e.target.classList.contains("overlay")) {
                    this.close();
                }
            });

        this.shadowRoot
            .querySelector("#btnCerrar")
            .addEventListener("click", () => {
                this.close();
            });

        this.shadowRoot
            .querySelector("#btnImprimir")
            .addEventListener("click", () => {
                this.abrirVentanaImpresion();
            });
    }

    abrirVentanaImpresion() {
        const nombre = `comprobante-venta-${String(this._venta.id).padStart(6, "0")}`;
        const tituloOriginal = document.title;

        // el comprobante se imprime desde un iframe oculto de esta misma pagina:
        // asi Chrome sugiere como nombre del archivo el titulo de la pagina principal
        const iframe = document.createElement("iframe");
        iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";

        const limpiar = () => {
            document.title = tituloOriginal;
            iframe.remove();
        };

        iframe.onload = () => {
            document.title = nombre;

            iframe.contentWindow.addEventListener("afterprint", limpiar, { once: true });
            window.addEventListener("afterprint", limpiar, { once: true });

            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        };

        // srcdoc se asigna antes de insertar el iframe para que onload corresponda al comprobante
        iframe.srcdoc = this.generarDocumentoCompleto(this._venta);
        document.body.appendChild(iframe);
    }
    
    generarDocumentoCompleto(v) {
        return `
            <!DOCTYPE html>

            <html lang="es">

            <head>

                <meta charset="UTF-8">

                <title>comprobante-venta-${String(v.id).padStart(6, "0")}</title>

                <style>

                    @page {
                        size: A4;
                        margin: 0;
                    }

                    * {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    html,
                    body {
                        margin: 0;
                        padding: 0;

                        background: white;
                    }

                    body {
                        font-family:
                            "Segoe UI",
                            Tahoma,
                            Geneva,
                            Verdana,
                            sans-serif;
                    }

                    .ticket {
                        box-shadow: none;
                        margin: 0 auto;
                    }

                    ${this.estilosTicket()}

                    @media print {

                        body {
                            background: white;
                        }

                        .ticket {
                            box-shadow: none;
                        }
                    }

                </style>

            </head>

            <body>

                <div class="ticket">
                    ${this.generarHtmlTicket(v)}
                </div>

            </body>

            </html>
        `;
    }

    generarHtmlTicket(v) {
        const basePath = this.getAttribute("base-path") || "";

        return `
            ${this.generarOlas()}
            
            <div class="encabezado">

                <div class="logo-container">
                    <img
                        class="logo"
                        src="${basePath}/assets/img/logos/logo-empresa-vertical.png"
                        alt="Piscinas GP"
                    >
                </div>

            </div>

            <div class="info-venta">

                <div class="cliente">

                    <span class="cliente-label">
                        Cliente:
                    </span>

                    <span class="cliente-nombre">
                        ${this.obtenerNombreCliente(v.cliente)}
                    </span>

                </div>

                <div class="datos-venta">

                    <div class="dato-venta">

                        <span class="dato-titulo">
                            N.º VENTA
                        </span>

                        <span class="dato-valor">
                            ${String(v.id).padStart(6, "0")}
                        </span>

                    </div>

                    <div class="dato-venta">

                        <span class="dato-titulo">
                            FECHA
                        </span>

                        <span class="dato-valor">
                            ${this.formatearFecha(v.fecha)}
                        </span>

                    </div>

                </div>

            </div>

            <table class="tabla-productos">

                <thead>

                    <tr>

                        <th class="col-cantidad">
                            Cantidad
                        </th>

                        <th class="col-detalle">
                            Detalle
                        </th>

                        <th class="col-precio">
                            Precio unit.
                        </th>

                        <th class="col-subtotal">
                            Subtotal
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${v.detallesVenta.map(detalle => `
                        <tr>

                            <td class="cantidad">
                                ${detalle.cantidad}
                            </td>

                            <td class="detalle">
                                ${detalle.producto.nombre}
                            </td>

                            <td class="precio">
                                ${this.formatearPrecio(
                                    detalle.precioUnitario
                                )}
                            </td>

                            <td class="subtotal">
                                ${this.formatearPrecio(
                                    detalle.precioUnitario * detalle.cantidad
                                )}
                            </td>

                        </tr>
                    `).join("")}

                    ${Array.from({
                        length: Math.max(
                            8 - v.detallesVenta.length,
                            0
                        )
                    }).map(() => `
                        <tr class="fila-vacia">

                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>

                        </tr>
                    `).join("")}

                </tbody>

            </table>

            <div class="pie-comprobante">

                <div class="metodo-pago">

                    <span class="metodo-label">
                        Método de pago:
                    </span>

                    <span class="metodo-valor">
                        ${v.metodoPago?.nombre || "-"}
                    </span>

                </div>

                <div class="total">

                    <span class="total-label">
                        TOTAL
                    </span>

                    <span class="total-valor">
                        ${this.formatearPrecio(v.total)}
                    </span>

                </div>

            </div>

            <div class="gracias">
                ¡Gracias por su compra!
            </div>
        `;
    }

    estilosTicket() {
        return `
            .ticket {
                position: relative;
                width: min(92vw, 800px);
                max-height: none;
                padding: 18mm 15mm 26mm;
                margin: auto;
                box-sizing: border-box;
                background: white;
                color: #07529A;
                font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 4px 20px rgba(0, 0, 0, .35);
                overflow-y: visible;
                border: 1px solid #65B5E8;
            }

            .encabezado {
                display: flex;
                justify-content: center;
                align-items: flex-start;

                padding-top: 2mm;
                margin-bottom: 8mm;
            }

            .logo-container {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .logo {
                width: min(30%, 180px);
                height: auto;
                object-fit: contain;
                display: block;
            }

            .info-venta {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;

                align-items: center;

                gap: 8mm;

                margin-bottom: 7mm;
                padding-bottom: 2.5mm;

                border-bottom: 1px solid #65B5E8;
            }

            .cliente {
                display: flex;
                align-items: baseline;

                gap: 4mm;

                min-width: 0;

                font-size: 4mm;
            }

            .cliente-label {
                font-weight: 700;
                white-space: nowrap;
            }

            .cliente-nombre {
                color: #164F82;

                min-width: 0;
            }

            .datos-venta {
                display: grid;
                grid-template-columns: 1fr 1fr;

                width: 240px;

                border: 1px solid #65B5E8;
            }

            .dato-venta {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;

                padding: 2mm 3mm;
            }

            .dato-venta + .dato-venta {
                border-left: 1px solid #65B5E8;
            }

            .dato-titulo {
                margin-bottom: 1mm;

                color: #07529A;

                font-size: 2.8mm;
                font-weight: 700;

                text-transform: uppercase;
            }

            .dato-valor {
                color: #164F82;

                font-size: 3.4mm;
            }

            .tabla-productos {
                width: 100%;

                border-collapse: collapse;
                table-layout: fixed;

                color: #164F82;

                font-size: 3.5mm;
            }

            .tabla-productos th {
                padding: 3mm 2mm;

                background: #E7F5FD;

                border: 1px solid #65B5E8;

                color: #07529A;

                font-size: 3.2mm;
                font-weight: 700;

                text-align: center;

                text-transform: uppercase;
            }

            .tabla-productos td {
                height: 9mm;

                padding: 2.5mm 2mm;

                border: 1px solid #8BC7EA;

                color: #164F82;
            }

            .col-cantidad,
            .cantidad {
                width: 14%;

                text-align: center;
            }

            .col-detalle,
            .detalle {
                width: 48%;

                text-align: left;
            }

            .col-precio,
            .precio {
                width: 19%;

                text-align: right;
            }

            .col-subtotal,
            .subtotal {
                width: 19%;

                text-align: right;
            }

            .detalle {
                word-break: break-word;
            }

            .fila-vacia td {
                height: 9mm;
            }

            .pie-comprobante {
                display: flex;

                align-items: flex-start;
                justify-content: space-between;

                gap: 10mm;

                margin-top: 7mm;
            }

            .metodo-pago {
                display: flex;
                flex-direction: column;

                gap: 2mm;

                flex: 1;

                color: #164F82;

                font-size: 3.7mm;
            }

            .metodo-label {
                font-weight: 700;
            }

            .metodo-valor {
                display: inline-block;

                width: fit-content;
                min-width: 45mm;

                padding: 2.5mm 4mm;

                background: #F0F9FD;

                border: 1px solid #8BC7EA;
                border-radius: 2mm;
            }

            .total {
                display: grid;
                grid-template-columns: auto auto;

                min-width: 65mm;

                border: 1px solid #65B5E8;

                font-size: 4.5mm;
                font-weight: 700;
            }

            .total-label {
                padding: 3mm 5mm;

                background: #E7F5FD;

                color: #07529A;
            }

            .total-valor {
                padding: 3mm 5mm;

                background: white;

                color: #07529A;

                text-align: right;
            }

            .gracias {
                margin-top: 10mm;

                padding-right: 3mm;

                color: #49A7DF;

                font-size: 3.8mm;
                font-style: italic;

                text-align: right;
            }
        
            .olas {
                position: absolute;
                inset: 0;
                overflow: hidden;
                pointer-events: none;
                z-index: 0;
            }

            .ola {
                position: absolute;
                display: block;
                width: 72mm;
                height: 26.4mm;
            }

            .ola-superior {
                top: 0;
                left: 0;
            }

            .ola-inferior {
                bottom: 0;
                right: 0;
            }

            /* el contenido queda por encima de las olas */
            .encabezado,
            .info-venta,
            .tabla-productos,
            .pie-comprobante,
            .gracias {
                position: relative;
                z-index: 1;
            }
        `;
    }
}

customElements.define("comprobante-venta", ComprobanteVenta);