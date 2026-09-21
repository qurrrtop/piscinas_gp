class ConfirmacionVenta extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._datos = null;
        this._documento = "sin";
    }

    set datos(valor) {
        this._datos = valor;
        this.render();
    }

    connectedCallback() {
        this.render();
    }

    obtenerIniciales(nombre) {
        const partes = (nombre || "").trim().split(" ");
        return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase();
    }

    render() {
        if (!this._datos) return;
        const d = this._datos;

        this.shadowRoot.innerHTML = `
            <style>
                .contenedor {
                    display: flex;
                    flex-direction: column;
                    gap: 1.2rem;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    max-height: 60vh;
                    overflow-y: auto;
                    padding-right: .5rem;
                }

                .titulo-seccion {
                    font-size: .82rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: .04em;
                    color: #B8D7FF;
                    margin-bottom: .6rem;
                }

                .cliente-chip {
                    display: flex;
                    align-items: center;
                    gap: .8rem;
                    background: rgba(255,255,255,.08);
                    border-radius: 8px;
                    padding: .8rem 1rem;
                }

                .avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    color: white;
                    flex-shrink: 0;
                    background: linear-gradient(160deg, #5FD9E8, #0B5C7A);
                }

                .cliente-info strong { display: block; }
                .cliente-info small { color: rgba(255,255,255,.7); font-size: .8rem; }

                .badge-metodo {
                    margin-left: auto;
                    background: rgba(255,255,255,.15);
                    padding: .25rem .8rem;
                    border-radius: 20px;
                    font-size: .75rem;
                    font-weight: 700;
                    white-space: nowrap;
                }

                table.tabla-productos {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: .88rem;
                    border-radius: 10px;
                    overflow: hidden;
                }

                table.tabla-productos thead {
                    background: rgba(6, 76, 156);
                }

                table.tabla-productos thead th {
                    text-align: left;
                    font-size: .72rem;
                    text-transform: uppercase;
                    color: #B8D7FF;
                    padding: .8rem .7rem;
                    border-bottom: 1px solid rgba(255,255,255,.25);
                }

                table.tabla-productos tbody {
                    background: rgba(255,255,255,.08);
                }

                table.tabla-productos tbody td {
                    padding: .7rem;
                    border-bottom: 1px solid rgba(255,255,255,.1);
                    vertical-align: middle;
                }

                table.tabla-productos tbody tr:last-child td {
                    border-bottom: none;
                }

                table.tabla-productos thead th.col-num,
                table.tabla-productos tbody td.col-num {
                    text-align: right;
                    white-space: nowrap;
                }

                table.tabla-productos thead th.col-cant,
                table.tabla-productos tbody td.col-cant {
                    text-align: center;
                }

                td.col-producto small {
                    display: block;
                    color: rgba(255,255,255,.6);
                    font-size: .78rem;
                    margin-top: .15rem;
                }

                .totales {
                    background: rgba(255,255,255,.08);
                    padding: .8rem;
                    border-radius: 10px;
                }

                .totales-fila {
                    display: flex;
                    justify-content: space-between;
                    padding: .35rem 0;
                    font-size: .92rem;
                }

                .totales-fila.total {
                    font-weight: 700;
                    font-size: 1.1rem;
                    border-top: 1px solid rgba(255,255,255,.3);
                    padding-top: .5rem;
                    margin-top: .2rem;
                }

                .documentos {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: .8rem;
                }

                .doc-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: .2rem;
                    padding: .8rem 1rem;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,.25);
                    background: rgba(255,255,255,.06);
                    color: white;
                    cursor: pointer;
                    font-weight: 700;
                    text-align: left;
                    transition: border-color .15s ease, background .15s ease;
                }

                .doc-btn small {
                    font-weight: 400;
                    color: rgba(255,255,255,.65);
                    font-size: .76rem;
                }

                .doc-btn:hover {
                    background: rgba(255,255,255,.1);
                }

                .doc-btn.seleccionado {
                    border-color: #37E0E0;
                    background: rgba(55,224,224,.15);
                }

                .acciones {
                    display: flex;
                    justify-content: flex-end;
                    gap: .8rem;
                    padding-top: .8rem;
                    border-top: 1px solid rgba(255,255,255,.2);
                }

                .acciones button {
                    padding: .6rem 1.3rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                    border: 1px solid rgba(255,255,255,.25);
                }

                .btn-cancelar {
                    background: transparent;
                    color: white;
                }

                .btn-cancelar:hover {
                    background: rgba(255,255,255,.06);
                }

                .btn-registrar {
                    background: #37E0E0;
                    color: #05448D;
                    border: none;
                }

                .btn-registrar:hover {
                    background: rgba(55,224,224,.85);
                }
            </style>

            <div class="contenedor">

                <div>
                    <div class="titulo-seccion">Cliente</div>
                    <div class="cliente-chip">
                        <span class="avatar">${this.obtenerIniciales(d.cliente.nombreCompleto)}</span>
                        <div class="cliente-info">
                            <strong>${d.cliente.nombreCompleto}</strong>
                            <small>${d.cliente.email || "Sin email"} · CUIT/CUIL: ${d.cliente.cuitCuil}</small>
                        </div>
                        <span class="badge-metodo">${d.metodoPago}</span>
                    </div>
                </div>

                <div>
                    <div class="titulo-seccion">Productos</div>
                    <table class="tabla-productos">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th class="col-num">Precio unit.</th>
                                <th class="col-cant">Cant.</th>
                                <th class="col-num">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${d.carrito.map(item => `
                                <tr>
                                    <td class="col-producto">${item.nombre}</td>
                                    <td class="col-num">$${item.precioUnitario.toLocaleString("es-AR")}</td>
                                    <td class="col-cant">${item.cantidad}</td>
                                    <td class="col-num">$${(item.precioUnitario * item.cantidad).toLocaleString("es-AR")}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>

                <div class="totales">
                    <div class="totales-fila"><span>Subtotal</span><span>$${d.subtotal.toLocaleString("es-AR")}</span></div>
                    <div class="totales-fila"><span>Descuento global (${d.descuentoGlobal}%)</span><span>-$${d.montoDescuento.toLocaleString("es-AR")}</span></div>
                    <div class="totales-fila total"><span>Total</span><span>$${d.total.toLocaleString("es-AR")}</span></div>
                </div>

                <div>
                    <div class="titulo-seccion">Documento</div>
                    <div class="documentos">
                        <button type="button" class="doc-btn" data-doc="factura">
                            🧾 Factura interna
                            <small>Genera un comprobante interno de la venta</small>
                        </button>
                        <button type="button" class="doc-btn seleccionado" data-doc="sin">
                            Sin documento
                            <small>Registra la venta sin generar comprobante</small>
                        </button>
                    </div>
                </div>

                <div class="acciones">
                    <button type="button" class="btn-cancelar">Cancelar</button>
                    <button type="button" class="btn-registrar">Registrar</button>
                </div>
            </div>
        `;

        this.shadowRoot.querySelectorAll(".doc-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                this._documento = btn.dataset.doc;
                this.shadowRoot.querySelectorAll(".doc-btn").forEach(b => b.classList.remove("seleccionado"));
                btn.classList.add("seleccionado");
            });
        });

        this.shadowRoot.querySelector(".btn-cancelar").addEventListener("click", () => {
            this.closest("modal-component")?.remove();
        });

        this.shadowRoot.querySelector(".btn-registrar").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("venta-confirmada", {
                bubbles: true,
                composed: true,
                detail: { generarFactura: this._documento === "factura" }
            }));
        });
    }
}

customElements.define("confirmacion-venta", ConfirmacionVenta);