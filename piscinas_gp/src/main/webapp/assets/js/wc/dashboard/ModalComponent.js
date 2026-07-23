class ModalComponent extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
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
                    width: 600px;
                    min-height: 300px;

                    background: white;
                    border-radius: 10px;
                    padding: 1.5rem;
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
                    gap: .5rem;
                }
                
                .header-text h2 {
                    margin: 0;
                }

                .close-button {
                    background: none;
                    border: none;
                    font-size: 1.6rem;
                    cursor: pointer;
                }
            </style>
            
            <div class="overlay">
                <div class="modal">
                    <div class="modal-header">

                        <div class="header-text">
                            <slot name="header"></slot>
                        </div>

                        <button class="close-button">&times;</button>

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