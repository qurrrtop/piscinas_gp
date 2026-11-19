class ListadoProductos extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._productos = [];
        this._marcas = [];
        this._categoriaSeleccionada = null;
        this._marcaSeleccionada = "";
        this._busqueda = "";
        this._estadoStock = "";
        this._filtroEstado = "todos";
        this._resumen = { total: 0, quimicos: 0, repuestos: 0, accesorios: 0, sinStock: 0, stockBajo: 0 };
        this._pagina = 1;
        this._tamano = 10;
        this._total = 0;
        this._reqId = 0;
        this._timerBusqueda = null;
    }

    // Etiqueta visible en la UI -> valor real guardado en la base
    static CATEGORIAS_TABS = [
        { etiqueta: "Químicos", valorReal: "Químico" },
        { etiqueta: "Repuestos", valorReal: "Repuesto" },
        { etiqueta: "Accesorios de instalación", valorReal: "Accesorios de Instalación" }
    ];

    async connectedCallback() {
        this.renderShell();
        await Promise.all([this.cargarMarcas(), this.cargarResumen(), this.cargarProductos()]);
        this.setupListeners();
        this.actualizarTabla();
        this.actualizarTarjetas();

        document.addEventListener("producto-guardado", () => this.recargarTodo());
        document.addEventListener("producto-actualizado", () => this.recargarTodo());
    }

    async cargarMarcas() {
        try {
            this._marcas = await fetch("marcas").then(r => r.json());
            const select = this.shadowRoot.querySelector("#filtroMarca");
            this._marcas.forEach(marca => {
                const option = document.createElement("option");
                option.value = marca.nombre;
                option.textContent = marca.nombre;
                select.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar marcas:", error);
        }
    }

    async cargarResumen() {
        try {
            this._resumen = await fetch("productos/resumen").then(r => r.json());
        } catch (error) {
            console.error("Error al cargar el resumen:", error);
        }
    }

    async cargarProductos() {
        const id = ++this._reqId; // para ignorar respuestas viejas si tipeás rápido

        const params = new URLSearchParams({ page: this._pagina, size: this._tamano });
        if (this._busqueda.trim()) params.set("q", this._busqueda.trim());
        if (this._categoriaSeleccionada) params.set("categoria", this._categoriaSeleccionada);
        if (this._marcaSeleccionada) params.set("marca", this._marcaSeleccionada);
        if (this._estadoStock) params.set("stock", this._estadoStock);
        if (this._filtroEstado !== "todos") params.set("estado", this._filtroEstado);

        try {
            const data = await fetch("productos?" + params).then(r => r.json());
            if (id !== this._reqId) return;

            this._productos = data.datos;
            this._total = data.total;

            // si la página actual quedó vacía (ej. se filtró o se borró algo), volver a la última válida
            const totalPaginas = Math.max(1, Math.ceil(this._total / this._tamano));
            if (this._pagina > totalPaginas) {
                this._pagina = totalPaginas;
                await this.cargarProductos();
            }
        } catch (error) {
            console.error("Error al cargar productos:", error);
        }
    }

    async refrescarTabla() {
        await this.cargarProductos();
        this.actualizarTabla();
    }

    async recargarTodo() {
        await Promise.all([this.cargarResumen(), this.cargarProductos()]);
        this.actualizarTabla();
        this.actualizarTarjetas();
    }
    
    actualizarTarjetas() {
        const tarjetas = this.shadowRoot.querySelector("tarjetas-resumen");
        const r = this._resumen;

        tarjetas.tarjetas = [
            { titulo: "Total productos", valor: r.total },
            { titulo: "Químicos", valor: r.quimicos },
            { titulo: "Repuestos", valor: r.repuestos },
            { titulo: "Accesorios", valor: r.accesorios },
            { titulo: "Sin stock", valor: r.sinStock },
            { titulo: "Stock bajo", valor: r.stockBajo }
        ];
    }

    estadoStockDe(producto) {
        if (producto.stock === 0) return "sin_stock";
        if (producto.stock <= producto.umbralStock) return "stock_bajo";
        return "disponible";
    }

    actualizarTabla() {
        const tabla = this.shadowRoot.querySelector("tabla-generica");

        const coloresEstado = {
            disponible: "#254D7B",
            stock_bajo: "#E28C15",
            sin_stock: "#FF1500"
        };

        const coloresCategoria = {
            "Químico": "#00690C",
            "Repuesto": "#9F6C00",
            "Accesorios de Instalación": "#A22EA0"
        };

        tabla.columnas = [
            {
              clave: "codigoProveedor",
              titulo: "Código",
              ancho: "10%",
              formato: valor => String(valor ?? "").toUpperCase() || "-"
            },
            {
                clave: "nombre",
                titulo: "Producto",
                ancho: "30%",
                formato: (valor, fila) =>
                    `${valor} - ${fila.contenido} ${fila.unidadMedida.abreviatura}`
            },
            {
                clave: "categoriaProducto.nombre",
                titulo: "Categoría",
                ancho: "20%",
                formato: (valor) => {
                    const color = coloresCategoria[valor] || "#888888";
                    return `<span style="background:${color}22; color:${color}; padding:.25rem .7rem; border-radius:20px; font-size:.9rem; font-weight:600">${valor}</span>`;
                }
            },
            { clave: "marcaProducto.nombre", titulo: "Marca", ancho: "13%" },
            {
                clave: "stock",
                titulo: "Stock",
                ancho: "10%",
                formato: (valor, fila) => {
                    const estado = this.estadoStockDe(fila);
                    const color = coloresEstado[estado];

                    const referencia = fila.umbralStock > 0 ? fila.umbralStock * 4 : 50;
                    const porcentaje = Math.min(100, Math.round((valor / referencia) * 100));

                    return `
                        <div style="display:flex; flex-direction:column; gap:.25rem; min-width:110px">
                            <span style="color:${color}; font-weight:600">${valor} / min ${fila.umbralStock}</span>
                            <div style="background:rgba(255,255,255,.15); border-radius:10px; height:6px; overflow:hidden">
                                <div style="background:${color}; width:${porcentaje}%; height:100%"></div>
                            </div>
                        </div>
                    `;
                }
            },
            {
                clave: "activo",
                titulo: "Estado",
                ancho: "7%",
                formato: (valor) => {
                    const color = valor ? "rgba(15,110,22,.5)" : "rgba(173,17,17,.5)";
                    const etiqueta = valor ? "Activo" : "Inactivo";
                    return `<span title="${etiqueta}" style="display:inline-block; width:15px; height:15px; border-radius:50%; background:${color}"></span>`;
                }
            },
            {
                clave: "precioActual",
                titulo: "Precio",
                ancho: "10%",
                formato: valor => `$${Number(valor).toLocaleString("es-AR")}`
            }
        ];
        tabla.paginacion = { pagina: this._pagina, total: this._total, tamano: this._tamano };
        tabla.datos = this._productos;
    }

    setupListeners() {
        this.shadowRoot.querySelector("tabla-generica").addEventListener("fila-clickeada", (evento) => {
            this.abrirDetalleProducto(evento.detail);
        });
        
        this.shadowRoot.querySelector("tabla-generica").addEventListener("cambiar-pagina", (e) => {
            this._pagina = e.detail;
            this.refrescarTabla();
        });
        
        this.shadowRoot.querySelectorAll(".tab-categoria").forEach(tab => {
            tab.addEventListener("click", () => {
                const valor = tab.dataset.valorReal;
                this._categoriaSeleccionada = this._categoriaSeleccionada === valor ? null : valor;

                this.shadowRoot.querySelectorAll(".tab-categoria").forEach(t => t.classList.remove("activo"));
                if (this._categoriaSeleccionada) tab.classList.add("activo");

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

        this.shadowRoot.querySelector("#filtroMarca").addEventListener("change", (e) => {
            this._marcaSeleccionada = e.target.value;
            this._pagina = 1;
            this.refrescarTabla();
        });

        this.shadowRoot.querySelector("#filtroStock").addEventListener("change", (e) => {
            this._estadoStock = e.target.value;
            this._pagina = 1;
            this.refrescarTabla();
        });

        this.shadowRoot.querySelector("#filtroEstado").addEventListener("change", (e) => {
            this._filtroEstado = e.target.value;
            this._pagina = 1;
            this.refrescarTabla();
        });

        this.shadowRoot.querySelector("#btnAnterior").addEventListener("click", () => {
            this._pagina--;
            this.refrescarTabla();
        });

        this.shadowRoot.querySelector("#btnSiguiente").addEventListener("click", () => {
            this._pagina++;
            this.refrescarTabla();
        });
    }
    
    // En ListadoProductos, agregar método para abrir edición
    abrirEdicionProducto(producto) {
        const modal = document.createElement("modal-component");
        modal.setAttribute("titulo", `Editando: ${producto.nombre}`);
        modal.setAttribute("subTitulo", "EDITAR PRODUCTO");
    
        const formulario = document.createElement("formulario-producto");
    
        // Configurar en modo edición
        formulario.setModoEdicion(producto);
    
        formulario.addEventListener("producto-actualizado", () => {
            this.recargarTodo();
        });
    
        formulario.addEventListener("cerrar-modal", () => {
            modal.remove();
        });
    
        modal.appendChild(formulario);
        document.body.appendChild(modal);
    }

    // Modificar el método abrirDetalleProducto para que use la edición
    abrirDetalleProducto(producto) {
        const modal = document.createElement("modal-component");
        modal.setAttribute("titulo", producto.nombre);
        modal.setAttribute("subTitulo", "PRODUCTO");
    
        const detalle = document.createElement("detalle-producto");
        detalle.setAttribute("base-path", this.getAttribute("base-path") || "");
        detalle.producto = producto;
    
        // Escuchar evento de edición desde el detalle
        detalle.addEventListener("editar-producto", (event) => {
            // Cerrar modal actual
            modal.remove();
            // Abrir formulario de edición
            this.abrirEdicionProducto(event.detail);
        });
    
        modal.appendChild(detalle);
        document.body.appendChild(modal);
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

                .tabs-categorias {
                    display: flex;
                    gap: .75rem;
                }

                .tab-categoria {
                    padding: .6rem 1.4rem;
                    border: 1px solid rgba(255,255,255,.4);
                    background: rgba(1, 49, 104, 1);
                    color: white;
                    cursor: pointer;
                    font-size: .9rem;
                    transition: .2s;
                    border-radius: 30px;
                }

                .tab-categoria:hover {
                    background: rgba(1, 49, 104, 0.5);
                }

                .tab-categoria.activo {
                    background: rgba(9, 77, 154, 1);
                    font-weight: 600;
                }

                .card-filtros {
                    display: grid;
                    grid-template-columns: 2fr repeat(4, 1fr);
                    gap: 1rem;
                    padding: 1rem 1.25rem;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,.5);
                    background: rgba(1, 49, 104, 1);
                }

                .card-filtros input,
                .card-filtros select {
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
            
                <div class="tabs-categorias">
                    ${ListadoProductos.CATEGORIAS_TABS.map(cat => `
                        <button class="tab-categoria" data-valor-real="${cat.valorReal}">${cat.etiqueta}</button>
                    `).join("")}
                </div>

                <div class="card-filtros">
                    <input type="text" id="filtroBusqueda" placeholder="Buscar por nombre o marca...">

                    <select id="filtroMarca">
                        <option value="">Todas las marcas</option>
                    </select>

                    <select id="filtroStock">
                        <option value="">Todos los Stock</option>
                        <option value="disponible">Disponible</option>
                        <option value="stock_bajo">Stock bajo</option>
                        <option value="sin_stock">Sin stock</option>
                    </select>
        
                    <select id="filtroEstado">
                        <option value="todos">Todos los estados</option>
                        <option value="activos">Activos</option>
                        <option value="inactivos">Inactivos</option>
                    </select>

                    <select id="filtroOrden">
                        <option value="nombre_asc">Nombre: A-Z</option>
                    </select>
                </div>

                <tabla-generica></tabla-generica>
            </div>
        `;
    }
}

customElements.define("listado-productos", ListadoProductos);

