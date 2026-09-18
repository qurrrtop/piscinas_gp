class ImportarProductos extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";

    }

    connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                .importar-vacio {
                    text-align: center;
                    padding: 2.5rem 1rem;
                    color: rgba(255,255,255);
                    border: 2px dashed rgba(255,255,255,.3);
                    border-radius: 8px;
                }
            </style>
        
            <p>Importe un archivo excel o CSV con la lista de productos. Asegúrese de que el
                formato del archivo coincida con la estructura requerida.
            </p>
        
            <div class="importar-vacio">
                <img src="${this.basePath}/assets/img/iconos/import.svg">
                <p>Arrastre el archivo aquí o haga click para seleccionar</p>
                <span>Formatos soportados: .xlsx, .xls, .csv</span>
                <span><img src="${this.basePath}/assets/img/iconos/file.svg">Máximo 10 MB</span>
            </div>
        
            <div class="box-util">
                <label>Marca</label>
                <select id="marca" name="marca" required>
                    <option value="">Seleccione una opción</option>
                    <option value="">Cualquiera</option>
                    <option value="">Vulcano</option>
                    <option value="">AstralPool</option>
                    <option value="">Clorotec</option>
                    <option value="">Nataclor</option>
                 </select>
        
                <span>Seleccione la marca de los productos a importar.</span>
                <span>Si el archivo contiene productos de varias marcas, elija "Cualquiera".</span>
            </div>
        
            <div class="acciones">
                <button type="button" id="btnCancelarVenta"">✕ Cancelar</button>
                <button type="button" id="btnVerFactura"><img src="${this.basePath}/assets/img/iconos/import.svg"> Importar</button>
            </div>
        `;
    }

}

customElements.define("importar-productos", ImportarProductos);