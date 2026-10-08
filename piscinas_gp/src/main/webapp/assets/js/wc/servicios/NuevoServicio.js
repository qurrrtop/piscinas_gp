class NuevoServicio extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";
        this._tipo = "tecnico";
        this._clientes = [];
        this._clienteSeleccionado = null;
        this._subrubros = [];
        this._estadosDisponibles = [];
        this._metodosPago = [];
        this._metodoPago = "efectivo";
        this._marcas = [];
        this._categorias = [];
        this._unidades = [];
        this._productos = [];
        this._carrito = [];
        this._manoObra = 0;
        this._descuentoGlobalTecnico = 0;
        this._cobradoAsesoramiento = false;
        this._montoAsesoramiento = 0;
        this._mostrandoFormProducto = false;
        this._archivoSeleccionado = null;
        this._archivoAsesoramiento = null;
    }

    async connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        await this.cargarDatosIniciales();
        this.render();
        this.renderSelectorCliente();
        this.cargarMetodosPago();
        this.setupListeners();
        this.actualizarResumenTecnico();
        this.actualizarResumenAsesoramiento();
        this.actualizarVisibilidadMetodoPago();
    }

    async cargarDatosIniciales() {
        try {
            const [clientes, subrubros, marcas, categorias, unidades, productos, estados, metodosPago] = await Promise.all([
                fetch(`${this.basePath}/clientes`).then(r => r.json()),
                fetch(`${this.basePath}/subrubros-servicio-tecnico`).then(r => r.json()),
                fetch(`${this.basePath}/marcas`).then(r => r.json()),
                fetch(`${this.basePath}/categorias`).then(r => r.json()),
                fetch(`${this.basePath}/unidades-medida`).then(r => r.json()),
                fetch(`${this.basePath}/productos`).then(r => r.json()),
                fetch(`${this.basePath}/estados-venta`).then(r => r.json()),
                fetch(`${this.basePath}/metodos-pago`).then(r => r.json())
            ]);
            this._clientes = clientes.filter(c => c.activo);
            this._subrubros = subrubros;
            this._marcas = marcas;
            this._categorias = categorias;
            this._unidades = unidades;
            this._productos = productos.filter(p => p.activo);
            this._estadosDisponibles = estados.filter(e => e.nombre.toLowerCase() !== "cancelada");
            this._metodosPago = metodosPago;
        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
        }
    }

    obtenerIniciales(nombre) {
        const partes = nombre.trim().split(" ");
        return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase();
    }

    colorCategoria(nombre) {
        const colores = {
            "Químico": "rgba(23, 153, 32,.60)",
            "Repuesto": "rgba(186, 85, 26,.60)",
            "Accesorios de Instalación": "rgba(161, 29, 136,.60)"
        };
        return colores[nombre] || "#888888";
    }
    
    estadoStockDe(producto) {
        if (producto.stock === 0) return "sin_stock";
        if (producto.stock <= producto.umbralStock) return "stock_bajo";
        return "disponible";
    }

    // ---------- cálculos ----------

    get subtotalRepuestos() {
        return this._carrito.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0);
    }

    get subtotalServicioTecnico() {
        return this.subtotalRepuestos + this._manoObra;
    }

    get montoDescuentoTecnico() {
        return this.subtotalServicioTecnico * (this._descuentoGlobalTecnico / 100);
    }

    get totalServicioTecnico() {
        return this.subtotalServicioTecnico - this.montoDescuentoTecnico;
    }

    actualizarResumenTecnico() {
        this.shadowRoot.querySelector("#resumenRepuestos").textContent = `$${this.subtotalRepuestos.toLocaleString("es-AR")}`;
        this.shadowRoot.querySelector("#resumenManoObra").textContent = `$${this._manoObra.toLocaleString("es-AR")}`;
        this.shadowRoot.querySelector("#resumenSubtotalTecnico").textContent = `$${this.subtotalServicioTecnico.toLocaleString("es-AR")}`;
        this.shadowRoot.querySelector("#resumenDescuentoTecnico").textContent = `-$${this.montoDescuentoTecnico.toLocaleString("es-AR")}`;
        this.shadowRoot.querySelector("#resumenTotalTecnico").textContent = `$${this.totalServicioTecnico.toLocaleString("es-AR")}`;
    }

    actualizarResumenAsesoramiento() {
        const card = this.shadowRoot.querySelector("#resumenAsesoramiento");
        if (!this._cobradoAsesoramiento) {
            card.style.display = "none";
            return;
        }
        card.style.display = "block";
        this.shadowRoot.querySelector("#resumenMontoAsesoramiento").textContent = `$${this._montoAsesoramiento.toLocaleString("es-AR")}`;
    }

    // la card de "Método de pago" solo tiene sentido si hay un cobro real
    actualizarVisibilidadMetodoPago() {
        const requiereMetodo = this._tipo === "tecnico" || this._cobradoAsesoramiento;
        this.shadowRoot.querySelector("#tarjetaMetodoPago").style.display = requiereMetodo ? "block" : "none";
    }

    // ---------- listeners ----------

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
            this.toggleCamposSegunEstado(e.target, ".seccion-tecnico");
        });

        this.shadowRoot.querySelector("#estadoAsesoramiento").addEventListener("change", (e) => {
            this.toggleCamposSegunEstado(e.target, ".seccion-asesoramiento");
        });

        this.shadowRoot.querySelector("#manoObra").addEventListener("input", (e) => {
            this._manoObra = Number(e.target.value) || 0;
            this.actualizarResumenTecnico();
        });

        this.shadowRoot.querySelector("#descuentoGlobalTecnico").addEventListener("input", (e) => {
            this._descuentoGlobalTecnico = Number(e.target.value) || 0;
            this.actualizarResumenTecnico();
        });

        const btnCobro = this.shadowRoot.querySelectorAll(".btn-cobro");
        btnCobro.forEach(btn => {
            btn.addEventListener("click", () => {
                btnCobro.forEach(b => b.classList.remove("seleccionado"));
                btn.classList.add("seleccionado");
                this._cobradoAsesoramiento = btn.dataset.cobro === "cobrado";
                this.shadowRoot.querySelector("#seccionMonto").style.display =
                    this._cobradoAsesoramiento ? "block" : "none";
                this.actualizarResumenAsesoramiento();
                this.actualizarVisibilidadMetodoPago();
            });
        });

        this.shadowRoot.querySelector("#montoCobrado").addEventListener("input", (e) => {
            this._montoAsesoramiento = Number(e.target.value) || 0;
            this.actualizarResumenAsesoramiento();
        });

        this.shadowRoot.querySelector("#archivoEvidencia").addEventListener("change", (e) => {
            this._archivoSeleccionado = e.target.files[0] || null;
            const nombreEl = this.shadowRoot.querySelector("#nombreArchivo");
            nombreEl.textContent = this._archivoSeleccionado ? this._archivoSeleccionado.name : "Ningún archivo seleccionado";
        });
        
        this.shadowRoot.querySelector("#archivoEvidenciaAsesoramiento").addEventListener("change", (e) => {
            this._archivoAsesoramiento = e.target.files[0] || null;
            const nombreEl = this.shadowRoot.querySelector("#nombreArchivoAsesoramiento");
            nombreEl.textContent = this._archivoAsesoramiento ? this._archivoAsesoramiento.name : "Ningún archivo seleccionado";
        });

        this.shadowRoot.querySelector("#btnAgregarProductos").addEventListener("click", () => {
            this._mostrandoFormProducto = true;
            this.renderFormProducto();
        });

        this.shadowRoot.querySelector("#btnRegistrarServicio").addEventListener("click", () => {
            this.registrarServicio();
        });

        this.shadowRoot.querySelector("#btnVolver")?.addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("navigateTo", {
                bubbles: true, composed: true,
                detail: { path: `${this.basePath}/dashboard/servicios/historial` }
            }));
        });

        // estado inicial al cargar (por si algun select ya viene en "Cerrada" por defecto)
        this.toggleCamposSegunEstado(this.shadowRoot.querySelector("#estadoServicio"), ".seccion-tecnico");
        this.toggleCamposSegunEstado(this.shadowRoot.querySelector("#estadoAsesoramiento"), ".seccion-asesoramiento");
    }

    toggleSeccionesPorTipo() {
        const esTecnico = this._tipo === "tecnico";
        this.shadowRoot.querySelectorAll(".seccion-tecnico").forEach(seccion => {
            seccion.style.display = esTecnico ? "block" : "none";
        });
        this.shadowRoot.querySelector(".seccion-asesoramiento").style.display = esTecnico ? "none" : "block";
        this.shadowRoot.querySelector("#tarjetaResumenTecnico").style.display = esTecnico ? "block" : "none";
        this.shadowRoot.querySelector("#tarjetaResumenAsesoramiento").style.display = esTecnico ? "none" : "block";
        if (!esTecnico) this.actualizarResumenAsesoramiento();
        this.actualizarVisibilidadMetodoPago();
    }

    toggleCamposSegunEstado(select, selectorSeccion) {
        const estado = this._estadosDisponibles.find(e => e.id == select.value);
        const esCerrada = estado?.nombre.toLowerCase() === "cerrada";

        this.shadowRoot.querySelectorAll(`${selectorSeccion} .campo-si-cerrada`).forEach(el => {
            el.style.display = esCerrada ? "block" : "none";
        });
        this.shadowRoot.querySelectorAll(`${selectorSeccion} .campo-si-pendiente`).forEach(el => {
            el.style.display = esCerrada ? "none" : "block";
        });
    }

    cargarMetodosPago() {
        const contenedor = this.shadowRoot.querySelector("#metodosPago");

        contenedor.innerHTML = [...this._metodosPago]
            .sort((a, b) => {
                if (a.nombre === "efectivo") return -1;
                if (b.nombre === "efectivo") return 1;
                return 0;
            })
            .map(metodo => `
                <label class="radio-metodo">
                    <input
                        type="radio"
                        name="metodoPagoServicio"
                        value="${metodo.nombre}"
                        ${metodo.nombre === this._metodoPago.toLowerCase() ? "checked" : ""}
                    >
                    ${metodo.nombre.charAt(0).toUpperCase() + metodo.nombre.slice(1)}
                </label>
            `)
            .join("");

        contenedor.querySelectorAll('input[name="metodoPagoServicio"]').forEach(radio => {
            radio.addEventListener("change", (e) => {
                this._metodoPago = e.target.value;
            });
        });
    }

    // ---------- cliente ----------
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
                    <div><strong>${c.nombreCompleto} </strong><small>- ${c.email || "Sin email"} - CUIL/CUIT: ${c.cuitCuil}</small></div>
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

    // ---------- productos / repuestos ----------
    renderFormProducto() {
        const contenedor = this.shadowRoot.querySelector("#areaProductos");

        const coloresEstado = {
            disponible: "rgba(15, 209, 73,.80)",
            stock_bajo: "rgba(226, 140, 21,.80)",
            sin_stock: "#FF1500"
        };

        contenedor.innerHTML = `
            <div class="form-producto">
                <label>CATEGORÍA</label>
                <div class="tabs-categoria-mini">
                    <button type="button" class="tab-cat-mini activo" data-id="">Todas</button>
                    ${this._categorias.map(cat => `<button type="button" class="tab-cat-mini" data-id="${cat.id}" style="--color-cat:${this.colorCategoria(cat.nombre)}">${cat.nombre}</button>`).join("")}
                </div>

                <div class="fila-selects">
                    <div>
                        <label>MARCA</label>
                        <select id="selectMarca">
                            <option value="">Seleccioná una marca</option>
                            ${this._marcas.map(m => `<option value="${m.id}">${m.nombre}</option>`).join("")}
                        </select>
                    </div>
                    <div>
                        <label>UNIDAD DE MEDIDA</label>
                        <select id="selectUnidad">
                            <option value="">Seleccioná una unidad</option>
                            ${this._unidades.map(u => `<option value="${u.id}">${u.nombre}</option>`).join("")}
                        </select>
                    </div>
                </div>

                <label>BUSCAR PRODUCTO</label>
                <input type="text" id="buscarProducto" placeholder="Escribí el nombre del producto...">

                <div class="lista-productos-filtrados" id="listaProductosFiltrados">
                    <p class="sin-resultados">Elegí al menos una categoría, marca o unidad para ver productos</p>
                </div>

                <div class="acciones-form-producto">
                    <button type="button" id="btnCancelarProducto">Cancelar</button>
                </div>
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

            listaEl.innerHTML = disponibles.length
            ? disponibles.map(p => {

                const estado = this.estadoStockDe(p);
                const color = coloresEstado[estado];

                const referencia = p.umbralStock > 0
                    ? p.umbralStock * 4
                    : 50;

                const porcentaje = Math.min(100, Math.round((p.stock / referencia) * 100));

                return `
                    <div class="item-producto-lista" data-id="${p.id}">
                        <div class="info-producto">
                            <span>${p.nombre} - ${p.contenido} ${p.unidadMedida.abreviatura}</span>
                            <small>${p.marcaProducto.nombre}</small>
                            <div class="stock-producto">
                                <span style="color:white;">Stock: ${p.stock} / min ${p.umbralStock}</span>
                                <div class="barra-stock">
                                    <div class="barra-stock-progreso" style="background:${color}; width:${porcentaje}%"></div>
                                </div>
                            </div>
                        </div>
                        <span>$${Number(p.precioActual).toLocaleString("es-AR")}</span>
                    </div>
                `;
            }).join("")
            : `<p class="sin-resultados">No se encontraron productos</p>`;

            listaEl.querySelectorAll(".item-producto-lista").forEach(el => {
                el.addEventListener("click", () => {
                    const producto = this._productos.find(p => p.id == el.dataset.id);
                    this.agregarAlCarrito(producto);
                });
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
        const existente = this._carrito.find(item => item.productoId === producto.id);

        if (existente) {
            if (existente.cantidad < existente.stock) {
                existente.cantidad++;
            } else {
                document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                    detail: { mensaje: `No hay más stock disponible de ${producto.nombre}`, tipo: "advertencia" }
                }));
                return;
            }
        } else {
            this._carrito.push({
                productoId: producto.id,
                nombre: producto.nombre,
                marca: producto.marcaProducto.nombre,
                categoria: producto.categoriaProducto.nombre,
                contenido: producto.contenido,
                unidadAbrev: producto.unidadMedida.abreviatura,
                precioUnitario: Number(producto.precioActual),
                stock: Number(producto.stock),
                cantidad: 1
            });
        }

        this._mostrandoFormProducto = false;
        this.renderAreaProductos();
        this.actualizarResumenTecnico();

        document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
            detail: { mensaje: `${producto.nombre} agregado al carrito`, tipo: "exito" }
        }));
    }

    renderAreaProductos() {
        const contenedor = this.shadowRoot.querySelector("#areaProductos");

        if (this._mostrandoFormProducto) {
            this.renderFormProducto();
            return;
        }

        if (this._carrito.length === 0) {
            contenedor.innerHTML = `
                <div class="carrito-vacio">
                    <img src="${this.basePath}/assets/img/iconos/shopping-cart.svg">
                    <p>Sin productos agregados.</p>
                </div>
                <button type="button" id="btnAgregarProductos" class="btn-agregar-productos">+ Agregar producto</button>
            `;
        } else {
            contenedor.innerHTML = `
                <table class="tabla-carrito">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th class="col-centro">Cant.</th>
                            <th class="col-derecha">Subtotal</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this._carrito.map((item, index) => `
                            <tr>
                                <td>
                                    <div class="info-producto-seleccionado">
                                        <div class="nombre-producto">${item.nombre}</div>
                                        <div class="detalle-producto">${item.contenido || ""} ${item.unidadAbrev || ""}</div>
                                    </div>
                                    <div class="badges-producto">
                                         <span class="badge-mini" style="background:rgba(255,255,255,.1); color:rgba(255,255,255,.8)">${item.categoria}</span>
                                        <span class="badge-mini" style="background:rgba(255,255,255,.1)">${item.marca}</span>
                                    </div>
                                </td>
                                <td>
                                    <div class="item-cantidad">
                                        <button type="button" class="btn-restar" data-index="${index}">-</button>
                                        <span>${item.cantidad}</span>
                                        <button type="button" class="btn-sumar" data-index="${index}">+</button>
                                    </div>
                                </td>
                                <td class="item-subtotal">$${(item.precioUnitario * item.cantidad).toLocaleString("es-AR")}</td>
                                <td><button type="button" class="btn-quitar-fila" data-index="${index}">&times;</button></td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
                <button type="button" id="btnAgregarProductos" class="btn-agregar-productos">+ Agregar producto</button>
            `;

            this.shadowRoot.querySelectorAll(".btn-restar").forEach(btn => {
                btn.addEventListener("click", () => {
                    const i = Number(btn.dataset.index);
                    if (this._carrito[i].cantidad > 1) this._carrito[i].cantidad--;
                    this.renderAreaProductos();
                    this.actualizarResumenTecnico();
                });
            });
            this.shadowRoot.querySelectorAll(".btn-sumar").forEach(btn => {
                btn.addEventListener("click", () => {
                    const i = Number(btn.dataset.index);
                    const item = this._carrito[i];

                    if (item.cantidad < item.stock) {
                        item.cantidad++;
                        this.renderAreaProductos();
                        this.actualizarResumenTecnico();
                    } else {
                        document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                            detail: { mensaje: `No hay más stock disponible de ${item.nombre}`, tipo: "advertencia" }
                        }));
                    }
                });
            });
            this.shadowRoot.querySelectorAll(".btn-quitar-fila").forEach(btn => {
                btn.addEventListener("click", () => {
                    const i = Number(btn.dataset.index);
                    this._carrito.splice(i, 1);
                    this.renderAreaProductos();
                    this.actualizarResumenTecnico();
                });
            });
        }

        this.shadowRoot.querySelector("#btnAgregarProductos").addEventListener("click", () => {
            this._mostrandoFormProducto = true;
            this.renderAreaProductos();
        });
    }

    // ---------- envío ----------

    async registrarServicio() {
        if (!this._clienteSeleccionado) {
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", { detail: { mensaje: "Seleccioná un cliente", tipo: "error" } }));
            return;
        }

        // metodo de pago solo es obligatorio si hay un cobro real
        const requiereMetodoPago = this._tipo === "tecnico" || this._cobradoAsesoramiento;
        const metodoElegido = requiereMetodoPago
                ? this._metodosPago.find(m => m.nombre.toLowerCase() === this._metodoPago.toLowerCase())
                : null;

        if (requiereMetodoPago && !metodoElegido) {
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", { detail: { mensaje: "Seleccioná un método de pago", tipo: "error" } }));
            return;
        }

        try {
            let body, url;
            let nombreImagen = null;
            
            // sube la imagen del tipo elegido (si hay una) antes de crear el registro
            const archivoElegido = this._tipo === "tecnico" ? this._archivoSeleccionado : this._archivoAsesoramiento;

            if (archivoElegido) {
                try {
                    const formData = new FormData();
                    formData.append("archivo", archivoElegido);

                    const resImagen = await fetch(`${this.basePath}/imagenes/servicios`, {
                        method: "POST",
                        body: formData
                    });

                    const dataImagen = await resImagen.json();
                    if (!resImagen.ok) throw new Error(dataImagen.error || "No se pudo subir la imagen");

                    nombreImagen = dataImagen.archivo;

                } catch (error) {
                    document.dispatchEvent(new CustomEvent("mostrar-notificacion", { detail: { mensaje: error.message, tipo: "error" } }));
                    return;
                }
            }

            if (this._tipo === "tecnico") {
                body = {
                    clienteId: this._clienteSeleccionado.id,
                    estadoVentaId: Number(this.shadowRoot.querySelector("#estadoServicio").value),
                    metodoPagoId: metodoElegido.id,
                    subrubroServicioId: Number(this.shadowRoot.querySelector("#subrubro").value),
                    manoObra: this._manoObra,
                    descuentoGlobal: this._descuentoGlobalTecnico,
                    fechaCierre: this.shadowRoot.querySelector("#fechaCierre").value || null,
                    fechaEntrega: this.shadowRoot.querySelector("#fechaEntrega").value || null,
                    problema: this.shadowRoot.querySelector("#descripcionProblema").value,
                    diagnostico: this.shadowRoot.querySelector("#recomendacion").value || null,
                    imagenEvidencia: nombreImagen,
                    detallesVenta: this._carrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad }))
                };
                url = `${this.basePath}/servicios/tecnicos`;
            } else {
                body = {
                    clienteId: this._clienteSeleccionado.id,
                    estadoVentaId: Number(this.shadowRoot.querySelector("#estadoAsesoramiento").value),
                    metodoPagoId: metodoElegido?.id ?? null,
                    fechaCierre: this.shadowRoot.querySelector("#fechaCierreAsesoramiento").value || null,
                    cobrado: this._cobradoAsesoramiento,
                    monto: this._cobradoAsesoramiento ? this._montoAsesoramiento : 0,
                    problema: this.shadowRoot.querySelector("#consultaMotivo").value,
                    diagnostico: this.shadowRoot.querySelector("#recomendacionAsesoramiento").value || null,
                    imagenEvidencia: nombreImagen
                };
                url = `${this.basePath}/servicios/asesoramientos`;
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

                .layout {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 1.2rem;
                    align-items: start;
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
                    margin-top: 1rem;
                }

                .fila-servicio {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    align-items: start;
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

                .bloque-descripcion {
                    margin-top: 1.2rem;
                    padding: 1rem;
                    border: 1px solid rgba(55, 164, 255, .35);
                    border-radius: 10px;
                    background: rgba(1, 49, 104, .25);
                }

                .bloque-descripcion label {
                    margin-top: 0;
                }
        
                .bloque-recomendacion {
                    margin-top: 1.2rem;
                    padding: 1rem;
                    border: 1px solid rgba(55, 164, 255, .35);
                    border-radius: 10px;
                    background: rgba(1, 49, 104, .25);
                }

                .bloque-recomendacion label {
                    margin-top: 0;
                }
        
                .bloque-evidencia {
                    margin-top: 1.2rem;
                    padding: 1rem;
                    border: 1px solid rgba(55, 164, 255, .35);
                    border-radius: 10px;
                    background: rgba(1, 49, 104, .25);
                }

                .bloque-evidencia label {
                    margin-top: 0;
                }

                .bloques-secundarios {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin: 1rem 0;
                }

                .bloque-secundario {
                    padding: 1rem;
                    border: 1px solid rgba(255, 255, 255, .2);
                    border-radius: 10px;
                    background: rgba(1, 49, 104, .25);
                }

                .bloque-secundario label {
                    margin-top: 0;
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
                    display: grid;
                    grid-template-columns: 2fr 1fr 1.5fr auto;
                    align-items: center;
                    gap: 1.5rem;
                    padding: .7rem 1rem;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255,255,255,.1);
                    background: rgba(1, 49, 104, 0.9);
                }

                .item-producto-lista:hover {
                    background: rgba(1, 49, 104, 0.8);
                }
        
                .item-producto-lista > span:last-child {
                    text-align: right;
                    white-space: nowrap;
                }
        
                .info-producto {
                    display: contents;
                }
        
                .info-producto > span:first-of-type {
                    font-size: .8rem;
                    font-weight: 600;
                }
        
                .item-producto-lista small {
                    color: rgba(255,255,255,.6);
                    font-size: .78rem;
                    min-width: 180px;
                }
        
                .stock-producto {
                    display: flex;
                    flex-direction: column;
                    gap: .3rem;
                    min-width: 0;
                }

                .stock-producto span {
                    font-size: .9rem;
                    font-weight: 500;
                }
        
                .barra-stock {
                    width: 100%;
                    height: 6px;
                    background: rgba(255,255,255,.35);
                    border-radius: 10px;
                    overflow: hidden;
                }

                .barra-stock-progreso {
                    height: 100%;
                    border-radius: 10px;
                    transition: width .2s ease;
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
        
                .carrito-vacio img {
                    width: 40px;
                    filter: brightness(0) invert(1);
                }
        
                .carrito-vacio p {
                    margin: .5rem 0;
                }

                .tabla-carrito {
                    width: 100%;
                    border-collapse: collapse;
                }
        
                .tabla-carrito thead th {
                    text-align: left;
                    font-size: .75rem;
                    text-transform: uppercase;
                    letter-spacing: .04em;
                    color: #B8D7FF;
                    padding: 0 0 .6rem 0;
                    border-bottom: 1px solid rgba(255,255,255,.25);
                }
        
                .tabla-carrito thead th.col-centro { text-align: center; }
                .tabla-carrito thead th.col-derecha { text-align: right; }

                .tabla-carrito tbody td {
                    padding: .8rem 0;
                    border-bottom: 1px solid rgba(255,255,255,.12);
                    vertical-align: middle;
                }
        
                .info-producto-seleccionado {
                    display: flex;
                    align-items: center;
                    gap: .5rem;
                }

                .nombre-producto {
                    font-weight: 700;
                    font-size: .95rem;
                }
        
                .detalle-producto {
                    font-size: .8rem;
                    color: rgba(255,255,255,.65);
                }

                .item-cantidad {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: .6rem;
                }
        
                .item-cantidad button {
                    width: 1.7rem;
                    height: 1.7rem;
                    border-radius: 5px;
                    border: 1px solid rgba(255,255,255,.3);
                    background: rgba(255,255,255,.08);
                    color: white;
                    cursor: pointer;
                    font-size: .9rem;
                }

                .item-cantidad button:hover {
                    background: rgba(255,255,255,.18);
                }
        
                .item-cantidad span {
                    min-width: 1.2rem;
                    text-align: center;
                    font-weight: 600;
                }

                .item-subtotal {
                    text-align: right;
                    font-weight: 700;
                    white-space: nowrap;
                }
        
                #nombreArchivo,
                #nombreArchivoAsesoramiento {
                    display: block;
                    margin-top: .5rem;
                    font-size: .8rem;
                    color: rgba(255, 255, 255, .7);
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
        
                .acciones-form-producto {
                    display: flex;
                    justify-content: end;
                }
        
                #btnCancelarProducto {
                    border-radius: 8px;
                    background: rgba(1, 49, 104, .9);
                    outline: none;
                    border: 1px solid rgba(255, 255, 255, .3);
                    padding: .6rem 1.5rem;
                    color: white;
                    margin-top: .5rem;
                    cursor: pointer;
                }
        
                #btnCancelarProducto:hover {
                    background: rgba(1, 49, 104, 0.8);
                }

                .resumen-fila {
                    display: flex;
                    justify-content: space-between;
                    padding: .5rem 0;
                    font-size: .95rem;
                }

                .resumen-total {
                    font-weight: 700;
                    font-size: 1.15rem;
                    border-top: 1px solid rgba(255, 255, 255, .3);
                    padding-top: .6rem;
                    margin-top: .3rem;
                }

                .radio-metodo {
                    display: flex;
                    align-items: center;
                    gap: .8rem;
                    background: rgba(1, 49, 104, 0.9);
                    padding: .8rem 1rem;
                    border-radius: 8px;
                    margin-bottom: .7rem;
                    cursor: pointer;
                    font-weight: 500;
                }

                .radio-metodo:last-of-type { margin-bottom: 0; }

                .radio-metodo input[type="radio"] {
                    appearance: none;
                    -webkit-appearance: none;
                    flex: 0 0 18px;
                    width: 18px;
                    height: 18px;
                    min-width: 18px;
                    min-height: 18px;
                    margin: 0;
                    padding: 0;
                    border: 2px solid rgba(255, 255, 255, 0.7);
                    border-radius: 50%;
                    background: transparent;
                    display: grid;
                    place-items: center;
                    box-sizing: border-box;
                }

                .radio-metodo input[type="radio"]::before {
                    content: "";
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: white;
                    transform: scale(0);
                    transition: transform 0.15s ease;
                }

                .radio-metodo input[type="radio"]:checked::before {
                    transform: scale(1);
                }

                .btn-confirmar {
                    width: 100%;
                    background: #37A4FF;
                    color: white;
                    border: none;
                    padding: .85rem;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    margin-top: .1rem;
                }
            </style>

            <div class="card">
                <div class="card-header">TIPO DE SERVICIO</div>
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

            <div class="layout">
                <div class="columna-izquierda">

                    <div class="card">
                        <div class="card-header">
                            <img src="${this.basePath}/assets/img/iconos/users.svg"> CLIENTE
                        </div>
                        <div class="card-body" id="seccionCliente"></div>
                    </div>

                    <!-- DATOS DEL SERVICIO TÉCNICO -->
                    <div class="card seccion-tecnico">
                        <div class="card-header"><img src="${this.basePath}/assets/img/iconos/hammer.svg"> DATOS DEL SERVICIO TÉCNICO</div>
                        <div class="card-body">
                            <div class="fila-servicio">
                                <div>
                                    <label>SUBRUBRO <span class="required">*</span></label>
                                    <select id="subrubro">
                                        ${this._subrubros.map(s => `<option value="${s.id}">${s.nombre}</option>`).join("")}
                                    </select>
                                </div>

                                <div>
                                    <label>ESTADO</label>
                                    <select id="estadoServicio">
                                        ${this._estadosDisponibles.map(e =>
                                            `<option value="${e.id}">${e.nombre.charAt(0).toUpperCase() + e.nombre.slice(1)}</option>`
                                        ).join("")}
                                    </select>
                                </div>

                                <div>
                                    <label>MANO DE OBRA</label>
                                    <input type="number" id="manoObra" value="0" min="0">
                                </div>
                            </div>

                            <div class="fila-2">
                                <div>
                                    <label>DESCUENTO GLOBAL (%)</label>
                                    <input type="number" id="descuentoGlobalTecnico" value="0" min="0" max="100">
                                </div>
                                <div class="campo-si-cerrada">
                                    <label>FECHA DE CIERRE</label>
                                    <input type="date" id="fechaCierre">
                                </div>
                                <div class="campo-si-pendiente">
                                    <label>FECHA DE ENTREGA ESTIMADA</label>
                                    <input type="date" id="fechaEntrega">
                                </div>
                            </div>

                            <div class="bloque-descripcion">
                                <label>DESCRIPCIÓN DEL PROBLEMA<span class="required">*</span></label>
                                <textarea id="descripcionProblema" rows="3" placeholder="Describí el problema..."></textarea>
                            </div>
        
                            <div class="bloque-recomendacion campo-si-cerrada">
                                    <label>RECOMENDACIÓN BRINDADA</label>
                                    <textarea id="recomendacion" rows="3" placeholder="¿Qué se encontró y cómo se resolvió?"></textarea>
                            </div>

                            <div class="bloque-evidencia">
                                <label>EVIDENCIA (OPCIONAL)</label>
                                <div class="archivo-box">
                                    <label for="archivoEvidencia">📎 Elegir imagen</label>
                                    <input type="file" id="archivoEvidencia" accept="image/*">
                                    <span id="nombreArchivo">Ningún archivo seleccionado</span>
                                </div>
                            </div>
                        </div>
                    </div>
        
                    <div class="card seccion-tecnico">
                        <div class="card-header">
                            <img src="${this.basePath}/assets/img/iconos/package.svg"> Productos
                        </div>
                        <div class="card-body" id="areaProductos">
                            <div class="carrito-vacio">
                                <img src="${this.basePath}/assets/img/iconos/shopping-cart.svg">
                                <p>Aún no hay productos en esta venta.<br>Agrégalos abajo.</p>
                            </div>
                            <button type="button" id="btnAgregarProductos" class="btn-agregar-productos">+ Agregar productos</button>
                        </div>
                    </div>

                    <!-- DATOS DEL ASESORAMIENTO -->
                    <div class="card seccion-asesoramiento" style="display:none">
                        <div class="card-header">DATOS DEL ASESORAMIENTO</div>
                        <div class="card-body">
                            <div class="fila-2">
                                <div>
                                    <label>ESTADO</label>
                                    <select id="estadoAsesoramiento">
                                        ${this._estadosDisponibles.map(e =>
                                            `<option value="${e.id}">${e.nombre.charAt(0).toUpperCase() + e.nombre.slice(1)}</option>`
                                        ).join("")}
                                    </select>
                                </div>
                                <div class="campo-si-cerrada">
                                    <label>FECHA DE CIERRE</label>
                                    <input type="date" id="fechaCierreAsesoramiento">
                                </div>
                            </div>

                            <label>¿SE COBRA?</label>
                            <div class="botones-toggle">
                                <button type="button" class="btn-cobro seleccionado" data-cobro="sin_cobro">Sin cobro</button>
                                <button type="button" class="btn-cobro" data-cobro="cobrado">Cobrado</button>
                            </div>

                            <div id="seccionMonto" style="display:none">
                                <label>MONTO COBRADO ($)</label>
                                <input type="number" id="montoCobrado" value="0" min="0">
                            </div>

                            <label>CONSULTA / MOTIVO <span class="required">*</span></label>
                            <textarea id="consultaMotivo" rows="3" placeholder="¿Qué consultó el cliente?"></textarea>

                            <div class="campo-si-cerrada">
                                <label>RECOMENDACIÓN BRINDADA <span class="required">*</span></label>
                                <textarea id="recomendacionAsesoramiento" rows="3" placeholder="¿Qué se le recomendó o indicó?"></textarea>
                            </div>
        
                            <div class="bloque-secundario" style="margin-top:1rem">
                                <label>EVIDENCIA (OPCIONAL)</label>
                                <div class="archivo-box">
                                    <label for="archivoEvidenciaAsesoramiento">📎 Elegir imagen</label>
                                    <input type="file" id="archivoEvidenciaAsesoramiento" accept="image/*">
                                    <span id="nombreArchivoAsesoramiento">Ningún archivo seleccionado</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div class="columna-derecha">

                    <div class="card" id="tarjetaResumenTecnico">
                        <div class="card-header">
                            <img src="${this.basePath}/assets/img/iconos/clipboard-list.svg"> RESUMEN
                        </div>
                        <div class="card-body">
                            <div class="resumen-fila"><span>Repuestos</span><span id="resumenRepuestos">$0</span></div>
                            <div class="resumen-fila"><span>Mano de obra</span><span id="resumenManoObra">$0</span></div>
                            <div class="resumen-fila"><span>Subtotal</span><span id="resumenSubtotalTecnico">$0</span></div>
                            <div class="resumen-fila"><span>Descuento global</span><span id="resumenDescuentoTecnico">-$0</span></div>
                            <div class="resumen-fila resumen-total"><span>Total</span><span id="resumenTotalTecnico">$0</span></div>
                        </div>
                    </div>

                    <div class="card" id="tarjetaResumenAsesoramiento" style="display:none">
                        <div class="card-header">
                            <img src="${this.basePath}/assets/img/iconos/clipboard-list.svg"> RESUMEN
                        </div>
                        <div class="card-body">
                            <div class="card" id="resumenAsesoramiento" style="display:none;margin-bottom:0;border:none;background:none">
                                <div class="resumen-fila resumen-total"><span>Monto a cobrar</span><span id="resumenMontoAsesoramiento">$0</span></div>
                            </div>
                        </div>
                    </div>

                    <div class="card" id="tarjetaMetodoPago">
                        <div class="card-header">
                            <img src="${this.basePath}/assets/img/iconos/credit-card.svg"> MÉTODO DE PAGO
                        </div>
                        <div class="card-body">
                            <div id="metodosPago"></div>
                        </div>
                    </div>

                    <button type="button" id="btnRegistrarServicio" class="btn-confirmar">✓ Registrar servicio</button>
                </div>
            </div>
        `;
    }
}

customElements.define("nuevo-servicio", NuevoServicio);