class ActualizarPrecios extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";
        this.marcas = [];
        this.archivoActual = null;
        this.marcaSeleccionadaId = null;
        this.cambios = [];
        this.seleccionados = new Set(); // indices de this.cambios tildados
        this.textoBusqueda = "";
    }

    async connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        await this.cargarMarcas();
        this.renderVacio();
        this.bindEventosEstadoVacio();
    }

    async cargarMarcas() {
        try {
            this.marcas = await fetch(`${this.basePath}/marcas`).then(r => r.json());
        } catch (error) {
            console.error("Error al cargar marcas:", error);
        }
    }

    // ---------- ESTADO 1: sin archivo ----------

    renderVacio() {
        this.shadowRoot.innerHTML = `
            <style>${this.estilosComunes()}${this.estilosVacio()}</style>
            <div class="layout-importar">
                <p class="importar-info">Se van a mostrar únicamente los
                    productos que ya existen en el sistema y cuyo precio cambió respecto al que tenés cargado.
                </p>

                <div class="zona-carga" id="zonaCarga">
                    <div class="zona-carga-vacia" id="zonaCargaVacia">
        
                        <img class="icon-importar" src="${this.basePath}/assets/img/iconos/trending-up.svg">
        
                        <p>Arrastre el archivo aquí o haga click para seleccionar</p>
                        <div class="detalle">
                            <span>Formatos soportados: .xlsx</span>
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

                    <input type="file" id="inputArchivo" accept=".xlsx" hidden>
                </div>

                <div class="box-marca">
                    <label>Marca</label>
                    <div class="select-wrapper">
                        <select id="marca" name="marca" required>
                            <option value="">Seleccione una opción</option>
                            ${this.marcas.map(m => `<option value="${m.id}">${m.nombre}</option>`).join("")}
                        </select>
                    </div>
                    <p class="ayuda">Los precios se comparan únicamente contra productos de esta marca.</p>
                </div>

                <div class="acciones">
                    <button type="button" id="btnComparar">
                        <img class="icon-importar-btn" src="${this.basePath}/assets/img/iconos/trending-up.svg">
                        Comparar precios
                    </button>
                </div>
            </div>
        `;
    }

    bindEventosEstadoVacio() {
        const zonaCarga = this.shadowRoot.querySelector("#zonaCarga");
        const inputArchivo = this.shadowRoot.querySelector("#inputArchivo");
        const btnComparar = this.shadowRoot.querySelector("#btnComparar");
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
            e.stopPropagation();
            inputArchivo.value = "";
            this.actualizarVistaArchivo();
        });

        btnComparar.addEventListener("click", () => this.onCompararClick());
        btnCancelar.addEventListener("click", () => this.dispatchEvent(new CustomEvent("cancelar", { bubbles: true, composed: true })));
    }

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

    async onCompararClick() {
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

            const res = await fetch(`${this.basePath}/productos/actualizar-precios/preview`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                this.notificar(data.error || "No se pudo procesar el archivo", "error");
                this.renderVacio();
                this.bindEventosEstadoVacio();
                return;
            }

            this.cambios = data;
            this.seleccionados = new Set(); // destildado por defecto
            this.textoBusqueda = "";
            this.renderResultados();
            this.bindEventosResultados();

        } catch (error) {
            console.error("Error al comparar precios:", error);
            this.notificar("Ocurrió un error al procesar el archivo", "error");
            this.renderVacio();
            this.bindEventosEstadoVacio();
        }
    }

    renderCargando() {
        this.shadowRoot.innerHTML = `
            <style>${this.estilosComunes()}${this.estilosCargando()}</style>
            <div class="layout-cargando">
                <div class="spinner"></div>
                <p class="cargando-titulo">Comparando precios<span class="puntos"><span>.</span><span>.</span><span>.</span></span></p>
                <p class="cargando-archivo">${this.archivoActual.name}</p>
                <p class="cargando-detalle">Esto puede tardar unos segundos si el archivo tiene muchos productos</p>
            </div>
        `;
    }

    notificar(mensaje, tipo = "exito") {
        document.dispatchEvent(new CustomEvent("mostrar-notificacion", { detail: { mensaje, tipo } }));
    }

    // ---------- ESTADO 2: tabla de comparación ----------

    renderResultados() {
        const total = this.cambios.length;

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
                        <div class="contador ok"><strong>${total}</strong><span>Precios distintos</span></div>
                        <div class="contador sel"><strong id="contadorSeleccionados">0</strong><span>Seleccionados</span></div>
                    </div>
                </div>

                ${total === 0 ? `
                    <div class="sin-cambios">
                        <p>No se encontraron productos existentes con un precio distinto al del archivo.</p>
                    </div>
                ` : `
                    <div class="barra-filtros">
                        <input type="search" id="buscador" placeholder="Buscar producto o código...">
                        <div class="acciones-seleccion">
                            <button type="button" id="btnSeleccionarTodos">Seleccionar todos</button>
                            <button type="button" id="btnDeseleccionarTodos">Deseleccionar todos</button>
                        </div>
                    </div>

                    <div class="tabla-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th class="col-check"><input type="checkbox" id="checkTodos"></th>
                                    <th>Código</th><th>Producto</th><th>Precio actual</th><th>Precio nuevo</th><th>Diferencia</th>
                                </tr>
                            </thead>
                            <tbody id="cuerpoTabla"></tbody>
                        </table>
                    </div>
                `}

                <div class="acciones">
                    <button type="button" id="btnVolver">← Volver</button>
                    <button type="button" id="btnConfirmar" ${total === 0 ? "disabled" : ""}>
                        ✓ Actualizar seleccionados (<span id="totalSeleccionadosBoton">0</span>)
                    </button>
                </div>
            </div>
        `;

        if (total > 0) {
            this.renderFilasTabla();
        }
    }

    renderFilasTabla() {
        const cuerpo = this.shadowRoot.querySelector("#cuerpoTabla");
        const texto = this.textoBusqueda.toLowerCase();

        const filasVisibles = this.cambios
            .map((item, indiceOriginal) => ({ item, indiceOriginal }))
            .filter(({ item }) => {
                if (!texto) return true;
                return (item.nombre || "").toLowerCase().includes(texto)
                    || (item.codigoProveedor || "").toLowerCase().includes(texto);
            });

        cuerpo.innerHTML = filasVisibles.map(({ item, indiceOriginal }) => {
            const diferencia = item.precioNuevo - item.precioActual;
            const subio = diferencia > 0;

            return `
                <tr>
                    <td class="col-check"><input type="checkbox" class="check-fila" data-indice="${indiceOriginal}" ${this.seleccionados.has(indiceOriginal) ? "checked" : ""}></td>
                    <td>${item.codigoProveedor ?? "-"}</td>
                    <td>${item.nombre ?? "-"}</td>
                    <td>$${Number(item.precioActual).toLocaleString("es-AR")}</td>
                    <td>$${Number(item.precioNuevo).toLocaleString("es-AR")}</td>
                    <td class="${subio ? "dif-sube" : "dif-baja"}">${subio ? "▲" : "▼"} $${Math.abs(diferencia).toLocaleString("es-AR")}</td>
                </tr>
            `;
        }).join("");

        if (filasVisibles.length === 0) {
            cuerpo.innerHTML = `<tr><td colspan="6" class="sin-resultados">No se encontraron filas para esta búsqueda</td></tr>`;
        }

        cuerpo.querySelectorAll(".check-fila").forEach(check => {
            check.addEventListener("change", (e) => {
                const indice = Number(e.target.dataset.indice);
                if (e.target.checked) this.seleccionados.add(indice);
                else this.seleccionados.delete(indice);
                this.actualizarContadorSeleccionados();
                this.actualizarCheckTodos();
            });
        });
    }

    actualizarContadorSeleccionados() {
        const cantidad = this.seleccionados.size;
        this.shadowRoot.querySelector("#contadorSeleccionados").textContent = cantidad;
        this.shadowRoot.querySelector("#totalSeleccionadosBoton").textContent = cantidad;
    }

    // el check del header refleja si TODAS las filas visibles estan tildadas, sin forzar nada mas
    actualizarCheckTodos() {
        const checkTodos = this.shadowRoot.querySelector("#checkTodos");
        const checksFila = [...this.shadowRoot.querySelectorAll(".check-fila")];
        checkTodos.checked = checksFila.length > 0 && checksFila.every(c => c.checked);
    }

    bindEventosResultados() {
        this.shadowRoot.querySelector("#btnVolver").addEventListener("click", () => {
            this.archivoActual = null;
            this.renderVacio();
            this.bindEventosEstadoVacio();
        });

        this.shadowRoot.querySelector("#btnConfirmar").addEventListener("click", () => this.confirmarActualizacion());

        if (this.cambios.length === 0) return;

        this.shadowRoot.querySelector("#buscador").addEventListener("input", (e) => {
            this.textoBusqueda = e.target.value;
            this.renderFilasTabla();
            this.actualizarCheckTodos();
        });

        this.shadowRoot.querySelector("#checkTodos").addEventListener("change", (e) => {
            // afecta solo a las filas visibles en este momento (respeta la busqueda activa)
            this.shadowRoot.querySelectorAll(".check-fila").forEach(check => {
                check.checked = e.target.checked;
                const indice = Number(check.dataset.indice);
                if (e.target.checked) this.seleccionados.add(indice);
                else this.seleccionados.delete(indice);
            });
            this.actualizarContadorSeleccionados();
        });

        this.shadowRoot.querySelector("#btnSeleccionarTodos").addEventListener("click", () => {
            this.cambios.forEach((_, indice) => this.seleccionados.add(indice));
            this.renderFilasTabla();
            this.actualizarContadorSeleccionados();
            this.actualizarCheckTodos();
        });

        this.shadowRoot.querySelector("#btnDeseleccionarTodos").addEventListener("click", () => {
            this.seleccionados.clear();
            this.renderFilasTabla();
            this.actualizarContadorSeleccionados();
            this.actualizarCheckTodos();
        });
    }

    async confirmarActualizacion() {
        if (this.seleccionados.size === 0) {
            this.notificar("No seleccionaste ningún producto para actualizar", "advertencia");
            return;
        }

        const btnConfirmar = this.shadowRoot.querySelector("#btnConfirmar");
        const textoOriginal = btnConfirmar.innerHTML;
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = "Actualizando...";

        const seleccionadosData = [...this.seleccionados].map(indice => this.cambios[indice]);

        try {
            const res = await fetch(`${this.basePath}/productos/actualizar-precios/confirmar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(seleccionadosData)
            });

            const data = await res.json();

            if (!res.ok) {
                this.notificar(data.error || "No se pudo completar la actualización", "error");
                btnConfirmar.disabled = false;
                btnConfirmar.innerHTML = textoOriginal;
                return;
            }

            this.notificar(`Se actualizaron ${data.actualizados} productos correctamente`, "exito");
            // no se reactiva el boton: los seleccionados ya se actualizaron, un segundo click los duplicaria/reprocesaria

        } catch (error) {
            console.error("Error al confirmar actualización:", error);
            this.notificar("Ocurrió un error al actualizar los precios", "error");
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = textoOriginal;
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
                --rojo: #E0473C;
                --texto-claro: rgba(255,255,255,.92);
                --texto-tenue: rgba(255,255,255,.6);
                --borde-tenue: rgba(255,255,255,.18);
            }
            * { box-sizing: border-box; }
            .layout-importar, .layout-resultados, .layout-cargando {
                font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                flex-direction: column;
                gap: 1.1rem;
            }
            .icon-circulo {
                width: 44px; height: 44px; flex-shrink: 0;
                display: flex; align-items: center; justify-content: center;
                border-radius: 50%;
                background: var(--azul-suave);
            }
            .icon-importar { width: 30px; padding: 1rem 0; }
            .icon-importar-btn { width: 15px; filter: brightness(0) invert(1); }
            .acciones { display: flex; justify-content: flex-end; gap: .7rem; }
            .acciones button {
                display: inline-flex; align-items: center; gap: .4rem;
                padding: .6rem 1.2rem; border-radius: 10px;
                font-size: .88rem; font-weight: 600; cursor: pointer;
                transition: background .15s ease, opacity .15s ease, transform .1s ease;
            }
            .acciones button:active { transform: scale(.98); }
            .acciones button:disabled { opacity: .5; cursor: not-allowed; }
            #btnCancelar, #btnVolver {
                background: transparent; border: 1px solid var(--borde-tenue); color: var(--texto-claro);
            }
            #btnCancelar:hover, #btnVolver:hover { background: rgba(255,255,255,.06); }
            #btnComparar, #btnConfirmar { background: var(--azul); border: none; color: white; }
            #btnComparar:hover, #btnConfirmar:hover { background: var(--azul-oscuro); }
        `;
    }

    estilosVacio() {
        return `
            .importar-info { color: var(--texto-tenue); margin: 0; font-size: .92rem; line-height: 1.5; }
            .zona-carga {
                text-align: center; padding: 2.25rem 1.5rem; color: var(--texto-claro);
                background: rgba(5, 68, 141, .8); border: 2px dashed var(--borde-tenue);
                border-radius: 14px; cursor: pointer;
                transition: border-color .18s ease, background .18s ease, transform .12s ease;
            }
            .zona-carga:hover, .zona-carga.arrastrando { border-color: var(--azul); background: rgba(5, 68, 141, .6); }
            .zona-carga:active { transform: scale(.995); }
            .zona-carga .icon-circulo { margin: 0 auto .75rem; }
            .zona-carga p { margin: 0 0 .35rem; font-weight: 600; }
            .zona-carga .detalle { display: flex; justify-content: center; gap: .9rem; flex-wrap: wrap; font-size: .8rem; color: var(--texto-tenue); }
            .zona-carga .detalle span { display: inline-flex; align-items: center; gap: .3rem; }
            .zona-carga .detalle img { width: 14px; opacity: .7; }
            .box-marca { display: flex; flex-direction: column; gap: .4rem; }
            .box-marca label { color: var(--texto-claro); font-weight: 600; font-size: .88rem; }
            .select-wrapper { position: relative; }
            select#marca {
                width: 100%; padding: .65rem 1rem;
                border-radius: 10px; border: 1px solid var(--borde-tenue);
                background: rgba(5, 68, 141, .8); color: var(--texto-claro);
                font-size: .9rem; cursor: pointer; transition: border-color .15s ease;
            }
            select#marca:focus-visible { outline: none; border-color: var(--azul); }
            select#marca option { color: #111; }
            .box-marca .ayuda { color: var(--texto-tenue); font-size: .78rem; line-height: 1.4; margin: 0; }

            .zona-carga-archivo { display: flex; flex-direction: column; align-items: center; }
            .zona-carga.con-archivo { border-style: solid; border-color: var(--verde); background: rgba(44,168,106,.08); }
            .icon-circulo.archivo-ok { background: rgba(44,168,106,.18); }
            .icon-circulo.archivo-ok img { filter: invert(48%) sepia(60%) saturate(500%) hue-rotate(90deg) brightness(90%); }
            .archivo-nombre { font-weight: 600; margin: 0 0 .2rem; word-break: break-all; }
            .archivo-tamano { color: var(--texto-tenue); font-size: .8rem; margin-bottom: .8rem; }
            #btnQuitarArchivo {
                background: transparent; border: 1px solid var(--borde-tenue); color: var(--texto-claro);
                padding: .4rem .9rem; border-radius: 8px; font-size: .8rem; cursor: pointer;
            }
            #btnQuitarArchivo:hover { background: rgba(255,255,255,.08); }

            .zona-carga-vacia[hidden],
            .zona-carga-archivo[hidden] {
                display: none !important;
            }
        `;
    }

    estilosCargando() {
        return `
            .layout-cargando {
                align-items: center; justify-content: center; text-align: center;
                padding: 3.5rem 1.5rem; color: var(--texto-claro); gap: .4rem;
            }
            .spinner {
                width: 46px; height: 46px; border-radius: 50%;
                border: 4px solid var(--borde-tenue); border-top-color: var(--azul);
                animation: girar .8s linear infinite; margin-bottom: 1.4rem;
            }
            @keyframes girar { to { transform: rotate(360deg); } }
            .cargando-titulo { font-size: 1rem; font-weight: 600; margin: 0; }
            .puntos span { animation: parpadeo 1.4s infinite; opacity: 0; }
            .puntos span:nth-child(2) { animation-delay: .2s; }
            .puntos span:nth-child(3) { animation-delay: .4s; }
            @keyframes parpadeo { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
            .cargando-archivo { margin: .3rem 0 0; font-size: .85rem; color: var(--azul); font-weight: 600; }
            .cargando-detalle { margin: .6rem 0 0; font-size: .78rem; color: var(--texto-tenue); max-width: 320px; }
        `;
    }

    estilosResultados() {
        return `
            .resumen-archivo {
                display: flex; justify-content: space-between; align-items: center;
                flex-wrap: wrap; gap: 1rem;
                background: rgba(255,255,255,.03); border: 1px solid var(--borde-tenue);
                border-radius: 12px; padding: .9rem 1.1rem;
            }
            .archivo-info { display: flex; align-items: center; gap: .7rem; color: var(--texto-claro); }
            .archivo-info strong { display: block; font-size: .9rem; }
            .archivo-info span { color: var(--texto-tenue); font-size: .78rem; }
            .contadores { display: flex; gap: 1.4rem; }
            .contador { text-align: center; }
            .contador strong { display: block; font-size: 1.15rem; }
            .contador span { font-size: .72rem; color: var(--texto-tenue); }
            .contador.ok strong { color: var(--azul); }
            .contador.sel strong { color: var(--verde); }

            .sin-cambios {
                text-align: center; padding: 2rem; color: var(--texto-tenue);
                border: 1px dashed var(--borde-tenue); border-radius: 12px;
            }

            .barra-filtros { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
            #buscador {
                padding: .5rem .9rem; border-radius: 8px; border: 1px solid var(--borde-tenue);
                background: rgba(255,255,255,.05); color: var(--texto-claro); font-size: .85rem; min-width: 220px;
            }
            #buscador::placeholder { color: var(--texto-tenue); }
            .acciones-seleccion { display: flex; gap: .5rem; }
            .acciones-seleccion button {
                padding: .45rem .9rem; border-radius: 8px; border: 1px solid var(--borde-tenue);
                background: transparent; color: var(--texto-tenue); font-size: .8rem; cursor: pointer;
            }
            .acciones-seleccion button:hover { background: rgba(255,255,255,.06); color: var(--texto-claro); }

            .tabla-wrapper { max-height: 360px; overflow-y: auto; border: 1px solid var(--borde-tenue); border-radius: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: .82rem; color: var(--texto-claro); }
            thead th {
                position: sticky; top: 0; background: rgba(20,20,30,.9);
                text-align: left; padding: .6rem .8rem; font-weight: 600; color: var(--texto-tenue);
                border-bottom: 1px solid var(--borde-tenue);
            }
            th.col-check, td.col-check { width: 36px; text-align: center; padding-left: 1rem; }
            tbody td { padding: .55rem .8rem; border-bottom: 1px solid rgba(255,255,255,.06); }
            tbody tr:last-child td { border-bottom: none; }
            .sin-resultados { text-align: center; color: var(--texto-tenue); padding: 1.5rem; }

            .dif-sube { color: var(--rojo); font-weight: 600; }
            .dif-baja { color: var(--verde); font-weight: 600; }
        `;
    }
}

customElements.define("actualizar-precios", ActualizarPrecios);