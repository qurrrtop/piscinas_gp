class ImportarProductos extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";
        this.marcas = [];
        this.categoriasPorId = new Map();
        this.unidadesPorId = new Map();

        this.archivoActual = null;
        this.marcaSeleccionadaId = null;
        this.productos = [];
        this.filtroEstado = "TODOS";
        this.textoBusqueda = "";
    }

    async connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        await this.cargarOpciones();
        this.renderVacio();
        this.bindEventosEstadoVacio();
    }

    async cargarOpciones() {
        try {
            const [resMarcas, resCategorias, resUnidades] = await Promise.all([
                fetch("marcas"),
                fetch("categorias"),
                fetch("unidades-medida")
            ]);

            this.marcas = await resMarcas.json();
            const categorias = await resCategorias.json();
            const unidades = await resUnidades.json();

            categorias.forEach(c => this.categoriasPorId.set(c.id, c.nombre));
            unidades.forEach(u => this.unidadesPorId.set(u.id, u.nombre));

        } catch (error) {
            console.error("Error al cargar marcas/categorias/unidades:", error);
        }
    }

    // ---------- ESTADO 1: sin archivo ----------

    renderVacio() {
        this.shadowRoot.innerHTML = `
            <style>${this.estilosComunes()}${this.estilosVacio()}</style>
            <div class="layout-importar">
                <p class="importar-info">Importe un archivo Excel o CSV con la lista de productos. Asegúrese de que el
                    formato del archivo coincida con la estructura requerida.
                </p>

                <div class="zona-carga" id="zonaCarga">
                    <div class="zona-carga-vacia" id="zonaCargaVacia">
                        <div class="icon-circulo">
                            <img class="icon-importar" src="${this.basePath}/assets/img/iconos/import.svg">
                        </div>
                        <p>Arrastre el archivo aquí o haga click para seleccionar</p>
                        <div class="detalle">
                            <span>Formatos soportados: .xlsx, .xls, .csv</span>
                            <span><img src="${this.basePath}/assets/img/iconos/file.svg">Máximo 10 MB</span>
                        </div>
                    </div>

                    <div class="zona-carga-archivo" id="zonaCargaArchivo" hidden>
                        <div class="icon-circulo archivo-ok">
                            <img class="icon-importar" src="${this.basePath}/assets/img/iconos/file.svg">
                        </div>
                        <p class="archivo-nombre"></p>
                        <span class="archivo-tamano"></span>
                        <button type="button" id="btnQuitarArchivo">✕ Quitar archivo</button>
                    </div>

                    <input type="file" id="inputArchivo" accept=".xlsx,.xls,.csv" hidden>
                </div>

                <div class="box-marca">
                    <label>Marca</label>
                    <div class="select-wrapper">
                        <select id="marca" name="marca" required>
                            <option value="">Seleccione una opción</option>
                            <option value="" disabled>Cualquiera (próximamente)</option>
                            ${this.marcas.map(m => `<option value="${m.id}">${m.nombre}</option>`).join("")}
                        </select>
                    </div>
                    <p class="ayuda">Seleccione la marca de los productos a importar. Si el archivo contiene
                        productos de varias marcas, elija "Cualquiera".</p>
                </div>

                <div class="acciones">
                    <button type="button" id="btnCancelar">✕ Cancelar</button>
                    <a class="link-ejemplo" href="${this.basePath}/assets/docs/ejemplo-importacion.xlsx" download>
                        <img class="icon-importar-btn" src="${this.basePath}/assets/img/iconos/file.svg">
                        Descargar ejemplo de estructura</a>
                    <button type="button" id="btnImportar">
                        <img class="icon-importar-btn" src="${this.basePath}/assets/img/iconos/import.svg">
                        Importar
                    </button>
                </div>
            </div>
        `;
    }

    bindEventosEstadoVacio() {
        const zonaCarga = this.shadowRoot.querySelector("#zonaCarga");
        const inputArchivo = this.shadowRoot.querySelector("#inputArchivo");
        const btnImportar = this.shadowRoot.querySelector("#btnImportar");
        const btnCancelar = this.shadowRoot.querySelector("#btnCancelar");
        const btnQuitarArchivo = this.shadowRoot.querySelector("#btnQuitarArchivo");

        zonaCarga.addEventListener("click", () => inputArchivo.click());

        zonaCarga.addEventListener("dragover", (e) => {
            e.preventDefault();
            zonaCarga.classList.add("arrastrando");
        });
        zonaCarga.addEventListener("dragleave", () => zonaCarga.classList.remove("arrastrando"));
        zonaCarga.addEventListener("drop", (e) => {
            e.preventDefault();
            zonaCarga.classList.remove("arrastrando");
            if (e.dataTransfer.files.length > 0) {
                inputArchivo.files = e.dataTransfer.files;
                this.actualizarVistaArchivo();
            }
        });

        inputArchivo.addEventListener("change", () => this.actualizarVistaArchivo());

        btnQuitarArchivo.addEventListener("click", (e) => {
            e.stopPropagation(); // que no dispare el click de zonaCarga (abriría el selector de nuevo)
            inputArchivo.value = "";
            this.actualizarVistaArchivo();
        });

        btnImportar.addEventListener("click", () => this.onImportarClick());
        btnCancelar.addEventListener("click", () => this.dispatchEvent(new CustomEvent("cancelar", { bubbles: true, composed: true })));
    }

    // alterna entre el estado "sin archivo" y "archivo seleccionado" dentro de la misma zona de carga
    actualizarVistaArchivo() {
        const inputArchivo = this.shadowRoot.querySelector("#inputArchivo");
        const zonaVacia = this.shadowRoot.querySelector("#zonaCargaVacia");
        const zonaArchivo = this.shadowRoot.querySelector("#zonaCargaArchivo");
        const zonaCarga = this.shadowRoot.querySelector("#zonaCarga");

        const archivo = inputArchivo.files[0];

        if (!archivo) {
            zonaVacia.hidden = false;
            zonaArchivo.hidden = true;
            zonaCarga.classList.remove("con-archivo");
            return;
        }

        zonaVacia.hidden = true;
        zonaArchivo.hidden = false;
        zonaCarga.classList.add("con-archivo");

        zonaArchivo.querySelector(".archivo-nombre").textContent = archivo.name;
        zonaArchivo.querySelector(".archivo-tamano").textContent = `${(archivo.size / 1024).toFixed(0)} KB`;
    }

    async onImportarClick() {
        const inputArchivo = this.shadowRoot.querySelector("#inputArchivo");
        const selectMarca = this.shadowRoot.querySelector("#marca");

        if (!inputArchivo.files.length) {
            this.notificar("Debe seleccionar un archivo", "advertencia");
            return;
        }
        if (!selectMarca.value) {
            this.notificar("Debe seleccionar una marca", "advertencia");
            return;
        }

        this.archivoActual = inputArchivo.files[0];
        this.marcaSeleccionadaId = selectMarca.value;

        this.renderCargando();

        try {
            const formData = new FormData();
            formData.append("archivo", this.archivoActual);
            formData.append("marcaId", this.marcaSeleccionadaId);

            const res = await fetch("productos/importar/preview", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                this.notificar(error.error || "No se pudo procesar el archivo", "error");
                this.renderVacio();
                this.bindEventosEstadoVacio();
                return;
            }

            this.productos = await res.json();
            this.filtroEstado = "TODOS";
            this.textoBusqueda = "";
            this.renderResultados();
            this.bindEventosResultados();

        } catch (error) {
            console.error("Error al importar:", error);
            this.notificar("Ocurrió un error al procesar el archivo", "error");
            this.renderVacio();
            this.bindEventosEstadoVacio();
        }
    }
    
    notificar(mensaje, tipo = "exito") {
        document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
            detail: { mensaje, tipo }
        }));
    }

    renderCargando() {
        this.shadowRoot.innerHTML = `
            <style>${this.estilosComunes()}${this.estilosCargando()}</style>
            <div class="layout-cargando">
                <div class="spinner"></div>
                <p class="cargando-titulo">Analizando el archivo<span class="puntos"><span>.</span><span>.</span><span>.</span></span></p>
                <p class="cargando-archivo">${this.archivoActual.name}</p>
                <p class="cargando-detalle">Esto puede tardar unos segundos si el archivo tiene muchos productos</p>
            </div>
        `;
    }

    // ---------- ESTADO 2: preview de resultados ----------

    renderResultados() {
        const total = this.productos.length;
        const validos = this.productos.filter(p => p.estado === "VALIDO").length;
        const advertencias = this.productos.filter(p => p.estado === "ADVERTENCIA").length;
        const errores = this.productos.filter(p => p.estado === "ERROR").length;

        this.shadowRoot.innerHTML = `
            <style>${this.estilosComunes()}${this.estilosResultados()}</style>
            <div class="layout-resultados">

                <div class="resumen-archivo">
                    <div class="archivo-info">
                        <div class="icon-circulo"><img class="icon-importar" src="${this.basePath}/assets/img/iconos/file.svg"></div>
                        <div>
                            <strong>${this.archivoActual.name}</strong>
                            <span>${(this.archivoActual.size / 1024).toFixed(0)} KB</span>
                        </div>
                    </div>
                    <div class="contadores">
                        <div class="contador ok"><strong>${total}</strong><span>Total de filas</span></div>
                        <div class="contador ok"><strong>${validos}</strong><span>Válidos</span></div>
                        <div class="contador warn"><strong>${advertencias}</strong><span>Advertencias</span></div>
                        <div class="contador error"><strong>${errores}</strong><span>Errores</span></div>
                    </div>
                </div>

                <div class="barra-filtros">
                    <div class="tabs">
                        <button type="button" class="tab activo" data-estado="TODOS">Todos (${total})</button>
                        <button type="button" class="tab" data-estado="VALIDO">Válidos (${validos})</button>
                        <button type="button" class="tab" data-estado="ADVERTENCIA">Advertencias (${advertencias})</button>
                        <button type="button" class="tab" data-estado="ERROR">Errores (${errores})</button>
                    </div>
                    
                    <div class="search">
                        <input type="search" id="buscador" placeholder="Buscar producto, código o sección...">
                    </div>
                </div>

                <div class="tabla-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Fila</th><th>Código</th><th>Producto</th><th>Categoría</th>
                                <th>Contenido</th><th>Unidad</th><th>Estado</th><th>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody id="cuerpoTabla"></tbody>
                    </table>
                </div>

                <p class="nota-defecto">Ten en cuenta que los productos se importarán con los valores de stock,
                    stock mínimo y precio en 0 si no vienen en el archivo. Podrás completarlos o modificarlos
                    después desde el listado de productos.</p>

                <div class="acciones">
                    <button type="button" id="btnVolver">← Volver</button>
                    <button type="button" id="btnReporte">⬇ Descargar reporte</button>
                    <button type="button" id="btnConfirmar"><img class="icon-importar-btn" src="${this.basePath}/assets/img/iconos/import.svg"> Importar productos válidos (${validos})</button>
                </div>
            </div>
        `;

        this.renderFilasTabla();
    }

    renderFilasTabla() {
        const cuerpo = this.shadowRoot.querySelector("#cuerpoTabla");
        const texto = this.textoBusqueda.toLowerCase();

        const filas = this.productos.filter(p => {
            if (this.filtroEstado !== "TODOS" && p.estado !== this.filtroEstado) return false;
            if (!texto) return true;
            const categoriaNombre = (this.categoriasPorId.get(p.categoriaId) || "").toLowerCase();
            return (p.nombre || "").toLowerCase().includes(texto)
                || (p.codigoProveedor || "").toLowerCase().includes(texto)
                || categoriaNombre.includes(texto);
        });

        cuerpo.innerHTML = filas.map((p, i) => `
            <tr data-fila="${p.fila}">
                <td>${p.fila}</td>
                <td>${p.codigoProveedor ?? "-"}</td>
                <td>${p.nombre ?? "-"}</td>
                <td>${this.celdaCategoria(p)}</td>
                <td>${p.contenido ?? "-"}</td>
                <td>${this.unidadesPorId.get(p.uniMedidaId) || "-"}</td>
                <td><span class="badge ${p.estado.toLowerCase()}">${this.etiquetaEstado(p.estado)}</span></td>
                <td class="observaciones">${p.motivo ?? "-"}</td>
            </tr>
        `).join("");

        if (filas.length === 0) {
            cuerpo.innerHTML = `<tr><td colspan="8" class="sin-resultados">No se encontraron filas para este filtro</td></tr>`;
        }

        cuerpo.querySelectorAll(".select-categoria-manual").forEach(select => {
            select.addEventListener("change", (e) => this.onCategoriaManualElegida(e));
        });
    }

    // si ya tiene categoria resuelta, muestra el nombre; si no, un select para elegirla a mano
    celdaCategoria(producto) {
        const nombreCategoria = this.categoriasPorId.get(producto.categoriaId);
        if (nombreCategoria) {
            return nombreCategoria;
        }

        const opciones = [...this.categoriasPorId.entries()]
            .map(([id, nombre]) => `<option value="${id}">${nombre}</option>`)
            .join("");

        return `
            <select class="select-categoria-manual" data-fila="${producto.fila}">
                <option value="">Elegir categoría...</option>
                ${opciones}
            </select>
        `;
    }

    onCategoriaManualElegida(evento) {
        const fila = Number(evento.target.dataset.fila);
        const categoriaId = Number(evento.target.value);

        if (!categoriaId) {
            return;
        }

        const producto = this.productos.find(p => p.fila === fila);
        if (!producto) {
            return;
        }

        producto.categoriaId = categoriaId;
        producto.estado = "VALIDO";
        producto.motivo = null;

        this.actualizarContadores();
        this.renderFilasTabla();
    }

    actualizarContadores() {
        const total = this.productos.length;
        const validos = this.productos.filter(p => p.estado === "VALIDO").length;
        const advertencias = this.productos.filter(p => p.estado === "ADVERTENCIA").length;
        const errores = this.productos.filter(p => p.estado === "ERROR").length;

        this.shadowRoot.querySelector(".contador.ok strong").textContent = total;
        this.shadowRoot.querySelectorAll(".contador strong")[1].textContent = validos;
        this.shadowRoot.querySelector(".contador.warn strong").textContent = advertencias;
        this.shadowRoot.querySelector(".contador.error strong").textContent = errores;

        this.shadowRoot.querySelector('[data-estado="TODOS"]').textContent = `Todos (${total})`;
        this.shadowRoot.querySelector('[data-estado="VALIDO"]').textContent = `Válidos (${validos})`;
        this.shadowRoot.querySelector('[data-estado="ADVERTENCIA"]').textContent = `Advertencias (${advertencias})`;
        this.shadowRoot.querySelector('[data-estado="ERROR"]').textContent = `Errores (${errores})`;

        this.shadowRoot.querySelector("#btnConfirmar").textContent = `✓ Importar productos válidos (${validos})`;
    }

    etiquetaEstado(estado) {
        if (estado === "VALIDO") return "✓ Válido";
        if (estado === "ADVERTENCIA") return "⚠ Advertencia";
        return "✕ Error";
    }

    bindEventosResultados() {
        this.shadowRoot.querySelector("#btnVolver").addEventListener("click", () => {
            this.archivoActual = null;
            this.renderVacio();
            this.bindEventosEstadoVacio();
        });

        this.shadowRoot.querySelectorAll(".tab").forEach(tab => {
            tab.addEventListener("click", () => {
                this.shadowRoot.querySelectorAll(".tab").forEach(t => t.classList.remove("activo"));
                tab.classList.add("activo");
                this.filtroEstado = tab.dataset.estado;
                this.renderFilasTabla();
            });
        });

        this.shadowRoot.querySelector("#buscador").addEventListener("input", (e) => {
            this.textoBusqueda = e.target.value;
            this.renderFilasTabla();
        });

        this.shadowRoot.querySelector("#btnReporte").addEventListener("click", () => this.descargarReporte());
        this.shadowRoot.querySelector("#btnConfirmar").addEventListener("click", () => this.confirmarImportacion());
    }

    descargarReporte() {
        const encabezado = "Fila,Codigo,Producto,Categoria,Contenido,Unidad,Estado,Observaciones\n";
        const filas = this.productos.map(p => [
            p.fila,
            p.codigoProveedor ?? "",
            `"${(p.nombre ?? "").replace(/"/g, '""')}"`,
            this.categoriasPorId.get(p.categoriaId) || "",
            p.contenido ?? "",
            this.unidadesPorId.get(p.uniMedidaId) || "",
            p.estado,
            `"${(p.motivo ?? "").replace(/"/g, '""')}"`
        ].join(",")).join("\n");

        const blob = new Blob([encabezado + filas], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "reporte-importacion.csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    async confirmarImportacion() {
        const validos = this.productos.filter(p => p.estado === "VALIDO");

        if (validos.length === 0) {
            this.notificar("No hay productos válidos para importar", "advertencia");
            return;
        }

        const btnConfirmar = this.shadowRoot.querySelector("#btnConfirmar");
        const textoOriginal = btnConfirmar.textContent;

        btnConfirmar.disabled = true;
        btnConfirmar.textContent = "Importando...";

        try {
            const res = await fetch("productos/importar/confirmar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validos)
            });

            const data = await res.json();

            if (!res.ok) {
                this.notificar(data.error || "No se pudo completar la importación", "error");
                btnConfirmar.disabled = false;
                btnConfirmar.textContent = textoOriginal;
                return;
            }

            data.productos.forEach(actualizado => {
                const producto = this.productos.find(p => p.fila === actualizado.fila);
                if (producto) {
                    producto.estado = actualizado.estado;
                    producto.motivo = actualizado.motivo;
                }
            });

            if (data.insertados > 0) {
                this.notificar(`Se importaron ${data.insertados} productos correctamente`, "exito");
            } else {
                this.notificar("No se pudo insertar ningún producto, revisá la pestaña de Errores", "error");
            }

            this.actualizarContadores();
            this.renderFilasTabla();
            // btnConfirmar queda deshabilitado a propósito: ya se insertaron los válidos,
            // un segundo click volvería a insertarlos duplicados

        } catch (error) {
            console.error("Error al confirmar importación:", error);
            this.notificar("Ocurrió un error al importar los productos", "error");
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = textoOriginal;
        }
    }

    // ---------- estilos ----------

    estilosComunes() {
        return `
            :host {
                --azul: #2F6FED;
                --azul-oscuro: #1F4FBD;
                --azul-suave: rgba(47, 111, 237, .12);
                --verde: #2CA86A;
                --amarillo: #D9A22F;
                --rojo: #E0473C;
                --texto-claro: rgba(255,255,255,.92);
                --texto-tenue: rgba(255,255,255,.6);
                --borde-tenue: rgba(255,255,255,.18);
            }

            * {
                box-sizing: border-box;
            }

            .layout-importar,
            .layout-resultados,
            .layout-cargando {
                font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                flex-direction: column;
                gap: 1.1rem;
            }

            .icon-circulo {
                width: 44px;
                height: 44px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .icon-importar {
                width: 2rem;
            }

            .icon-importar-btn {
                width: 15px;
                filter: brightness(0) invert(1);
            }

            .acciones {
                display: flex;
                justify-content: flex-end;
                gap: .7rem;
                font-weight: 600;
            }

            .acciones button {
                display: inline-flex;
                align-items: center;
                gap: .4rem;
                padding: .6rem 1.2rem;
                border-radius: 10px;
                font-size: .88rem;
                cursor: pointer;
                transition: background .15s ease, opacity .15s ease, transform .1s ease;
            }

            .acciones button:active {
                transform: scale(.98);
            }

            #btnCancelar,
            #btnVolver,
            #btnReporte {
                background: transparent;
                border: 1px solid var(--borde-tenue);
                color: var(--texto-claro);
            }

            #btnCancelar:hover,
            #btnVolver:hover,
            #btnReporte:hover {
                background: rgba(255,255,255,.06);
            }

            #btnImportar,
            #btnConfirmar {
                background: var(--azul);
                border: none;
                color: white;
            }

            #btnImportar:hover,
            #btnConfirmar:hover {
                background: var(--azul-oscuro);
            }
        `;
    }

    estilosVacio() {
        return `
            .importar-info {
                color: var(--texto-tenue);
                margin: 0;
                font-size: .92rem;
                line-height: 1.5;
            }

            .zona-carga {
                text-align: center;
                padding: 2.25rem 1.5rem;
                color: var(--texto-claro);
                background: rgba(255,255,255,.03);
                border: 2px dashed var(--borde-tenue);
                border-radius: 14px;
                cursor: pointer;
                transition: border-color .18s ease, background .18s ease, transform .12s ease;
            }

            .zona-carga:hover,
            .zona-carga.arrastrando {
                border-color: var(--azul);
                background: var(--azul-suave);
            }

            .zona-carga:active {
                transform: scale(.995);
            }

            .zona-carga .icon-circulo {
                margin: 0 auto .75rem;
            }

            .zona-carga p {
                margin: 0 0 .35rem;
                font-weight: 600;
            }

            .zona-carga .detalle {
                display: flex;
                justify-content: center;
                gap: .9rem;
                flex-wrap: wrap;
                font-size: .8rem;
                color: var(--texto-tenue);
            }

            .zona-carga .detalle span {
                display: inline-flex;
                align-items: center;
                gap: .3rem;
            }

            .zona-carga .detalle img {
                width: 14px;
                opacity: .7;
            }

            .box-marca {
                display: flex;
                flex-direction: column;
                gap: .4rem;
            }

            .box-marca label {
                color: var(--texto-claro);
                font-weight: 600;
                font-size: .88rem;
            }

            .select-wrapper {
                position: relative;
            }

            .select-wrapper img {
                position: absolute;
                left: .8rem;
                top: 50%;
                transform: translateY(-50%);
                width: 16px;
                opacity: .8;
                pointer-events: none;
            }

            select#marca {
                width: 100%;
                padding: .65rem 1rem;
                border-radius: 10px;
                border: 1px solid var(--borde-tenue);
                background: rgba(255,255,255,.05);
                color: var(--texto-claro);
                font-size: .9rem;
                cursor: pointer;
                transition: border-color .15s ease;
            }

            select#marca:focus-visible {
                outline: none;
                border-color: var(--azul);
            }

            select#marca option {
                color: #111;
            }

            .box-marca .ayuda {
                color: var(--texto-tenue);
                font-size: .78rem;
                line-height: 1.4;
                margin: 0;
            }
        
            .zona-carga-archivo {
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .zona-carga.con-archivo {
                border-style: solid;
                border-color: var(--verde);
                background: rgba(44,168,106,.08);
            }
        
            .archivo-nombre {
                font-weight: 600;
                margin: 0 0 .2rem;
                word-break: break-all;
            }

            .archivo-tamano {
                color: var(--texto-tenue);
                font-size: .8rem;
                margin-bottom: .8rem;
            }

            #btnQuitarArchivo {
                background: transparent;
                border: 1px solid var(--borde-tenue);
                color: var(--texto-claro);
                padding: .4rem .9rem;
                border-radius: 8px;
                font-size: .8rem;
                cursor: pointer;
            }

            #btnQuitarArchivo:hover {
                background: rgba(255,255,255,.08);
            }
        
            .link-ejemplo {
                display: inline-flex;
                align-items: center;
                gap: .4rem;
                align-self: flex-start;
                padding: .6rem .8rem;
                border-radius: 8px;
                background: rgba(9, 189, 91 ,.4);
                border: 1px solid var(--borde-tenue);
                color: white;
                font-size: .8rem;
                text-decoration: none;
                transition: background .15s ease, color .15s ease, border-color .15s ease;
            }

            .link-ejemplo:hover {
                background: rgba(9, 189, 91 ,.2);
                border-color: var(--azul);
                color: var(--texto-claro);
            }

            .link-ejemplo:focus-visible {
                outline: none;
                border-color: var(--azul);
            }
        
            .zona-carga-vacia[hidden],
            .zona-carga-archivo[hidden] {
                display: none !important;
            }
        `;
    }

    estilosResultados() {
        return `
            .resumen-archivo {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 1rem;
                background: rgba(255,255,255,.03);
                border: 1px solid var(--borde-tenue);
                border-radius: 12px;
                padding: .9rem 1.1rem;
            }

            .archivo-info {
                display: flex;
                align-items: center;
                gap: .7rem;
                color: var(--texto-claro);
            }

            .archivo-info strong {
                display: block;
                font-size: .9rem;
            }

            .archivo-info span {
                color: var(--texto-tenue);
                font-size: .78rem;
            }

            .contadores {
                display: flex;
                gap: 1.4rem;
            }

            .contador {
                text-align: center;
            }

            .contador strong {
                display: block;
                font-size: 1.15rem;
            }

            .contador span {
                font-size: .72rem;
                color: var(--texto-tenue);
            }

            .contador.ok strong {
                color: var(--verde);
            }

            .contador.warn strong {
                color: var(--amarillo);
            }

            .contador.error strong {
                color: var(--rojo);
            }

            .barra-filtros {
                display: flex;
                justify-content: space-between;
                flex-direction: column;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .tabs {
                display: flex;
                gap: .4rem;
            }
        
            .search input:focus {
                outline: none;
                border-color: #2F6FED;
            }

            .tab {
                padding: .45rem .9rem;
                border-radius: 8px;
                border: 1px solid var(--borde-tenue);
                background: transparent;
                color: var(--texto-tenue);
                font-size: .82rem;
                cursor: pointer;
                transition: background .15s ease, color .15s ease;
            }

            .tab.activo {
                background: var(--azul);
                border-color: var(--azul);
                color: white;
            }

            #buscador {
                padding: .5rem .9rem;
                border-radius: 8px;
                border: 1px solid var(--borde-tenue);
                background: rgba(255,255,255,.05);
                color: var(--texto-claro);
                font-size: .85rem;
                width: 100%;
            }
        
            #buscador:focus {
                border: 1px solid var(--azul);
            }

            #buscador::placeholder {
                color: var(--texto-tenue);
            }

            .tabla-wrapper {
                max-height: 320px;
                overflow-y: auto;
                border: 1px solid var(--borde-tenue);
                border-radius: 12px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                font-size: .82rem;
                color: var(--texto-claro);
            }

            thead th {
                position: sticky;
                top: 0;
                background: rgba(19, 11, 99);
                text-align: left;
                padding: .6rem .8rem;
                font-weight: 600;
                color: var(--texto-tenue);
                border-bottom: 1px solid var(--borde-tenue);
            }

            tbody td {
                padding: .55rem .8rem;
                border-bottom: 1px solid rgba(255,255,255,.06);
            }

            tbody tr:last-child td {
                border-bottom: none;
            }

            td.observaciones {
                color: var(--texto-tenue);
                max-width: 220px;
            }

            .sin-resultados {
                text-align: center;
                color: var(--texto-tenue);
                padding: 1.5rem;
            }

            .badge {
                padding: .2rem .55rem;
                border-radius: 999px;
                font-size: .74rem;
                font-weight: 600;
                white-space: nowrap;
            }

            .badge.valido {
                background: rgba(44,168,106,.15);
                color: var(--verde);
            }

            .badge.advertencia {
                background: rgba(217,162,47,.18);
                color: var(--amarillo);
            }

            .badge.error {
                background: rgba(224,71,60,.15);
                color: var(--rojo);
            }

            .nota-defecto {
                font-size: .78rem;
                color: var(--texto-tenue);
                margin: 0;
            }
        `;
    }
    
    estilosCargando() {
        return `
            .layout-cargando {
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 3.5rem 1.5rem;
                color: var(--texto-claro);
                gap: .4rem;
            }

            .spinner {
                width: 46px;
                height: 46px;
                border-radius: 50%;
                border: 4px solid var(--borde-tenue);
                border-top-color: var(--azul);
                animation: girar .8s linear infinite;
                margin-bottom: 1.4rem;
            }

            @keyframes girar {
                to { transform: rotate(360deg); }
            }

            .cargando-titulo {
                font-size: 1rem;
                font-weight: 600;
                margin: 0;
            }

            .puntos span {
                animation: parpadeo 1.4s infinite;
                opacity: 0;
            }

            .puntos span:nth-child(2) { animation-delay: .2s; }
            .puntos span:nth-child(3) { animation-delay: .4s; }

            @keyframes parpadeo {
                0%, 100% { opacity: 0; }
                50% { opacity: 1; }
            }

            .cargando-archivo {
                margin: .3rem 0 0;
                font-size: .85rem;
                color: var(--azul);
                font-weight: 600;
            }

            .cargando-detalle {
                margin: .6rem 0 0;
                font-size: .78rem;
                color: var(--texto-tenue);
                max-width: 320px;
            }
        `;
    }

}

customElements.define("importar-productos", ImportarProductos);