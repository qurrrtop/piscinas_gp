class LoginForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.basePath = "";
    }

    connectedCallback() {
        this.basePath = this.getAttribute('base-path') || "";
        this.render();
        this.setupListeners();
    }

    // ---------- VALIDACIONES SIMPLES ----------
    // Regla de Email: formato básico usuario@dominio.com
    validarEmail(valor) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!valor) return "El correo es obligatorio";
        if (!regex.test(valor)) return "Formato de correo inválido";
        return null; // null = sin error
    }

    // Regla de Contraseña: mínimo 6 caracteres
    validarPassword(valor) {
        if (!valor) return "La contraseña es obligatoria";
        if (valor.length < 6) return "Debe tener al menos 6 caracteres";
        return null;
    }

    // ---------- EVENTOS ----------
    setupListeners() {
        const form = this.shadowRoot.querySelector('form');
        form?.addEventListener('submit', (e) => this.handlerAccess(e));

        const emailInput = this.shadowRoot.querySelector('#email');
        const passwordInput = this.shadowRoot.querySelector('#password');

        // Validación en tiempo real mientras el usuario escribe
        emailInput?.addEventListener('input', () => {
            const error = this.validarEmail(emailInput.value);
            this.mostrarError(emailInput, error);
        });

        passwordInput?.addEventListener('input', () => {
            const error = this.validarPassword(passwordInput.value);
            this.mostrarError(passwordInput, error);
        });

        const btnCloseAlert = this.shadowRoot.querySelector('#close-alert');
        btnCloseAlert?.addEventListener('click', () => {
            this.shadowRoot.querySelector('#modal-overlay').classList.add('hidden');
        });
    }

    mostrarError(inputElement, error) {
        const container = inputElement.closest('.inlet-container');
        if (!container) return;

        const errorMessage = container.querySelector('.error-message');

        if (error) {
            errorMessage.textContent = error;
            errorMessage.classList.remove('hidden');
        } else {
            errorMessage.textContent = "";
            errorMessage.classList.add('hidden');
        }
    }

    handlerAccess(e) {
        e.preventDefault(); // frenamos el envío nativo / recarga de página

        const form = this.shadowRoot.querySelector('form');
        const emailInput = this.shadowRoot.querySelector('#email');
        const passwordInput = this.shadowRoot.querySelector('#password');

        const formData = new FormData(form);
        const emailValue = formData.get('email');
        const passwordValue = formData.get('password');

        // Validamos todo de nuevo al hacer submit (por si el usuario no tocó algún campo)
        const errorEmail = this.validarEmail(emailValue);
        const errorPassword = this.validarPassword(passwordValue);

        this.mostrarError(emailInput, errorEmail);
        this.mostrarError(passwordInput, errorPassword);

        if (errorEmail || errorPassword) {
            return; // frenamos si hay errores
        }

        this.validarAcceso(emailValue, passwordValue);
    }

    // ---------- "AUTENTICACIÓN" MOCK ----------
    // Por ahora sin base de datos: un solo usuario de prueba hardcodeado
    validarAcceso(email, password) {
        const USUARIO_PRUEBA = { email: "jugador@prode.com", password: "Prode123" };

        if (email === USUARIO_PRUEBA.email && password === USUARIO_PRUEBA.password) {
            this.mostrarAlerta("¡Bienvenido!", "Acceso correcto. Ingresando al prode...");
            // Acá después redirigís a la vista de pronósticos
            // window.location.href = `${this.basePath}/controlador?accion=inicio`;
        } else {
            this.mostrarAlerta("Error", "Usuario o contraseña incorrectos");
        }
    }

    mostrarAlerta(titulo, mensaje) {
        this.shadowRoot.querySelector('#title-message').textContent = titulo;
        this.shadowRoot.querySelector('#alert-message').textContent = mensaje;
        this.shadowRoot.querySelector('#modal-overlay').classList.remove('hidden');
    }

    // ---------- RENDER ----------
    render() {
        this.shadowRoot.innerHTML = `
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }

                .wrapper {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #f0f2f5;
                    padding: 1rem;
                }

                .card {
                    width: 100%;
                    max-width: 380px;
                }

                form {
                    background-color: white;
                    border-radius: 16px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                    overflow: hidden;
                }

                legend {
                    display: block;
                    width: 100%;
                    text-align: center;
                    font-size: 20px;
                    font-weight: bold;
                    color: #1a7a4c;
                    padding: 24px 0 16px;
                    border-bottom: 1px solid #eee;
                }

                fieldset {
                    border: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }

                .inlet-container {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 0 28px;
                }

                label {
                    font-size: 13px;
                    color: #555;
                }

                input {
                    border: none;
                    border-bottom: 2px solid #ddd;
                    padding: 8px 4px;
                    font-size: 14px;
                    background: transparent;
                }

                input:focus {
                    outline: none;
                    border-bottom-color: #1a7a4c;
                }

                .error-message {
                    color: #c11007;
                    font-size: 12px;
                    min-height: 14px;
                }

                .button-area {
                    padding: 20px 28px 28px;
                }

                .btn {
                    width: 100%;
                    border: none;
                    border-radius: 8px;
                    padding: 12px;
                    font-weight: bold;
                    font-size: 15px;
                    color: white;
                    background-color: #1a7a4c;
                    cursor: pointer;
                }

                .btn:hover {
                    background-color: #156140;
                }

                #modal-overlay {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background-color: rgba(0,0,0,0.6);
                    z-index: 1000;
                }

                #custom-alert {
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    text-align: center;
                    min-width: 280px;
                }

                #close-alert {
                    margin-top: 12px;
                    padding: 8px 20px;
                    cursor: pointer;
                    border: none;
                    border-radius: 6px;
                    background-color: #1a7a4c;
                    color: white;
                }

                .hidden { display: none !important; }
            </style>

            <div id="modal-overlay" class="hidden">
                <div id="custom-alert">
                    <h3 id="title-message"></h3>
                    <p id="alert-message"></p>
                    <button type="button" id="close-alert">Ok</button>
                </div>
            </div>

            <div class="wrapper">
                <div class="card">
                    <form>
                        <fieldset>
                            <legend>⚽ Ingresar al Prode</legend>

                            <div class="inlet-container">
                                <label for="email">Correo electrónico</label>
                                <input type="email" id="email" name="email" placeholder="tu@correo.com" required />
                                <small class="error-message hidden"></small>
                            </div>

                            <div class="inlet-container">
                                <label for="password">Contraseña</label>
                                <input type="password" id="password" name="password" placeholder="Tu contraseña" required />
                                <small class="error-message hidden"></small>
                            </div>

                            <div class="button-area">
                                <button type="submit" class="btn">Ingresar</button>
                            </div>
                        </fieldset>
                    </form>
                </div>
            </div>
        `;
    }
}

customElements.define('login-form', LoginForm);