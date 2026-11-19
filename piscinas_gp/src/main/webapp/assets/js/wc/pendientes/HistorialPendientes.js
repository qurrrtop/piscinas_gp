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
        this._tipoSeleccionado = "todos";
        this._busqueda = "";
        this._entregaSeleccionada = "";
        this._subrubroSeleccionado = "";
        this._fechaDesde = "";
        this._alGuardar = () => this.recargar();
        this._tarjetas = [];
        this._resumen = { total: 0, ventas: 0, tecnicos: 0, asesoramientos: 0 };
        this._pagina = 1;
        this._tamano = 10;
        this._total = 0;
        this._reqId = 0;
        this._timerBusqueda = null;
    }

    async connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";

        this.renderShell();
        this.setupListeners();
        
        // si llegó desde el inicio, abre con el filtro elegido (se lee una sola vez)
        const filtroInicial = sessionStorage.getItem("pendientes-filtro");
        sessionStorage.removeItem("pendientes-filtro");

        if (["venta", "servicios"].includes(filtroInicial)) {
            this._tipoSeleccionado = filtroInicial;
            this.shadowRoot.querySelectorAll(".tab-tipo").forEach(tab => {
                tab.classList.toggle("activo", tab.dataset.tipo === filtroInicial);
            });
        }
        
        
        await Promise.all([this.cargarSubrubros(), this.cargarResumen(), this.cargarPendientes()]);
        this.actualizar();

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

    async cargarSubrubros() {
        try {
            const subrubros = await this.pedir(`${this.basePath}/subrubros-servicio-tecnico`);
            this.shadowRoot.querySelector("#filtroSubrubro").innerHTML = `
                <option value="">Todos</option>
                ${subrubros.map(s => `<option value="${s.id}">${this.esc(s.nombre)}</option>`).join("")}
            `;
        } catch (error) {
            console.error("Error al cargar subrubros:", error);
        }
    }

    async cargarResumen() {
        try {
            this._resumen = await this.pedir(`${this.basePath}/servicios/pendientes/resumen`);
        } catch (error) {
            console.error("Error al cargar el resumen de pendientes:", error);
        }
    }

    async cargarPendientes() {
        const id = ++this._reqId; // ignora respuestas viejas si tipeás rápido

        const params = new URLSearchParams({ page: this._pagina, size: this._tamano });
        if (this._busqueda.trim()) params.set("q", this._busqueda.trim());
        if (this._tipoSeleccionado !== "todos") params.set("tipo", this._tipoSeleccionado);
        if (this._entregaSeleccionada) params.set("entrega", this._entregaSeleccionada);
        if (this._subrubroSeleccionado) params.set("subrubroId", this._subrubroSeleccionado);
        if (this._fechaDesde) params.set("desde", this._fechaDesde);

        try {
            const data = await this.pedir(`${this.basePath}/servicios/pendientes?${params}`);
            if (id !== this._reqId) return;

            this._tarjetas = data.datos.map(p => {
                const esVenta = p.tipo === "venta";
                const pad = esVenta ? 4 : 3;
                const prefijo = esVenta ? "V" : p.tipo === "tecnico" ? "T" : "A";

                let monto;
                if (esVenta) monto = this.money(p.total);
                else if (p.tipo === "tecnico") monto = `${this.money(p.manoObra)} MO`;
                else monto = p.cobrado ? this.money(p.total) : "Sin cobro";

                return {
                    tipo: p.tipo,
                    id: p.id,
                    codigo: `${prefijo}-${String(p.id).padStart(pad, "0")}`,
                    subrubro: p.subrubro || "",
                    cliente: p.cliente || "-",
                    descripcion: esVenta ? this.textoUtil(p.descripcion) : (p.descripcion || ""),
                    creado: p.creado,
                    entrega: p.entrega,
                    monto
                };
            });
            this._total = data.total;

            const totalPaginas = Math.max(1, Math.ceil(this._total / this._tamano));
            if (this._pagina > totalPaginas) {
                this._pagina = totalPaginas;
                await this.cargarPendientes();
            }
        } catch (error) {
            console.error("Error al cargar los pendientes:", error);
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: "No se pudieron cargar los pendientes", tipo: "error" }
            }));
        }
    }

    async refrescar() {
        await this.cargarPendientes();
        this.renderLista();
        this.actualizarPaginacion();
    }

    async recargar() {
        await Promise.all([this.cargarResumen(), this.cargarPendientes()]);
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

    // ---------- render ----------

    actualizar() {
        this.actualizarResumen();
        this.renderLista();
        this.actualizarPaginacion();
    }

    actualizarResumen() {
        const r = this._resumen;

        this.shadowRoot.querySelector("tarjetas-resumen").tarjetas = [
            { titulo: "Total", valor: r.total, subTitulo: "PENDIENTES" },
            { titulo: "Ventas", valor: r.ventas, subTitulo: "PENDIENTES" },
            { titulo: "Servicio técnico", valor: r.tecnicos, subTitulo: "PENDIENTES" },
            { titulo: "Asesoramiento", valor: r.asesoramientos, subTitulo: "PENDIENTES" }
        ];
    }

    actualizarPaginacion() {
        const totalPaginas = Math.max(1, Math.ceil(this._total / this._tamano));
        this.shadowRoot.querySelector("#paginacion").style.display = totalPaginas > 1 ? "flex" : "none";
        this.shadowRoot.querySelector("#infoPagina").textContent =
            `Página ${this._pagina} de ${totalPaginas} (${this._total} pendientes)`;
        this.shadowRoot.querySelector("#btnAnterior").disabled = this._pagina <= 1;
        this.shadowRoot.querySelector("#btnSiguiente").disabled = this._pagina >= totalPaginas;
    }

    renderLista() {
        const lista = this.shadowRoot.querySelector("#lista");
        const tarjetas = this._tarjetas;

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
                            <h2 class="cliente">${this.esc(t.cliente)}</h2>
                        </div>

                        ${t.descripcion ? `<p class="descripcion" title="${this.esc(t.descripcion)}">${this.esc(t.descripcion)}</p>` : ""}
                    </div>

                    <div class="lado-derecho">
                        <div class="monto">${this.esc(t.monto)}</div>
                        <div class="fechas">
                            <span>Creado: <strong>${this.formatearFecha(t.creado)}</strong></span>
                            ${t.entrega ? `
                                <span class="${vencida ? "vencida" : ""}">
                                    Entrega: <strong>${this.formatearFecha(t.entrega)}</strong>${vencida ? " (vencida)" : ""}
                                </span>
                            ` : ""}
                        </div>
                    </div>
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
                this._pagina = 1;
                this.refrescar();
            });
        });

        // debounce: espera 300 ms sin tipear antes de consultar
        this.shadowRoot.querySelector("#filtroBusqueda").addEventListener("input", (e) => {
            this._busqueda = e.target.value;
            clearTimeout(this._timerBusqueda);
            this._timerBusqueda = setTimeout(() => {
                this._pagina = 1;
                this.refrescar();
            }, 300);
        });

        this.shadowRoot.querySelector("#filtroEntrega").addEventListener("change", (e) => {
            this._entregaSeleccionada = e.target.value;
            this._pagina = 1;
            this.refrescar();
        });

        this.shadowRoot.querySelector("#filtroSubrubro").addEventListener("change", (e) => {
            this._subrubroSeleccionado = e.target.value;
            this._pagina = 1;
            this.refrescar();
        });

        this.shadowRoot.querySelector("#filtroFecha").addEventListener("change", (e) => {
            this._fechaDesde = e.target.value;
            this._pagina = 1;
            this.refrescar();
        });

        this.shadowRoot.querySelector("#btnAnterior").addEventListener("click", () => {
            this._pagina--;
            this.refrescar();
        });

        this.shadowRoot.querySelector("#btnSiguiente").addEventListener("click", () => {
            this._pagina++;
            this.refrescar();
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

                @media (max-width: 800px) {
                    .card-filtros {
                        grid-template-columns: 1fr 1fr;
                    }
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
                    padding: .75rem 1.3rem .75rem 1.1rem;
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
                    background: rgba(1, 49, 104, .7);
                    transform: translateY(-1px);
                }

                .tarjeta-info {
                    flex: 1;
                    min-width: 0;
                }

                .fila-superior {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: .3rem .7rem;
                }

                .codigo {
                    font-weight: 700;
                    font-size: .9rem;
                }

                .pildora {
                    padding: .08rem .7rem;
                    border-radius: 20px;
                    border: 1px solid var(--c);
                    background: color-mix(in srgb, var(--c) 18%, transparent);
                    color: var(--c);
                    font-size: .8rem;
                    font-weight: 700;
                }

                .subrubro {
                    font-size: .85rem;
                    font-weight: 700;
                }

                .cliente {
                    margin: 0;
                    font-size: 1.15rem;
                    font-weight: 700;
                    overflow-wrap: anywhere;
                }

                .descripcion {
                    margin: .2rem 0 0;
                    font-size: .85rem;
                    color: rgba(255,255,255,.85);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .lado-derecho {
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: .15rem;
                }

                .monto {
                    font-size: 1.4rem;
                    font-weight: 700;
                    white-space: nowrap;
                }

                .fechas {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                    gap: .1rem 1.2rem;
                    font-size: .78rem;
                    color: rgba(255,255,255,.75);
                }

                .fechas strong {
                    color: white;
                }

                .fechas .vencida,
                .fechas .vencida strong {
                    color: #FFB4A8;
                }

                @media (max-width: 800px) {
                    .tarjeta {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .lado-derecho {
                        align-items: flex-start;
                    }

                    .fechas {
                        justify-content: flex-start;
                    }
                }
        
                .paginacion {
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    font-size: .85rem;
                }

                .paginacion button {
                    background: rgba(1, 49, 104, 1);
                    border: 1px solid rgba(255,255,255,.2);
                    color: white;
                    width: 2.2rem;
                    height: 2.2rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                }

                .paginacion button:disabled {
                    opacity: .35;
                    cursor: default;
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

                <div class="card-filtros">
                    <div>
                        <label>Buscar</label>
                        <input type="text" id="filtroBusqueda" placeholder="Cliente, descripción o código..." autocomplete="off">
                    </div>
                    <div>
                        <label>Entrega</label>
                        <select id="filtroEntrega">
                            <option value="">Todas</option>
                            <option value="vencidas">Vencidas</option>
                            <option value="hoy">Vencen hoy</option>
                            <option value="semana">Próximos 7 días</option>
                        </select>
                    </div>
                    <div>
                        <label>Subrubro</label>
                        <select id="filtroSubrubro"><option value="">Todos</option></select>
                    </div>
                    <div>
                        <label>Creado desde</label>
                        <input type="date" id="filtroFecha">
                    </div>
                </div>
                
                <div id="lista"></div>
        
                <div class="paginacion" id="paginacion" style="display:none">
                    <button type="button" id="btnAnterior">&larr;</button>
                    <span id="infoPagina"></span>
                    <button type="button" id="btnSiguiente">&rarr;</button>
                </div>
            </div>
        `;
    }
}

customElements.define("historial-pendientes", HistorialPendientes);