class FormularioProducto extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: "open"});
    }

    connectedCallback() {
        this.render();
    }

    render() {

        this.shadowRoot.innerHTML = `
        
            <style>
                form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.8rem;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }
        
                h2 {
                    margin:0;
                    font-size:.8rem;
                    font-weight: heavy;
                    color: rgba(255, 255, 255, 0.5);
                    letter-spacing:.08em;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                h1 {
                    margin: 0 0 2rem 0;
                    font-size:2rem;
                    font-weight:700;
                    color:white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                h3 {
                    margin:0 0 1rem 0;
                    font-size:.9rem;
                    font-weight:600;
                    color:#B8D7FF;
                    text-transform:uppercase;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }
            </style>
            
            <h2>NUEVO PRODUCTO</h2>

            <h1>COMPLETE LOS DATOS</h1>
        
            <form>
                <div class="stock-section">
        
                    <div class="form-group">
                        <label>UNIDADES EN STOCK</label>
                        <input type="number" id="stock" name="stock" placeholder="0">
                    </div>
        
                    <div class="form-group">
                        <label>STOCK MÍNIMO (ALERTA)</label>
                        <input type="number" id="stockMin" name="stockMin" placeholder="ej: 5">
                        <span>Cuando el stock baje de este número, aparecerá una alerta.</span>
                    </div>
        
                    <div class="form-group">
                        <label>PRECIO UNITARIO</label>
                        <input type="number" id="precio" name="precio" required placeholder="25.000">
                    </div>
                </div>
        
                <div class="product-section">
                    <h3>INFORMACIÓN DEL PRODUCTO</h3>
                    
                    <div class="form-group">
                        <label>NOMBRE DEL PRODUCTO</label>
                        <input type="text" id="nombreProducto" name="nombreProducto" required placeholder="Ej: cloro granulado 1kg">
                    </div>
        
                    <div class="form-group">
                        <label>CATEGORÍA</label>
        
                        <select id="categoria" name="categoria" required>
                            <option>Seleccione una categoría</option>
                        </select>
                    </div>
        
                    <div class="form-group">
                        <label>MARCA</label>
        
                        <select id="marca" name="marca" required>
                            <option>Seleccione una marca</option>
                        </select>
                    </div>
        
                    <div class="form-group">
                        <label>UNIDAD DE MEDIDA</label>
        
                        <select id="uniMedida" name="uniMedida" required>
                            <option>Seleccione una unidad de medida</option>
                        </select>
                    </div>
        
                    <div class="form-group">
                        <label>DESCRIPCIÓN</label>
        
                        <textarea id="descripcion" name="descripcion" placeholder="Descripción, características, presentación..."></textarea>
                    </div>
                </div>
        
                <div class="actions">
                    <button type="button">Volver</button>
                    <button type="submit">Guardar producto</button>
                </div>
            </form>
        `;

    }

}

customElements.define("formulario-producto", FormularioProducto);