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

    render() {
        if (!this._datos) return;
        const d = this._datos;

        this.shadowRoot.innerHTML = `
            <style>
                .contenedor {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    max-height: 60vh;
                    overflow-y: auto;
                }

                .cliente-nombre { font-weight: 700; font-size: 1.05rem; }
                .cliente-sub { font-size: .85rem; color: rgba(255,255,255,.7); }

                .item {
                    display: flex;
                    justify-content: space-between;
                    padding: .5rem 0;
                    border-bottom: 1px solid rgba(255,255,255,.15);
                }

                .item small { display: block; color: rgba(255,255,255,.6); }

                .totales-fila { display: flex; justify-content: space-between; padding: .3rem 0; }
                .total-final { font-weight: 700; font-size: 1.15rem; border-top: 1px solid rgba(255,255,255,.3); padding-top: .5rem; margin-top: .3rem; }

                .documentos {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: .8rem;
                }

                .doc-btn {
                    padding: .8rem;
                    border-radius: 8px;
                    border: 2px solid rgba(255,255,255,.3);
                    background: rgba(255,255,255,.08);
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                }

                .doc-btn.seleccionado {
                    border-color: #37A4FF;
                    background: rgba(55,164,255,.2);
                }

                .acciones {
                    display: flex;
                    justify-content: flex-end;
                    gap: .8rem;
                }

                .acciones button {
                    padding: .6rem 1.4rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                }

                .btn-cancelar { background: transparent; color: white; border: 1px solid rgba(255,255,255,.3); }
                .btn-registrar { background: #37A4FF; color: white; border: none; }
            </style>

            <div class="contenedor">
                <div>
                    <div class="cliente-nombre">${d.cliente.nombreCompleto}</div>
                    <div class="cliente-sub">${d.cliente.email || "Sin email"} · CUIT/CUIL: ${d.cliente.cuitCuil}</div>
                </div>

                <div>
                    ${d.carrito.map(item => `
                        <div class="item">
                            <div>
                                ${item.nombre}
                                <small>${item.cantidad} x $${item.precioUnitario.toLocaleString("es-AR")}</small>
                            </div>
                            <span>$${(item.precioUnitario * item.cantidad).toLocaleString("es-AR")}</span>
                        </div>
                    `).join("")}
                </div>

                <div>
                    <div class="totales-fila"><span>Subtotal</span><span>$${d.subtotal.toLocaleString("es-AR")}</span></div>
                    <div class="totales-fila"><span>Descuento global (${d.descuentoGlobal}%)</span><span>-$${d.montoDescuento.toLocaleString("es-AR")}</span></div>
                    <div class="totales-fila total-final"><span>Total</span><span>$${d.total.toLocaleString("es-AR")}</span></div>
                </div>

                <div>Método de pago: <strong>${d.metodoPago}</strong></div>

                <div class="documentos">
                    <button type="button" class="doc-btn" data-doc="factura">🧾 Factura interna</button>
                    <button type="button" class="doc-btn seleccionado" data-doc="sin">Sin documento</button>
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