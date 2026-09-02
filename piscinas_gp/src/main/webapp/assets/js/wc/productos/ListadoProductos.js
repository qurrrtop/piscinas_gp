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
        this._filtroEstado = "activos";
        this._orden = "nombre_asc";
    }

    // Etiqueta visible en la UI -> valor real guardado en la base
    static CATEGORIAS_TABS = [
        { etiqueta: "Químicos", valorReal: "Químico" },
        { etiqueta: "Repuestos", valorReal: "Repuesto" },
        { etiqueta: "Accesorios de instalación", valorReal: "Accesorios de Instalación" }
    ];

    async connectedCallback() {
        this.renderShell();
        await this.cargarDatos();
        this.setupListeners();
        this.actualizarTabla();
        this.actualizarTarjetas();
        
        document.addEventListener("producto-guardado", async () => {
            await this.cargarDatos();
            this.actualizarTabla();
            this.actualizarTarjetas();
        });
        
        document.addEventListener("producto-actualizado", async () => {
            await this.cargarDatos();
            this.actualizarTabla();
            this.actualizarTarjetas();
        });
    }

    async cargarDatos() {
        try {
            const [productos, marcas] = await Promise.all([
                fetch("productos").then(r => r.json()),
                fetch("marcas").then(r => r.json())
            ]);
            this._productos = productos;
            this._marcas = marcas;
            this.poblarSelectMarcas();
        } catch (error) {
            console.error("Error al cargar productos/marcas:", error);
        }
    }
    
    actualizarTarjetas() {
        const tarjetas = this.shadowRoot.querySelector("tarjetas-resumen");

        const total = this._productos.length;
        const quimicos = this._productos.filter(p => p.categoriaProducto.nombre === "Químico").length;
        const repuestos = this._productos.filter(p => p.categoriaProducto.nombre === "Repuesto").length;
        const accesorios = this._productos.filter(p => p.categoriaProducto.nombre === "Accesorios de Instalación").length;
        const sinStock = this._productos.filter(p => this.estadoStockDe(p) === "sin_stock").length;
        const stockBajo = this._productos.filter(p => this.estadoStockDe(p) === "stock_bajo").length;

        tarjetas.tarjetas = [
            { titulo: "Total productos", valor: total },
            { titulo: "Químicos", valor: quimicos },
            { titulo: "Repuestos", valor: repuestos },
            { titulo: "Accesorios", valor: accesorios },
            { titulo: "Sin stock", valor: sinStock },
            { titulo: "Stock bajo", valor: stockBajo }
        ];
    }

    poblarSelectMarcas() {
        const select = this.shadowRoot.querySelector("#filtroMarca");
        this._marcas.forEach(marca => {
            const option = document.createElement("option");
            option.value = marca.nombre;
            option.textContent = marca.nombre;
            select.appendChild(option);
        });
    }

    estadoStockDe(producto) {
        if (producto.stock === 0) return "sin_stock";
        if (producto.stock <= producto.umbralStock) return "stock_bajo";
        return "disponible";
    }

    obtenerProductosFiltrados() {
        const busqueda = this._busqueda.trim().toLowerCase();

        let resultado = this._productos.filter(producto => {
            if (this._filtroEstado === "activos" && !producto.activo) return false;
            
            if (this._filtroEstado === "inactivos" && producto.activo) return false;
            
            if (this._categoriaSeleccionada && producto.categoriaProducto.nombre !== this._categoriaSeleccionada) {
                return false;
            }
            if (this._marcaSeleccionada && producto.marcaProducto.nombre !== this._marcaSeleccionada) {
                return false;
            }
            if (this._estadoStock && this.estadoStockDe(producto) !== this._estadoStock) {
                return false;
            }
            if (busqueda) {
                const coincideNombre = producto.nombre.toLowerCase().includes(busqueda);
                const coincideMarca = producto.marcaProducto.nombre.toLowerCase().includes(busqueda);
                if (!coincideNombre && !coincideMarca) return false;
            }
            return true;
        });

        if (this._orden === "nombre_asc") {
            resultado = resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
        }

        return resultado;
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
                clave: "nombre",
                titulo: "Producto",
                formato: (valor, fila) =>
                    `${valor} - ${fila.contenido} ${fila.unidadMedida.abreviatura}`
            },
            {
                clave: "categoriaProducto.nombre",
                titulo: "Categoría",
                formato: (valor) => {
                    const color = coloresCategoria[valor] || "#888888";
                    return `<span style="background:${color}22; color:${color}; padding:.25rem .7rem; border-radius:20px; font-size:.9rem; font-weight:600">${valor}</span>`;
                }
            },
            { clave: "marcaProducto.nombre", titulo: "Marca" },
            {
                clave: "stock",
                titulo: "Stock",
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
                clave: "stock",
                titulo: "Estado stock",
                formato: (valor, fila) => {
                    const estado = this.estadoStockDe(fila);
                    const color = coloresEstado[estado];
                    const etiquetas = {
                        disponible: "Disponible",
                        stock_bajo: "Stock bajo",
                        sin_stock: "Sin stock"
                    };
                    return `<span style="color:${color} font-weight:bold;">${etiquetas[estado]}</span>`;
                }
            },
            {
                clave: "activo",
                titulo: "Estado",
                formato: (valor) => {
                    const color = valor ? "rgba(15,110,22,.5)" : "rgba(173,17,17,.5)";
                    const etiqueta = valor ? "Activo" : "Inactivo";
                    return `<span title="${etiqueta}" style="display:inline-block; width:15px; height:15px; border-radius:50%; background:${color}"></span>`;
                }
            },
            {
                clave: "precioActual",
                titulo: "Precio",
                formato: valor => `$${Number(valor).toLocaleString("es-AR")}`
            }
        ];

    tabla.datos = this.obtenerProductosFiltrados();
}

    setupListeners() {
        this.shadowRoot.querySelector("tabla-generica").addEventListener("fila-clickeada", (evento) => {
            this.abrirDetalleProducto(evento.detail);
        });
        
        this.shadowRoot.querySelectorAll(".tab-categoria").forEach(tab => {
            tab.addEventListener("click", () => {
                const valor = tab.dataset.valorReal;
                this._categoriaSeleccionada = this._categoriaSeleccionada === valor ? null : valor;

                this.shadowRoot.querySelectorAll(".tab-categoria").forEach(t => t.classList.remove("activo"));
                if (this._categoriaSeleccionada) tab.classList.add("activo");

                this.actualizarTabla();
            });
        });

        this.shadowRoot.querySelector("#filtroBusqueda").addEventListener("input", (e) => {
            this._busqueda = e.target.value;
            this.actualizarTabla();
        });

        this.shadowRoot.querySelector("#filtroMarca").addEventListener("change", (e) => {
            this._marcaSeleccionada = e.target.value;
            this.actualizarTabla();
        });

        this.shadowRoot.querySelector("#filtroStock").addEventListener("change", (e) => {
            this._estadoStock = e.target.value;
            this.actualizarTabla();
        });
        
        this.shadowRoot.querySelector("#filtroEstado").addEventListener("input", (e) => {
            this._filtroEstado = e.target.value;
            this.actualizarTabla();
        });

        this.shadowRoot.querySelector("#filtroOrden").addEventListener("change", (e) => {
            this._orden = e.target.value;
            this.actualizarTabla();
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
    
        // Escuchar cuando se actualice el producto
        formulario.addEventListener("producto-actualizado", () => {
            // Recargar datos
            this.cargarDatos();
            this.actualizarTabla();
            this.actualizarTarjetas();
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

