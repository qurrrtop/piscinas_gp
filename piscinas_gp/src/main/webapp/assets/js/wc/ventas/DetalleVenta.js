class DetalleVenta extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";
        this._venta = null;
    }

    set venta(valor) {
        this._venta = valor;
        this.render();
    }

    connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        this.render();
    }

    obtenerIniciales(nombre) {
        const partes = (nombre || "").trim().split(" ");
        return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase();
    }

    colorEstado(estado) {
        const e = (estado || "").toLowerCase();
        if (e === "cerrada") return "#4ADE80";
        if (e === "pendiente") return "#FBBF24";
        return "#F87171";
    }

    colorCategoria(nombre) {
        const colores = { "Químico": "#4ADE80", "Repuesto": "#FB923C", "Accesorios de Instalación": "#A855F7" };
        return colores[nombre] || "#888888";
    }

    capitalizar(texto) {
        if (!texto) return "";
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    setupListeners() {
        this.shadowRoot.querySelector("#btnCancelarVenta")?.addEventListener("click", async () => {
            try {
                const response = await fetch(`${this.basePath}/ventas/productos/${this._venta.id}`, { method: "DELETE" });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Error al cancelar la venta");

                document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                    detail: { mensaje: "Venta cancelada correctamente", tipo: "exito" }
                }));
                document.dispatchEvent(new CustomEvent("venta-guardada", { bubbles: true, composed: true }));

                const modal = this.closest("modal-component") || document.querySelector("modal-component");
                if (modal) modal.remove();

            } catch (error) {
                document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                    detail: { mensaje: error.message, tipo: "error" }
                }));
            }
        });

        this.shadowRoot.querySelector("#btnVerFactura")?.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: "La generación de facturas no está disponible todavía", tipo: "error" }
            }));
        });

        this.shadowRoot.querySelector("#btnEditarVenta")?.addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("editar-venta", {
                detail: this._venta,
                bubbles: true,
                composed: true
            }));
        });
    }

    render() {
        if (!this._venta) {
            this.shadowRoot.innerHTML = `<p style="color:white;padding:1rem">Cargando...</p>`;
            return;
        }

        const v = this._venta;
        const c = v.cliente;
        const colorEst = this.colorEstado(v.estado);
        const estaCancelada = (v.estado || "").toLowerCase() === "cancelada";

        this.shadowRoot.innerHTML = `
            <style>
                .detalle {
                    display: flex;
                    flex-direction: column;
                    gap: 1.2rem;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                .encabezado {
                    display: flex;
                    align-items: center;
                    gap: .8rem;
                }

                .encabezado h3 {
                    margin: 0;
                    font-size: 1.3rem;
                }

                .badge-estado {
                    padding: .25rem .8rem;
                    border-radius: 20px;
                    font-size: .78rem;
                    font-weight: 700;
                    background: ${colorEst}22;
                    color: ${colorEst};
                }

                .grid-info {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(255,255,255,.2);
                }

                .grid-info label {
                    display: block;
                    font-size: .72rem;
                    text-transform: uppercase;
                    color: #B8D7FF;
                    margin-bottom: .3rem;
                    font-weight: 700;
                }

                .grid-info .valor {
                    font-weight: 600;
                }

                .titulo-seccion {
                    font-size: .82rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: .04em;
                    color: #B8D7FF;
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
                }

                .avatar-particular { background: linear-gradient(160deg, #5FD9E8, #0B5C7A); }
                .avatar-empresa { background: linear-gradient(160deg, #E85FC9, #6A1B6E); }

                .cliente-info strong { display: block; }
                .cliente-info small { color: rgba(255,255,255,.7); font-size: .8rem; }

                .badge-tipo {
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
                }

                table.tabla-productos thead th {
                    text-align: left;
                    font-size: .72rem;
                    text-transform: uppercase;
                    color: #B8D7FF;
                    padding-bottom: .5rem;
                    border-bottom: 1px solid rgba(255,255,255,.25);
                }

                table.tabla-productos thead th.col-num { text-align: right; }

                table.tabla-productos tbody td {
                    padding: .7rem 0;
                    border-bottom: 1px solid rgba(255,255,255,.1);
                    vertical-align: top;
                }

                table.tabla-productos tbody td.col-num { text-align: right; white-space: nowrap; }

                .badges-producto { display: flex; gap: .35rem; margin-top: .35rem; }

                .badge-mini {
                    font-size: .65rem;
                    font-weight: 700;
                    padding: .12rem .5rem;
                    border-radius: 20px;
                }

                .totales {
                    align-self: flex-end;
                    width: 260px;
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

                .caja-observaciones {
                    background: rgba(255,255,255,.06);
                    border-radius: 8px;
                    padding: .8rem 1rem;
                    font-size: .88rem;
                    color: rgba(255,255,255,.85);
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
                    border: none;
                }

                .acciones button:disabled {
                    opacity: .4;
                    cursor: not-allowed;
                }

                #btnCancelarVenta { background: #F87171; color: white; }
                #btnVerFactura { background: rgba(255,255,255,.12); color: white; border: 1px solid rgba(255,255,255,.3); }
                #btnEditarVenta { background: #37E0E0; color: #05448D; }
            </style>

            <div class="detalle">
                <div class="encabezado">
                    <h3>#${String(v.id).padStart(5, "0")}</h3>
                    <span class="badge-estado">${this.capitalizar(v.estado)}</span>
                </div>

                <div class="grid-info">
                    <div><label>Fecha</label><div class="valor">${new Date(v.fecha).toLocaleDateString("es-AR")}</div></div>
                    <div><label>Método de pago</label><div class="valor">${this.capitalizar(v.metodoPago)}</div></div>
                    <div><label>Estado</label><div class="valor" style="color:${colorEst}">${this.capitalizar(v.estado)}</div></div>
                </div>

                <div>
                    <div class="titulo-seccion" style="margin-bottom:.6rem">Cliente</div>
                    <div class="cliente-chip">
                        <span class="avatar avatar-${c.tipo === 'Empresa' ? 'empresa' : 'particular'}">${this.obtenerIniciales(c.nombreCompleto)}</span>
                        <div class="cliente-info">
                            <strong>${c.nombreCompleto}</strong>
                            <small>${c.email || "Sin email"} · ${c.telefono || "Sin teléfono"} · CUIL/CUIT: ${c.cuitCuil}</small>
                        </div>
                        <span class="badge-tipo">${c.tipo}</span>
                    </div>
                </div>

                <div>
                    <div class="titulo-seccion" style="margin-bottom:.6rem">Productos</div>
                    <table class="tabla-productos">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th class="col-num">Precio unit.</th>
                                <th class="col-num">Cant.</th>
                                <th class="col-num">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${v.detallesVenta.map(d => `
                                <tr>
                                    <td>
                                        <strong>${d.productoNombre}</strong>
                                        <div class="badges-producto">
                                            ${d.categoria ? `<span class="badge-mini" style="background:${this.colorCategoria(d.categoria)}22;color:${this.colorCategoria(d.categoria)}">${d.categoria}</span>` : ""}
                                            ${d.marca ? `<span class="badge-mini" style="background:rgba(255,255,255,.1)">${d.marca}</span>` : ""}
                                        </div>
                                    </td>
                                    <td class="col-num">$${Number(d.precioUnitario).toLocaleString("es-AR")}</td>
                                    <td class="col-num">${d.cantidad}</td>
                                    <td class="col-num">$${Number(d.subtotal).toLocaleString("es-AR")}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>

                <div class="totales">
                    <div class="totales-fila"><span>Subtotal</span><span>$${Number(v.subtotal).toLocaleString("es-AR")}</span></div>
                    <div class="totales-fila"><span>Descuento global</span><span>-$${Number(v.subtotal - v.total).toLocaleString("es-AR")}</span></div>
                    <div class="totales-fila total"><span>Total</span><span>$${Number(v.total).toLocaleString("es-AR")}</span></div>
                </div>

                <div>
                    <div class="titulo-seccion" style="margin-bottom:.5rem">Observaciones</div>
                    <div class="caja-observaciones">${v.observacion || "Sin observaciones."}</div>
                </div>

                <div class="acciones">
                    <button type="button" id="btnCancelarVenta" ${estaCancelada ? "disabled" : ""}>✕ Cancelar venta</button>
                    <button type="button" id="btnVerFactura">📄 Ver factura</button>
                    <button type="button" id="btnEditarVenta" ${estaCancelada ? "disabled" : ""}>✎ Editar</button>
                </div>
            </div>
        `;

        this.setupListeners();
    }
}

customElements.define("detalle-venta", DetalleVenta);