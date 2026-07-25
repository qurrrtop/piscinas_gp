class ModalComponent extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.titulo = this.getAttribute("titulo") || "";
        this.subTitulo = this.getAttribute("subTitulo") || "";
        
        this.render();
    }
    
    close() {
        this.remove();
    }
    
    setupListeners() {
        const closeButton = this.shadowRoot.querySelector(".close-button");
        const overlay = this.shadowRoot.querySelector(".overlay");
        const modal = this.shadowRoot.querySelector(".modal");

        closeButton?.addEventListener("click", () => {
            this.close();
        });

        overlay.addEventListener("click", () => {
            this.close();
        });
        
        modal.addEventListener("click", (event) => {
            event.stopPropagation();
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                }
        
                .overlay {
                    width: 100%;
                    height: 100%;

                    display: flex;
                    justify-content: center;
                    align-items: center;

                    background: rgba(0, 0, 0, .5);
                }

                .modal {
                    width: 650px;
                    display: flex;
                    flex-direction: column;
                    max-height: 80vh;
                    overflow: hidden;
                    background: white;
                    border-radius: 10px;
                    border: 1px solid rgba(112, 112, 112, 1);
                    padding: 1.2rem;
                    background-color: rgba(5, 68, 141, 1);
                }
        
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    margin-bottom: 1.5rem;
                }
        
                .header-text {
                    display: flex;
                    flex-direction: column;
                }
                
                .header-text h2 {
                    margin: 0;
                }
        
                .circle-button {
                    background-color: rgba(181, 181, 181, 1);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 2.2rem;
                    height: 2.2rem;
                    border-radius: 30px;
                }

                .close-button {
                    background: none;
                    border: none;
                    font-size: 1.6rem;
                    cursor: pointer;
                }
        
                span {
                    margin:0;
                    font-size:.8rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.5);
                    letter-spacing:.08em;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }
        
                h2 {
                    margin: 0;
                    font-size:2rem;
                    font-weight:700;
                    color:white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }
        
                .modal-body {
                    flex: 1;
                    overflow-y: auto;
                    padding-right: 1rem;
                }
            </style>
            
            <div class="overlay">
                <div class="modal">
                    <div class="modal-header">

                        <div class="header-text">
                            <span>${this.subTitulo}</span>
                            <h2>${this.titulo}</h2>
                        </div>
                        
                        <div class="circle-button">
                            <button class="close-button">&times;</button>
                        </div>

                    </div>

                    <div class="modal-body">
                        <slot></slot>
                    </div>
                </div>
            </div>
        `;
        
        this.setupListeners();
    }

}

customElements.define("modal-component", ModalComponent);