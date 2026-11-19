class HistorialVentas extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._ventas = [];
        this._busqueda = "";
        this._estadoSeleccionado = null;
        this._fechaDesde = "";
        this._fechaHasta = "";
        this.basePath = "";
        this._resumen = { total: 0, cerradas: 0, canceladas: 0 };
        this._pagina = 1;
        this._tamano = 10;
        this._total = 0;
        this._reqId = 0;
        this._timerBusqueda = null;
    }
    
    capitalizar(texto) {
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    static ESTADOS_TABS = ["Cerrada", "Cancelada"];

    async connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        this.renderShell();
        await Promise.all([this.cargarResumen(), this.cargarDatos()]);
        this.setupListeners();
        this.actualizarTabla();
        this.actualizarTarjetas();

        this._onCambio = () => this.recargarTodo();
        document.addEventListener("venta-guardada", this._onCambio);
    }

    disconnectedCallback() {
        document.removeEventListener("venta-guardada", this._onCambio);
    }

    async cargarResumen() {
        try {
            this._resumen = await fetch(`${this.basePath}/ventas/productos/resumen`).then(r => r.json());
        } catch (error) {
            console.error("Error al cargar el resumen de ventas:", error);
        }
    }

    async cargarDatos() {
        const id = ++this._reqId; // ignora respuestas viejas si tipeás rápido

        const params = new URLSearchParams({ page: this._pagina, size: this._tamano });
        if (this._busqueda.trim()) params.set("cliente", this._busqueda.trim());
        if (this._estadoSeleccionado) params.set("estado", this._estadoSeleccionado.toLowerCase());
        if (this._fechaDesde) params.set("fechaDesde", this._fechaDesde);
        if (this._fechaHasta) params.set("fechaHasta", this._fechaHasta);

        try {
            const data = await fetch(`${this.basePath}/ventas/productos?${params}`).then(r => r.json());
            if (id !== this._reqId) return;

            this._ventas = data.datos;
            this._total = data.total;

            const totalPaginas = Math.max(1, Math.ceil(this._total / this._tamano));
            if (this._pagina > totalPaginas) {
                this._pagina = totalPaginas;
                await this.cargarDatos();
            }
        } catch (error) {
            console.error("Error al cargar ventas:", error);
        }
    }

    async refrescarTabla() {
        await this.cargarDatos();
        this.actualizarTabla();
    }

    async recargarTodo() {
        await Promise.all([this.cargarResumen(), this.cargarDatos()]);
        this.actualizarTabla();
        this.actualizarTarjetas();
    }

    actualizarTarjetas() {
        const tarjetas = this.shadowRoot.querySelector("tarjetas-resumen");
        const r = this._resumen;

        tarjetas.tarjetas = [
            { titulo: "Total ventas", valor: r.total },
            { titulo: "Cerradas", valor: r.cerradas },
            { titulo: "Canceladas", valor: r.canceladas }
        ];
    }

    actualizarTabla() {
        const tabla = this.shadowRoot.querySelector("tabla-generica");

        const coloresEstado = {
            "Cerrada": "rgba(19, 99, 18)",
            "Pendiente": "rgba(130, 119, 5)",
            "Cancelada": "rgba(145, 34, 26)"
        };

        tabla.columnas = [
            { clave: "id", titulo: "N° venta", formato: valor => `#${String(valor).padStart(5, "0")}` },
            { clave: "cliente", titulo: "Cliente" },
            {
                clave: "estado",
                titulo: "Estado",
                formato: (valor) => {
                    const estado = this.capitalizar(valor);
                    const color = coloresEstado[estado] || "rgba(136, 136, 136)";

                    return `<span style="
                        color:${color};
                        background:${color.replace(")", ", 0.22)")};
                        padding:.25rem .7rem;
                        border-radius:20px;
                        font-weight:600
                    ">${estado}</span>`;
                }
            },
            {
                clave: "fecha",
                titulo: "Fecha",
                formato: (valor) => new Date(valor).toLocaleDateString("es-AR")
            },
            {
                clave: "total",
                titulo: "Total",
                formato: (valor) => `$${Number(valor).toLocaleString("es-AR")}`
            }
        ];

        tabla.paginacion = { pagina: this._pagina, total: this._total, tamano: this._tamano };
        tabla.datos = this._ventas;
    }

    setupListeners() {
        const tabla = this.shadowRoot.querySelector("tabla-generica");

        tabla.addEventListener("fila-clickeada", (evento) => {
            this.abrirDetalleVenta(evento.detail);
        });

        tabla.addEventListener("cambiar-pagina", (e) => {
            this._pagina = e.detail;
            this.refrescarTabla();
        });

        // debounce: espera 300 ms sin tipear antes de consultar
        this.shadowRoot.querySelector("#filtroBusqueda").addEventListener("input", (e) => {
            this._busqueda = e.target.value;
            clearTimeout(this._timerBusqueda);
            this._timerBusqueda = setTimeout(() => {
                this._pagina = 1;
                this.refrescarTabla();
            }, 300);
        });

        this.shadowRoot.querySelector("#fechaDesde").addEventListener("change", (e) => {
            this._fechaDesde = e.target.value;
            this._pagina = 1;
            this.refrescarTabla();
        });

        this.shadowRoot.querySelector("#fechaHasta").addEventListener("change", (e) => {
            this._fechaHasta = e.target.value;
            this._pagina = 1;
            this.refrescarTabla();
        });

        this.shadowRoot.querySelectorAll(".tab-estado").forEach(tab => {
            tab.addEventListener("click", () => {
                const valor = tab.dataset.estado || null;
                this._estadoSeleccionado = this._estadoSeleccionado === valor ? null : valor;

                this.shadowRoot.querySelectorAll(".tab-estado").forEach(t => t.classList.remove("activo"));
                if (this._estadoSeleccionado) tab.classList.add("activo");
                else this.shadowRoot.querySelector('.tab-estado[data-estado=""]')?.classList.add("activo");

                this._pagina = 1;
                this.refrescarTabla();
            });
        });

        this.shadowRoot.querySelector("#limpiarFiltros").addEventListener("click", () => {
            this._busqueda = "";
            this._fechaDesde = "";
            this._fechaHasta = "";
            this._estadoSeleccionado = null;
            this._pagina = 1;

            this.shadowRoot.querySelector("#filtroBusqueda").value = "";
            this.shadowRoot.querySelector("#fechaDesde").value = "";
            this.shadowRoot.querySelector("#fechaHasta").value = "";

            this.shadowRoot.querySelectorAll(".tab-estado").forEach(t => t.classList.remove("activo"));
            this.shadowRoot.querySelector('.tab-estado[data-estado=""]')?.classList.add("activo");

            this.refrescarTabla();
        });
    }

    async abrirDetalleVenta(ventaResumen) {
        const modal = document.createElement("modal-component");
        modal.setAttribute("titulo", `Venta #${String(ventaResumen.id).padStart(5, "0")}`);
        modal.setAttribute("subTitulo", "DETALLE DE VENTA");

        const detalle = document.createElement("detalle-venta");
        detalle.setAttribute("base-path", this.basePath);

        detalle.addEventListener("editar-venta", (evento) => {
            modal.remove();
            // acá se conecta el flujo de edición cuando lo armemos
            console.log("Editar venta:", evento.detail);
        });

        modal.appendChild(detalle);
        document.body.appendChild(modal);

        try {
            const response = await fetch(`${this.basePath}/ventas/productos/${ventaResumen.id}`);

            console.log("STATUS DETALLE:", response.status);

            const ventaCompleta = await response.json();

            console.log("DETALLE VENTA RECIBIDO:", ventaCompleta);
            console.log("DETALLE PRIMER PRODUCTO:", ventaCompleta.detallesVenta[0]);

            detalle.venta = ventaCompleta;
        } catch (error) {
            console.error("Error al cargar el detalle de la venta:", error);
        }
    }

    renderShell() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    margin-top: 30px;
                }

                .contenedor {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    color: white;
                }

                .card-filtros {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr;
                    gap: 1rem;
                    padding: 1rem 1.25rem;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,.5);
                    background: rgba(1, 49, 104, 1);
                }

                .card-filtros input {
                    padding: .55rem .7rem;
                    border-radius: 6px;
                    border: 1px solid rgba(255,255,255,.2);
                    background: rgba(255,255,255,.08);
                    color: white;
                    font-size: .9rem;
                    outline: none;
                }

                .card-filtros input::placeholder {
                    color: rgba(255,255,255,.6);
                }

                .grupo-fechas {
                    display: flex;
                    align-items: center;
                    gap: .5rem;
                }

                .grupo-fechas label {
                    font-size: .85rem;
                    white-space: nowrap;
                }

                .fila-tabs {
                    display: flex;
                    align-items: center;
                    gap: .75rem;
                    flex-wrap: wrap;
                }

                .tab-estado {
                    padding: .6rem 1.4rem;
                    border-radius: 30px;
                    border: 1px solid rgba(255,255,255,.4);
                    background: rgba(1, 49, 104, 1);
                    color: white;
                    cursor: pointer;
                    font-size: .9rem;
                    font-weight: 600;
                    transition: .2s;
                }

                .tab-estado:hover {
                    background: rgba(1, 49, 104, .5);
                }

                .tab-estado.activo {
                    background: rgba(9, 77, 154, 1);
                }

                .btn-limpiar {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,.3);
                    color: white;
                    padding: .6rem 1.2rem;
                    border-radius: 30px;
                    cursor: pointer;
                    font-size: .85rem;
                    margin-left: auto;
                }

                .btn-limpiar:hover {
                    background: rgba(255,255,255,.08);
                }
            </style>

            <div class="contenedor">
                <tarjetas-resumen></tarjetas-resumen>

                <div class="card-filtros">
                    <input type="text" id="filtroBusqueda" placeholder="Buscar por cliente, CUIT o CUIL...">

                    <div class="grupo-fechas">
                        <label>Desde</label>
                        <input type="date" id="fechaDesde">
                    </div>

                    <div class="grupo-fechas">
                        <label>Hasta</label>
                        <input type="date" id="fechaHasta">
                    </div>
                </div>

                <div class="fila-tabs">
                    <button class="tab-estado activo" data-estado="">Todas</button>
                    ${HistorialVentas.ESTADOS_TABS.map(estado => `
                        <button class="tab-estado" data-estado="${estado}">${estado === "Cerrada" ? "Cerradas" : "Canceladas"}</button>
                    `).join("")}
                    <button class="btn-limpiar" id="limpiarFiltros">Limpiar filtros</button>
                </div>
        
                <tabla-generica></tabla-generica>
            </div>
        `;
    }
}

customElements.define("historial-ventas", HistorialVentas);