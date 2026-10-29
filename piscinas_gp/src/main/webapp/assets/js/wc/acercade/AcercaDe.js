class AcercaDe extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";

        this._integrantes = [
            { nombre: "Javier José", apellido: "Maidana", rol: "Desarrollador", telefono: "3773123456", email: "nombre1234@gmail.com" },
            { nombre: "Román Alberto", apellido: "Maidana", rol: "Desarrollador", telefono: "3773123456", email: "nombre1234@gmail.com" },
            { nombre: "Matias", apellido: "Avalos", rol: "Desarrollador", telefono: "3773123456", email: "nombre1234@gmail.com" },
            { nombre: "Máximo", apellido: "Percara", rol: "Desarrollador", telefono: "3773123456", email: "nombre1234@gmail.com" }
        ];
    }

    connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        this.render();
    }

    iniciales(i) {
        return ((i.nombre[0] || "") + (i.apellido[0] || "")).toUpperCase();
    }

    render() {
        const colores = [
            "linear-gradient(160deg, #5FD9E8, #0B5C7A)",
            "linear-gradient(160deg, #E85FC9, #6A1B6E)",
            "linear-gradient(160deg, #F5C84C, #A8650B)",
            "linear-gradient(160deg, #6FE08A, #14703A)"
        ];

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    margin-top: 20px;
                    color: white;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                }

                .card {
                    background: rgba(2, 24, 56, 0.45);
                    backdrop-filter: blur(2px);
                    border: 1px solid rgba(255,255,255,.25);
                    border-radius: 12px;
                    margin-bottom: 1.2rem;
                    overflow: hidden;
                }

                .card-header {
                    background: rgba(1, 49, 104, 0.9);
                    padding: .8rem 1.2rem;
                    font-size: .85rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: .04em;
                }

                .card-body { padding: 1.2rem; line-height: 1.6; font-size: .95rem; text-shadow: 0 1px 3px rgba(0,0,0,.6); }
                .card-body p { margin: 0 0 .8rem 0; color: rgba(255,255,255,.92); }
                .card-body p:last-child { margin-bottom: 0; }

                .equipo {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                }

                .integrante {
                    display: flex;
                    align-items: center;
                    gap: .9rem;
                    background: rgba(255,255,255,.06);
                    border: 1px solid rgba(255,255,255,.15);
                    border-radius: 10px;
                    padding: .8rem 1rem;
                    transition: background .2s;
                }

                .integrante:hover { background: rgba(255,255,255,.12); }

                .integrante > div { min-width: 0; }

                .integrante small,
                .integrante a { overflow-wrap: anywhere; }

                .avatar {
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.1rem;
                    flex-shrink: 0;
                }

                .integrante strong { display: block; font-size: 1rem; }
                .integrante .rol { color: #B8D7FF; font-size: .78rem; font-weight: 600; text-transform: uppercase; }
                .integrante small { display: block; color: rgba(255,255,255,.75); font-size: .8rem; margin-top: .2rem; }
                .integrante a { color: #B8D7FF; text-decoration: none; }
                .integrante a:hover { text-decoration: underline; }

                .descargo { font-size: .85rem; color: rgba(255,255,255,.9); }
                .pie { text-align: center; font-size: .78rem; color: rgba(255,255,255,.7); margin-top: 1rem; }

                @media (max-width: 700px) {
                    .equipo { grid-template-columns: 1fr; }
                }
            </style>

            <div class="card">
                <div class="card-header">Sobre el sistema</div>
                <div class="card-body">
                    <p><strong>Piscinas GP</strong> es un sistema de gestión pensado para un negocio dedicado a la venta de productos para piscinas (químicos, repuestos y accesorios de instalación) y a la prestación de servicios relacionados con piscinas y el agua.</p>
                    <p>Permite administrar clientes, productos, marcas y categorías, controlar el stock, registrar ventas con distintos métodos de pago y consultar el historial de operaciones, todo desde una sola plataforma.</p>
                </div>
            </div>

            <div class="card">
                <div class="card-header">Equipo de desarrollo</div>
                <div class="card-body">
                    <p>Sistema desarrollado como proyecto final de la Tecnicatura Superior en Desarrollo de Software
                    del Instituto Superior de Formación Docente (ISFD Mercedes). Si querés contactarnos por consultas o por nuestros servicios de desarrollo:</p>
                    <div class="equipo">
                        ${this._integrantes.map((i, n) => `
                            <div class="integrante">
                                <span class="avatar" style="background:${colores[n % colores.length]}">${this.iniciales(i)}</span>
                                <div>
                                    <strong>${i.nombre} ${i.apellido}</strong>
                                    <span class="rol">${i.rol}</span>
                                    <small>Tel: <a href="tel:${i.telefono}">${i.telefono}</a></small>
                                    <small><a href="mailto:${i.email}">${i.email}</a></small>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">Descargo de responsabilidad</div>
                <div class="card-body descargo">
                    <p>Piscinas GP es un proyecto con fines académicos y se proporciona "tal cual", sin garantías de ningún tipo, expresas o implícitas, incluidas las de comerciabilidad, adecuación a un fin particular o funcionamiento ininterrumpido y libre de errores.</p>
                    <p>Los desarrolladores no se hacen responsables por daños, pérdidas de datos, pérdidas económicas u otros perjuicios derivados del uso, el mal uso o la imposibilidad de uso del sistema, ni por las decisiones comerciales que se tomen a partir de la información que este muestre.</p>
                    <p>La persona o entidad que utilice el sistema es responsable de los datos que cargue, de realizar copias de seguridad periódicas y de cumplir con la normativa vigente aplicable a su actividad, incluida la protección de datos personales (Ley 25.326).</p>
                    <p>Los nombres de marcas o productos que aparezcan en el sistema pertenecen a sus respectivos titulares y se muestran solo con fines ilustrativos.</p>
                </div>
            </div>

            <p class="pie">Piscinas GP · Todos los derechos reservados por sus autores · 2026</p>
        `;
    }
}

customElements.define("acerca-de", AcercaDe);