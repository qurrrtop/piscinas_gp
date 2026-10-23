class DetalleServicio extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.basePath = "";
        this.tipo = "";
        this.servicioId = "";
        this.maxImagenes = 5;
        this.tiposImagen = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        this._servicio = null;
        this._edicion = null;
        this._clientes = [];
        this._productos = [];
        this._cantidadOriginal = {};
        this._guardando = false;
        this._metodosPago = [];
    }

    connectedCallback() {
        this.basePath = this.getAttribute("base-path") || "";
        this.tipo = this.getAttribute("tipo") || "";
        this.servicioId = this.getAttribute("servicio-id") || "";

        this.renderShell();
        this.cargar();
    }

    // ---------- carga ----------

    // Si no viene base-path se usan rutas relativas, igual que ListadoServicios.
    prefijo() {
        return this.basePath ? `${this.basePath}/` : "";
    }

    carpetaServicio() {
        if (this.tipo === "tecnico") return "tecnicos";
        if (this.tipo === "asesoramiento") return "asesoramientos";
        return null;
    }

    async cargar() {
        const carpeta = this.carpetaServicio();

        if (!carpeta || !this.servicioId) {
            this.renderError("Falta indicar el tipo o el id del servicio");
            return;
        }

        this.renderCargando();

        try {
            const respuesta = await fetch(`${this.prefijo()}servicios/${carpeta}/${this.servicioId}`);
            const data = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(data.error || "No se pudo cargar el detalle del servicio");
            }

            this._servicio = data;
            this._edicion = null;
            this.renderDetalle(data);

        } catch (error) {
            this.renderError(error.message);
        }
    }

    // ---------- helpers ----------

    esc(texto) {
        return String(texto ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    money(valor) {
        const numero = Number(valor ?? 0);
        return `$${numero.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }

    formatearFecha(fecha, conHora = false) {
        if (!fecha) return "-";

        // "YYYY-MM-DD" (columnas DATE) se arma a mano para evitar el desfase por UTC;
        // con hora (fecha_inicio, DATETIME) new Date la interpreta bien.
        const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(fecha);

        const d = soloFecha
            ? new Date(...fecha.split("-").map((v, i) => i === 1 ? Number(v) - 1 : Number(v)))
            : new Date(fecha);

        const opciones = { day: "2-digit", month: "short", year: "numeric" };
        if (conHora && !soloFecha) {
            opciones.hour = "2-digit";
            opciones.minute = "2-digit";
        }

        return d.toLocaleString("es-AR", opciones);
    }

    etiquetaEstado(nombre) {
        const e = (nombre || "").toLowerCase();
        if (e === "cerrada") return "Completado";
        if (e === "cancelada") return "Cancelado";
        return "Pendiente";
    }

    colorEstado(nombre) {
        const e = (nombre || "").toLowerCase();
        if (e === "cerrada") return "#4ADE80";
        if (e === "cancelada") return "#F87171";
        return "#FBBF24";
    }

    // todos los subrubros usan el mismo color
    colorSubrubro() {
        return "#37A4FF";
    }

    colorCategoria(nombre) {
        const colores = {
            "Químico": "#4ADE80",
            "Repuesto": "#FB923C",
            "Accesorios de Instalación": "#C084FC"
        };
        return colores[nombre] || "#B8D7FF";
    }

    // Misma pildora que el detalle de venta: texto en el color y fondo del mismo color al 22 %.
    // El color tiene que ser hexadecimal de 6 digitos ("38" al final equivale a ese 22 %).
    pildora(texto, color) {
        return `<span class="pildora" style="color:${color};background:${color}38">${this.esc(texto)}</span>`;
    }

    htmlEtiquetasProducto(categoria, marca) {
        const etiquetas = [
            categoria ? this.pildora(categoria, this.colorCategoria(categoria)) : "",
            marca ? `<span class="pildora pildora-gris">${this.esc(marca)}</span>` : ""
        ].join("");

        return etiquetas ? `<div class="etiquetas">${etiquetas}</div>` : "";
    }

    nombreCliente(c) {
        if (!c) return "-";
        return c.nombre ? `${c.nombre} ${c.apellido || ""}`.trim() : (c.razonSocial || "-");
    }

    iniciales(nombre) {
        const partes = nombre.trim().split(" ");
        return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase();
    }

    capitalizar(texto) {
        return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
    }

    // GET /imagenes/servicios/{nombreArchivo} (ImagenServicioControlador)
    urlImagen(nombreArchivo) {
        return `${this.prefijo()}imagenes/servicios/${encodeURIComponent(nombreArchivo)}`;
    }

    notificar(mensaje, tipo) {
        document.dispatchEvent(new CustomEvent("mostrar-notificacion", {
            detail: { mensaje, tipo }
        }));
    }

    // ---------- estados del contenido ----------

    renderCargando() {
        this.shadowRoot.querySelector(".contenido").innerHTML =
            `<p class="mensaje">Cargando…</p>`;
    }

    renderError(mensaje) {
        this.shadowRoot.querySelector(".contenido").innerHTML =
            `<p class="mensaje error">${this.esc(mensaje)}</p>`;
    }

    // ---------- detalle (solo lectura) ----------

    renderDetalle(s) {
        const esTecnico = this.tipo === "tecnico";
        const estadoNombre = s.estadoVenta?.nombre;
        const subrubro = esTecnico ? (s.subrubroServicio?.nombre || "") : "";
        const cancelado = (estadoNombre || "").toLowerCase() === "cancelada";
        const pendiente = (estadoNombre || "").toLowerCase() === "pendiente";

        const datos = [
            ["Estado", this.pildora(this.etiquetaEstado(estadoNombre), this.colorEstado(estadoNombre))],
            esTecnico && subrubro
                ? ["Subrubro", this.pildora(subrubro, this.colorSubrubro())]
                : null,
            ["Fecha creación", this.formatearFecha(s.fechaInicio, true)],
            esTecnico ? ["Entrega estimada", this.formatearFecha(s.fechaEntrega)] : null,
            ["Cierre", this.formatearFecha(s.fechaCierre)],
            this.datoPago(esTecnico, s)
        ].filter(Boolean);

        const recomendacion = s.diagnostico
            ? `<p class="texto">${this.esc(s.diagnostico)}</p>`
            : `<p class="texto vacio">Todavía no se cargó una recomendación.</p>`;

        const imagenes = s.imagenesEvidencia || [];
        const evidencia = imagenes.length > 0
            ? `<section>
                    <h3>Evidencia</h3>
                    <div class="galeria">
                        ${imagenes.map(archivo => `
                            <a class="galeria-item" href="${this.esc(this.urlImagen(archivo))}" target="_blank" rel="noopener">
                                <img src="${this.esc(this.urlImagen(archivo))}" alt="Evidencia del servicio">
                            </a>
                        `).join("")}
                    </div>
               </section>`
            : "";

        this.shadowRoot.querySelector(".contenido").innerHTML = `
            <dl class="datos">
                ${datos.map(([etiqueta, valor]) => `
                    <div><dt>${etiqueta}</dt><dd>${valor}</dd></div>
                `).join("")}
            </dl>

            <section>
                <h3>Cliente</h3>
                ${this.htmlCliente(s.cliente)}
            </section>

            <section>
                <h3>${esTecnico ? "Problema" : "Consulta"}</h3>
                <div class="caja"><p class="texto">${this.esc(s.problema || "-")}</p></div>
            </section>

            <section>
                <h3>Recomendación brindada</h3>
                <div class="caja">${recomendacion}</div>
            </section>

            ${evidencia}
            ${esTecnico ? this.htmlRepuestos(s) : ""}
            ${esTecnico ? this.htmlTotalesTecnico(s) : this.htmlTotalAsesoramiento(s)}

            ${!cancelado ? this.htmlAcciones(pendiente) : ""}
        `;

        this.reemplazarImagenesRotas();

        this.shadowRoot.querySelector("#btnEditar")?.addEventListener("click", () => this.iniciarEdicion());
        this.shadowRoot.querySelector("#btnCancelarServicio")?.addEventListener("click", (e) => this.cancelarServicio(e.currentTarget));
        this.shadowRoot.querySelector("#btnCompletarServicio")?.addEventListener("click", (e) => this.completarServicio(e.currentTarget));
    }

    reemplazarImagenesRotas() {
        this.shadowRoot.querySelectorAll(".galeria-item img").forEach(img => {
            img.addEventListener("error", () => {
                img.replaceWith(Object.assign(document.createElement("span"), {
                    className: "imagen-rota",
                    textContent: "No disponible"
                }));
            });
        });
    }

    datoPago(esTecnico, s) {
        if (esTecnico) {
            return ["Método de pago", this.esc(this.capitalizar(s.metodoPago?.nombre) || "-")];
        }
        if (!s.cobrado) {
            return ["Cobro", "Sin cobro"];
        }
        return ["Cobro", `Cobrado${s.metodoPago?.nombre ? ` con ${this.esc(s.metodoPago.nombre)}` : ""}`];
    }

    htmlCliente(c) {
        if (!c) return `<div class="caja"><p class="texto vacio">Sin datos del cliente.</p></div>`;

        const nombre = this.nombreCliente(c);
        const esEmpresa = !c.nombre;

        const documento = c.cuil ? `CUIL: ${c.cuil}` : (c.cuit ? `CUIT: ${c.cuit}` : "");
        const contacto = [c.email, c.telefono, documento].filter(Boolean).join(" · ");
        const direccion = [c.calleYnumero, c.localidad?.nombre].filter(Boolean).join(", ");

        return `
            <div class="cliente-card">
                <span class="avatar ${esEmpresa ? "avatar-empresa" : "avatar-particular"}">${this.esc(this.iniciales(nombre))}</span>
                <div class="cliente-info">
                    <strong>${this.esc(nombre)}</strong>
                    ${contacto ? `<span class="cliente-linea">${this.esc(contacto)}</span>` : ""}
                    ${direccion ? `<span class="cliente-linea">${this.esc(direccion)}</span>` : ""}
                </div>
                <span class="pildora pildora-gris">${esEmpresa ? "Empresa" : "Particular"}</span>
            </div>
        `;
    }

    htmlRepuestos(s) {
        const detalles = s.detallesVenta || [];

        if (detalles.length === 0) {
            return `
                <section>
                    <h3>Repuestos</h3>
                    <div class="caja"><p class="texto vacio">Sin repuestos, solo mano de obra.</p></div>
                </section>
            `;
        }

        const filas = detalles.map(d => {
            const p = d.producto || {};
            const subtotal = Number(d.precioUnitario || 0) * Number(d.cantidad || 0);

            return `
                <tr>
                    <td>
                        <div class="prod-nombre">${this.esc(p.nombre || `Producto #${p.id ?? "?"}`)}</div>
                        ${this.htmlEtiquetasProducto(p.categoriaProducto?.nombre, p.marcaProducto?.nombre)}
                    </td>
                    <td class="der">${this.money(d.precioUnitario)}</td>
                    <td class="centro">${this.esc(d.cantidad)}</td>
                    <td class="der">${this.money(subtotal)}</td>
                </tr>
            `;
        }).join("");

        return `
            <section>
                <h3>Repuestos</h3>
                <div class="tabla-card">
                    <table class="tabla-repuestos">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th class="der col-precio">Precio unit.</th>
                                <th class="centro col-cant">Cant.</th>
                                <th class="der col-subtotal">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>${filas}</tbody>
                    </table>
                </div>
            </section>
        `;
    }

    htmlFilasTotales(repuestos, manoObra, porcentaje, total, etiquetaTotal) {
        const descuento = (repuestos + manoObra) * porcentaje / 100;

        return `
            <div class="fila-total"><span>Repuestos</span><span>${this.money(repuestos)}</span></div>
            <div class="fila-total"><span>Mano de obra</span><span>${this.money(manoObra)}</span></div>
            ${porcentaje > 0 ? `
                <div class="fila-total"><span>Descuento global (${porcentaje}%)</span><span>-${this.money(descuento)}</span></div>
            ` : ""}
            <div class="fila-total total-final"><span>${etiquetaTotal}</span><span>${this.money(total)}</span></div>
        `;
    }

    htmlTotalesTecnico(s) {
        const repuestos = (s.detallesVenta || []).reduce(
            (acc, d) => acc + Number(d.precioUnitario || 0) * Number(d.cantidad || 0), 0
        );
        const manoObra = Number(s.manoObra || 0);
        const porcentaje = Number(s.descuentoGlobal || 0);
        const subtotal = repuestos + manoObra;
        const total = s.total != null ? s.total : subtotal - subtotal * porcentaje / 100;

        return `
            <section>
                <div class="tarjeta-totales">
                    ${this.htmlFilasTotales(repuestos, manoObra, porcentaje, total, "Total")}
                </div>
            </section>
        `;
    }

    htmlTotalAsesoramiento(s) {
        if (!s.cobrado) {
            return `
                <section>
                    <div class="tarjeta-totales">
                        <div class="fila-total"><span>Este asesoramiento no se cobró</span></div>
                    </div>
                </section>
            `;
        }

        return `
            <section>
                <div class="tarjeta-totales">
                    <div class="fila-total total-final"><span>Monto cobrado</span><span>${this.money(s.monto)}</span></div>
                </div>
            </section>
        `;
    }

    htmlAcciones(pendiente) {
        return `
            <div class="pie-acciones" id="acciones">
                <button type="button" class="btn btn-peligro" id="btnCancelarServicio">✕ Cancelar servicio</button>
                ${pendiente ? `<button type="button" class="btn btn-completar" id="btnCompletarServicio">✓ Completar</button>` : ""}
                <button type="button" class="btn btn-primario" id="btnEditar">✎ Editar</button>
            </div>
        `;
    }

    // los mensajes de error y de aviso salen en el toast global
    mostrarErrorAcciones(mensaje) {
        this.notificar(mensaje, "error");
    }

    // ---------- cancelar servicio ----------

    async cancelarServicio(boton) {
        const esTecnico = this.tipo === "tecnico";

        boton.disabled = true;
        boton.textContent = "Cancelando…";

        try {
            const respuesta = await fetch(`${this.prefijo()}servicios/${this.carpetaServicio()}/${this.servicioId}`, {
                method: "DELETE"
            });
            const data = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(data.error || "No se pudo cancelar el servicio");
            }

            this.notificar(esTecnico ? "Servicio cancelado correctamente" : "Asesoramiento cancelado correctamente", "exito");
            document.dispatchEvent(new CustomEvent("servicio-guardado", { bubbles: true, composed: true }));
            await this.cargar();

        } catch (error) {
            this.renderDetalle(this._servicio);
            this.mostrarErrorAcciones(error.message);
        }
    }
    
    async completarServicio(boton) {
        const esTecnico = this.tipo === "tecnico";

        boton.disabled = true;
        boton.textContent = "Completando…";

        try {
            const respuesta = await fetch(`${this.prefijo()}servicios/${this.carpetaServicio()}/${this.servicioId}/cerrar`, {
                method: "POST"
            });
            const data = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(data.error || "No se pudo completar el servicio");
            }

            this.notificar(esTecnico ? "Servicio completado correctamente" : "Asesoramiento completado correctamente", "exito");
            document.dispatchEvent(new CustomEvent("servicio-guardado", { bubbles: true, composed: true }));
            await this.cargar();

        } catch (error) {
            this.renderDetalle(this._servicio);
            this.mostrarErrorAcciones(error.message);
        }
    }

    // ---------- edición ----------

    clienteDesdeServicio(c) {
        return {
            id: c.id,
            nombreCompleto: this.nombreCliente(c),
            cuitCuil: c.cuil || c.cuit || "",
            email: c.email || "",
            esEmpresa: !c.nombre
        };
    }

    clienteDesdeLista(c) {
        return {
            id: c.id,
            nombreCompleto: c.nombreCompleto,
            cuitCuil: c.cuitCuil || "",
            email: c.email || "",
            esEmpresa: c.tipo === "Empresa"
        };
    }

    async iniciarEdicion() {
        const s = this._servicio;
        const esTecnico = this.tipo === "tecnico";
        this.renderCargando();

        try {
            const [clientes, productos, metodosPago] = await Promise.all([
                fetch(`${this.prefijo()}clientes`).then(r => r.json()),
                esTecnico
                    ? fetch(`${this.prefijo()}productos`).then(r => r.json())
                    : Promise.resolve([]),
                esTecnico
                    ? Promise.resolve([])
                    : fetch(`${this.prefijo()}metodos-pago`).then(r => r.json())
            ]);
            this._clientes = clientes.filter(c => c.activo);
            this._productos = productos.filter(p => p.activo);
            this._metodosPago = metodosPago;

        } catch (error) {
            this.renderDetalle(s);
            this.mostrarErrorAcciones("No se pudieron cargar los datos para editar");
            return;
        }

        // cantidad que cada producto ya tiene en este servicio (ese stock ya fue descontado)
        this._cantidadOriginal = {};
        (s.detallesVenta || []).forEach(d => {
            const id = d.producto?.id;
            this._cantidadOriginal[id] = (this._cantidadOriginal[id] || 0) + Number(d.cantidad || 0);
        });

        this._edicion = {
            cliente: this.clienteDesdeServicio(s.cliente),
            cambiandoCliente: false,
            problema: s.problema || "",
            diagnostico: s.diagnostico || "",
            cobro: {
                cobrado: !!s.cobrado,
                monto: s.monto ?? "",
                metodoPagoId: s.metodoPago?.id ?? ""
            },
            // archivo: nombre guardado en el servidor; file/preview: imagen nueva que todavia no se subio
            imagenes: (s.imagenesEvidencia || []).map(archivo => ({
                archivo, file: null, preview: null, archivoSubido: null
            })),
            agregandoProducto: false,
            carrito: (s.detallesVenta || []).map(d => ({
                detalleId: d.id,
                productoId: d.producto.id,
                nombre: d.producto.nombre,
                categoria: d.producto.categoriaProducto?.nombre || "",
                marca: d.producto.marcaProducto?.nombre || "",
                precioUnitario: Number(d.precioUnitario || 0),
                cantidad: Number(d.cantidad || 0),
                stockMax: d.producto.activo === false
                    ? this._cantidadOriginal[d.producto.id]
                    : Number(d.producto.stock || 0) + this._cantidadOriginal[d.producto.id]
            }))
        };

        this.renderEdicion();
    }

    renderEdicion() {
        const ed = this._edicion;
        const esTecnico = this.tipo === "tecnico";

        this.shadowRoot.querySelector(".contenido").innerHTML = `
            <section class="sin-margen">
                <h3>Cliente</h3>
                <div id="areaCliente"></div>
            </section>

            <section>
                <h3>${esTecnico ? "Problema" : "Consulta"}</h3>
                <textarea id="editProblema" rows="3">${this.esc(ed.problema)}</textarea>
            </section>

            <section>
                <h3>Recomendación brindada</h3>
                <textarea id="editDiagnostico" rows="3" placeholder="¿Qué se encontró y cómo se resolvió?">${this.esc(ed.diagnostico)}</textarea>
            </section>

            <section>
                <h3>Evidencia</h3>
                <div id="areaEvidencia"></div>
            </section>
        
            ${!esTecnico ? `
                <section>
                    <h3>Cobro</h3>
                    <div id="areaCobro"></div>
                </section>
            ` : ""}

            ${esTecnico ? `
                <section>
                    <h3>Repuestos</h3>
                    <div id="areaRepuestos"></div>
                </section>

                <section>
                    <div class="tarjeta-totales" id="resumenEdicion"></div>
                </section>
            ` : ""}

            <div class="pie-acciones">
                <button type="button" class="btn btn-secundario" id="btnDescartar">Descartar cambios</button>
                <button type="button" class="btn btn-primario" id="btnGuardar">Guardar cambios</button>
            </div>
        `;

        this.renderAreaCliente();
        this.renderAreaEvidencia();

        if (esTecnico) {
            this.renderAreaRepuestos();
            this.renderResumenEdicion();
        } else {
            this.renderAreaCobro();
        }

        this.shadowRoot.querySelector("#btnDescartar").addEventListener("click", () => {
            this.liberarPreviews();
            this._edicion = null;
            this.renderDetalle(this._servicio);
        });

        this.shadowRoot.querySelector("#btnGuardar").addEventListener("click", () => this.guardarEdicion());
    }

    // los mensajes de error y de aviso salen en el toast global
    mostrarErrorEdicion(mensaje) {
        this.notificar(mensaje, "error");
    }

    // ----- cliente -----

    renderAreaCliente() {
        const area = this.shadowRoot.querySelector("#areaCliente");
        const ed = this._edicion;
        const c = ed.cliente;

        if (!ed.cambiandoCliente) {
            area.innerHTML = `
                <div class="cliente-card">
                    <span class="avatar ${c.esEmpresa ? "avatar-empresa" : "avatar-particular"}">${this.esc(this.iniciales(c.nombreCompleto))}</span>
                    <div class="cliente-info">
                        <strong>${this.esc(c.nombreCompleto)}</strong>
                        <span class="cliente-linea">${this.esc([c.email, c.cuitCuil].filter(Boolean).join(" · "))}</span>
                    </div>
                    <button type="button" class="btn btn-secundario" id="btnCambiarCliente">Cambiar</button>
                </div>
            `;

            area.querySelector("#btnCambiarCliente").addEventListener("click", () => {
                ed.cambiandoCliente = true;
                this.renderAreaCliente();
            });
            return;
        }

        area.innerHTML = `
            <input type="text" id="buscarCliente" placeholder="Nombre, CUIL o CUIT del cliente..." autocomplete="off">
            <div class="resultados" id="resultadosCliente"></div>
            <button type="button" class="btn btn-secundario" id="btnMantenerCliente">Mantener el cliente actual</button>
        `;

        const input = area.querySelector("#buscarCliente");
        const resultados = area.querySelector("#resultadosCliente");
        input.focus();

        input.addEventListener("input", () => {
            const busqueda = input.value.trim().toLowerCase();

            if (!busqueda) {
                resultados.innerHTML = "";
                return;
            }

            const coincidencias = this._clientes.filter(cl =>
                (cl.nombreCompleto || "").toLowerCase().includes(busqueda) ||
                (cl.cuitCuil || "").toLowerCase().includes(busqueda)
            ).slice(0, 8);

            resultados.innerHTML = coincidencias.map(cl => `
                <div class="item-resultado" data-id="${this.esc(cl.id)}">
                    <div>
                        <div class="prod-nombre">${this.esc(cl.nombreCompleto)}</div>
                        <div class="prod-detalle">${this.esc([cl.cuitCuil, cl.email].filter(Boolean).join(", "))}</div>
                    </div>
                </div>
            `).join("") || `<p class="texto vacio sin-resultados">Sin coincidencias</p>`;

            resultados.querySelectorAll(".item-resultado").forEach(el => {
                el.addEventListener("click", () => {
                    const elegido = this._clientes.find(cl => String(cl.id) === el.dataset.id);
                    ed.cliente = this.clienteDesdeLista(elegido);
                    ed.cambiandoCliente = false;
                    this.renderAreaCliente();
                });
            });
        });

        area.querySelector("#btnMantenerCliente").addEventListener("click", () => {
            ed.cambiandoCliente = false;
            this.renderAreaCliente();
        });
    }

    // ----- evidencia (hasta 5 imágenes) -----

    renderAreaEvidencia() {
        const area = this.shadowRoot.querySelector("#areaEvidencia");
        const ed = this._edicion;
        const cantidad = ed.imagenes.length;
        const puedeAgregar = cantidad < this.maxImagenes;

        area.innerHTML = `
            ${cantidad > 0 ? `
                <div class="galeria">
                    ${ed.imagenes.map((imagen, i) => `
                        <div class="galeria-item">
                            <img src="${this.esc(imagen.file ? imagen.preview : this.urlImagen(imagen.archivo))}" alt="Evidencia ${i + 1}">
                            <button type="button" class="btn-x" data-index="${i}" aria-label="Quitar imagen" title="Quitar imagen">&times;</button>
                        </div>
                    `).join("")}
                </div>
            ` : `<p class="texto vacio">Sin imágenes.</p>`}

            <div class="acciones-botones izquierda">
                ${puedeAgregar ? `
                    <label class="btn btn-secundario" for="archivoEdicion">Agregar imágenes</label>
                    <input type="file" id="archivoEdicion" accept="${this.tiposImagen.join(",")}" multiple hidden>
                ` : ""}
                <span class="contador-imagenes">${cantidad} de ${this.maxImagenes}</span>
            </div>
        `;

        this.reemplazarImagenesRotas();

        area.querySelector("#archivoEdicion")?.addEventListener("change", (e) => {
            this.agregarArchivos(Array.from(e.target.files));
        });

        area.querySelectorAll(".btn-x").forEach(btn => {
            btn.addEventListener("click", () => {
                const [quitada] = ed.imagenes.splice(Number(btn.dataset.index), 1);
                if (quitada.preview) URL.revokeObjectURL(quitada.preview);
                this.renderAreaEvidencia();
            });
        });
    }

    agregarArchivos(archivos) {
        const ed = this._edicion;

        for (const archivo of archivos) {
            if (!this.tiposImagen.includes(archivo.type)) {
                this.notificar(`"${archivo.name}" no es un formato válido (JPG, PNG, GIF o WEBP)`, "error");
                continue;
            }
            if (archivo.size > 10 * 1024 * 1024) {
                this.notificar(`"${archivo.name}" pesa más de 10 MB`, "error");
                continue;
            }
            if (ed.imagenes.length >= this.maxImagenes) {
                this.notificar(`Se pueden adjuntar hasta ${this.maxImagenes} imágenes por servicio`, "advertencia");
                break;
            }

            ed.imagenes.push({
                archivo: null,
                file: archivo,
                preview: URL.createObjectURL(archivo),
                archivoSubido: null
            });
        }

        this.renderAreaEvidencia();
    }

    liberarPreviews() {
        (this._edicion?.imagenes || []).forEach(imagen => {
            if (imagen.preview) URL.revokeObjectURL(imagen.preview);
        });
    }
    
    // ----- cobro (solo asesoramiento) -----

    renderAreaCobro() {
        const area = this.shadowRoot.querySelector("#areaCobro");
        const cobro = this._edicion.cobro;

        area.innerHTML = `
            <div class="opciones-cobro">
                <button type="button" class="btn-opcion ${!cobro.cobrado ? "seleccionado" : ""}" data-cobrado="no">Sin cobro</button>
                <button type="button" class="btn-opcion ${cobro.cobrado ? "seleccionado" : ""}" data-cobrado="si">Cobrado</button>
            </div>

            ${cobro.cobrado ? `
                <div class="fila-cobro">
                    <div>
                        <label class="campo" for="editMonto">Monto cobrado ($)</label>
                        <input type="number" id="editMonto" min="0" step="any" value="${this.esc(cobro.monto)}">
                    </div>
                    <div>
                        <label class="campo" for="editMetodoPago">Método de pago</label>
                        <select id="editMetodoPago">
                            <option value="">Elegí un método</option>
                            ${this._metodosPago.map(m => `
                                <option value="${this.esc(m.id)}" ${String(m.id) === String(cobro.metodoPagoId) ? "selected" : ""}>
                                    ${this.esc(this.capitalizar(m.nombre))}
                                </option>
                            `).join("")}
                        </select>
                    </div>
                </div>
            ` : ""}
        `;

        area.querySelectorAll(".btn-opcion").forEach(btn => {
            btn.addEventListener("click", () => {
                cobro.cobrado = btn.dataset.cobrado === "si";
                this.renderAreaCobro();
            });
        });

        area.querySelector("#editMonto")?.addEventListener("input", (e) => {
            cobro.monto = e.target.value;
        });

        area.querySelector("#editMetodoPago")?.addEventListener("change", (e) => {
            cobro.metodoPagoId = e.target.value;
        });
    }

    // ----- repuestos (solo servicio técnico) -----

    actualizarRepuestos() {
        this.renderAreaRepuestos();
        this.renderResumenEdicion();
    }

    renderAreaRepuestos() {
        const area = this.shadowRoot.querySelector("#areaRepuestos");
        const ed = this._edicion;

        const tabla = ed.carrito.length === 0
            ? `<div class="caja"><p class="texto vacio">Sin repuestos, solo mano de obra.</p></div>`
            : `
                <div class="tabla-card">
                    <table class="tabla-repuestos">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th class="centro col-cantidad">Cant.</th>
                                <th class="der col-subtotal">Subtotal</th>
                                <th class="col-quitar"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ed.carrito.map((item, i) => `
                                <tr>
                                    <td>
                                        <div class="prod-nombre">${this.esc(item.nombre)}</div>
                                        ${this.htmlEtiquetasProducto(item.categoria, item.marca)}
                                    </td>
                                    <td>
                                        <div class="cantidad">
                                            <button type="button" class="btn-cant" data-accion="restar" data-index="${i}">-</button>
                                            <span>${item.cantidad}</span>
                                            <button type="button" class="btn-cant" data-accion="sumar" data-index="${i}">+</button>
                                        </div>
                                    </td>
                                    <td class="der">${this.money(item.precioUnitario * item.cantidad)}</td>
                                    <td class="der">
                                        <button type="button" class="btn-quitar" data-index="${i}" aria-label="Quitar repuesto">&times;</button>
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            `;

        area.innerHTML = `
            ${tabla}
            ${ed.agregandoProducto ? `
                <div class="buscador-producto">
                    <input type="text" id="buscarProducto" placeholder="Nombre o marca del producto..." autocomplete="off">
                    <div class="resultados" id="resultadosProducto"></div>
                    <button type="button" class="btn btn-secundario" id="btnCerrarBusqueda">Cerrar búsqueda</button>
                </div>
            ` : `
                <button type="button" class="btn btn-secundario btn-bloque" id="btnAgregarProducto">+ Agregar producto</button>
            `}
        `;

        area.querySelectorAll(".btn-cant").forEach(btn => {
            btn.addEventListener("click", () => {
                this.cambiarCantidad(Number(btn.dataset.index), btn.dataset.accion === "sumar" ? 1 : -1);
            });
        });

        area.querySelectorAll(".btn-quitar").forEach(btn => {
            btn.addEventListener("click", () => {
                ed.carrito.splice(Number(btn.dataset.index), 1);
                this.actualizarRepuestos();
            });
        });

        area.querySelector("#btnAgregarProducto")?.addEventListener("click", () => {
            ed.agregandoProducto = true;
            this.renderAreaRepuestos();
            this.shadowRoot.querySelector("#buscarProducto").focus();
        });

        if (ed.agregandoProducto) {
            const input = area.querySelector("#buscarProducto");
            this.renderResultadosProducto("");

            input.addEventListener("input", () => this.renderResultadosProducto(input.value));

            area.querySelector("#btnCerrarBusqueda").addEventListener("click", () => {
                ed.agregandoProducto = false;
                this.renderAreaRepuestos();
            });
        }
    }

    renderResultadosProducto(texto) {
        const lista = this.shadowRoot.querySelector("#resultadosProducto");
        const busqueda = texto.trim().toLowerCase();

        if (!busqueda) {
            lista.innerHTML = `<p class="texto vacio sin-resultados">Escribí el nombre o la marca del producto</p>`;
            return;
        }

        const coincidencias = this._productos.filter(p =>
            (p.nombre || "").toLowerCase().includes(busqueda) ||
            (p.marcaProducto?.nombre || "").toLowerCase().includes(busqueda)
        ).slice(0, 25);

        lista.innerHTML = coincidencias.map(p => {
            const contenido = [p.contenido, p.unidadMedida?.abreviatura]
                .filter(v => v != null && v !== "").join(" ");

            return `
                <div class="item-resultado" data-id="${this.esc(p.id)}">
                    <div>
                        <div class="prod-nombre">${this.esc(p.nombre)}</div>
                        <div class="prod-detalle">${this.esc([p.marcaProducto?.nombre, contenido].filter(Boolean).join(", "))}</div>
                    </div>
                    <div class="item-der">
                        <div>${this.money(p.precioActual)}</div>
                        <div class="prod-detalle">Stock ${this.esc(p.stock)}</div>
                    </div>
                </div>
            `;
        }).join("") || `<p class="texto vacio sin-resultados">No se encontraron productos</p>`;

        lista.querySelectorAll(".item-resultado").forEach(el => {
            el.addEventListener("click", () => {
                const producto = this._productos.find(p => String(p.id) === el.dataset.id);
                this.agregarProducto(producto);
            });
        });
    }

    agregarProducto(producto) {
        const ed = this._edicion;
        const existente = ed.carrito.find(i => i.productoId === producto.id);

        if (existente) {
            if (existente.cantidad >= existente.stockMax) {
                this.notificar(`No hay más stock disponible de ${producto.nombre}`, "advertencia");
                return;
            }
            existente.cantidad++;

        } else {
            // si el producto ya estaba en el servicio, ese stock ya fue descontado y vuelve a estar disponible
            const disponible = Number(producto.stock || 0) + (this._cantidadOriginal[producto.id] || 0);

            if (disponible <= 0) {
                this.notificar(`No hay stock disponible de ${producto.nombre}`, "advertencia");
                return;
            }

            ed.carrito.push({
                detalleId: null,
                productoId: producto.id,
                nombre: producto.nombre,
                categoria: producto.categoriaProducto?.nombre || "",
                marca: producto.marcaProducto?.nombre || "",
                precioUnitario: Number(producto.precioActual || 0),
                cantidad: 1,
                stockMax: disponible
            });
        }

        ed.agregandoProducto = false;
        this.actualizarRepuestos();
    }

    cambiarCantidad(indice, delta) {
        const item = this._edicion.carrito[indice];
        const nueva = item.cantidad + delta;

        if (nueva < 1) return;

        if (nueva > item.stockMax) {
            this.notificar(`No hay más stock disponible de ${item.nombre}`, "advertencia");
            return;
        }

        item.cantidad = nueva;
        this.actualizarRepuestos();
    }

    renderResumenEdicion() {
        const s = this._servicio;
        const repuestos = this._edicion.carrito.reduce(
            (acc, i) => acc + i.precioUnitario * i.cantidad, 0
        );
        const manoObra = Number(s.manoObra || 0);
        const porcentaje = Number(s.descuentoGlobal || 0);
        const subtotal = repuestos + manoObra;
        const total = subtotal - subtotal * porcentaje / 100;

        this.shadowRoot.querySelector("#resumenEdicion").innerHTML =
            this.htmlFilasTotales(repuestos, manoObra, porcentaje, total, "Total estimado");
    }

    // ----- guardar -----

    async subirImagen(archivo) {
        const formData = new FormData();
        formData.append("archivo", archivo);

        const respuesta = await fetch(`${this.prefijo()}imagenes/servicios`, {
            method: "POST",
            body: formData
        });
        const data = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(data.error || "No se pudo subir la imagen");
        }

        return data.archivo;
    }

    async guardarEdicion() {
        if (this._guardando) return;

        const ed = this._edicion;
        const s = this._servicio;
        const esTecnico = this.tipo === "tecnico";
        const boton = this.shadowRoot.querySelector("#btnGuardar");

        const problema = this.shadowRoot.querySelector("#editProblema").value.trim();
        const diagnostico = this.shadowRoot.querySelector("#editDiagnostico").value.trim();

        if (!problema) {
            this.mostrarErrorEdicion(esTecnico ? "Describí el problema del servicio" : "Indicá el motivo de la consulta");
            return;
        }
        
        if (!esTecnico && ed.cobro.cobrado) {
            if (!(Number(ed.cobro.monto) > 0)) {
                this.mostrarErrorEdicion("Indicá un monto mayor a cero para el cobro");
                return;
            }
            if (!ed.cobro.metodoPagoId) {
                this.mostrarErrorEdicion("Elegí el método de pago del cobro");
                return;
            }
        }

        this._guardando = true;
        boton.disabled = true;
        boton.textContent = "Guardando…";

        try {
            // sube las imagenes nuevas en orden; las que ya estaban conservan su nombre.
            // Si el guardado falla y se reintenta, no se vuelve a subir lo que ya se subio.
            const imagenesEvidencia = [];
            for (const imagen of ed.imagenes) {
                if (imagen.file && !imagen.archivoSubido) {
                    imagen.archivoSubido = await this.subirImagen(imagen.file);
                }
                imagenesEvidencia.push(imagen.archivoSubido || imagen.archivo);
            }

            // El PUT reemplaza el servicio completo, por eso se reenvían tal cual
            // los datos que esta pantalla no edita (estado, cobro, pago, fechas, etc.).
            const base = {
                id: s.id,
                clienteId: ed.cliente.id,
                estadoVentaId: s.estadoVenta.id,
                fechaInicio: s.fechaInicio,
                fechaCierre: s.fechaCierre,
                problema,
                diagnostico: diagnostico || null,
                imagenesEvidencia
            };

            const body = esTecnico
                ? {
                    ...base,
                    metodoPagoId: s.metodoPago.id,
                    subrubroServicioId: s.subrubroServicio.id,
                    fechaEntrega: s.fechaEntrega,
                    manoObra: s.manoObra,
                    descuentoGlobal: s.descuentoGlobal,
                    detallesVenta: ed.carrito.map(i => ({
                        id: i.detalleId,
                        productoId: i.productoId,
                        cantidad: i.cantidad
                    }))
                }
                : {
                    ...base,
                    cobrado: ed.cobro.cobrado,
                    monto: ed.cobro.cobrado ? Number(ed.cobro.monto) : 0,
                    metodoPagoId: ed.cobro.cobrado ? Number(ed.cobro.metodoPagoId) : null
                };
            const respuesta = await fetch(`${this.prefijo()}servicios/${this.carpetaServicio()}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(data.error || "No se pudieron guardar los cambios");
            }

            this.liberarPreviews();
            this.notificar(esTecnico ? "Servicio actualizado correctamente" : "Asesoramiento actualizado correctamente", "exito");
            document.dispatchEvent(new CustomEvent("servicio-guardado", { bubbles: true, composed: true }));
            await this.cargar();

        } catch (error) {
            this.mostrarErrorEdicion(error.message);
            boton.disabled = false;
            boton.textContent = "Guardar cambios";

        } finally {
            this._guardando = false;
        }
    }

    // ---------- estructura y estilos ----------

    renderShell() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                    color: white;
                }

                .mensaje {
                    padding: 2rem 0;
                    text-align: center;
                    color: rgba(255, 255, 255, .7);
                }

                .mensaje.error {
                    color: #F87171;
                }

                /* ---------- datos principales ---------- */

                .datos {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 1.1rem 1.5rem;
                    margin: 0;
                    padding: 0 0 1.2rem;
                    border-bottom: 1px solid rgba(255, 255, 255, .2);
                }

                .datos dt {
                    margin-bottom: .3rem;
                    font-size: .72rem;
                    font-weight: 600;
                    letter-spacing: .08em;
                    text-transform: uppercase;
                    color: rgba(255, 255, 255, .65);
                }

                .datos dd {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 700;
                }

                /* ---------- secciones ---------- */

                section {
                    margin-top: 1.4rem;
                }

                section.sin-margen {
                    margin-top: 0;
                }

                h3 {
                    margin: 0 0 .6rem;
                    font-size: .85rem;
                    font-weight: 700;
                    letter-spacing: .08em;
                    text-transform: uppercase;
                    color: #B8D7FF;
                }

                .caja {
                    padding: .9rem 1rem;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, .08);
                    border: 1px solid rgba(255,255,255,.25);
                }

                .texto {
                    margin: 0;
                    font-size: .95rem;
                    line-height: 1.5;
                    white-space: pre-wrap;
                    overflow-wrap: anywhere;
                }

                .texto.vacio {
                    color: rgba(255, 255, 255, .55);
                    font-style: italic;
                }

                /* ---------- píldoras ---------- */

                .pildora {
                    display: inline-block;
                    padding: .2rem .8rem;
                    border-radius: 20px;
                    font-size: .85rem;
                    font-weight: 700;
                    white-space: nowrap;
                }

                .pildora-gris {
                    background: rgba(255, 255, 255, .18);
                    color: white;
                }

                .etiquetas {
                    display: flex;
                    flex-wrap: wrap;
                    gap: .35rem;
                    margin-top: .4rem;
                }

                .etiquetas .pildora {
                    padding: .12rem .6rem;
                    font-size: .72rem;
                }

                /* ---------- cliente ---------- */

                .cliente-card {
                    display: flex;
                    align-items: center;
                    gap: .9rem;
                    padding: .9rem 1rem;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, .08);
                    border: 1px solid rgba(255,255,255,.25);
                }

                .cliente-card > .btn,
                .cliente-card > .pildora {
                    flex-shrink: 0;
                    margin-left: auto;
                }

                .cliente-info {
                    min-width: 0;
                }

                .cliente-info strong {
                    display: block;
                    margin-bottom: .1rem;
                    font-size: 1rem;
                }

                .cliente-linea {
                    display: block;
                    font-size: .85rem;
                    color: rgba(255, 255, 255, .7);
                    overflow-wrap: anywhere;
                }

                .avatar {
                    width: 44px;
                    height: 44px;
                    flex-shrink: 0;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    color: white;
                }

                .avatar-particular { background: linear-gradient(160deg, #5FD9E8, #0B5C7A); }
                .avatar-empresa { background: linear-gradient(160deg, #E85FC9, #6A1B6E); }
        
                .opciones-cobro {
                    display: flex;
                    gap: .7rem;
                }

                .btn-opcion {
                    flex: 1;
                    padding: .65rem;
                    border-radius: 8px;
                    border: 2px solid rgba(255, 255, 255, .3);
                    background: rgba(255, 255, 255, .08);
                    color: white;
                    font-family: inherit;
                    font-weight: 700;
                    cursor: pointer;
                }

                .btn-opcion.seleccionado {
                    border-color: #37E0E0;
                    background: rgba(55, 224, 224, .18);
                }

                .fila-cobro {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin-top: .9rem;
                }

                label.campo {
                    display: block;
                    margin-bottom: .3rem;
                    font-size: .72rem;
                    font-weight: 600;
                    letter-spacing: .06em;
                    text-transform: uppercase;
                    color: rgba(255, 255, 255, .65);
                }

                input[type="number"],
                select {
                    width: 100%;
                    box-sizing: border-box;
                    padding: .6rem .8rem;
                    border-radius: 8px;
                    border: 1px solid rgba(196, 196, 196, 1);
                    background: rgba(255, 255, 255, .15);
                    color: white;
                    font-family: inherit;
                    font-size: .95rem;
                }

                select option {
                    color: black;
                }

                /* ---------- galería de evidencia ---------- */

                .galeria {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
                    gap: .9rem;
                    margin-bottom: .2rem;
                }

                .galeria-item {
                    position: relative;
                    display: block;
                }

                .galeria-item img {
                    display: block;
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    object-fit: cover;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, .25);
                }

                .imagen-rota {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                    width: 100%;
                    aspect-ratio: 1 / 1;
                    border-radius: 8px;
                    border: 1px dashed rgba(255, 255, 255, .3);
                    color: rgba(255, 255, 255, .55);
                    font-size: .8rem;
                    font-style: italic;
                    text-align: center;
                }

                .btn-x {
                    position: absolute;
                    top: -.5rem;
                    right: -.5rem;
                    width: 1.7rem;
                    height: 1.7rem;
                    border-radius: 50%;
                    border: 2px solid rgba(5, 68, 141, 1);
                    background: #DC2626;
                    color: white;
                    font-size: 1rem;
                    line-height: 1;
                    cursor: pointer;
                }

                .btn-x:hover {
                    background: #B91C1C;
                }

                .contador-imagenes {
                    font-size: .85rem;
                    color: rgba(255, 255, 255, .7);
                }

                /* ---------- tabla de repuestos ---------- */

                .tabla-card {
                    overflow: hidden;
                    border: 1px solid rgba(101, 181, 232, .55);
                    border-radius: 10px;
                    background: rgba(5, 68, 141, .25);
                }

                .tabla-repuestos {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }

                .tabla-repuestos th {
                    padding: .7rem 1rem;
                    text-align: left;
                    font-size: .72rem;
                    font-weight: 700;
                    letter-spacing: .06em;
                    text-transform: uppercase;
                    color: #B8D7FF;
                    background: rgba(6, 76, 156, .85);
                    border-bottom: 1px solid rgba(101, 181, 232, .45);
                }

                .tabla-repuestos td {
                    padding: .8rem 1rem;
                    vertical-align: middle;
                    font-size: .92rem;
                    border-top: 1px solid rgba(101, 181, 232, .25);
                }

                .tabla-repuestos .centro {
                    text-align: center;
                }

                .tabla-repuestos .der {
                    text-align: right;
                    white-space: nowrap;
                }

                .tabla-repuestos .col-precio { width: 22%; }
                .tabla-repuestos .col-cant { width: 12%; }
                .tabla-repuestos .col-subtotal { width: 22%; }
                .tabla-repuestos .col-cantidad { width: 26%; }
                .tabla-repuestos .col-quitar { width: 8%; }

                .prod-nombre {
                    font-weight: 700;
                    overflow-wrap: anywhere;
                }

                .prod-detalle {
                    font-size: .8rem;
                    color: rgba(255, 255, 255, .6);
                }

                /* ---------- totales ---------- */

                .tarjeta-totales {
                    padding: 1rem 1.2rem;
                    border-radius: 10px;
                    background: rgba(255, 255, 255, .1);
                    border: 1px solid rgba(255,255,255,.25);
                }

                .fila-total {
                    display: flex;
                    justify-content: space-between;
                    padding: .3rem 0;
                    font-size: .95rem;
                }

                .total-final {
                    margin-top: .4rem;
                    padding-top: .7rem;
                    border-top: 1px solid rgba(255, 255, 255, .3);
                    font-size: 1.2rem;
                    font-weight: 700;
                }

                .tarjeta-totales .total-final:first-child {
                    margin-top: 0;
                    padding-top: 0;
                    border-top: none;
                }

                /* ---------- botones ---------- */

                .pie-acciones {
                    display: flex;
                    justify-content: flex-end;
                    gap: .7rem;
                    margin-top: 1.6rem;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255, 255, 255, .25);
                }

                .acciones-botones {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: .6rem;
                    margin-top: .6rem;
                }

                .acciones-botones.izquierda {
                    justify-content: flex-start;
                }

                .btn {
                    display: inline-block;
                    padding: .65rem 1.3rem;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, .25);
                    background: transparent;
                    color: white;
                    font-family: inherit;
                    font-size: .9rem;
                    font-weight: 700;
                    cursor: pointer;
                    
                }

                .btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, .12);
                }

                .btn:disabled {
                    opacity: .5;
                    cursor: default;
                }

                .btn-primario {
                    border: none;
                    background: #37E0E0;
                    color: #05448D;
                }

                .btn-primario:hover:not(:disabled) {
                    background: rgba(55, 224, 224, .85);
                }

                .btn-peligro {
                    background: #A52A3A;
                    color: white;
                }

                .btn-peligro:hover:not(:disabled) {
                    background: #8F2331;
                }
        
                .btn-completar {
                    border: none;
                    background: #1F9D55;
                    color: white;
                }

                .btn-completar:hover:not(:disabled) {
                    background: #198347;
                }

                .btn-bloque {
                    width: 100%;
                    margin-top: .8rem;
                }

                /* ---------- formulario de edición ---------- */

                textarea,
                input[type="text"] {
                    width: 100%;
                    box-sizing: border-box;
                    padding: .6rem .8rem;
                    border-radius: 8px;
                    border: 1px solid rgba(196, 196, 196, 1);
                    background: rgba(255, 255, 255, .15);
                    color: white;
                    font-family: inherit;
                    font-size: .95rem;
                }

                textarea {
                    resize: vertical;
                }

                textarea::placeholder,
                input::placeholder {
                    color: rgba(255, 255, 255, .6);
                }

                .resultados {
                    max-height: 220px;
                    overflow-y: auto;
                    margin: .5rem 0;
                    border-radius: 8px;
                }

                .resultados:empty {
                    display: none;
                }

                .item-resultado {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                    padding: .6rem .8rem;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255, 255, 255, .1);
                    background: rgba(1, 49, 104, .6);
                }

                .item-resultado:hover {
                    background: rgba(1, 49, 104, 1);
                }

                .item-der {
                    text-align: right;
                    white-space: nowrap;
                }

                .sin-resultados {
                    padding: .8rem;
                    text-align: center;
                }

                .buscador-producto {
                    margin-top: .8rem;
                }

                .cantidad {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: .5rem;
                }

                .btn-cant {
                    width: 1.7rem;
                    height: 1.7rem;
                    border-radius: 5px;
                    border: 1px solid rgba(255, 255, 255, .3);
                    background: rgba(255, 255, 255, .08);
                    color: white;
                    cursor: pointer;
                    font-size: .9rem;
                }

                .btn-cant:hover {
                    background: rgba(255, 255, 255, .18);
                }

                .cantidad span {
                    min-width: 1.2rem;
                    text-align: center;
                    font-weight: 600;
                }

                .btn-quitar {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, .6);
                    font-size: 1.3rem;
                    line-height: 1;
                    cursor: pointer;
                }

                .btn-quitar:hover {
                    color: #F87171;
                }
            </style>

            <div class="contenido"></div>
        `;
    }
}

customElements.define("detalle-servicio", DetalleServicio);