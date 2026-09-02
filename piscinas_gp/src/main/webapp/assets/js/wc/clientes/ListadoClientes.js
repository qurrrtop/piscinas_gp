class ListadoClientes extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._clientes = [];
        this._busqueda = "";
        this._tipoSeleccionado = "";
        this._filtroEstado = "todos";
        this._orden = "nombre_desc";
        
    }

    async connectedCallback() {
        this.renderShell();
        await this.cargarDatos();
        this.setupListeners();
        this.actualizarTabla();
        this.actualizarTarjetas();
        
        document.addEventListener("cliente-guardado", async () => {
            await this.cargarDatos();
            this.actualizarTabla();
            this.actualizarTarjetas();
        });
    }
    
    async cargarDatos() {
        try {
            this._clientes = await fetch("clientes").then(r => r.json());
        } catch (error) {
            console.error("Error al cargar clientes: ", error);
        }
    }
    
    obtenerClientesFiltrados() {
        const busqueda = this._busqueda.trim().toLowerCase();
        
        let resultado = this._clientes.filter(cliente => {
            if (this._filtroEstado === "activos" && !cliente.activo) return false;
            
            if (this._filtroEstado === "inactivos" && cliente.activo) return false;
            
           if (this._tipoSeleccionado && cliente.tipo !== this._tipoSeleccionado) {
               return false;
           }
           
           if (busqueda) {
               const coincideNombre = cliente.nombreCompleto.toLowerCase().includes(busqueda);
               const coincideCuitCuil = cliente.cuitCuil.toLowerCase().includes(busqueda);
               const coincideEmail = (cliente.email || "").toLowerCase().includes(busqueda);
               if (!coincideNombre && !coincideCuitCuil && !coincideEmail) return false;

           }
           return true;
        });
        
         if (this._orden === "nombre_desc") {
            resultado = resultado.sort((a, b) => b.nombreCompleto.localeCompare(a.nombreCompleto));
        }

        return resultado;
    }
    
    actualizarTarjetas() {
        const tarjetas = this.shadowRoot.querySelector("tarjetas-resumen");

        const total = this._clientes.length;
        const particulares = this._clientes.filter(c => c.tipo === "Particular").length;
        const empresas = this._clientes.filter(c => c.tipo === "Empresa").length;

        tarjetas.tarjetas = [
            { titulo: "Total clientes registrados", valor: total },
            { titulo: "Particulares", valor: particulares, subTitulo: "PERSONAS FÍSICAS" },
            { titulo: "Empresas", valor: empresas, subTitulo: "PERSONAS JURÍDICAS" }
        ];
    }

    actualizarTabla() {
        const tabla = this.shadowRoot.querySelector("tabla-generica");

        const coloresTipo = {
            "Particular" : "#013168",
            "Empresa" : "#FE1BD4"
        };

        tabla.columnas = [
            { clave: "nombreCompleto", titulo: "Cliente" },
            {
                clave: "tipo",
                titulo: "Tipo",
                formato: (valor) => {
                    const color = coloresTipo[valor] || "#888888";
                    return `<span style="background:${color}22; color:${color}; padding:.25rem .7rem; border-radius:20px; font-size:.9rem; font-weight:600">${valor}</span>`;
                }
            },
            { clave: "cuitCuil", titulo: "Cuit / Cuil" },
            {
                clave: "telefono",
                titulo: "Teléfono",
                formato: (valor) =>  valor || "No registrado." 
            },
            {
                clave: "activo",
                titulo: "Estado",
                formato: (valor) => {
                    const color = valor ? "rgba(35,143,16,.6)" : "rgba(199,22,22,.6)";
                    const etiqueta = valor ? "Activo" : "Inactivo";
                    return `<span title="${etiqueta}" style="display:inline-block; width:17px; height:17px; border-radius:50%; background:${color}"></span>`;
                }
            },
            { clave: "cantidadVentas", titulo: "Ventas" }
        ];

        tabla.datos = this.obtenerClientesFiltrados();
    }

    setupListeners() {
        this.shadowRoot.querySelector("tabla-generica").addEventListener("fila-clickeada", (evento) => {
            this.abrirDetalleCliente(evento.detail);
        });

        this.shadowRoot.querySelector("#filtroBusqueda").addEventListener("input", (e) => {
            this._busqueda = e.target.value;
            this.actualizarTabla();
        });

        this.shadowRoot.querySelector("#filtroTipo").addEventListener("change", (e) => {
            this._tipoSeleccionado = e.target.value;
            this.actualizarTabla();
        });
        
        this.shadowRoot.querySelector("#filtroEstado").addEventListener("change", (e) => {
            this._filtroEstado = e.target.value;
            this.actualizarTabla();
        });


        this.shadowRoot.querySelector("#filtroOrden").addEventListener("change", (e) => {
            this._orden = e.target.value;
            this.actualizarTabla();
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

