class ListadoServicios extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._tecnicos = [];
        this._asesoramientos = [];
        this._subrubros = [];
        this._tipoSeleccionado = "todos";
        this._busqueda = "";
        this._subrubroSeleccionado = "";
        this._estadoSeleccionado = "";
        this._fechaDesde = "";
    }

    async connectedCallback() {
        this.renderShell();
        await this.cargarDatos();
        this.setupListeners();
        this.actualizarTabla();
        this.actualizarTarjetas();

        document.addEventListener("servicio-guardado", async () => {
            await this.cargarDatos();
            this.actualizarTabla();
            this.actualizarTarjetas();
        });
    }

    async cargarDatos() {
        try {
            const [tecnicos, asesoramientos, subrubros] = await Promise.all([
                fetch("servicios/tecnicos").then(r => r.json()),
                fetch("servicios/asesoramientos").then(r => r.json()),
                fetch("subrubros-servicio-tecnico").then(r => r.json())
            ]);
            this._tecnicos = tecnicos;
            this._asesoramientos = asesoramientos;
            this._subrubros = subrubros;
            this.cargarOpcionesSubrubro();
        } catch (error) {
            console.error("Error al cargar servicios:", error);
        }
    }

    cargarOpcionesSubrubro() {
        const select = this.shadowRoot.querySelector("#filtroSubrubro");
        select.innerHTML = `
            <option value="">Todos</option>
            ${this._subrubros.map(s => `<option value="${s.id}">${s.nombre}</option>`).join("")}
        `;
    }

    obtenerNombreCliente(c) {
        return c.nombre ? `${c.nombre} ${c.apellido}` : c.razonSocial;
    }

    etiquetaEstado(nombre) {
        const e = (nombre || "").toLowerCase();
        if (e === "cerrada") return "Completado";
        if (e === "cancelada") return "Cancelado";
        return "Pendiente";
    }

    colorEstado(nombre) {
        const e = (nombre || "").toLowerCase();
        if (e === "cerrada") return "#4ADE80";
        if (e === "cancelada") return "#F87171";
        return "#FBBF24";
    }

    colorSubrubro(nombre) {
        const colores = { "Bomba": "#37A4FF", "Piscina": "#FBBF24", "Reparación": "#FB923C" };
        return colores[nombre] || "#888888";
    }

    formatearFecha(fecha) {
        if (!fecha) return "-";

        // Si viene con hora (fecha_inicio, tipo DATETIME), new Date la interpreta bien.
        // Si viene solo como "YYYY-MM-DD" (fecha_cierre, tipo DATE), hay que armar
        // la fecha a mano para que no la interprete como medianoche UTC.
        const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(fecha);

        const d = soloFecha
            ? new Date(...fecha.split("-").map((v, i) => i === 1 ? Number(v) - 1 : Number(v)))
            : new Date(fecha);

        return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
    }

    // combina ambas listas en filas planas con un campo "tipo" discriminador
    obtenerFilasCombinadas() {
        const filasTecnicas = this._tecnicos.map(v => ({
            tipo: "tecnico",
            codigo: `T-${String(v.id).padStart(3, "0")}`,
            cliente: this.obtenerNombreCliente(v.cliente),
            telefono: v.cliente.telefono || "",
            tipoInfo: { tipo: "tecnico", subrubro: v.subrubroServicio?.nombre || "" },
            subrubroId: v.subrubroServicio?.id ?? null,
            estadoNombre: v.estadoVenta.nombre,
            inicio: v.fechaInicio,
            cierre: v.fechaCierre,
            descripcion: v.problema || "",
            total: v.total
        }));

        const filasAsesoramiento = this._asesoramientos.map(v => ({
            tipo: "asesoramiento",
            codigo: `A-${String(v.id).padStart(3, "0")}`,
            cliente: this.obtenerNombreCliente(v.cliente),
            telefono: v.cliente.telefono || "",
            tipoInfo: { tipo: "asesoramiento", subrubro: "" },
            subrubroId: null,
            estadoNombre: v.estadoVenta.nombre,
            inicio: v.fechaInicio,
            cierre: v.fechaCierre,
            descripcion: v.problema || "",
            total: v.cobrado ? v.total : null
        }));

        return [...filasTecnicas, ...filasAsesoramiento];
    }

    obtenerFilasFiltradas() {
        const busqueda = this._busqueda.trim().toLowerCase();

        return this.obtenerFilasCombinadas().filter(fila => {
            if (this._tipoSeleccionado !== "todos" && fila.tipo !== this._tipoSeleccionado) return false;

            if (this._subrubroSeleccionado && String(fila.subrubroId) !== this._subrubroSeleccionado) return false;

            if (this._estadoSeleccionado && fila.estadoNombre.toLowerCase() !== this._estadoSeleccionado) return false;

            if (busqueda) {
                const coincide = fila.cliente.toLowerCase().includes(busqueda) || fila.telefono.toLowerCase().includes(busqueda);
                if (!coincide) return false;
            }

            if (this._fechaDesde) {
                const inicio = new Date(fila.inicio);
                const desde = new Date(this._fechaDesde);
                if (inicio < desde) return false;
            }

            return true;
        });
    }

    actualizarTarjetas() {
        const tarjetas = this.shadowRoot.querySelector("tarjetas-resumen");
        const todas = this.obtenerFilasCombinadas();

        // const tecnicosCompletados = todas.filter(f => f.tipo === "tecnico" && f.estadoNombre.toLowerCase() === "cerrada").length;
        // const tecnicosCancelados = todas.filter(f => f.tipo === "tecnico" && f.estadoNombre.toLowerCase() === "cancelada").length;
        const totalTecnicos = this._tecnicos.length;
        const totalAsesoramientos = this._asesoramientos.length;

        tarjetas.tarjetas = [
            { titulo: "Total de servicios", valor: todas.length },
            { titulo: "Servicios Técnicos", valor: totalTecnicos, subTitulo: "REGISTROS" },
            { titulo: "Asesoramientos", valor: totalAsesoramientos, subTitulo: "REGISTROS" }
        ];
    }

    actualizarTabla() {
        const tabla = this.shadowRoot.querySelector("tabla-generica");

        tabla.columnas = [
            { clave: "codigo", titulo: "N°", ancho: "8%" },
            { clave: "cliente", titulo: "Cliente", ancho: "15%" },
            {
                clave: "tipoInfo",
                titulo: "Tipo",
                ancho: "14%",
                formato: (valor) => {
                    if (valor.tipo === "tecnico") {
                        const color = this.colorSubrubro(valor.subrubro);
                        return `<div><span style="color:#37A4FF;font-weight:600">Serv. Téc.</span><br>
                                <span style="color:${color};font-size:.85em">${valor.subrubro}</span></div>`;
                    }
                    return `<span style="color:#E85FC9;font-weight:600">Asesoram.</span>`;
                }
            },
            {
                clave: "estadoNombre",
                titulo: "Estado",
                ancho: "11%",
                formato: (valor) => {
                    const color = this.colorEstado(valor);
                    return `<span style="color:${color};font-weight:700">${this.etiquetaEstado(valor)}</span>`;
                }
            },
            {
                clave: "inicio",
                titulo: "Inicio",
                ancho: "13%",
                formato: (valor) => this.formatearFecha(valor)
            },
            {
                clave: "cierre",
                titulo: "Cierre",
                ancho: "13%",
                formato: (valor) => this.formatearFecha(valor)
            },
            {
                clave: "descripcion",
                titulo: "Descripción",
                ancho: "18%",
                formato: (valor) => valor.length > 50 ? valor.slice(0, 50) + "…" : valor
            },
            {
                clave: "total",
                titulo: "Total",
                ancho: "8%",
                formato: (valor) => valor != null ? `$${Number(valor).toLocaleString("es-AR")}` : "-"
            }
        ];

        tabla.datos = this.obtenerFilasFiltradas();
    }

    setupListeners() {
        this.shadowRoot.querySelectorAll(".tab-tipo").forEach(tab => {
            tab.addEventListener("click", () => {
                this.shadowRoot.querySelectorAll(".tab-tipo").forEach(t => t.classList.remove("activo"));
                tab.classList.add("activo");
                this._tipoSeleccionado = tab.dataset.tipo;
                this.actualizarTabla();
            });
        });

        this.shadowRoot.querySelector("#filtroBusqueda").addEventListener("input", (e) => {
            this._busqueda = e.target.value;
            this.actualizarTabla();
        });

        this.shadowRoot.querySelector("#filtroSubrubro").addEventListener("change", (e) => {
            this._subrubroSeleccionado = e.target.value;
            this.actualizarTabla();
        });

        this.shadowRoot.querySelector("#filtroEstado").addEventListener("change", (e) => {
            this._estadoSeleccionado = e.target.value;
            this.actualizarTabla();
        });

        this.shadowRoot.querySelector("#filtroFecha").addEventListener("change", (e) => {
            this._fechaDesde = e.target.value;
            this.actualizarTabla();
        });

        this.shadowRoot.querySelector("tabla-generica").addEventListener("fila-clickeada", (evento) => {
            console.log("Fila clickeada:", evento.detail);
            // TODO: abrir detalle de servicio tecnico o asesoramiento segun evento.detail.tipo
        });
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

                .tabs {
                    display: flex;
                    gap: .5rem;
                }

                .tab-tipo {
                    padding: .6rem 1.4rem;
                    border: 1px solid rgba(255,255,255,.4);
                    background: rgba(1, 49, 104, 1);
                    color: white;
                    cursor: pointer;
                    font-size: .9rem;
                    transition: .2s;
                    border-radius: 30px;
                }

                .tab-tipo.activo {
                    background: rgba(9, 77, 154, 1);
                    font-weight: 600;
                }
        
                .tab-tipo:hover {
                    background: rgba(1, 49, 104, 0.5);
                }
       
                .card-filtros {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
                    gap: 1rem;
                    padding: 1rem 1.25rem;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,.5);
                    background: rgba(1, 49, 104, 1);
                }

                .card-filtros label {
                    display: block;
                    font-size: .72rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: rgba(255,255,255,.6);
                    margin-bottom: .3rem;
                }

                .card-filtros input,
                .card-filtros select {
                    width: 100%;
                    box-sizing: border-box;
                    padding: .55rem .7rem;
                    border-radius: 6px;
                    border: 1px solid rgba(255,255,255,.2);
                    background: rgba(255,255,255,.08);
                    color: white;
                    font-size: .9rem;
                    outline: none;
                }

                .card-filtros select option {
                    color: black;
                    background: white;
                }

                .card-filtros input::placeholder {
                    color: rgba(255,255,255,.6);
                }
            </style>

            <div class="contenedor">
                <tarjetas-resumen></tarjetas-resumen>

                <div class="tabs">
                    <button type="button" class="tab-tipo activo" data-tipo="todos">Todos</button>
                    <button type="button" class="tab-tipo" data-tipo="tecnico">Serv. Técnico</button>
                    <button type="button" class="tab-tipo" data-tipo="asesoramiento">Asesoramientos</button>
                </div>

                <div class="card-filtros">
                    <div>
                        <label>Buscar cliente</label>
                        <input type="text" id="filtroBusqueda" placeholder="Nombre o teléfono...">
                    </div>
                    <div>
                        <label>Subrubro</label>
                        <select id="filtroSubrubro"><option value="">Todos</option></select>
                    </div>
                    <div>
                        <label>Estado</label>
                        <select id="filtroEstado">
                            <option value="">Todos</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="cerrada">Completado</option>
                            <option value="cancelada">Cancelado</option>
                        </select>
                    </div>
                    <div>
                        <label>Fecha desde</label>
                        <input type="date" id="filtroFecha">
                    </div>
                </div>

                <tabla-generica></tabla-generica>
            </div>
        `;
    }
}

customElements.define("listado-servicios", ListadoServicios);