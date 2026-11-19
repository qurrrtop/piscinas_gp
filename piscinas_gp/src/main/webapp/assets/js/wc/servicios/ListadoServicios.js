class ListadoServicios extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._subrubros = [];
        this._tipoSeleccionado = "todos";
        this._busqueda = "";
        this._subrubroSeleccionado = "";
        this._estadoSeleccionado = "";
        this._fechaDesde = "";
        this._filas = [];
        this._resumen = { total: 0, tecnicos: 0, asesoramientos: 0 };
        this._pagina = 1;
        this._tamano = 10;
        this._total = 0;
        this._reqId = 0;
        this._timerBusqueda = null;
    }

    async connectedCallback() {
        this.renderShell();
        await Promise.all([this.cargarSubrubros(), this.cargarResumen(), this.cargarServicios()]);
        this.setupListeners();
        this.actualizarTabla();
        this.actualizarTarjetas();

        this._onCambio = () => this.recargarTodo();
        document.addEventListener("servicio-guardado", this._onCambio);
    }

    disconnectedCallback() {
        document.removeEventListener("servicio-guardado", this._onCambio);
    }

    async cargarSubrubros() {
        try {
            this._subrubros = await fetch("subrubros-servicio-tecnico").then(r => r.json());
            this.cargarOpcionesSubrubro();
        } catch (error) {
            console.error("Error al cargar subrubros:", error);
        }
    }

    async cargarResumen() {
        try {
            this._resumen = await fetch("servicios/historial/resumen").then(r => r.json());
        } catch (error) {
            console.error("Error al cargar el resumen de servicios:", error);
        }
    }

    async cargarServicios() {
        const id = ++this._reqId; // ignora respuestas viejas si tipeás rápido

        const params = new URLSearchParams({ page: this._pagina, size: this._tamano });
        if (this._busqueda.trim()) params.set("q", this._busqueda.trim());
        if (this._tipoSeleccionado !== "todos") params.set("tipo", this._tipoSeleccionado);
        if (this._subrubroSeleccionado) params.set("subrubroId", this._subrubroSeleccionado);
        if (this._estadoSeleccionado) params.set("estado", this._estadoSeleccionado);
        if (this._fechaDesde) params.set("fechaDesde", this._fechaDesde);

        try {
            const data = await fetch("servicios/historial?" + params).then(r => r.json());
            if (id !== this._reqId) return;

            // se arman los campos que usan las columnas de la tabla
            this._filas = data.datos.map(s => ({
                id: s.id,
                tipo: s.tipo,
                codigo: `${s.tipo === "tecnico" ? "T" : "A"}-${String(s.id).padStart(3, "0")}`,
                cliente: s.cliente,
                telefono: s.telefono || "",
                tipoInfo: { tipo: s.tipo, subrubro: s.subrubro || "" },
                estadoNombre: s.estadoNombre,
                inicio: s.inicio,
                cierre: s.cierre,
                descripcion: s.descripcion || "",
                total: s.total
            }));
            this._total = data.total;

            const totalPaginas = Math.max(1, Math.ceil(this._total / this._tamano));
            if (this._pagina > totalPaginas) {
                this._pagina = totalPaginas;
                await this.cargarServicios();
            }
        } catch (error) {
            console.error("Error al cargar servicios:", error);
        }
    }

    async refrescarTabla() {
        await this.cargarServicios();
        this.actualizarTabla();
    }

    async recargarTodo() {
        await Promise.all([this.cargarResumen(), this.cargarServicios()]);
        this.actualizarTabla();
        this.actualizarTarjetas();
    }

    cargarOpcionesSubrubro() {
        const select = this.shadowRoot.querySelector("#filtroSubrubro");
        select.innerHTML = `
            <option value="">Todos</option>
            ${this._subrubros.map(s => `<option value="${s.id}">${s.nombre}</option>`).join("")}
        `;
    }
    
    etiquetaEstado(nombre) {
        const e = (nombre || "").toLowerCase();
        if (e === "cerrada") return "Completado";
        if (e === "cancelada") return "Cancelado";
        return "Pendiente";
    }
    
    colorTecnico() {
        return "#1D4ED8";
    }

    // Tonos más oscuros que los del modal, para que se lean sobre el fondo claro de la tabla
    colorEstado(nombre) {
        const e = (nombre || "").toLowerCase();
        if (e === "cerrada") return "#136312";
        if (e === "cancelada") return "#91221A";
        return "#827705";
    }

    colorSubrubro() {
        return this.colorTecnico();
    }

    // Píldora con fondo suave, borde y texto del mismo color.
    // Va con estilos en línea porque la tabla la dibuja dentro de su propio shadow DOM.
    pildora(texto, color) {
        return `<span style="
            color:${color};
            background:${color}38;
            padding:.25rem .7rem;
            border-radius:20px;
            font-weight:600;
            white-space:nowrap
        ">${texto}</span>`;
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

    actualizarTarjetas() {
        const tarjetas = this.shadowRoot.querySelector("tarjetas-resumen");
        const r = this._resumen;

        tarjetas.tarjetas = [
            { titulo: "Total de servicios", valor: r.total },
            { titulo: "Servicios Técnicos", valor: r.tecnicos, subTitulo: "REGISTROS" },
            { titulo: "Asesoramientos", valor: r.asesoramientos, subTitulo: "REGISTROS" }
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
                        const subrubro = valor.subrubro
                            ? this.pildora(valor.subrubro, this.colorSubrubro())
                            : "";

                        return `<div style="display:flex;flex-direction:column;align-items:flex-start;gap:.3rem">
                                    ${this.pildora("Serv. Téc.", this.colorTecnico())}
                                    ${subrubro}
                                </div>`;
                    }
                    return this.pildora("Asesoram.", "#A21CAF");
                }
            },
            {
                clave: "estadoNombre",
                titulo: "Estado",
                ancho: "11%",
                formato: (valor) => this.pildora(this.etiquetaEstado(valor), this.colorEstado(valor))
            },
            {
                clave: "inicio",
                titulo: "Fecha creación",
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

        tabla.paginacion = { pagina: this._pagina, total: this._total, tamano: this._tamano };
        tabla.datos = this._filas;
    }

    setupListeners() {
        const tabla = this.shadowRoot.querySelector("tabla-generica");

        tabla.addEventListener("cambiar-pagina", (e) => {
            this._pagina = e.detail;
            this.refrescarTabla();
        });

        this.shadowRoot.querySelectorAll(".tab-tipo").forEach(tab => {
            tab.addEventListener("click", () => {
                this.shadowRoot.querySelectorAll(".tab-tipo").forEach(t => t.classList.remove("activo"));
                tab.classList.add("activo");
                this._tipoSeleccionado = tab.dataset.tipo;
                this._pagina = 1;
                this.refrescarTabla();
            });
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

        this.shadowRoot.querySelector("#filtroSubrubro").addEventListener("change", (e) => {
            this._subrubroSeleccionado = e.target.value;
            this._pagina = 1;
            this.refrescarTabla();
        });

        this.shadowRoot.querySelector("#filtroEstado").addEventListener("change", (e) => {
            this._estadoSeleccionado = e.target.value;
            this._pagina = 1;
            this.refrescarTabla();
        });

        this.shadowRoot.querySelector("#filtroFecha").addEventListener("change", (e) => {
            this._fechaDesde = e.target.value;
            this._pagina = 1;
            this.refrescarTabla();
        });

        tabla.addEventListener("fila-clickeada", (evento) => {
            const { tipo, id, codigo } = evento.detail;

            const modal = document.createElement("modal-component");
            modal.setAttribute("subTitulo", tipo === "tecnico" ? "SERVICIO TÉCNICO" : "ASESORAMIENTO");
            modal.setAttribute("titulo", codigo);

            const detalle = document.createElement("detalle-servicio");
            detalle.setAttribute("tipo", tipo);
            detalle.setAttribute("servicio-id", id);

            modal.appendChild(detalle);
            document.body.appendChild(modal);
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