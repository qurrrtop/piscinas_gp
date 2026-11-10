class InicioPrincipal extends HTMLElement {

    // criterios fáciles de ajustar
    static DIAS_VENTA_ANTIGUA = 3;   // desde cuántos días una venta pendiente entra en "Requiere atención"
    static MAX_ATENCION = 5;         // cuántos ítems muestra la lista
    static RUTA_PENDIENTES = "/dashboard/pendientes/historial";

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";
        this._datos = null;
        this._semana = [];
        this._grafico = null;
    }

    async connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        this.renderCargando();

        let hayError = false;

        try {
            await this.cargarDatos();
        } catch (error) {
            console.error("Error al cargar el inicio:", error);
            hayError = true;

            // sin datos: se dibuja todo igual, con valores en cero
            this._datos = { cerradas: [], ventasPend: [], tecnicos: [], asesoramientos: [], productos: [] };

            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: "No se pudo cargar el resumen del negocio", tipo: "error" }
            }));
        }

        this.render(hayError);
        await this.dibujarGrafico();
    }

    disconnectedCallback() {
        this._grafico?.destroy();
        this._grafico = null;
    }

    // ---------- carga ----------

    async pedir(url) {
        const respuesta = await fetch(url);
        const data = await respuesta.json();
        if (!respuesta.ok) throw new Error(data.error || "No se pudieron cargar los datos");
        return data;
    }

    async cargarDatos() {
        const inicio = this.inicioDelDia(new Date());
        inicio.setDate(inicio.getDate() - 6);
        const desde = this.claveDia(inicio);

        const [cerradas, ventasPend, tecnicos, asesoramientos, productos] = await Promise.all([
            this.pedir(`${this.basePath}/ventas/productos?estado=cerrada&fechaDesde=${desde}`),
            this.pedir(`${this.basePath}/ventas/productos?estado=pendiente`),
            this.pedir(`${this.basePath}/servicios/tecnicos?estado=pendiente`),
            this.pedir(`${this.basePath}/servicios/asesoramientos?estado=pendiente`),
            this.pedir(`${this.basePath}/productos`)
        ]);

        this._datos = { cerradas, ventasPend, tecnicos, asesoramientos, productos };
    }

    cargarChartJs() {
        if (window.Chart) return Promise.resolve();

        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = `${this.basePath}/assets/js/libs/chart.umd.js`;
            script.onload = resolve;
            script.onerror = () => reject(new Error("No se pudo cargar Chart.js"));
            document.head.appendChild(script);
        });
    }

    // ---------- helpers ----------

    esc(texto) {
        return String(texto ?? "")
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    money(valor) {
        return `$${Number(valor ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
    }

    // "YYYY-MM-DD" se arma a mano para evitar el desfase por UTC
    aFecha(valor) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
            const [anio, mes, dia] = valor.split("-").map(Number);
            return new Date(anio, mes - 1, dia);
        }
        return new Date(valor);
    }

    inicioDelDia(fecha) {
        const d = new Date(fecha);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    claveDia(fecha) {
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const dia = String(fecha.getDate()).padStart(2, "0");
        return `${fecha.getFullYear()}-${mes}-${dia}`;
    }

    diasEntre(desde, hasta) {
        return Math.round((hasta - desde) / 86400000);
    }

    plural(n, singular, plural) {
        return `${n} ${n === 1 ? singular : plural}`;
    }

    nombreCliente(c) {
        if (!c) return "-";
        return c.nombre ? `${c.nombre} ${c.apellido || ""}`.trim() : (c.razonSocial || "-");
    }

    // ---------- cálculos ----------

    // ventas cerradas de los últimos 7 días (el último elemento es hoy)
    calcularSemana() {
        const dias = [];
        for (let i = 6; i >= 0; i--) {
            const d = this.inicioDelDia(new Date());
            d.setDate(d.getDate() - i);
            dias.push({ fecha: d, clave: this.claveDia(d), total: 0, cantidad: 0 });
        }

        // criterio a definir con el cliente: hoy solo cuentan las ventas de productos cerradas
        this._datos.cerradas
            .filter(v => (v.estado || "").toLowerCase() === "cerrada")
            .forEach(v => {
                const dia = dias.find(x => x.clave === this.claveDia(this.aFecha(v.fecha)));
                if (dia) {
                    dia.total += Number(v.total || 0);
                    dia.cantidad++;
                }
            });

        return dias;
    }

    // solo cuentan productos con mínimo configurado: los importados llegan con stock y mínimo en 0
    productosStockBajo() {
        return this._datos.productos
            .filter(p => p.activo && Number(p.umbralStock) > 0 && Number(p.stock) <= Number(p.umbralStock))
            .sort((a, b) => a.stock / a.umbralStock - b.stock / b.umbralStock);
    }

    tecnicosVencidos() {
        const hoy = this.inicioDelDia(new Date());
        return this._datos.tecnicos
            .filter(s => s.fechaEntrega && this.aFecha(s.fechaEntrega) < hoy)
            .sort((a, b) => this.aFecha(a.fechaEntrega) - this.aFecha(b.fechaEntrega));
    }

    calcularAtencion() {
        const hoy = this.inicioDelDia(new Date());
        const items = [];

        this.tecnicosVencidos().forEach(s => {
            const dias = this.diasEntre(this.aFecha(s.fechaEntrega), hoy);
            items.push({
                titulo: `T-${String(s.id).padStart(3, "0")} · ${s.subrubroServicio?.nombre || "Servicio técnico"}`,
                detalle: `${this.nombreCliente(s.cliente)} · entrega vencida hace ${this.plural(dias, "día", "días")}`,
                etiqueta: "Vencido",
                color: "naranja"
            });
        });

        this._datos.ventasPend
            .map(v => ({ v, dias: this.diasEntre(this.inicioDelDia(this.aFecha(v.fecha)), hoy) }))
            .filter(x => x.dias >= InicioPrincipal.DIAS_VENTA_ANTIGUA)
            .sort((a, b) => b.dias - a.dias)
            .forEach(({ v, dias }) => {
                items.push({
                    titulo: `V-${String(v.id).padStart(4, "0")} · ${v.cliente}`,
                    detalle: `Pendiente desde hace ${this.plural(dias, "día", "días")}`,
                    etiqueta: "Pendiente",
                    color: "amarillo"
                });
            });

        this.productosStockBajo().forEach(p => {
            const contenido = [p.contenido, p.unidadMedida?.abreviatura].filter(Boolean).join(" ");
            items.push({
                titulo: `${p.nombre}${contenido ? ` ${contenido}` : ""}`,
                detalle: `Stock ${p.stock} · mínimo ${p.umbralStock}`,
                etiqueta: Number(p.stock) === 0 ? "Sin stock" : "Stock bajo",
                color: "rojo"
            });
        });

        return items;
    }

    // ---------- render ----------

    irA(ruta) {
        document.dispatchEvent(new CustomEvent("navigateTo", {
            bubbles: true, composed: true,
            detail: { path: `${this.basePath}${ruta}` }
        }));
    }

    renderCargando() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .centrado { min-height: 60vh; display: flex; align-items: center; justify-content: center; }
                .spinner {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    border: 4px solid rgba(255,255,255,.25);
                    border-top-color: #37E0E0;
                    animation: girar .8s linear infinite;
                }
                @keyframes girar { to { transform: rotate(360deg); } }
                @media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 2.4s; } }
            </style>

            <div class="centrado" role="status" aria-label="Cargando el resumen del negocio">
                <div class="spinner"></div>
            </div>
        `;
    }

    htmlTarjeta({ icono, color, titulo, valor, detalle, alerta, ruta, filtro }) {
        return `
            <div class="card kpi ${ruta ? "clickeable" : ""}" ${ruta ? `data-ruta="${ruta}" data-filtro="${filtro || ""}" tabindex="0" role="link"` : ""}>
                <span class="ic" style="background:${color}33;color:${color}">${icono}</span>
                <div>
                    <div class="kpi-titulo">${titulo}</div>
                    <div class="kpi-valor">${valor}</div>
                    <div class="kpi-detalle ${alerta ? "alerta" : ""}">${detalle}</div>
                </div>
            </div>
        `;
    }

    render(hayError = false) {
        this._semana = this.calcularSemana();
        const hoy = this._semana[6];
        const totalSemana = this._semana.reduce((acc, d) => acc + d.total, 0);

        const vencidos = this.tecnicosVencidos().length;
        const serviciosPend = this._datos.tecnicos.length + this._datos.asesoramientos.length;
        const stockBajo = this.productosStockBajo().length;

        const atencion = this.calcularAtencion();
        const visibles = atencion.slice(0, InicioPrincipal.MAX_ATENCION);
        const resto = atencion.length - visibles.length;

        const icono = (trazo) => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${trazo}</svg>`;

        const fecha = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; margin-top: 20px; }
                .contenedor { display: flex; flex-direction: column; gap: 16px; color: white; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; }
                .cabecera { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 8px; }
                h1 { margin: 0; font-size: 1.8rem; font-weight: 600; }
                .cabecera p { margin: 4px 0 0; color: rgba(255,255,255,.8); font-size: .95rem; }
                .fecha { font-size: .9rem; color: rgba(255,255,255,.8); text-transform: capitalize; }

                .card { background: rgba(1, 49, 104, .92); border: 1px solid rgba(255,255,255,.4); border-radius: 12px; }
                .g4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
                .kpi { padding: 16px 18px; display: flex; gap: 14px; align-items: center; }
                .kpi.clickeable { cursor: pointer; transition: background .15s, transform .15s; outline: none; }
                .kpi.clickeable:hover, .kpi.clickeable:focus-visible { background: rgba(1, 49, 104, .7); transform: translateY(-1px); }
                .ic { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .kpi-titulo { font-size: .78rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #B8D7FF; }
                .kpi-valor { font-size: 1.6rem; font-weight: 700; }
                .kpi-detalle { font-size: .8rem; color: rgba(255,255,255,.75); }
                .kpi-detalle.alerta { color: #FFB4A8; }

                .principal { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
                .bloque { padding: 18px 20px; }
                .encabezado { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
                h2 { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #B8D7FF; }
                .total-semana { font-size: .9rem; color: rgba(255,255,255,.8); }
                .total-semana b { color: white; }
                .grafico { position: relative; height: 280px; margin-top: 12px; }

                .it { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid rgba(255,255,255,.15); }
                .it b { display: block; font-size: .92rem; overflow-wrap: anywhere; }
                .it small { color: rgba(255,255,255,.75); font-size: .8rem; }
                .tag { margin-left: auto; padding: 2px 10px; border-radius: 20px; font-size: .75rem; font-weight: 700; white-space: nowrap; }
                .tag.rojo { background: rgba(248,113,113,.22); color: #FCA5A5; }
                .tag.naranja { background: rgba(251,146,60,.22); color: #FDBA74; }
                .tag.amarillo { background: rgba(251,191,36,.22); color: #FCD34D; }
                .vacio { margin: 1rem 0 .4rem; text-align: center; color: rgba(255,255,255,.75); font-size: .9rem; }
                .mas { margin: .6rem 0 0; font-size: .8rem; color: rgba(255,255,255,.7); text-align: center; }

                .aviso { padding: 10px 14px; border-radius: 10px; background: rgba(251,191,36,.18); border: 1px solid rgba(251,191,36,.5); color: #FCD34D; font-size: .9rem; }

                @media (max-width: 900px) {
                    .g4 { grid-template-columns: 1fr 1fr; }
                    .principal { grid-template-columns: 1fr; }
                }
            </style>

            <div class="contenedor">
                <div class="cabecera">
                    <div>
                        <h1>Resumen del negocio</h1>
                        <p>Así está PiscinasGP hoy</p>
                    </div>
                    <span class="fecha">${this.esc(fecha)}</span>
                </div>

                ${hayError ? `<div class="aviso">No se pudo conectar con el servidor, por eso se muestran los valores en cero.</div>` : ""}

                <div class="g4">
                    ${this.htmlTarjeta({
                        icono: icono(`<path d="M3 4h2l2.4 10.5a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20 8H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>`),
                        color: "#4ADE80", titulo: "Ventas del día", valor: this.money(hoy.total),
                        detalle: `${this.plural(hoy.cantidad, "venta cerrada", "ventas cerradas")}`
                    })}
                    ${this.htmlTarjeta({
                        icono: icono(`<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6"/>`),
                        color: "#FBBF24", titulo: "Ventas pendientes", valor: this._datos.ventasPend.length,
                        detalle: "Sin completar", ruta: InicioPrincipal.RUTA_PENDIENTES, filtro: "venta"
                    })}
                    ${this.htmlTarjeta({
                        icono: icono(`<path d="M14.5 6.5a4 4 0 0 0 4.8 4.8l-9.3 9.3a2 2 0 0 1-2.8-2.8l9.3-9.3z"/>`),
                        color: "#FB923C", titulo: "Servicios pendientes", valor: serviciosPend,
                        detalle: vencidos > 0 ? `${vencidos} con entrega vencida` : "Ninguno vencido",
                        alerta: vencidos > 0, ruta: InicioPrincipal.RUTA_PENDIENTES, filtro: "servicios"
                    })}
                    ${this.htmlTarjeta({
                        icono: icono(`<path d="M3 7l9-4 9 4v10l-9 4-9-4V7zM3 7l9 4 9-4M12 11v10"/>`),
                        color: "#F87171", titulo: "Stock bajo", valor: stockBajo,
                        detalle: stockBajo > 0 ? "Productos bajo el mínimo" : "Sin productos bajo el mínimo",
                        alerta: stockBajo > 0
                    })}
                </div>

                <div class="principal">
                    <div class="card bloque">
                        <div class="encabezado">
                            <h2>Ventas de los últimos 7 días</h2>
                            <span class="total-semana">Total de la semana: <b>${this.money(totalSemana)}</b></span>
                        </div>
                        <div class="grafico"><canvas id="graficoVentas"></canvas></div>
                    </div>

                    <div class="card bloque">
                        <div class="encabezado"><h2>Requiere atención</h2></div>
                        ${visibles.length === 0
                            ? `<p class="vacio">${hayError ? "Sin datos disponibles." : "Todo en orden por ahora."}</p>`
                            : visibles.map(i => `
                                <div class="it">
                                    <div><b>${this.esc(i.titulo)}</b><small>${this.esc(i.detalle)}</small></div>
                                    <span class="tag ${i.color}">${i.etiqueta}</span>
                                </div>
                            `).join("")}
                        ${resto > 0 ? `<p class="mas">y ${resto} más</p>` : ""}
                    </div>
                </div>
            </div>
        `;

        this.shadowRoot.querySelectorAll("[data-ruta]").forEach(el => {
            const abrir = () => {
                if (el.dataset.filtro) {
                    sessionStorage.setItem("pendientes-filtro", el.dataset.filtro);
                }
                this.irA(el.dataset.ruta);
            };
            el.addEventListener("click", abrir);
            el.addEventListener("keydown", (e) => { if (e.key === "Enter") abrir(); });
        });
    }

    async dibujarGrafico() {
        const contenedor = this.shadowRoot.querySelector(".grafico");

        try {
            await this.cargarChartJs();
        } catch (error) {
            console.error(error);
            contenedor.innerHTML = `<p class="vacio">No se pudo cargar el gráfico.</p>`;
            return;
        }

        const dias = this._semana;
        const sinDatos = dias.every(d => d.total === 0);
        const nombresDia = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        const etiquetas = dias.map((d, i) => i === dias.length - 1 ? "Hoy" : nombresDia[d.fecha.getDay()]);

        this._grafico?.destroy();
        this._grafico = new Chart(this.shadowRoot.querySelector("#graficoVentas"), {
            type: "line",
            data: {
                labels: etiquetas,
                datasets: [{
                    data: dias.map(d => d.total),
                    borderColor: "#37E0E0",
                    backgroundColor: "rgba(55, 224, 224, .25)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: "#37E0E0",
                    pointRadius: dias.map((_, i) => i === dias.length - 1 ? 5 : 0),
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` ${this.money(ctx.parsed.y)} · ${this.plural(dias[ctx.dataIndex].cantidad, "venta", "ventas")}`
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: "rgba(255,255,255,.8)" }, grid: { display: false } },
                    y: {
                        beginAtZero: true,
                        suggestedMax: sinDatos ? 100000 : undefined,
                        ticks: {
                            color: "rgba(255,255,255,.8)",
                            callback: (v) => v >= 1000 ? `$${v / 1000}k` : `$${v}`
                        },
                        grid: { color: "rgba(255,255,255,.15)" }
                    }
                }
            }
        });
    }
}

customElements.define("inicio-principal", InicioPrincipal);