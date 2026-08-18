class NotificacionToast extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.render();
        document.addEventListener("mostrar-notificacion", (evento) => {
            this.mostrar(evento.detail.mensaje, evento.detail.tipo);
        });
    }

    mostrar(mensaje, tipo = "exito") {
        const contenedor = this.shadowRoot.querySelector(".contenedor-toasts");

        const toast = document.createElement("div");
        toast.className = `toast toast-${tipo}`;
        toast.textContent = mensaje;

        contenedor.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("saliendo");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    render() {
    this.shadowRoot.innerHTML = `
        <style>
            .contenedor-toasts {
                position: fixed;
                bottom: 3rem;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: .6rem;
                z-index: 999999;
            }

            .toast {
                padding: .8rem 1.4rem;
                border-radius: 8px;
                color: white;
                font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                font-size: .9rem;
                box-shadow: 0 4px 12px rgba(0,0,0,.3);
                animation: entrar .25s ease-out;
                white-space: nowrap;
            }

            .toast-exito {
                background: #2E9E5B;
            }

            .toast-error {
                background: #D64545;
            }

            .toast.saliendo {
                animation: salir .3s ease-in forwards;
            }

            @keyframes entrar {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            @keyframes salir {
                to { transform: translateY(20px); opacity: 0; }
            }
        </style>

        <div class="contenedor-toasts"></div>
    `;
}
}

customElements.define("notificacion-toast", NotificacionToast);