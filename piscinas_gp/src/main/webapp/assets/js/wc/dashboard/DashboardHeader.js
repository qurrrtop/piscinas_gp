class DashboardHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.basePath = "";
    }
    
connectedCallback() {
    this.basePath = this.getAttribute("base-path") || "";
    this.titulo = this.getAttribute("titulo") || "";
    this.descripcion = this.getAttribute("descripcion") || "";
    this.icono = this.getAttribute("icono") || "";
    this.botonTexto = this.getAttribute("botonTexto") || "";
    this.accion = this.getAttribute("accion") || "";
    this.render();
}
    
    setupListeners() {
        const button = this.shadowRoot.querySelector("button");
        
        if (!button) return;
            button.addEventListener("click", () => {
            
                if (this.accion && this.accion.startsWith("nav:")) {
                    const path = this.accion.replace("nav:", "");
                    this.dispatchEvent(new CustomEvent("navigateTo", {
                        bubbles: true,
                        composed: true,
                        detail: { path: `${this.basePath}${path}` }
                    }));
                } else {
                    this.dispatchEvent(new CustomEvent("header-action", {
                        bubbles: true,
                        composed: true,
                        detail: { action: this.accion }
                    }));
                }
            });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
        
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
    
                .header-info {
                    color: white;
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                }
    
                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
    
                .header-title h1 {
                    margin: 0;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    font-weight: 500;
                }

                .header-info p {
                    margin: 0;
                    margin-top: 2px;

                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    font-size: .95rem;
                    font-weight: 400;
                }
    
                .header-title img {
                    width: 30px;
                    height: 30px;
                }
    
                button {
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    background-color: rgba(59, 159, 240, 1);
                    border: 1px solid rgba(181, 161, 161, 1);
                    padding: .7rem 1.2rem;
                    border-radius: 3px;
                    font-weight: 500;
                    cursor: pointer;
                }
            </style>
            
            <header class="dashboard-header">

            <div class="header-info">
                <div class="header-title">
                    <img src="${this.basePath}/assets/img/iconos/${this.icono}">
                    <h1>${this.titulo}</h1>
                </div>
                
                <p>${this.descripcion}</p>
            </div>

            ${this.botonTexto ? `<button>${this.botonTexto}</button>` : ""}

            </header>
        `;
        
        this.setupListeners();
    }

}

customElements.define("dashboard-header", DashboardHeader);