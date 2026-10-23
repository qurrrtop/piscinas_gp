class HistorialPendientes extends HTMLElement {

    static TIPOS = {
        venta: { pildora: "Venta", color: "#4ADE80" },
        tecnico: { pildora: "Serv. Téc.", color: "#FB923C" },
        asesoramiento: { pildora: "Ases.", color: "#C084FC" }
    };

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";
        this._ventas = [];
        this._tecnicos = [];
        this._asesoramientos = [];
        this._tipoSeleccionado = "todos";
        this._busqueda = "";
        this._alGuardar = () => this.recargar();
    }

    async connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";

        this.renderShell();
        this.setupListeners();
        await this.cargarDatos();
        this.actualizar();

        // cuando se completa o se cancela algo desde el detalle, la lista se vuelve a pedir
        document.addEventListener("servicio-guardado", this._alGuardar);
        document.addEventListener("venta-guardada", this._alGuardar);
    }

    disconnectedCallback() {
        document.removeEventListener("servicio-guardado", this._alGuardar);
        document.removeEventListener("venta-guardada", this._alGuardar);
    }

    // ---------- carga ----------

    async pedir(url) {
        const respuesta = await fetch(url);
        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.error || "No se pudo cargar la lista");
        }

        return data;
    }

    async cargarDatos() {
        try {
            const [ventas, tecnicos, asesoramientos] = await Promise.all([
                this.pedir(`${this.basePath}/ventas/productos?estado=pendiente`),
                this.pedir(`${this.basePath}/servicios/tecnicos?estado=pendiente`),
                this.pedir(`${this.basePath}/servicios/asesoramientos?estado=pendiente`)
            ]);

            this._ventas = ventas;
            this._tecnicos = tecnicos;
            this._asesoramientos = asesoramientos;

        } catch (error) {
            console.error("Error al cargar los pendientes:", error);
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: "No se pudieron cargar los pendientes", tipo: "error" }
            }));
        }
    }

    async recargar() {
        await this.cargarDatos();
        this.actualizar();
    }

    // ---------- helpers ----------

    esc(texto) {
        return String(texto ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    money(valor) {
        const numero = Number(valor ?? 0);
        return `$${numero.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }

    // "YYYY-MM-DD" (columnas DATE) se arma a mano para evitar el desfase por UTC
    aFecha(valor) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
            const [anio, mes, dia] = valor.split("-").map(Number);
            return new Date(anio, mes - 1, dia);
        }
        return new Date(valor);
    }

    formatearFecha(valor) {
        return this.aFecha(valor).toLocaleDateString("es-AR", {
            day: "numeric", month: "short", year: "numeric"
        });
    }

    nombreCliente(c) {
        if (!c) return "-";
        return c.nombre ? `${c.nombre} ${c.apellido || ""}`.trim() : (c.razonSocial || "-");
    }

    // la observacion por defecto ("Sin observaciones") no aporta nada en una tarjeta
    textoUtil(texto) {
        return texto && texto !== "Sin observaciones" ? texto : "";
    }

    // ---------- datos de las tarjetas ----------

    obtenerTarjetas() {
        const ventas = this._ventas.map(v => ({
            tipo: "venta",
            id: v.id,
            codigo: `V-${String(v.id).padStart(4, "0")}`,
            subrubro: "",
            cliente: v.cliente || "-",
            descripcion: this.textoUtil(v.observacion),
            creado: v.fecha,
            entrega: null,
            monto: this.money(v.total)
        }));

        const tecnicos = this._tecnicos.map(s => ({
            tipo: "tecnico",
            id: s.id,
            codigo: `T-${String(s.id).padStart(3, "0")}`,
            subrubro: s.subrubroServicio?.nombre || "",
            cliente: this.nombreCliente(s.cliente),
            descripcion: s.problema || "",
            creado: s.fechaInicio,
            entrega: s.fechaEntrega,
            // mano de obra, como en el diseño; para mostrar el total en su lugar: this.money(s.total)
            monto: `${this.money(s.manoObra)} MO`
        }));

        const asesoramientos = this._asesoramientos.map(s => ({
            tipo: "asesoramiento",
            id: s.id,
            codigo: `A-${String(s.id).padStart(3, "0")}`,
            subrubro: "",
            cliente: this.nombreCliente(s.cliente),
            descripcion: s.problema || "",
            creado: s.fechaInicio,
            entrega: null,
            monto: s.cobrado ? this.money(s.monto) : "Sin cobro"
        }));

        return [...ventas, ...tecnicos, ...asesoramientos];
    }

    // lo mas urgente primero: los tecnicos por fecha de entrega y el resto por antiguedad
    fechaClave(tarjeta) {
        return this.aFecha(tarjeta.entrega || tarjeta.creado).getTime();
    }

    obtenerTarjetasFiltradas() {
        const busqueda = this._busqueda.trim().toLowerCase();

        return this.obtenerTarjetas()
            .filter(t => this._tipoSeleccionado === "todos" || t.tipo === this._tipoSeleccionado)
            .filter(t => !busqueda
                || t.cliente.toLowerCase().includes(busqueda)
                || t.descripcion.toLowerCase().includes(busqueda))
            .sort((a, b) => this.fechaClave(a) - this.fechaClave(b));
    }

    // ---------- render ----------

    actualizar() {
        this.actualizarResumen();
        this.renderLista();
    }

    actualizarResumen() {
        const total = this._ventas.length + this._tecnicos.length + this._asesoramientos.length;

        this.shadowRoot.querySelector("tarjetas-resumen").tarjetas = [
            { titulo: "Total", valor: total, subTitulo: "PENDIENTES" },
            { titulo: "Ventas", valor: this._ventas.length, subTitulo: "PENDIENTES" },
            { titulo: "Servicio técnico", valor: this._tecnicos.length, subTitulo: "PENDIENTES" },
            { titulo: "Asesoramiento", valor: this._asesoramientos.length, subTitulo: "PENDIENTES" }
        ];
    }

    renderLista() {
        const lista = this.shadowRoot.querySelector("#lista");
        const tarjetas = this.obtenerTarjetasFiltradas();

        if (tarjetas.length === 0) {
            lista.innerHTML = `<p class="vacio">No hay pendientes para mostrar.</p>`;
            return;
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        lista.innerHTML = tarjetas.map(t => {
            const tipo = HistorialPendientes.TIPOS[t.tipo];
            const vencida = t.entrega && this.aFecha(t.entrega) < hoy;

            return `
                <article class="tarjeta" style="--c:${tipo.color}" tabindex="0"
                         data-tipo="${t.tipo}" data-id="${this.esc(t.id)}" data-codigo="${this.esc(t.codigo)}">

                    <div class="tarjeta-info">
                        <div class="fila-superior">
                            <span class="codigo">${this.esc(t.codigo)}</span>
                            <span class="pildora">${tipo.pildora}</span>
                            ${t.subrubro ? `<span class="subrubro">${this.esc(t.subrubro)}</span>` : ""}
                        </div>

                        <h2 class="cliente">${this.esc(t.cliente)}</h2>

                        ${t.descripcion ? `<p class="descripcion">${this.esc(t.descripcion)}</p>` : ""}

                        <div class="fechas">
                            <span>Creado: <strong>${this.formatearFecha(t.creado)}</strong></span>
                            ${t.entrega ? `
                                <span class="${vencida ? "vencida" : ""}">
                                    Entrega: <strong>${this.formatearFecha(t.entrega)}</strong>${vencida ? " (vencida)" : ""}
                                </span>
                            ` : ""}
                        </div>
                    </div>

                    <div class="monto">${this.esc(t.monto)}</div>
                </article>
            `;
        }).join("");

        lista.querySelectorAll(".tarjeta").forEach(el => {
            const abrir = () => this.abrirDetalle(el.dataset.tipo, el.dataset.id, el.dataset.codigo);

            el.addEventListener("click", abrir);
            el.addEventListener("keydown", (e) => {
                if (e.key === "Enter") abrir();
            });
        });
    }

    // ---------- detalle ----------

    async abrirDetalle(tipo, id, codigo) {
        const modal = document.createElement("modal-component");

        if (tipo === "venta") {
            modal.setAttribute("titulo", `Venta #${String(id).padStart(5, "0")}`);
            modal.setAttribute("subTitulo", "DETALLE DE VENTA");

            const detalle = document.createElement("detalle-venta");
            detalle.setAttribute("base-path", this.basePath);

            modal.appendChild(detalle);
            document.body.appendChild(modal);

            try {
                const venta = await this.pedir(`${this.basePath}/ventas/productos/${id}`);
                detalle.venta = venta;

            } catch (error) {
                modal.remove();
                document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                    detail: { mensaje: error.message, tipo: "error" }
                }));
            }
            return;
        }

        modal.setAttribute("subTitulo", tipo === "tecnico" ? "SERVICIO TÉCNICO" : "ASESORAMIENTO");
        modal.setAttribute("titulo", codigo);

        const detalle = document.createElement("detalle-servicio");
        detalle.setAttribute("base-path", this.basePath);
        detalle.setAttribute("tipo", tipo);
        detalle.setAttribute("servicio-id", id);

        modal.appendChild(detalle);
        document.body.appendChild(modal);
    }

    // ---------- listeners y estructura ----------

    setupListeners() {
        this.shadowRoot.querySelectorAll(".tab-tipo").forEach(tab => {
            tab.addEventListener("click", () => {
                this.shadowRoot.querySelectorAll(".tab-tipo").forEach(t => t.classList.remove("activo"));
                tab.classList.add("activo");
                this._tipoSeleccionado = tab.dataset.tipo;
                this.renderLista();
            });
        });

        this.shadowRoot.querySelector("#filtroBusqueda").addEventListener("input", (e) => {
            this._busqueda = e.target.value;
            this.renderLista();
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
                    flex-wrap: wrap;
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

                #filtroBusqueda {
                    width: 100%;
                    box-sizing: border-box;
                    padding: .75rem 1rem;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,.35);
                    background: rgba(1, 49, 104, 1);
                    color: white;
                    font-size: .95rem;
                    outline: none;
                }

                #filtroBusqueda::placeholder {
                    color: rgba(255,255,255,.6);
                }

                #lista {
                    display: flex;
                    flex-direction: column;
                    gap: .5rem;
                }

                .vacio {
                    margin: 2rem 0;
                    text-align: center;
                    color: rgba(255,255,255,.75);
                }

                /* ---------- tarjeta ---------- */

                .tarjeta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1.5rem;
                    padding: .7rem 1.5rem .7rem 1rem;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,.35);
                    border-left: 6px solid var(--c);
                    background: rgba(1, 49, 104, 1);
                    cursor: pointer;
                    transition: background .15s, transform .15s;
                    outline: none;
                }

                .tarjeta:hover,
                .tarjeta:focus-visible {
                    background: rgba(1, 49, 104, .8);
                    transform: translateY(-1px);
                }

                .tarjeta-info {
                    min-width: 0;
                }

                .fila-superior {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: .7rem;
                }

                .codigo {
                    font-weight: 700;
                    font-size: .95rem;
                }

                .pildora {
                    padding: .12rem .8rem;
                    border-radius: 20px;
                    border: 1px solid var(--c);
                    background: color-mix(in srgb, var(--c) 18%, transparent);
                    color: var(--c);
                    font-size: .85rem;
                    font-weight: 700;
                }

                .subrubro {
                    font-size: .9rem;
                    font-weight: 700;
                }

                .cliente {
                    margin: .25rem 0 .2rem;
                    font-size: 1.6rem;
                    font-weight: 700;
                    overflow-wrap: anywhere;
                }

                .descripcion {
                    margin: 0 0 .4rem;
                    font-size: .9rem;
                    color: rgba(255,255,255,.85);
                    overflow-wrap: anywhere;
                }

                .fechas {
                    display: flex;
                    flex-wrap: wrap;
                    gap: .3rem 1.6rem;
                    font-size: .8rem;
                    color: rgba(255,255,255,.75);
                }

                .fechas strong {
                    color: white;
                }

                .fechas .vencida,
                .fechas .vencida strong {
                    color: #FFB4A8;
                }

                .monto {
                    flex-shrink: 0;
                    font-size: 1.7rem;
                    font-weight: 700;
                    white-space: nowrap;
                    text-align: right;
                }

                @media (max-width: 700px) {
                    .tarjeta {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .monto {
                        text-align: left;
                    }
                }
            </style>

            <div class="contenedor">
                <tarjetas-resumen></tarjetas-resumen>

                <div class="tabs">
                    <button type="button" class="tab-tipo activo" data-tipo="todos">Todos</button>
                    <button type="button" class="tab-tipo" data-tipo="venta">Ventas</button>
                    <button type="button" class="tab-tipo" data-tipo="tecnico">Serv. Técnico</button>
                    <button type="button" class="tab-tipo" data-tipo="asesoramiento">Asesoramientos</button>
                </div>

                <input type="text" id="filtroBusqueda" placeholder="Buscar por cliente o descripción" autocomplete="off">

                <div id="lista"></div>
            </div>
        `;
    }
}

customElements.define("historial-pendientes", HistorialPendientes);