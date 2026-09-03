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
    }

    static ESTADOS_TABS = ["Cerrada", "Pendiente", "Cancelada"];

    async connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        this.renderShell();
        await this.cargarDatos();
        this.setupListeners();
        this.actualizarTabla();
        this.actualizarTarjetas();

        document.addEventListener("venta-guardada", async () => {
            await this.cargarDatos();
            this.actualizarTabla();
            this.actualizarTarjetas();
        });
    }

    async cargarDatos() {
        try {
            this._ventas = await fetch(`${this.basePath}/ventas`).then(r => r.json());
        } catch (error) {
            console.error("Error al cargar ventas:", error);
        }
    }

    obtenerVentasFiltradas() {
        const busqueda = this._busqueda.trim().toLowerCase();

        let resultado = this._ventas.filter(venta => {
            if (this._estadoSeleccionado && venta.estado !== this._estadoSeleccionado) {
                return false;
            }

            if (busqueda) {
                const coincideNombre = venta.clienteNombre.toLowerCase().includes(busqueda);
                const coincideCuitCuil = (venta.clienteCuitCuil || "").toLowerCase().includes(busqueda);
                if (!coincideNombre && !coincideCuitCuil) return false;
            }

            if (this._fechaDesde && venta.fecha < this._fechaDesde) return false;
            if (this._fechaHasta && venta.fecha > this._fechaHasta) return false;

            return true;
        });

        return resultado.sort((a, b) => b.id - a.id);
    }

    actualizarTarjetas() {
        const tarjetas = this.shadowRoot.querySelector("tarjetas-resumen");

        const total = this._ventas.length;
        const cerradas = this._ventas.filter(v => v.estado === "Cerrada").length;
        const pendientes = this._ventas.filter(v => v.estado === "Pendiente").length;
        const canceladas = this._ventas.filter(v => v.estado === "Cancelada").length;

        tarjetas.tarjetas = [
            { titulo: "Total ventas", valor: total },
            { titulo: "Cerradas", valor: cerradas },
            { titulo: "Pendientes", valor: pendientes },
            { titulo: "Canceladas", valor: canceladas }
        ];
    }

    actualizarTabla() {
        const tabla = this.shadowRoot.querySelector("tabla-generica");

        const coloresEstado = {
            "Cerrada": "#4ADE80",
            "Pendiente": "#FBBF24",
            "Cancelada": "#F87171"
        };

        tabla.columnas = [
            { clave: "id", titulo: "N° venta", formato: valor => `#${String(valor).padStart(5, "0")}` },
            { clave: "clienteNombre", titulo: "Cliente" },
            {
                clave: "estado",
                titulo: "Estado",
                formato: (valor) => `<span style="color:${coloresEstado[valor] || "#888"}; font-weight:600">${valor}</span>`
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

        tabla.datos = this.obtenerVentasFiltradas();
    }

    setupListeners() {
        this.shadowRoot.querySelector("tabla-generica").addEventListener("fila-clickeada", (evento) => {
            this.abrirDetalleVenta(evento.detail);
        });

        this.shadowRoot.querySelector("#filtroBusqueda").addEventListener("input", (e) => {
            this._busqueda = e.target.value;
            this.actualizarTabla();
        });

        this.shadowRoot.querySelector("#fechaDesde").addEventListener("change", (e) => {
            this._fechaDesde = e.target.value;
            this.actualizarTabla();
        });

        this.shadowRoot.querySelector("#fechaHasta").addEventListener("change", (e) => {
            this._fechaHasta = e.target.value;
            this.actualizarTabla();
        });

        this.shadowRoot.querySelectorAll(".tab-estado").forEach(tab => {
            tab.addEventListener("click", () => {
                const valor = tab.dataset.estado || null;
                this._estadoSeleccionado = this._estadoSeleccionado === valor ? null : valor;

                this.shadowRoot.querySelectorAll(".tab-estado").forEach(t => t.classList.remove("activo"));
                if (this._estadoSeleccionado) tab.classList.add("activo");
                else this.shadowRoot.querySelector('.tab-estado[data-estado=""]')?.classList.add("activo");

                this.actualizarTabla();
            });
        });

        this.shadowRoot.querySelector("#limpiarFiltros").addEventListener("click", () => {
            this._busqueda = "";
            this._fechaDesde = "";
            this._fechaHasta = "";
            this._estadoSeleccionado = null;

            this.shadowRoot.querySelector("#filtroBusqueda").value = "";
            this.shadowRoot.querySelector("#fechaDesde").value = "";
            this.shadowRoot.querySelector("#fechaHasta").value = "";
            this.shadowRoot.querySelectorAll(".tab-estado").forEach(t => t.classList.remove("activo"));
            this.shadowRoot.querySelector('.tab-estado[data-estado=""]')?.classList.add("activo");

            this.actualizarTabla();
        });
    }

    abrirDetalleVenta(venta) {
        // Placeholder: acá se conecta el detalle de venta cuando esté armado
        console.log("Ver detalle de venta:", venta);
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
                    background: none;
                    border: none;
                    color: #B8D7FF;
                    text-decoration: underline;
                    cursor: pointer;
                    font-size: .85rem;
                    align-self: flex-start;
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
                        <button class="tab-estado" data-estado="${estado}">${estado === "Cerrada" ? "Cerradas" : estado === "Pendiente" ? "Pendientes" : "Canceladas"}</button>
                    `).join("")}
                </div>

                <button class="btn-limpiar" id="limpiarFiltros">Limpiar filtros</button>

                <tabla-generica></tabla-generica>
            </div>
        `;
    }
}

customElements.define("historial-ventas", HistorialVentas);