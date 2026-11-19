class ListadoClientes extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._clientes = [];
        this._busqueda = "";
        this._tipoSeleccionado = "";
        this._filtroEstado = "todos";
        this._orden = "nombre_desc";
        this._resumen = { total: 0, particulares: 0, empresas: 0 };
        this._pagina = 1;
        this._tamano = 10;
        this._total = 0;
        this._reqId = 0;
        this._timerBusqueda = null;
    }

    async connectedCallback() {
        this.renderShell();
        await Promise.all([this.cargarResumen(), this.cargarClientes()]);
        this.setupListeners();
        this.actualizarTabla();
        this.actualizarTarjetas();

        this._onCambio = () => this.recargarTodo();
        document.addEventListener("cliente-guardado", this._onCambio);
    }

    disconnectedCallback() {
        document.removeEventListener("cliente-guardado", this._onCambio);
    }

    async cargarResumen() {
        try {
            this._resumen = await fetch("clientes/resumen").then(r => r.json());
        } catch (error) {
            console.error("Error al cargar el resumen:", error);
        }
    }

    async cargarClientes() {
        const id = ++this._reqId; // ignora respuestas viejas si tipeás rápido

        const params = new URLSearchParams({ page: this._pagina, size: this._tamano });
        if (this._busqueda.trim()) params.set("q", this._busqueda.trim());
        if (this._tipoSeleccionado) params.set("tipo", this._tipoSeleccionado);
        if (this._filtroEstado !== "todos") params.set("estado", this._filtroEstado);
        params.set("orden", this._orden === "nombre_desc" ? "desc" : "asc");

        try {
            const data = await fetch("clientes?" + params).then(r => r.json());
            if (id !== this._reqId) return;

            this._clientes = data.datos;
            this._total = data.total;

            const totalPaginas = Math.max(1, Math.ceil(this._total / this._tamano));
            if (this._pagina > totalPaginas) {
                this._pagina = totalPaginas;
                await this.cargarClientes();
            }
        } catch (error) {
            console.error("Error al cargar clientes: ", error);
        }
    }

    async refrescarTabla() {
        await this.cargarClientes();
        this.actualizarTabla();
    }

    async recargarTodo() {
        await Promise.all([this.cargarResumen(), this.cargarClientes()]);
        this.actualizarTabla();
        this.actualizarTarjetas();
    }
    
    actualizarTarjetas() {
        const tarjetas = this.shadowRoot.querySelector("tarjetas-resumen");
        const r = this._resumen;

        tarjetas.tarjetas = [
            { titulo: "Total clientes registrados", valor: r.total },
            { titulo: "Particulares", valor: r.particulares, subTitulo: "PERSONAS FÍSICAS" },
            { titulo: "Empresas", valor: r.empresas, subTitulo: "PERSONAS JURÍDICAS" }
        ];
    }

    actualizarTabla() {
        const tabla = this.shadowRoot.querySelector("tabla-generica");

        const coloresTipo = {
            "Particular" : "#013168",
            "Empresa" : "#FE1BD4"
        };

        tabla.columnas = [
            { clave: "nombreCompleto", titulo: "Cliente", ancho: "41%" },
            {
                clave: "tipo",
                titulo: "Tipo",
                ancho: "15%",
                formato: (valor) => {
                    const color = coloresTipo[valor] || "#888888";
                    return `<span style="background:${color}22; color:${color}; padding:.25rem .7rem; border-radius:20px; font-size:.9rem; font-weight:600">${valor}</span>`;
                }
            },
            { clave: "cuitCuil", titulo: "Cuit / Cuil", ancho: "15%" },
            {
                clave: "telefono",
                titulo: "Teléfono",
                ancho: "15%",
                formato: (valor) =>  valor || "No registrado." 
            },
            {
                clave: "activo",
                titulo: "Estado",
                ancho: "7%",
                formato: (valor) => {
                    const color = valor ? "rgba(35,143,16,.6)" : "rgba(199,22,22,.6)";
                    const etiqueta = valor ? "Activo" : "Inactivo";
                    return `<span title="${etiqueta}" style="display:inline-block; width:17px; height:17px; border-radius:50%; background:${color}"></span>`;
                }
            },
            { clave: "cantidadVentas", titulo: "Ventas", ancho: "7%" }
        ];

        tabla.paginacion = { pagina: this._pagina, total: this._total, tamano: this._tamano };
        tabla.datos = this._clientes;
    }

    setupListeners() {
        this.shadowRoot.querySelector("tabla-generica").addEventListener("fila-clickeada", (evento) => {
            this.abrirDetalleCliente(evento.detail);
        });

        this.shadowRoot.querySelector("tabla-generica").addEventListener("cambiar-pagina", (e) => {
            this._pagina = e.detail;
            this.refrescarTabla();
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

        this.shadowRoot.querySelector("#filtroTipo").addEventListener("change", (e) => {
            this._tipoSeleccionado = e.target.value;
            this._pagina = 1;
            this.refrescarTabla();
        });

        this.shadowRoot.querySelector("#filtroEstado").addEventListener("change", (e) => {
            this._filtroEstado = e.target.value;
            this._pagina = 1;
            this.refrescarTabla();
        });

        this.shadowRoot.querySelector("#filtroOrden").addEventListener("change", (e) => {
            this._orden = e.target.value;
            this._pagina = 1;
            this.refrescarTabla();
        });
    }
    
    abrirEdicionCliente(cliente) {
        const modal = document.createElement("modal-component");
        modal.setAttribute("titulo", `Editando: ${cliente.nombre ? cliente.nombre + ' ' + cliente.apellido : cliente.razonSocial}`);
        modal.setAttribute("subTitulo", "EDITAR CLIENTE");

        const formulario = document.createElement("formulario-cliente");
        formulario.setAttribute("base-path", this.getAttribute("base-path") || "");

        modal.appendChild(formulario);
        document.body.appendChild(modal);

        formulario.setModoEdicion(cliente);
    }

    async abrirDetalleCliente(clienteResumen) {
        const modal = document.createElement("modal-component");
        modal.setAttribute("titulo", clienteResumen.nombreCompleto);
        modal.setAttribute("subTitulo", "CLIENTE");

        const detalle = document.createElement("detalle-cliente");
        
        detalle.addEventListener("editar-cliente", (evento) => {
            modal.remove();
            this.abrirEdicionCliente(evento.detail);
        });
        
        modal.appendChild(detalle);
        document.body.appendChild(modal);

        try {
            const clienteCompleto = await fetch(`clientes/${clienteResumen.id}`).then(r => r.json());
            detalle.cliente = clienteCompleto;
        } catch (error) {
            console.error("Error al cargar el detalle del cliente:", error);
        }
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

                .card-filtros {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr;
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

                <div class="card-filtros">
                    <input type="text" id="filtroBusqueda" placeholder="Buscar por nombre, cuit/cuil o email...">

                    <select id="filtroTipo">
                        <option value="">Todos los tipos</option>
                        <option value="Particular">Particular</option>
                        <option value="Empresa">Empresa</option>
                    </select>
        
                    <select id="filtroEstado">
                        <option value="todos">Todos los estados</option>
                        <option value="activos">Activos</option>
                        <option value="inactivos">Inactivos</option>
                    </select>

                    <select id="filtroOrden">
                        <option value="nombre_desc">Nombre: Z-A</option>
                    </select>
                </div>

                <tabla-generica></tabla-generica>
            </div>
        `;
    }
}

customElements.define("listado-clientes", ListadoClientes);

