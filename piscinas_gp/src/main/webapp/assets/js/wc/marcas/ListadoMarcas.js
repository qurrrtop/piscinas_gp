class ListadoMarcas extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._marcas = [];
        this._busqueda = "";
        this._filtroEstado = "todos";
    }

    async connectedCallback() {
        this.renderShell();
        await this.cargarDatos();
        this.setupListeners();
        this.actualizarTabla();
        this.actualizarTarjetas();

        document.addEventListener("marca-guardada", async () => {
            await this.cargarDatos();
            this.actualizarTabla();
            this.actualizarTarjetas();
        });
    }

    async cargarDatos() {
        try {
            this._marcas = await fetch("marcas?incluirInactivas=true").then(r => r.json());
        } catch (error) {
            console.error("Error al cargar marcas: ", error);
        }
    }

    obtenerMarcasFiltradas() {
        const busqueda = this._busqueda.trim().toLowerCase();

        return this._marcas.filter(marca => {
            if (this._filtroEstado === "activos" && !marca.activo) return false;
            if (this._filtroEstado === "inactivos" && marca.activo) return false;

            if (busqueda && !marca.nombre.toLowerCase().includes(busqueda)) return false;

            return true;
        });
    }

    actualizarTarjetas() {
        const tarjetas = this.shadowRoot.querySelector("tarjetas-resumen");

        const total = this._marcas.length;
        const activas = this._marcas.filter(m => m.activo).length;
        const inactivas = total - activas;

        tarjetas.tarjetas = [
            { titulo: "Total de marcas", valor: total },
            { titulo: "Activas", valor: activas },
            { titulo: "Inactivas", valor: inactivas }
        ];
    }

    actualizarTabla() {
        const tabla = this.shadowRoot.querySelector("tabla-generica");

        tabla.columnas = [
            { clave: "nombre", titulo: "Marca", ancho: "75%" },
            {
                clave: "activo",
                titulo: "Estado",
                ancho: "25%",
                formato: (valor) => {
                    const color = valor ? "rgba(35,143,16,.6)" : "rgba(199,22,22,.6)";
                    const etiqueta = valor ? "Activo" : "Inactivo";
                    return `<span title="${etiqueta}" style="display:inline-block; width:17px; height:17px; border-radius:50%; background:${color}"></span>`;
                }
            }
        ];

        tabla.datos = this.obtenerMarcasFiltradas();
    }

    setupListeners() {
        this.shadowRoot.querySelector("tabla-generica").addEventListener("fila-clickeada", (evento) => {
            this.abrirEdicionMarca(evento.detail);
        });

        this.shadowRoot.querySelector("#filtroBusqueda").addEventListener("input", (e) => {
            this._busqueda = e.target.value;
            this.actualizarTabla();
        });

        this.shadowRoot.querySelector("#filtroEstado").addEventListener("change", (e) => {
            this._filtroEstado = e.target.value;
            this.actualizarTabla();
        });
    }

    abrirEdicionMarca(marca) {
        const modal = document.createElement("modal-component");
        modal.setAttribute("titulo", `Editando: ${marca.nombre}`);
        modal.setAttribute("subTitulo", "EDITAR MARCA");

        const formulario = document.createElement("formulario-marca");
        formulario.setAttribute("base-path", this.getAttribute("base-path") || "");

        modal.appendChild(formulario);
        document.body.appendChild(modal);

        formulario.setModoEdicion(marca);
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
                    grid-template-columns: 2fr 1fr;
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
                    <input type="text" id="filtroBusqueda" placeholder="Buscar por nombre...">

                    <select id="filtroEstado">
                        <option value="todos">Todos los estados</option>
                        <option value="activos">Activas</option>
                        <option value="inactivos">Inactivas</option>
                    </select>
                </div>

                <tabla-generica></tabla-generica>
            </div>
        `;
    }
}

customElements.define("listado-marcas", ListadoMarcas);