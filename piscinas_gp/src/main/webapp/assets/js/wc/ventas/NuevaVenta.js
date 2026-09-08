class NuevaVenta extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";
        this._clientes = [];
        this._marcas = [];
        this._categorias = [];
        this._productos = [];
        this._clienteSeleccionado = null;
        this._carrito = [];
        this._descuentoGlobal = 0;
        this._metodoPago = "Efectivo";
        this._observaciones = "";
        this._mostrandoFormProducto = false;
        this._estadosVenta = [];
        this._metodosPago = [];
        this._estadoVenta = "cerrada";
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
            await this.cargarClientes();
            const [marcas, categorias, unidades, productos, estadosVenta, metodosPago] = await Promise.all([
                fetch(`${this.basePath}/marcas`).then(r => r.json()),
                fetch(`${this.basePath}/categorias`).then(r => r.json()),
                fetch(`${this.basePath}/unidades-medida`).then(r => r.json()),
                fetch(`${this.basePath}/productos`).then(r => r.json()),
                fetch(`${this.basePath}/estados-venta`).then(r => r.json()),
                fetch(`${this.basePath}/metodos-pago`).then(r => r.json())
            ]);
            this._marcas = marcas;
            this._categorias = categorias;
            this._unidades = unidades;
            this._productos = productos.filter(p => p.activo);
            this._estadosVenta = estadosVenta;
            this._metodosPago = metodosPago;
            
            this.cargarEstadosVenta();
            this.cargarMetodosPago();
        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
        }
    }

    cargarEstadosVenta() {
        const select = this.shadowRoot.querySelector("#estadoVenta");

        select.innerHTML = this._estadosVenta.map(estado => `
            <option value="${estado.nombre}" ${estado.nombre === this._estadoVenta ? "selected" : ""}>
                ${estado.nombre.charAt(0).toUpperCase() + estado.nombre.slice(1)}
            </option>
        `).join("");
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
                        name="metodoPago" 
                        value="${metodo.nombre}"
                        ${metodo.nombre === this._metodoPago.toLowerCase() ? "checked" : ""}
                    >
                    ${metodo.nombre.charAt(0).toUpperCase() + metodo.nombre.slice(1)}
                </label>
            `)
            .join("");
    }
    
    get subtotal() {
        return this._carrito.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0);
    }

    get montoDescuento() {
        return this.subtotal * (this._descuentoGlobal / 100);
    }

    get total() {
        return this.subtotal - this.montoDescuento;
    }

    setupListeners() {
        this.shadowRoot.querySelector("#btnAgregarProductos").addEventListener("click", () => {
            this._mostrandoFormProducto = true;
            this.renderFormProducto();
        });

        this.shadowRoot.querySelector("#descuentoGlobal").addEventListener("input", (e) => {
            this._descuentoGlobal = Number(e.target.value) || 0;
            this.actualizarResumen();
        });

        this.shadowRoot.querySelector("#observaciones").addEventListener("input", (e) => {
            this._observaciones = e.target.value;
        });

        this.shadowRoot.querySelectorAll('input[name="metodoPago"]').forEach(radio => {
            radio.addEventListener("change", (e) => {
                this._metodoPago = e.target.value;
            });
        });
        
        this.shadowRoot.querySelector("#estadoVenta").addEventListener("change", (e) => {
            this._estadoVenta = e.target.value;
        });

        this.shadowRoot.querySelector("#btnConfirmarVenta").addEventListener("click", () => {
            this.abrirConfirmacion();
        });
    }

    obtenerIniciales(nombre) {
        const partes = nombre.trim().split(" ");
        return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase();
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

            if (!busqueda) {
                resultados.style.display = "none";
                return;
            }

            const coincidencias = this._clientes.filter(c =>
                c.nombreCompleto.toLowerCase().includes(busqueda) ||
                c.cuitCuil.toLowerCase().includes(busqueda)
            ).slice(0, 8);

            resultados.innerHTML = `
                ${coincidencias.map(c => `
                    <div class="resultado-cliente" data-id="${c.id}">
                        <span class="avatar avatar-${c.tipo === 'Empresa' ? 'empresa' : 'particular'}">${this.obtenerIniciales(c.nombreCompleto)}</span>
                        <div>
                            <strong>${c.nombreCompleto}</strong>
                            <small>${c.email || "Sin email"} - CUIL/CUIT: ${c.cuitCuil}</small>
                        </div>
                    </div>
                `).join("")}
                <div class="resultado-crear" id="btnCrearClienteRapido">+ Crear nuevo cliente "${texto}"</div>
            `;

            resultados.style.display = "block";

            resultados.querySelectorAll(".resultado-cliente").forEach(el => {
                el.addEventListener("click", () => {
                    this._clienteSeleccionado = this._clientes.find(c => c.id == el.dataset.id);
                    this.renderClienteSeleccionado();
                });
            });

            resultados.querySelector("#btnCrearClienteRapido").addEventListener("click", () => {
                this.abrirCreacionRapidaCliente();
            });
        };

        input.addEventListener("input", (e) => renderResultados(e.target.value));

        document.addEventListener("click", (e) => {
            if (!this.shadowRoot.contains(e.composedPath()[0])) {
                resultados.style.display = "none";
            }
        });
    }

    renderClienteSeleccionado() {
        const contenedor = this.shadowRoot.querySelector("#seccionCliente");
        const c = this._clienteSeleccionado;
        contenedor.innerHTML = `
            <div class="cliente-chip">
                <span class="avatar avatar-${c.tipo === 'Empresa' ? 'empresa' : 'particular'}">${this.obtenerIniciales(c.nombreCompleto)}</span>
                <div class="cliente-info">
                    <strong>${c.nombreCompleto}</strong>
                    <small>${c.email || "Sin email"} · CUIL/CUIT: ${c.cuitCuil}</small>
                </div>
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

            // Punto 2: no mostrar nada hasta que haya al menos un filtro activo
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
                ? disponibles.map(p => `
                    <div class="item-producto-lista" data-id="${p.id}">
                        <div>
                            <strong>${p.nombre}</strong>
                            <small>${p.marcaProducto.nombre} · ${p.contenido} ${p.unidadMedida.abreviatura}</small>
                        </div>
                        <span>$${Number(p.precioActual).toLocaleString("es-AR")}</span>
                    </div>
                `).join("")
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
            existente.cantidad++;
        } else {
            this._carrito.push({
                productoId: producto.id,
                nombre: producto.nombre,
                marca: producto.marcaProducto.nombre,
                categoria: producto.categoriaProducto.nombre,
                contenido: producto.contenido,
                unidadAbrev: producto.unidadMedida.abreviatura,
                precioUnitario: Number(producto.precioActual),
                cantidad: 1
            });
        }

        this._mostrandoFormProducto = false;
        this.renderAreaProductos();
        this.actualizarResumen();

        document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
            detail: { mensaje: `${producto.nombre} agregado al carrito`, tipo: "exito" }
        }));
    }

    colorCategoria(nombre) {
        const colores = {
            "Químico": "#4ADE80",
            "Repuesto": "#FB923C",
            "Accesorios de Instalación": "#A855F7"
        };
        return colores[nombre] || "#888888";
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
                    <p>Aún no hay productos en esta venta.<br>Agrégalos abajo.</p>
                </div>
                <button type="button" id="btnAgregarProductos" class="btn-agregar-productos">+ Agregar productos</button>
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
                                    <div class="nombre-producto">${item.nombre}</div>
                                    <div class="detalle-producto">${item.contenido || ""} ${item.unidadAbrev || ""}</div>
                                    <div class="badges-producto">
                                        <span class="badge-mini" style="background:${this.colorCategoria(item.categoria)}22; color:${this.colorCategoria(item.categoria)}">${item.categoria}</span>
                                        <span class="badge-mini" style="background:rgba(255,255,255,.1); color:rgba(255,255,255,.8)">${item.marca}</span>
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
                    this.actualizarResumen();
                });
            });
            this.shadowRoot.querySelectorAll(".btn-sumar").forEach(btn => {
                btn.addEventListener("click", () => {
                    const i = Number(btn.dataset.index);
                    this._carrito[i].cantidad++;
                    this.renderAreaProductos();
                    this.actualizarResumen();
                });
            });
            this.shadowRoot.querySelectorAll(".btn-quitar-fila").forEach(btn => {
                btn.addEventListener("click", () => {
                    const i = Number(btn.dataset.index);
                    this._carrito.splice(i, 1);
                    this.renderAreaProductos();
                    this.actualizarResumen();
                });
            });
        }

        this.shadowRoot.querySelector("#btnAgregarProductos").addEventListener("click", () => {
            this._mostrandoFormProducto = true;
            this.renderAreaProductos();
        });
    }
  
    abrirCreacionRapidaCliente() {
        const modal = document.createElement("modal-component");
        modal.setAttribute("titulo", "Nuevo cliente");
        modal.setAttribute("subTitulo", "CREAR RÁPIDO");

        const formulario = document.createElement("formulario-cliente");
        formulario.setAttribute("base-path", this.basePath);

        formulario.addEventListener("cliente-guardado", async (evento) => {
            await this.cargarClientes();
            if (evento.detail?.id) {
                this._clienteSeleccionado = this._clientes.find(c => c.id === evento.detail.id) || evento.detail;
                this.renderClienteSeleccionado();
            }
        });

        modal.appendChild(formulario);
        document.body.appendChild(modal);
    }

    async cargarClientes() {
        try {
            const url = `${this.basePath}/clientes`;

            console.log("URL CLIENTES:", url);

            const clientes = await fetch(url).then(r => r.json());

            console.log("CLIENTES RECIBIDOS:", clientes);
            console.log("PRIMER CLIENTE COMPLETO:", clientes[0]);

            this._clientes = clientes;

            console.log("CLIENTES:", this._clientes);

        } catch (error) {
            console.error("Error al cargar clientes:", error);
        }
    }

    actualizarResumen() {
        this.shadowRoot.querySelector("#resumenSubtotal").textContent = `$${this.subtotal.toLocaleString("es-AR")}`;
        this.shadowRoot.querySelector("#resumenDescuento").textContent = `-$${this.montoDescuento.toLocaleString("es-AR")}`;
        this.shadowRoot.querySelector("#resumenTotal").textContent = `$${this.total.toLocaleString("es-AR")}`;
    }

    abrirConfirmacion() {
        if (!this._clienteSeleccionado) {
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: "Seleccioná un cliente antes de confirmar", tipo: "error" }
            }));
            return;
        }
        if (this._carrito.length === 0) {
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: "Agregá al menos un producto a la venta", tipo: "error" }
            }));
            return;
        }

        const modal = document.createElement("modal-component");
        modal.setAttribute("titulo", "Confirmar venta");
        modal.setAttribute("subTitulo", "REVISÁ LOS DATOS");

        const confirmacion = document.createElement("confirmacion-venta");
        confirmacion.datos = {
            cliente: this._clienteSeleccionado,
            carrito: this._carrito,
            subtotal: this.subtotal,
            descuentoGlobal: this._descuentoGlobal,
            montoDescuento: this.montoDescuento,
            total: this.total,
            metodoPago: this._metodoPago
        };

        confirmacion.addEventListener("venta-confirmada", async (evento) => {
            await this.registrarVenta(evento.detail.generarFactura);
            modal.remove();
        });

        modal.appendChild(confirmacion);
        document.body.appendChild(modal);
    }

    async registrarVenta(generarFactura) {
        try {
            const estadoElegido = this._estadosVenta.find(e => e.nombre.toLowerCase() === this._estadoVenta.toLowerCase());
            const metodoElegido = this._metodosPago.find(m => m.nombre.toLowerCase() === this._metodoPago.toLowerCase());

            const body = {
                clienteId: this._clienteSeleccionado.id,
                estadoVentaId: estadoElegido.id,
                metodoPagoId: metodoElegido.id,
                descuentoGlobal: this._descuentoGlobal,
                observacion: this._observaciones,
                detallesVenta: this._carrito.map(item => ({
                    productoId: item.productoId,
                    cantidad: item.cantidad
                }))
            };

            const response = await fetch(`${this.basePath}/ventas/productos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al registrar la venta");
            }

            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: "Venta registrada correctamente", tipo: "exito" }
            }));

            document.dispatchEvent(new CustomEvent("venta-guardada", { bubbles: true, composed: true }));

            document.dispatchEvent(new CustomEvent("navigateTo", {
                bubbles: true, composed: true,
                detail: { path: `${this.basePath}/dashboard/ventas/historial` }
            }));

        } catch (error) {
            document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                detail: { mensaje: error.message, tipo: "error" }
            }));
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
                    background: rgba(134, 128, 128, 0.9);
                    border: 1px solid rgba(255,255,255,.3);
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
                    border: 1px solid rgba(255,255,255,.3);
                    border-radius: 8px;
                    margin-top: .4rem;
                    max-height: 320px;
                    overflow-y: auto;
                    box-shadow: 0 8px 20px rgba(0,0,0,.4);
                }

                .resultado-cliente {
                    display: flex;
                    align-items: center;
                    gap: .8rem;
                    padding: .8rem 1rem;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255,255,255,.1);
                }

                .resultado-cliente:hover {
                    background: rgba(255,255,255,.08);
                }

                .resultado-cliente strong {
                    display: block;
                    font-size: .95rem;
                }

                .resultado-cliente small {
                    color: rgba(255,255,255,.65);
                    font-size: .78rem;
                }

                .avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: .95rem;
                    color: white;
                    flex-shrink: 0;
                }

                .avatar-particular {
                    background: linear-gradient(160deg, #5FD9E8, #0B5C7A);
                }

                .avatar-empresa {
                    background: linear-gradient(160deg, #E85FC9, #6A1B6E);
                }

                .resultado-crear {
                    padding: .9rem 1rem;
                    text-align: center;
                    font-weight: 700;
                    color: #B8D7FF;
                    cursor: pointer;
                    background: rgba(255,255,255,.05);
                }

                .resultado-crear:hover {
                    background: rgba(255,255,255,.1);
                }

                .sin-resultados {
                    padding: 1rem;
                    text-align: center;
                    color: rgba(255,255,255,.6);
                    font-size: .85rem;
                }

                .cliente-chip {
                    display: flex;
                    align-items: center;
                    gap: .9rem;
                    background: rgba(255,255,255,.08);
                    border-radius: 8px;
                    padding: .9rem 1rem;
                }

                .cliente-info {
                    flex: 1;
                }

                .cliente-info strong { display: block; }
                .cliente-info small { color: rgba(255,255,255,.7); font-size: .8rem; }

                .cliente-chip button {
                    background: rgba(1, 49, 104, 0.9);
                    color: white;
                    border: none;
                    padding: .5rem 1.1rem;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 700;
                    white-space: nowrap;
                }
        
                .fila-selects {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .lista-productos-filtrados {
                    max-height: 220px;
                    overflow-y: auto;
                    border: 1px solid rgba(255,255,255,.2);
                    border-radius: 8px;
                    margin-top: .6rem;
                }

                .item-producto-lista {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: .7rem 1rem;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255,255,255,.1);
                }

                .item-producto-lista:hover {
                    background: rgba(255,255,255,.06);
                }

                .item-producto-lista.seleccionado {
                    background: rgba(55,164,255,.2);
                    border-left: 3px solid #37A4FF;
                }

                .item-producto-lista strong { display: block; font-size: .9rem; }
                .item-producto-lista small { color: rgba(255,255,255,.6); font-size: .78rem; }

                label {
                    display: block;
                    font-size: .8rem;
                    font-weight: 600;
                    margin-bottom: .4rem;
                    margin-top: .8rem;
                    text-transform: uppercase;
                    letter-spacing: .03em;
                }
                
                .tabs-categoria-mini {  
                    display: flex;
                    flex-direction: row;
                    gap: .6rem;
                    padding: .5rem 0;
                }
        
                .tab-cat-mini {
                    padding: .4rem .9rem;
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,.3);
                    background: rgba(255,255,255,.06);
                    color: white;
                    cursor: pointer;
                    font-size: .8rem;
                    font-weight: 600;
                }

                .tab-cat-mini.activo {
                    background: var(--color-cat, #37A4FF);
                    color: white;
                    border-color: var(--color-cat, #37A4FF);
                }

                label:first-child { margin-top: 0; }

                input, select, textarea {
                    width: 100%;
                    box-sizing: border-box;
                    padding: .6rem .8rem;
                    border-radius: 6px;
                    border: 1px solid rgba(196,196,196,1);
                    background: rgba(255,255,255,.4);
                    color: white;
                    font-family: inherit;
                }
        
                input, textarea {
                    outline: none;
                }
        
                input:focus, textarea:focus {
                    border-color: rgba(1, 49, 104, 0.8);
                }

                input::placeholder, textarea::placeholder {
                    color: rgba(000,000,000,.30);
                    font-weight: 700;
                }

                .required { color: #CC2727; }

                .carrito-vacio {
                    text-align: center;
                    padding: 2.5rem 1rem;
                    color: rgba(255,255,255);
                    border: 2px dashed rgba(255,255,255,.3);
                    border-radius: 8px;
                }

                .carrito-vacio img {
                    width: 40px;
                    margin-bottom: .8rem;
                    filter: brightness(0) invert(1);
                }

                .carrito-vacio p {
                    margin: 0;
                    font-size: .9rem;
                }

                .btn-agregar-productos {
                    width: 100%;
                    margin-top: 1rem;
                    background: rgba(1, 49, 104, 0.9);
                    color: white;
                    border: 1px solid rgba(255,255,255,.3);
                    padding: .8rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                    letter-spacing: .02em;
                }

                .btn-agregar-productos:hover {
                    background: rgba(1, 49, 104, 0.8);
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
        
                #btnCancelarProducto {
                    border-radius: 8px;
                    background: rgba(1, 49, 104, 0.9);
                    outline: none;
                    border: none;
                    padding: .5rem 1rem;
                    color: white;
                    margin-top: .5rem;
                    cursor: pointer;
                }
        
                #btnCancelarProducto:hover {
                    background: rgba(1, 49, 104, 0.8);
                }

                .nombre-producto {
                    font-weight: 700;
                    font-size: .95rem;
                }

                .detalle-producto {
                    font-size: .8rem;
                    color: rgba(255,255,255,.65);
                    margin-top: .15rem;
                }

                .badges-producto {
                    display: flex;
                    gap: .4rem;
                    margin-top: .4rem;
                }

                .badge-mini {
                    font-size: .68rem;
                    font-weight: 700;
                    padding: .15rem .55rem;
                    border-radius: 20px;
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

                .btn-quitar-fila {
                    background: none;
                    border: none;
                    color: rgba(255,255,255,.5);
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 0 0 0 .8rem;
                }

                .btn-quitar-fila:hover {
                    color: #F87171;
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
                    border-top: 1px solid rgba(255,255,255,.3);
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
                    width: 18px;
                    height: 18px;
                    accent-color: white;
                    margin: 0;
                }
        
                .estado-venta {
                    margin-top: 1.2rem;
                }

                .estado-venta label {
                    margin-top: 0;
                }

                #estadoVenta {
                    background: rgba(1, 49, 104, 0.9);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    font-weight: 600;
                    cursor: pointer;
                    outline: none;
                }

                #estadoVenta option {
                    background: white;
                    color: #222;
                    font-weight: 400;
                }
        
                #estadoVenta:focus {
                    outline: none;
                    border-color: rgba(255, 255, 255, 0.3);
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

            <div class="layout">
                <div class="columna-izquierda">
                    <div class="card">
                        <div class="card-header">
                            <img src="${this.basePath}/assets/img/iconos/users.svg"> Cliente
                        </div>
                        <div class="card-body" id="seccionCliente"></div>
                    </div>

                    <div class="card">
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

                    <div class="card">
                        <div class="card-header">
                            <img src="${this.basePath}/assets/img/iconos/sticky-note.svg"> Detalles adicionales
                        </div>
                        <div class="card-body">
                            <label>DESCUENTO GLOBAL</label>
                            <input type="number" id="descuentoGlobal" value="0" min="0" max="100" placeholder="0"> <span style="font-size:.8rem">% sobre el subtotal</span>
                            <label>OBSERVACIONES</label>
                            <textarea id="observaciones" rows="3" placeholder="Instrucciones de entrega, notas internas, acuerdos con el cliente..."></textarea>
                        </div>
                    </div>
                </div>

                <div class="columna-derecha">
                    <div class="card">
                        <div class="card-header">
                            <img src="${this.basePath}/assets/img/iconos/clipboard-list.svg"> Resumen
                        </div>
                        <div class="card-body">
                            <div class="resumen-fila"><span>Subtotal</span><span id="resumenSubtotal">$0</span></div>
                            <div class="resumen-fila"><span>Descuento global</span><span id="resumenDescuento">-$0</span></div>
                            <div class="resumen-fila resumen-total"><span>Total</span><span id="resumenTotal">$0</span></div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <img src="${this.basePath}/assets/img/iconos/credit-card.svg"> Método de pago
                        </div>
                        <div class="card-body">
                            <div id="metodosPago"></div>
                        </div> 
                    </div>
        
                    <div class="card">
                        <div class="card-header">
                            <img src="${this.basePath}/assets/img/iconos/clipboard-list.svg">
                            Estado de la venta
                        </div>

                        <div class="card-body">
                            <label for="estadoVenta">ESTADO DE LA VENTA</label>
                            <select id="estadoVenta"></select>
                        </div>
                    </div>

                    <button type="button" id="btnConfirmarVenta" class="btn-confirmar">
                        ✓ Confirmar venta
                    </button>
            </div>
        `;
    }
}

customElements.define("nueva-venta", NuevaVenta);