class FormularioProducto extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: "open"});
    }

    connectedCallback() {
        this.render();
        this.setupListeners();
    }
    
    setupListeners() {
        const btnVolver = this.shadowRoot.querySelector(".btn-volver");
        
        btnVolver.addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("cerrar-modal", {
                bubbles: true,
                composed: true
            }));
        });
    }

    render() {

        this.shadowRoot.innerHTML = `
        
            <style>
                form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                h3 {
                    margin: 0;
                    font-size:.9rem;
                    font-weight:600;
                    color:#B8D7FF;
                    text-transform:uppercase;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }
        
                .stock-section {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    border-bottom: 1px solid rgba(196, 196, 196, .50);
                    padding-bottom: 1rem;
                }
        
                .product-section {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                }
        
                .product-section h3 {
                    grid-column: 1/-1;
                }
        
                .form-group.full-width {
                    grid-column: 1/-1;
                }
        
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: .45rem;
                }

                .actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: .5rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(196, 196, 196, .50);
                }
        
                .form-group input, 
                .form-group select, 
                .form-group textarea {
                    width: 100%;
                    box-sizing: border-box;
                }
        
                .form-group small {
                    font-size: .75rem;
                    color: rgba(255,255,255,.8);
                }
        
                label {
                    font-size: .8rem;
                    font-weight: 600;
                }
        
                input {
                    padding: .4rem 0;
                    outline: none;
                    background-color: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(196, 196, 196, 1);
                    border-radius: 5px;
                    color: white;
                    padding-left: .7rem;
                }
        
                .form-group select {
                    padding: .4rem .2rem;
                    border: 2px solid rgba(255,255,255,.15);
                    border-radius: 8px;
                    background: rgba(255,255,255,.08);
                    color: white;
                    font-size: .95rem;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    outline: none;
                    transition: .2s;
                    padding-right: 2.5rem;
                }
        
                input::placeholder {
                    color: white;
                }
        
                textarea {
                    outline: none;
                    background-color: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(196, 196, 196, 1);
                    border-radius: 5px;
                    color: white;
                    padding-left: .7rem;
                }
        
                textarea::placeholder {
                    color: white;
                }
                
                .actions button:first-child{
                    background:transparent;
                    color:white;
                    border:1px solid rgba(255,255,255,.25);
                    padding:.6rem 1.6rem;
                    border-radius:8px;
                    cursor:pointer;
                    transition:.2s;
                }
        
                .actions button:first-child:hover {
                    background:rgba(255,255,255,.08);
                }
        
                .actions button:last-child{
                    background:#37A4FF;
                    color:white;
                    border:none;
                    padding:.6rem 1.8rem;
                    border-radius:8px;
                    font-weight:600;
                    cursor:pointer;
                    transition:.2s;
                }
        
                .actions button:last-child:hover{
                    background:#2398FB;
                }
        
            </style>
        
            <form>
                <div class="stock-section">
        
                    <div class="form-group">
                        <label>UNIDADES EN STOCK</label>
                        <input type="number" id="stock" name="stock" placeholder="0">
                    </div>
        
                    <div class="form-group">
                        <label>STOCK MÍNIMO (ALERTA)</label>
                        <input type="number" id="stockMin" name="stockMin" placeholder="ej: 5">
                        <small>Cuando el stock baje de este número, aparecerá una alerta.</small>
                    </div>
        
                    <div class="form-group">
                        <label>PRECIO UNITARIO</label>
                        <input type="number" id="precio" name="precio" required placeholder="25.000">
                    </div>
                </div>

                <div class="product-section">
                    <h3>INFORMACIÓN DEL PRODUCTO</h3>
                    
                    <div class="form-group full-width">
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
        
                    <div class="form-group full-width">
                        <label>DESCRIPCIÓN</label>
        
                        <textarea id="descripcion" name="descripcion" rows="4" cols="50" placeholder="Descripción, características, presentación..."></textarea>
                    </div>
                </div>
        
                <div class="actions">
                    <button class="btn-volver" type="button">Volver</button>
                    <button type="submit">Guardar producto</button>
                </div>
            </form>
        `;

    }

}

customElements.define("formulario-producto", FormularioProducto);