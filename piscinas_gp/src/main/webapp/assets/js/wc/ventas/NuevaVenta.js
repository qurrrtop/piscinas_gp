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
    }

    async connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        this.render();
        await this.cargarDatosIniciales();
        this.setupListeners();
    }

    async cargarDatosIniciales() {
        try {
            const [clientes, marcas, categorias, productos] = await Promise.all([
                fetch(`${this.basePath}/clientes`).then(r => r.json()),
                fetch(`${this.basePath}/marcas`).then(r => r.json()),
                fetch(`${this.basePath}/categorias`).then(r => r.json()),
                fetch(`${this.basePath}/productos`).then(r => r.json())
            ]);
            this._clientes = clientes.filter(c => c.activo);
            this._marcas = marcas;
            this._categorias = categorias;
            this._productos = productos.filter(p => p.activo);
            this.poblarDatalistClientes();
        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
        }
    }

    poblarDatalistClientes() {
        const datalist = this.shadowRoot.querySelector("#listaClientes");
        datalist.innerHTML = this._clientes
            .map(c => `<option value="${c.nombreCompleto} - ${c.cuitCuil}"></option>`)
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
        this.shadowRoot.querySelector("#buscarCliente").addEventListener("change", (e) => {
            const texto = e.target.value;
            const encontrado = this._clientes.find(c => `${c.nombreCompleto} - ${c.cuitCuil}` === texto);
            if (encontrado) {
                this._clienteSeleccionado = encontrado;
                this.renderClienteSeleccionado();
            }
        });

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

        this.shadowRoot.querySelector("#btnConfirmarVenta").addEventListener("click", () => {
            this.abrirConfirmacion();
        });
    }

    renderClienteSeleccionado() {
        const contenedor = this.shadowRoot.querySelector("#seccionCliente");
        const c = this._clienteSeleccionado;
        contenedor.innerHTML = `
            <div class="cliente-chip">
                <div>
                    <strong>${c.nombreCompleto}</strong>
                    <span class="cliente-sub">${c.email || "Sin email"} · CUIT/CUIL: ${c.cuitCuil}</span>
                </div>
                <button id="btnCambiarCliente">Cambiar</button>
            </div>
        `;
        this.shadowRoot.querySelector("#btnCambiarCliente").addEventListener("click", () => {
            this._clienteSeleccionado = null;
            this.renderSelectorCliente();
        });
    }

    renderSelectorCliente() {
        const contenedor = this.shadowRoot.querySelector("#seccionCliente");
        contenedor.innerHTML = `
            <label>BUSCAR CLIENTE <span class="required">*</span></label>
            <input type="text" id="buscarCliente" list="listaClientes" placeholder="Nombre, CUIL o CUIT del cliente...">
            <datalist id="listaClientes"></datalist>
        `;
        this.poblarDatalistClientes();
        this.shadowRoot.querySelector("#buscarCliente").addEventListener("change", (e) => {
            const texto = e.target.value;
            const encontrado = this._clientes.find(c => `${c.nombreCompleto} - ${c.cuitCuil}` === texto);
            if (encontrado) {
                this._clienteSeleccionado = encontrado;
                this.renderClienteSeleccionado();
            }
        });
    }

    renderFormProducto() {
        const contenedor = this.shadowRoot.querySelector("#areaProductos");

        contenedor.innerHTML = `
            <div class="form-producto">
                <label>CATEGORÍA</label>
                <div class="tabs-categoria-mini">
                    ${this._categorias.map(cat => `<button type="button" class="tab-cat-mini" data-id="${cat.id}">${cat.nombre}</button>`).join("")}
                </div>

                <label>MARCA</label>
                <select id="selectMarca">
                    <option value="">Seleccioná una marca</option>
                    ${this._marcas.map(m => `<option value="${m.id}">${m.nombre}</option>`).join("")}
                </select>

                <label>PRODUCTO</label>
                <select id="selectProducto">
                    <option value="">Seleccioná un producto</option>
                </select>

                <div class="fila-precio-cantidad">
                    <div>
                        <label>PRECIO UNIT.</label>
                        <input type="text" id="precioUnitario" disabled value="$ 0">
                    </div>
                    <div>
                        <label>CANTIDAD</label>
                        <input type="number" id="cantidadProducto" value="1" min="1">
                    </div>
                </div>

                <div class="acciones-form-producto">
                    <button type="button" id="btnCancelarProducto">Cancelar</button>
                    <button type="button" id="btnAgregarAlCarrito">+ Agregar producto</button>
                </div>
            </div>
        `;

        let categoriaSeleccionada = null;

        const actualizarProductosFiltrados = () => {
            const marcaId = this.shadowRoot.querySelector("#selectMarca").value;
            const disponibles = this._productos.filter(p =>
                (!categoriaSeleccionada || p.categoriaProducto.id == categoriaSeleccionada) &&
                (!marcaId || p.marcaProducto.id == marcaId)
            );
            const selectProducto = this.shadowRoot.querySelector("#selectProducto");
            selectProducto.innerHTML = `<option value="">Seleccioná un producto</option>` +
                disponibles.map(p => `<option value="${p.id}">${p.nombre} - ${p.contenido} ${p.unidadMedida.abreviatura}</option>`).join("");
        };

        this.shadowRoot.querySelectorAll(".tab-cat-mini").forEach(tab => {
            tab.addEventListener("click", () => {
                categoriaSeleccionada = tab.dataset.id;
                this.shadowRoot.querySelectorAll(".tab-cat-mini").forEach(t => t.classList.remove("activo"));
                tab.classList.add("activo");
                actualizarProductosFiltrados();
            });
        });

        this.shadowRoot.querySelector("#selectMarca").addEventListener("change", actualizarProductosFiltrados);

        this.shadowRoot.querySelector("#selectProducto").addEventListener("change", (e) => {
            const producto = this._productos.find(p => p.id == e.target.value);
            this.shadowRoot.querySelector("#precioUnitario").value = producto ? `$ ${Number(producto.precioActual).toLocaleString("es-AR")}` : "$ 0";
        });

        this.shadowRoot.querySelector("#btnCancelarProducto").addEventListener("click", () => {
            this._mostrandoFormProducto = false;
            this.renderAreaProductos();
        });

        this.shadowRoot.querySelector("#btnAgregarAlCarrito").addEventListener("click", () => {
            const productoId = this.shadowRoot.querySelector("#selectProducto").value;
            const cantidad = Number(this.shadowRoot.querySelector("#cantidadProducto").value) || 1;
            const producto = this._productos.find(p => p.id == productoId);

            if (!producto) {
                document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
                    detail: { mensaje: "Seleccioná un producto para agregar", tipo: "error" }
                }));
                return;
            }

            this._carrito.push({
                productoId: producto.id,
                nombre: producto.nombre,
                marca: producto.marcaProducto.nombre,
                categoria: producto.categoriaProducto.nombre,
                precioUnitario: Number(producto.precioActual),
                cantidad
            });

            this._mostrandoFormProducto = false;
            this.renderAreaProductos();
            this.actualizarResumen();
        });
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
                    <p>Aún no hay productos en esta venta. Agregalos abajo.</p>
                </div>
                <button type="button" id="btnAgregarProductos" class="btn-agregar-productos">+ Agregar productos</button>
            `;
        } else {
            contenedor.innerHTML = `
                <div class="lista-carrito">
                    ${this._carrito.map((item, index) => `
                        <div class="item-carrito">
                            <div>
                                <strong>${item.nombre}</strong>
                                <div class="item-tags">
                                    <span>${item.categoria}</span>
                                    <span>${item.marca}</span>
                                </div>
                            </div>
                            <div class="item-cantidad">
                                <button type="button" class="btn-restar" data-index="${index}">-</button>
                                <span>${item.cantidad}</span>
                                <button type="button" class="btn-sumar" data-index="${index}">+</button>
                            </div>
                            <div class="item-subtotal">$${(item.precioUnitario * item.cantidad).toLocaleString("es-AR")}</div>
                            <button type="button" class="btn-quitar" data-index="${index}">&times;</button>
                        </div>
                    `).join("")}
                </div>
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
            this.shadowRoot.querySelectorAll(".btn-quitar").forEach(btn => {
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
            const body = {
                clienteId: this._clienteSeleccionado.id,
                metodoPago: this._metodoPago,
                descuentoGlobal: this._descuentoGlobal,
                observaciones: this._observaciones,
                generarFactura,
                detalles: this._carrito.map(item => ({
                    productoId: item.productoId,
                    cantidad: item.cantidad,
                    precioUnitario: item.precioUnitario
                }))
            };

            const response = await fetch(`${this.basePath}/ventas`, {
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
                    background: rgba(134, 128, 128, 0.7);
                    border: 1px solid rgba(255,255,255,.3);
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 1.2rem;
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
                    letter-spacing: .03em;
                }

                label:first-child { margin-top: 0; }

                input, select, textarea {
                    width: 100%;
                    box-sizing: border-box;
                    padding: .6rem .8rem;
                    border-radius: 6px;
                    border: 1px solid rgba(196,196,196,1);
                    background: rgba(255,255,255,.15);
                    color: white;
                    font-family: inherit;
                }

                input::placeholder, textarea::placeholder {
                    color: rgba(255,255,255,.6);
                }

                select option { color: black; }

                .required { color: #ff4d4d; }

                .carrito-vacio {
                    text-align: center;
                    padding: 2.5rem 1rem;
                    color: rgba(255,255,255,.7);
                    border: 2px dashed rgba(255,255,255,.3);
                    border-radius: 8px;
                }

                .carrito-vacio img {
                    width: 40px;
                    opacity: .5;
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
                    margin-top: 1.2rem;
                }
            </style>

            <div class="layout">
                <div class="columna-izquierda">
                    <div class="card">
                        <div class="card-header">
                            <img src="${this.basePath}/assets/img/iconos/users.svg"> Cliente
                        </div>
                        <div class="card-body" id="seccionCliente">
                            <label>BUSCAR CLIENTE <span class="required">*</span></label>
                            <input type="text" id="buscarCliente" list="listaClientes" placeholder="Nombre o RUT del cliente...">
                            <datalist id="listaClientes"></datalist>
                        </div>
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
                            <label class="radio-metodo"><input type="radio" name="metodoPago" value="Efectivo" checked> Efectivo</label>
                            <label class="radio-metodo"><input type="radio" name="metodoPago" value="Transferencia"> Transferencia</label>
                            <label class="radio-metodo"><input type="radio" name="metodoPago" value="Tarjeta de crédito"> Tarjeta de crédito</label>
                            <label class="radio-metodo"><input type="radio" name="metodoPago" value="Tarjeta de débito"> Tarjeta de débito</label>

                            <button type="button" id="btnConfirmarVenta" class="btn-confirmar">✓ Confirmar venta</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define("nueva-venta", NuevaVenta);