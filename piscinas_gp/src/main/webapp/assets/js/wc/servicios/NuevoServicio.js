class NuevoServicio extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";
        this._tipo = "tecnico";
        this._clientes = [];
        this._clienteSeleccionado = null;
        this._estadosVenta = [];
        this._marcas = [];
        this._categorias = [];
        this._unidades = [];
        this._productos = [];
        this._estadosVenta = [];
        this._estadoVenta = "cerrada";
        this._carrito = [];
        this._mostrandoFormProducto = false;
        this._archivoSeleccionado = null;
    }

    async connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        this.render();
        await this.cargarDatosIniciales();
        this.renderSelectorCliente();
        this.setupListeners();
    }

    async cargarDatosIniciales() {
        try {
            const [clientes, estadosVenta, marcas, categorias, unidades, productos] = await Promise.all([
                fetch(`${this.basePath}/clientes`).then(r => r.json()),
                fetch(`${this.basePath}/estados-venta`).then(r => r.json()),
                fetch(`${this.basePath}/marcas`).then(r => r.json()),
                fetch(`${this.basePath}/categorias`).then(r => r.json()),
                fetch(`${this.basePath}/unidades-medida`).then(r => r.json()),
                fetch(`${this.basePath}/productos`).then(r => r.json()),
                fetch(`${this.basePath}/estados-venta`).then(r => r.json())
            ]);
            this._clientes = clientes.filter(c => c.activo);
            this._estadosVenta = estadosVenta;
            this._marcas = marcas;
            this._categorias = categorias;
            this._unidades = unidades;
            this._productos = productos.filter(p => p.activo);
            
            this.cargarEstadosVenta();
        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
        }
    }

    obtenerIniciales(nombre) {
        const partes = nombre.trim().split(" ");
        return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase();
    }
    
        cargarEstadosVenta() {
            const select = this.shadowRoot.querySelector("#estadoVenta");

            select.innerHTML = this._estadosVenta.map(estado => `
                <option value="${estado.nombre}" ${estado.nombre === this._estadoVenta ? "selected" : ""}>
                    ${estado.nombre.charAt(0).toUpperCase() + estado.nombre.slice(1)}
                </option>
            `).join("");
        }

    colorCategoria(nombre) {
        const colores = { "Químico": "#4ADE80", "Repuesto": "#FB923C", "Accesorios de Instalación": "#A855F7" };
        return colores[nombre] || "#888888";
    }

    setupListeners() {
        this.shadowRoot.querySelectorAll(".tarjeta-tipo").forEach(tarjeta => {
            tarjeta.addEventListener("click", () => {
                this._tipo = tarjeta.dataset.tipo;
                this.shadowRoot.querySelectorAll(".tarjeta-tipo").forEach(t => t.classList.remove("seleccionada"));
                tarjeta.classList.add("seleccionada");
                this.toggleSeccionesPorTipo();
            });
        });

        this.shadowRoot.querySelector("#estadoServicio").addEventListener("change", (e) => {
            this.toggleCamposSegunEstado(e.target.value);
        });

        const btnCobro = this.shadowRoot.querySelectorAll(".btn-cobro");
        btnCobro.forEach(btn => {
            btn.addEventListener("click", () => {
                btnCobro.forEach(b => b.classList.remove("seleccionado"));
                btn.classList.add("seleccionado");
                this.shadowRoot.querySelector("#seccionMonto").style.display =
                    btn.dataset.cobro === "cobrado" ? "block" : "none";
            });
        });

        this.shadowRoot.querySelector("#archivoEvidencia").addEventListener("change", (e) => {
            this._archivoSeleccionado = e.target.files[0] || null;
            const nombreEl = this.shadowRoot.querySelector("#nombreArchivo");
            nombreEl.textContent = this._archivoSeleccionado ? this._archivoSeleccionado.name : "Ningún archivo seleccionado";
        });

        this.shadowRoot.querySelector("#btnAgregarProductos").addEventListener("click", () => {
            this._mostrandoFormProducto = true;
            this.renderFormProducto();
        });

        this.shadowRoot.querySelector("#btnRegistrarServicio").addEventListener("click", () => {
            this.registrarServicio();
        });

        this.shadowRoot.querySelector("#btnVolver").addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("navigateTo", {
                bubbles: true, composed: true,
                detail: { path: `${this.basePath}/dashboard/servicios/historial` }
            }));
        });

        this.toggleCamposSegunEstado(this.shadowRoot.querySelector("#estadoServicio").value);
    }

    toggleSeccionesPorTipo() {
        const esTecnico = this._tipo === "tecnico";
        this.shadowRoot.querySelector(".seccion-tecnico").style.display = esTecnico ? "block" : "none";
        this.shadowRoot.querySelector(".seccion-asesoramiento").style.display = esTecnico ? "none" : "block";
    }

    toggleCamposSegunEstado(estadoNombre) {
        const esCompletado = estadoNombre?.toLowerCase() === "cerrada" || estadoNombre?.toLowerCase() === "completado";
        this.shadowRoot.querySelectorAll(".campo-si-completado").forEach(el => {
            el.style.display = esCompletado ? "block" : "none";
        });
    }

    renderSelectorCliente() {
        const contenedor = this.shadowRoot.querySelector("#seccionCliente");
        contenedor.innerHTML = `
            <label>BUSCAR CLIENTE <span class="required">*</span></label>
            <div class="buscador-cliente">
                <input type="text" id="buscarCliente" autocomplete="off" placeholder="Nombre, CUIL o CUIT del cliente...">
                <div class="resultados-cliente" id="resultadosCliente" style="display:none"></div>
            </div>
        `;
        const input = this.shadowRoot.querySelector("#buscarCliente");
        const resultados = this.shadowRoot.querySelector("#resultadosCliente");

        const renderResultados = (texto) => {
            const busqueda = texto.trim().toLowerCase();
            if (!busqueda) { resultados.style.display = "none"; return; }

            const coincidencias = this._clientes.filter(c =>
                c.nombreCompleto.toLowerCase().includes(busqueda) || c.cuitCuil.toLowerCase().includes(busqueda)
            ).slice(0, 8);

            resultados.innerHTML = coincidencias.map(c => `
                <div class="resultado-cliente" data-id="${c.id}">
                    <span class="avatar avatar-${c.tipo === 'Empresa' ? 'empresa' : 'particular'}">${this.obtenerIniciales(c.nombreCompleto)}</span>
                    <div><strong>${c.nombreCompleto}</strong><small>${c.email || "Sin email"} - CUIL/CUIT: ${c.cuitCuil}</small></div>
                </div>
            `).join("") || `<p class="sin-resultados">Sin coincidencias</p>`;

            resultados.style.display = "block";
            resultados.querySelectorAll(".resultado-cliente").forEach(el => {
                el.addEventListener("click", () => {
                    this._clienteSeleccionado = this._clientes.find(c => c.id == el.dataset.id);
                    this.renderClienteSeleccionado();
                });
            });
        };

        input.addEventListener("input", (e) => renderResultados(e.target.value));
    }

    renderClienteSeleccionado() {
        const contenedor = this.shadowRoot.querySelector("#seccionCliente");
        const c = this._clienteSeleccionado;
        contenedor.innerHTML = `
            <div class="cliente-chip">
                <span class="avatar avatar-${c.tipo === 'Empresa' ? 'empresa' : 'particular'}">${this.obtenerIniciales(c.nombreCompleto)}</span>
                <div class="cliente-info"><strong>${c.nombreCompleto}</strong><small>${c.email || "Sin email"} · CUIL/CUIT: ${c.cuitCuil}</small></div>
                <button type="button" id="btnCambiarCliente">✎ Cambiar</button>
            </div>
        `;
        this.shadowRoot.querySelector("#btnCambiarCliente").addEventListener("click", () => {
            this._clienteSeleccionado = null;
            this.renderSelectorCliente();
        });
    }

    renderFormProducto() {
        const contenedor = this.shadowRoot.querySelector("#areaProductos");
        contenedor.innerHTML = `
            <div class="form-producto">
                <label>CATEGORÍA</label>
                <div class="tabs-categoria-mini">
                    <button type="button" class="tab-cat-mini activo" data-id="">Todas</button>
                    ${this._categorias.map(cat => `<button type="button" class="tab-cat-mini" data-id="${cat.id}" style="--color-cat:${this.colorCategoria(cat.nombre)}">${cat.nombre}</button>`).join("")}
                </div>
                <div class="fila-selects">
                    <div><label>MARCA</label>
                        <select id="selectMarca"><option value="">Seleccioná una marca</option>${this._marcas.map(m => `<option value="${m.id}">${m.nombre}</option>`).join("")}</select>
                    </div>
                    <div><label>UNIDAD DE MEDIDA</label>
                        <select id="selectUnidad"><option value="">Seleccioná una unidad</option>${this._unidades.map(u => `<option value="${u.id}">${u.nombre}</option>`).join("")}</select>
                    </div>
                </div>
                <label>BUSCAR PRODUCTO</label>
                <input type="text" id="buscarProducto" placeholder="Escribí el nombre del producto...">
                <div class="lista-productos-filtrados" id="listaProductosFiltrados">
                    <p class="sin-resultados">Elegí al menos una categoría, marca o unidad para ver productos</p>
                </div>
                <div class="acciones-form-producto"><button type="button" id="btnCancelarProducto">Cancelar</button></div>
            </div>
        `;

        let categoriaId = "";
        const listaEl = this.shadowRoot.querySelector("#listaProductosFiltrados");
        const renderLista = () => {
            const marcaId = this.shadowRoot.querySelector("#selectMarca").value;
            const unidadId = this.shadowRoot.querySelector("#selectUnidad").value;
            const texto = this.shadowRoot.querySelector("#buscarProducto").value.trim().toLowerCase();
            if (!categoriaId && !marcaId && !unidadId && !texto) {
                listaEl.innerHTML = `<p class="sin-resultados">Elegí al menos una categoría, marca o unidad para ver productos</p>`;
                return;
            }
            const disponibles = this._productos.filter(p =>
                (!categoriaId || p.categoriaProducto.id == categoriaId) &&
                (!marcaId || p.marcaProducto.id == marcaId) &&
                (!unidadId || p.unidadMedida.id == unidadId) &&
                (!texto || p.nombre.toLowerCase().includes(texto))
            ).slice(0, 25);

            listaEl.innerHTML = disponibles.length ? disponibles.map(p => `
                <div class="item-producto-lista" data-id="${p.id}">
                    <div><strong>${p.nombre}</strong><small>${p.marcaProducto.nombre} · ${p.contenido} ${p.unidadMedida.abreviatura}</small></div>
                    <span>$${Number(p.precioActual).toLocaleString("es-AR")}</span>
                </div>
            `).join("") : `<p class="sin-resultados">No se encontraron productos</p>`;

            listaEl.querySelectorAll(".item-producto-lista").forEach(el => {
                el.addEventListener("click", () => this.agregarAlCarrito(this._productos.find(p => p.id == el.dataset.id)));
            });
        };

        this.shadowRoot.querySelectorAll(".tab-cat-mini").forEach(tab => {
            tab.addEventListener("click", () => {
                categoriaId = tab.dataset.id;
                this.shadowRoot.querySelectorAll(".tab-cat-mini").forEach(t => t.classList.remove("activo"));
                tab.classList.add("activo");
                renderLista();
            });
        });
        this.shadowRoot.querySelector("#selectMarca").addEventListener("change", renderLista);
        this.shadowRoot.querySelector("#selectUnidad").addEventListener("change", renderLista);
        this.shadowRoot.querySelector("#buscarProducto").addEventListener("input", renderLista);
        this.shadowRoot.querySelector("#btnCancelarProducto").addEventListener("click", () => {
            this._mostrandoFormProducto = false;
            this.renderAreaProductos();
        });
    }

    agregarAlCarrito(producto) {
        const existente = this._carrito.find(i => i.productoId === producto.id);
        if (existente) existente.cantidad++;
        else this._carrito.push({
            productoId: producto.id, nombre: producto.nombre, marca: producto.marcaProducto.nombre,
            categoria: producto.categoriaProducto.nombre, contenido: producto.contenido,
            unidadAbrev: producto.unidadMedida.abreviatura, precioUnitario: Number(producto.precioActual), cantidad: 1
        });
        this._mostrandoFormProducto = false;
        this.renderAreaProductos();
    }

    renderAreaProductos() {
        const contenedor = this.shadowRoot.querySelector("#areaProductos");
        if (this._mostrandoFormProducto) { this.renderFormProducto(); return; }

        if (this._carrito.length === 0) {
            contenedor.innerHTML = `
                <div class="carrito-vacio"><p>Sin productos agregados.</p></div>
                <button type="button" id="btnAgregarProductos" class="btn-agregar-productos">+ Agregar producto</button>
            `;
        } else {
            contenedor.innerHTML = `
                ${this._carrito.map((item, i) => `
                    <div class="fila-carrito-simple">
                        <div><strong>${item.nombre}</strong><div class="badges-producto">
                            <span class="badge-mini" style="background:${this.colorCategoria(item.categoria)}22;color:${this.colorCategoria(item.categoria)}">${item.categoria}</span>
                            <span class="badge-mini" style="background:rgba(255,255,255,.1)">${item.marca}</span>
                        </div></div>
                        <span>$${item.precioUnitario.toLocaleString("es-AR")}</span>
                        <span>x${item.cantidad}</span>
                        <span>$${(item.precioUnitario * item.cantidad).toLocaleString("es-AR")}</span>
                        <button type="button" class="btn-quitar-fila" data-index="${i}">&times;</button>
                    </div>
                `).join("")}
                <button type="button" id="btnAgregarProductos" class="btn-agregar-productos">+ Agregar producto</button>
            `;
            this.shadowRoot.querySelectorAll(".btn-quitar-fila").forEach(btn => {
                btn.addEventListener("click", () => {
                    this._carrito.splice(Number(btn.dataset.index), 1);
                    this.renderAreaProductos();
                });
            });
        }
        this.shadowRoot.querySelector("#btnAgregarProductos").addEventListener("click", () => {
            this._mostrandoFormProducto = true;
            this.renderAreaProductos();
        });
    }

    async registrarServicio() {
        if (!this._clienteSeleccionado) {
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", { detail: { mensaje: "Seleccioná un cliente", tipo: "error" } }));
            return;
        }

        const estadoId = Number(this.shadowRoot.querySelector("#estadoServicio").value);

        try {
            let body, url;

            if (this._tipo === "tecnico") {
                body = {
                    clienteId: this._clienteSeleccionado.id,
                    estadoVentaId: estadoId,
                    subrubro: this.shadowRoot.querySelector("#subrubro").value,
                    manoObra: Number(this.shadowRoot.querySelector("#manoObra").value) || 0,
                    fechaInicio: this.shadowRoot.querySelector("#fechaInicio").value,
                    fechaCierre: this.shadowRoot.querySelector("#fechaCierre").value || null,
                    problema: this.shadowRoot.querySelector("#descripcionProblema").value,
                    diagnostico: this.shadowRoot.querySelector("#recomendacion").value || null,
                    detallesVenta: this._carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad }))
                };
                url = `${this.basePath}/ventas/servicio-tecnico`;
            } else {
                const cobrado = this.shadowRoot.querySelector(".btn-cobro.seleccionado")?.dataset.cobro === "cobrado";
                body = {
                    clienteId: this._clienteSeleccionado.id,
                    estadoVentaId: estadoId,
                    fecha: this.shadowRoot.querySelector("#fechaAsesoramiento").value,
                    cobrado,
                    monto: cobrado ? Number(this.shadowRoot.querySelector("#montoCobrado").value) || 0 : 0,
                    problema: this.shadowRoot.querySelector("#consultaMotivo").value,
                    diagnostico: this.shadowRoot.querySelector("#recomendacionAsesoramiento").value || null
                };
                url = `${this.basePath}/ventas/asesoramiento`;
            }

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Error al registrar el servicio");

            document.dispatchEvent(new CustomEvent("mostrar-notificacion", { detail: { mensaje: "Servicio registrado correctamente", tipo: "exito" } }));
            document.dispatchEvent(new CustomEvent("servicio-guardado", { bubbles: true, composed: true }));
            document.dispatchEvent(new CustomEvent("navigateTo", { bubbles: true, composed: true, detail: { path: `${this.basePath}/dashboard/servicios/historial` } }));

        } catch (error) {
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", { detail: { mensaje: error.message, tipo: "error" } }));
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    margin-top: 20px;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                .card {
                    background: rgba(11, 62, 121, 0.9);
                    border: 1px solid rgba(255, 255, 255, .3);
                    border-radius: 10px;
                    margin-bottom: 1.2rem;
                    position: relative;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: .6rem;
                    background: rgba(1, 49, 104, 0.9);
                    padding: .8rem 1.2rem;
                    font-size: .85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: .04em;
                    border-top-left-radius: 10px;
                    border-top-right-radius: 10px;
                }

                .card-header img {
                    width: 18px;
                    height: 18px;
                    filter: brightness(0) invert(1);
                }

                .card-body {
                    padding: 1.2rem;
                }

                label {
                    display: block;
                    font-size: .8rem;
                    font-weight: 600;
                    margin-bottom: .4rem;
                    margin-top: .8rem;
                    text-transform: uppercase;
                }

                label:first-child {
                    margin-top: 0;
                }

                .required {
                    color: #CC2727;
                }

                input,
                select,
                textarea {
                    width: 100%;
                    box-sizing: border-box;
                    padding: .6rem .8rem;
                    border-radius: 6px;
                    border: 1px solid rgba(196, 196, 196, 1);
                    background: rgba(255, 255, 255, .15);
                    color: white;
                    font-family: inherit;
                }

                select option {
                    color: black;
                }

                .selector-tipo { 
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 1.2rem; 
                }

                .tarjeta-tipo { 
                    width: 30%;
                    padding: 1.5rem 1.2rem; 
                    border-radius: 10px; 
                    border: 2px solid rgba(255, 255, 255, .25); 
                    background: rgba(1, 49, 104, 0.9); 
                    cursor: pointer; 
                    text-align: center; 
                }

                .tarjeta-tipo.seleccionada[data-tipo="tecnico"] {
                    border-color: #37A4FF;
                    background: rgba(1, 49, 104, 0.9);
                }

                .tarjeta-tipo.seleccionada[data-tipo="asesoramiento"] {
                    border-color: #E85FC9;
                    background: rgba(232, 95, 201, 0.08);
                }

                .tarjeta-tipo strong {
                    display: block;
                    font-size: 1.05rem;
                }

                .tarjeta-tipo small {
                    color: rgba(255, 255, 255, .65);
                }

                .fila-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .buscador-cliente {
                    position: relative;
                }

                .resultados-cliente {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    z-index: 9999;
                    background: rgba(1, 49, 104, 1);
                    border: 1px solid rgba(255, 255, 255, .3);
                    border-radius: 8px;
                    margin-top: .4rem;
                    max-height: 280px;
                    overflow-y: auto;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, .4);
                }

                .resultado-cliente {
                    display: flex;
                    align-items: center;
                    gap: .8rem;
                    padding: .7rem 1rem;
                    cursor: pointer;
                }

                .resultado-cliente:hover {
                    background: rgba(255, 255, 255, .08);
                }

                .avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    color: white;
                    flex-shrink: 0;
                }

                .avatar-particular {
                    background: linear-gradient(160deg, #5FD9E8, #0B5C7A);
                }

                .avatar-empresa {
                    background: linear-gradient(160deg, #E85FC9, #6A1B6E);
                }

                .cliente-chip {
                    display: flex;
                    align-items: center;
                    gap: .9rem;
                    background: rgba(255, 255, 255, .08);
                    border-radius: 8px;
                    padding: .7rem 1rem;
                }

                .cliente-info {
                    flex: 1;
                }

                .cliente-chip button {
                    background: rgba(55, 224, 224, 1);
                    color: #05448D;
                    border: none;
                    padding: .4rem 1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 700;
                }

                .botones-toggle {
                    display: flex;
                    gap: 1rem;
                }

                .btn-cobro {
                    flex: 1;
                    padding: .7rem;
                    border-radius: 6px;
                    border: 2px solid rgba(255, 255, 255, .3);
                    background: rgba(255, 255, 255, .08);
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                }

                .btn-cobro.seleccionado[data-cobro="sin_cobro"] {
                    border-color: #FBBF24;
                    background: rgba(251, 191, 36, .2);
                }

                .btn-cobro.seleccionado[data-cobro="cobrado"] {
                    border-color: #4ADE80;
                    background: rgba(74, 222, 128, .2);
                }

                .archivo-box {
                    border: 2px dashed rgba(255, 255, 255, .3);
                    border-radius: 8px;
                    padding: 1rem;
                    text-align: center;
                    margin-top: .4rem;
                }

                .archivo-box input {
                    display: none;
                }

                .archivo-box label {
                    display: inline-block;
                    background: rgba(255, 255, 255, .1);
                    padding: .5rem 1.2rem;
                    border-radius: 6px;
                    cursor: pointer;
                    margin: 0;
                    text-transform: none;
                    font-weight: 600;
                }

                #nombreArchivo {
                    display: block;
                    margin-top: .5rem;
                    font-size: .8rem;
                    color: rgba(255, 255, 255, .7);
                }

                .tabs-categoria-mini {
                    display: flex;
                    gap: .5rem;
                    flex-wrap: wrap;
                    margin-bottom: .5rem;
                }

                .tab-cat-mini {
                    padding: .4rem .9rem;
                    border-radius: 20px;
                    border: 1px solid var(--color-cat, rgba(255, 255, 255, .3));
                    background: rgba(255, 255, 255, .06);
                    color: white;
                    cursor: pointer;
                    font-size: .8rem;
                }

                .tab-cat-mini.activo {
                    background: var(--color-cat, #37A4FF);
                }

                .fila-selects {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .lista-productos-filtrados {
                    max-height: 200px;
                    overflow-y: auto;
                    border: 1px solid rgba(255, 255, 255, .2);
                    border-radius: 8px;
                    margin-top: .6rem;
                }

                .item-producto-lista {
                    display: flex;
                    justify-content: space-between;
                    padding: .6rem 1rem;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255, 255, 255, .1);
                }

                .item-producto-lista:hover {
                    background: rgba(255, 255, 255, .06);
                }

                .sin-resultados {
                    padding: 1rem;
                    text-align: center;
                    color: rgba(255, 255, 255, .6);
                    font-size: .85rem;
                }

                .carrito-vacio {
                    text-align: center;
                    padding: 1.5rem;
                    color: rgba(255, 255, 255, .6);
                    border: 2px dashed rgba(255, 255, 255, .3);
                    border-radius: 8px;
                }

                .fila-carrito-simple {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr auto;
                    align-items: center;
                    gap: .8rem;
                    padding: .6rem 0;
                    border-bottom: 1px solid rgba(255, 255, 255, .1);
                }

                .badges-producto {
                    display: flex;
                    gap: .3rem;
                    margin-top: .3rem;
                }

                .badge-mini {
                    font-size: .65rem;
                    font-weight: 700;
                    padding: .1rem .5rem;
                    border-radius: 20px;
                }

                .btn-quitar-fila {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, .5);
                    font-size: 1.1rem;
                    cursor: pointer;
                }

                .btn-agregar-productos {
                    width: 100%;
                    margin-top: 1rem;
                    background: rgba(1, 49, 104, .9);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, .3);
                    padding: .7rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                }

                .acciones-finales {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                }

                .acciones-finales button {
                    padding: .7rem 1.6rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                }

                #btnVolver {
                    background: transparent;
                    color: white;
                    border: 1px solid rgba(255, 255, 255, .3);
                }

                #btnRegistrarServicio {
                    background: #37A4FF;
                    color: white;
                    border: none;
                }
            </style>

            <div class="card">
                <div class="card-header">
                    TIPO DE SERVICIO
                </div>

                <div class="card-body">
                    <div class="selector-tipo">

                        <div class="tarjeta-tipo seleccionada" data-tipo="tecnico">
                            <img src="${this.basePath}/assets/img/iconos/hammer.svg">
                            <strong>Servicio Técnico</strong>
                            <small>Reparación, instalación, revisión</small>
                        </div>

                        <div class="tarjeta-tipo" data-tipo="asesoramiento">
                            <img src="${this.basePath}/assets/img/iconos/messages-square.svg">
                            <strong>Asesoramiento</strong>
                            <small>Consulta, orientación, presupuesto</small>
                        </div>

                    </div>
                </div>
            </div>

            <!-- CLIENTE -->
            <div class="card">
                <div class="card-header">
                    CLIENTE <span class="required">*</span>
                </div>
                <div class="card-body">
                    <div id="seccionCliente"></div>
                </div>
            </div>

            <!-- DATOS DEL SERVICIO TÉCNICO -->
            <div class="card seccion-tecnico">
                <div class="card-header">
                    DATOS DEL SERVICIO TÉCNICO
                </div>
                <div class="card-body">
                    <div class="fila-2">
                        <div>
                            <label>SUBRUBRO</label>
                            <select id="subrubro">
                                <option>Bomba</option>
                                <option>Piscina</option>
                                <option>Reparación</option>
                                <option>Otro</option>
                            </select>
                        </div>
                        <div>
                            <label>ESTADO</label>
                            <select id="estadoServicio">
                                ${this._estadosVenta.map(e =>`<option value="${e.id}">${e.nombre}</option>`).join("")}
                            </select>
                        </div>
                    </div>
                    <div class="fila-2">
                        <div>
                            <label>MANO DE OBRA</label>
                            <input type="number" id="manoObra" value="0" min="0">
                        </div>
                        <div>
                            <label>FECHA INICIO</label>
                            <input type="date" id="fechaInicio">
                        </div>
                    </div>
                    <div class="campo-si-completado">
                        <label>FECHA CIERRE</label>
                        <input type="date" id="fechaCierre">
                    </div>
                    <label>DESCRIPCIÓN DEL PROBLEMA<span class="required">*</span>
                    </label>
                    <textarea id="descripcionProblema" rows="2" placeholder="Describí el problema..."></textarea>

                    <div class="campo-si-completado">
                        <label>RECOMENDACIÓN BRINDADA</label>
                        <textareaid="recomendacion" rows="2" placeholder="¿Qué se encontró y cómo se resolvió?"></textarea>
                    </div>
       
                    <label>EVIDENCIA (OPCIONAL)</label>
                    <div class="archivo-box">
                        <label for="archivoEvidencia">
                            📎 Elegir imagen
                        </label>
                        <input type="file" id="archivoEvidencia" accept="image/*">
                        <span id="nombreArchivo">Ningún archivo seleccionado</span>
                    </div>

                    <label>
                        PRODUCTOS / REPUESTOS UTILIZADOS

                        <small style="text-transform:none;color:rgba(255,255,255,.5)">
                            (Opcional)
                        </small>
                    </label>


                    <div id="areaProductos">

                        <div class="carrito-vacio">
                            <p>Sin productos agregados.</p>
                        </div>

                        <button
                            type="button"
                            id="btnAgregarProductos"
                            class="btn-agregar-productos">

                            + Agregar producto

                        </button>

                    </div>

                </div>

            </div>


            <!-- DATOS DEL ASESORAMIENTO -->
            <div
                class="card seccion-asesoramiento"
                style="display:none">

                <div class="card-header">
                    DATOS DEL ASESORAMIENTO
                </div>

                <div class="card-body">

                    <div class="fila-2">

                        <div>

                            <label>FECHA</label>

                            <input
                                type="date"
                                id="fechaAsesoramiento">

                        </div>


                        <div>

                            <label>ESTADO</label>

                            <select id="estadoServicioAsesoramiento">

                                ${this._estadosVenta.map(e =>
                                    `<option value="${e.id}">${e.nombre}</option>`
                                ).join("")}

                            </select>

                        </div>

                    </div>


                    <label>¿SE COBRA?</label>

                    <div class="botones-toggle">

                        <button
                            type="button"
                            class="btn-cobro seleccionado"
                            data-cobro="sin_cobro">

                            Sin cobro

                        </button>


                        <button
                            type="button"
                            class="btn-cobro"
                            data-cobro="cobrado">

                            Cobrado

                        </button>

                    </div>


                    <div
                        id="seccionMonto"
                        style="display:none">

                        <label>MONTO COBRADO ($)</label>

                        <input
                            type="number"
                            id="montoCobrado"
                            value="0"
                            min="0">

                    </div>


                    <label>
                        CONSULTA / MOTIVO
                        <span class="required">*</span>
                    </label>

                    <textarea
                        id="consultaMotivo"
                        rows="2"
                        placeholder="¿Qué consultó el cliente?"></textarea>


                    <div class="campo-si-completado">

                        <label>RECOMENDACIÓN BRINDADA</label>

                        <textarea
                            id="recomendacionAsesoramiento"
                            rows="2"
                            placeholder="¿Qué se le recomendó o indicó?"></textarea>

                    </div>

                </div>

            </div>

            <div class="acciones-finales">
                <button type="button" id="btnRegistrarServicio">Registrar servicio</button>
            </div>
        `;
    }
}

customElements.define("nuevo-servicio", NuevoServicio);