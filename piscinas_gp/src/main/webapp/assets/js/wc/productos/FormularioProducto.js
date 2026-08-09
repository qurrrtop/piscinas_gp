import Rules from '../../Rules.js';
import SetValidator from '../../SetValidator.js';

class FormularioProducto extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: "open"});
    }

    connectedCallback() {
        console.log("hola entré");
        this.render();
        console.log("hola pasó render");
        this.setupListeners();
        console.log("hola pasó setup");
    }
    
    setupListeners() {
        const form = this.shadowRoot.querySelector("form");
        const btnVolver = this.shadowRoot.querySelector(".btn-volver");
        
        const fields = [
            { input: "#nombreProducto", rule: Rules.provisions.NOMBRE_PRODUCTO },
            { input: "#stock", rule: Rules.provisions.STOCK },
            { input: "#stockMin", rule: Rules.provisions.STOCK_MIN },
            { input: "#precio", rule: Rules.provisions.PRECIO },
            { input: "#contenido", rule: Rules.provisions.CONTENIDO },
            { input: "#categoria", rule: Rules.provisions.CATEGORIA },
            { input: "#marca", rule: Rules.provisions.MARCA },
            { input: "#uniMedida", rule: Rules.provisions.UNIDAD_MEDIDA }
        ];
        
        fields.forEach(field => {
            const input = this.shadowRoot.querySelector(field.input);

            input?.addEventListener("input", () => {
                const error = SetValidator.validate(
                    input.value,
                    field.rule
                );

                this.checkResult(input, error);
            });

            input?.addEventListener("change", () => {
                const error = SetValidator.validate(
                    input.value,
                    field.rule
                );

                this.checkResult(input, error);
            });

        });
        
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            console.log("submit presionado");
            
            const esValido = this.validarFormulario();

            if (!esValido) {
                return;
            }

            const producto = this.obtenerDatosDelForm();

            await this.registrarProducto(producto);
        });
        
        btnVolver.addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("cerrar-modal", {
                bubbles: true,
                composed: true
            }));
        });
    }
    
    async registrarProducto(producto) {
        try {
            const response = await fetch("productos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(producto)
            });
            
            if (!response.ok) {
                throw new Error("Error al registrar el producto");
            }
            
            console.log("Producto enviado correctamente");
            
        } catch (error) {
            console.error("Error:", error);
        }
    }
    
    validarFormulario() {
        let formularioValido = true;

        const fields = [
            { input: "#nombreProducto", rule: Rules.provisions.NOMBRE_PRODUCTO },
            { input: "#stock", rule: Rules.provisions.STOCK, optional: true },
            { input: "#stockMin", rule: Rules.provisions.STOCK_MIN, optional: true },
            { input: "#precio", rule: Rules.provisions.PRECIO },
            { input: "#contenido", rule: Rules.provisions.CONTENIDO },
            { input: "#categoria", rule: Rules.provisions.CATEGORIA },
            { input: "#marca", rule: Rules.provisions.MARCA },
            { input: "#uniMedida", rule: Rules.provisions.UNIDAD_MEDIDA }
        ];

        fields.forEach(field => {
            const input = this.shadowRoot.querySelector(field.input);
            
            if (field.optional && input.value === "") {
                this.checkResult(input, null);
                return;
            }

            const error = SetValidator.validate(
                input.value,
                field.rule
            );

            this.checkResult(input, error);

            if (error) {
                formularioValido = false;
            }
        });

        return formularioValido;
    }
    
    checkResult(inputElement, error) {
        const container = inputElement.closest(".form-group");
        
        if (!container) return;
            const errorMessage = container.querySelector(".error-message");
            
            if (error) {
                errorMessage.textContent = error;    
            } else {
                errorMessage.textContent = "";
            }
    }
    
    obtenerDatosDelForm() {
        const producto = {
            stock: this.shadowRoot.querySelector("#stock").value,
            stockMin: this.shadowRoot.querySelector("#stockMin").value,
            precio: this.shadowRoot.querySelector("#precio").value,
            nombre: this.shadowRoot.querySelector("#nombreProducto").value,
            categoria: this.shadowRoot.querySelector("#categoria").value,
            marca: this.shadowRoot.querySelector("#marca").value,
            uniMedida: this.shadowRoot.querySelector("#uniMedida").value,
            contenido: this.shadowRoot.querySelector("#contenido").value,
            descripcion: this.shadowRoot.querySelector("#descripcion").value
        };
        
        return producto;
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
                    padding: .5rem 0;
                    outline: none;
                    background-color: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(196, 196, 196, 1);
                    border-radius: 5px;
                    color: white;
                    padding-left: .7rem;
                }
        
                .form-group select {
                    padding: .2rem .2rem;
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
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
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
        
                .form-group select option {
                    color: black;
                    background: white;
                }
        
                .required {
                    color: #ff4d4d;
                    font-weight: bold;
                }
        
                .error-message {
                    color: #ff6b6b;
                    font-size: .75rem;
                    min-height: 1rem;
                }
            </style>
        
            <form>
                <div class="stock-section">
        
                    <div class="form-group">
                        <label>UNIDADES EN STOCK</label>
                        <input type="number" id="stock" name="stock" placeholder="0">
                        <small class="error-message"></small>
                    </div>
        
                    <div class="form-group">
                        <label>STOCK MÍNIMO (ALERTA)</label>
                        <input type="number" id="stockMin" name="stockMin" placeholder="Ej: 5">
                        <small>Cuando el stock baje de este número, aparecerá una alerta.</small>
                        <small class="error-message"></small>
                    </div>
        
                    <div class="form-group">
                        <label>PRECIO UNITARIO <span class="required">*</span></label>
                        <input type="number" id="precio" name="precio" required placeholder="25.000">
                        <small class="error-message"></small>
                    </div>
                </div>

                <div class="product-section">
                    <h3>INFORMACIÓN DEL PRODUCTO</h3>
                    
                    <div class="form-group full-width">
                        <label>NOMBRE DEL PRODUCTO <span class="required">*</span></label>
                        <input type="text" id="nombreProducto" name="nombreProducto" required placeholder="Ej: cloro granulado 1kg">
                        <small class="error-message"></small>
                    </div>
        
                    <div class="form-group">
                        <label>CATEGORÍA <span class="required">*</span></label>
        
                        <select id="categoria" name="categoria" required>
                            <option value="">Seleccione una categoría</option>
                            <option value="Químico">Químico</option>
                            <option value="Accesorio">Accesorio de instalación</option>
                            <option value="Repuesto">Repuesto</option>

                        </select>
                        <small class="error-message"></small>
                    </div>
        
                    <div class="form-group">
                        <label>MARCA <span class="required">*</span></label>
        
                        <select id="marca" name="marca" required>
                            <option value="">Seleccione una marca</option>
                            <option value="Nataclor">Nataclor</option>
                            <option value="Clorotec">Clorotec</option>
                            <option value="Vulcano">Vulcano</option>
                            <option value="AstralPool">AstralPool</option>
                            <option value="Hayward">Hayward</option>
                            <option value="Pentair">Pentair</option>
                        </select>
                        <small class="error-message"></small>
                    </div>
        
                    <div class="form-group">
                        <label>UNIDAD DE MEDIDA <span class="required">*</span></label>
        
                        <select id="uniMedida" name="uniMedida" required>
                            <option value="">Seleccione una unidad de medida</option>
                            <option value="unidad">Unidad</option>
                            <option value="kilogramo">Kilogramo (kg)</option>
                            <option value="gramo">Gramo (g)</option>
                            <option value="litro">Litro (lt)</option>
                            <option value="partes Por Millón">Partes por millón (ppm)</option>
                            <option value="metros cubicos por hora">Metros cúbicos por hora (m³/h)</option>
                            <option value="pulgadas">Pulgadas (”)</option>
                        </select>
                        <small class="error-message"></small>
                    </div>
        
                    <div class="form-group">
                        <label>CONTENIDO (UNI. MEDIDA) <span class="required">*</span></label>
                        <input type="number" id="contenido" name="contenido" required placeholder="Ej: 5kg, 1lt, 12w" required>
                        <small class="error-message"></small>
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