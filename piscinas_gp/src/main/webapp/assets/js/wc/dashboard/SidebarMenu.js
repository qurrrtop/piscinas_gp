class SidebarMenu extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.basePath = "";
    }
    
    async connectedCallback() {
        this.basePath = this.getAttribute('base-path') || "";
        const items = await this.fetchMenuItems();
        this.render(items);
        this.setupListeners();
    }
    
    async fetchMenuItems() {
        const response = await fetch(`${this.basePath}/dashboard/menu`);
        const items = await response.json();
        return items;
    }

    setupListeners() {
        const links = this.shadowRoot.querySelectorAll(".menu-link");
        const buttonsMenu = this.shadowRoot.querySelectorAll(".menu-button");
        const menuGroups = this.shadowRoot.querySelectorAll(".menu-group");
        
        // recorremos los links, si se hace click en uno, le sacamos los estilos
        // a los que estaba y le colocamos al link que clickeamos
        
        links.forEach(link => {
            link.addEventListener("click", (event) => {
               event.preventDefault();
               
               links.forEach(item => {
                    item.classList.remove("active");
                });
                
                link.classList.add("active");
            });
        });
        
        // recorremos los botones, si se hace click en uno, le sacamos los estilos
        // a los que estaba y le colocamos al boton que clickeamos
        
        buttonsMenu.forEach(buttonMenu => {
            buttonMenu.addEventListener("click", (event) => {
                const menuGroup = buttonMenu.closest(".menu-group");
                
                const estaAbierto = menuGroup.classList.contains("open");

                menuGroups.forEach(group => {
                    group.classList.remove("open");
                });
                
                if (!estaAbierto) {
                    menuGroup.classList.add("open");
                }
                
                
            });
        });
        
    }
    
    render(items) {
        const menuPrincipal = items.filter(item => item.seccion === "menu");
        const menuFooter = items.filter(item => item.seccion === "footer");
        
        this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        display: block;
                        height: 100vh;
                    }
        
                    /* --- SIDEBAR --- */
                    
                    .sidebar {
                        background-color: rgba(1, 49, 104, 1);
                        height: 100vh;
                        width: 210px;
                        display: flex;
                        flex-direction: column;
                        font-family: 'Segoe UI', Arial, sans-serif;
                        box-shadow:4px 0 12px rgba(0,0,0,.18);
                    }
                    
                    .logo-header {
                        max-width: 120px;
                        filter: drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.5));
                        user-select: none;
                    }
                    
                    /* --- HEADER SIDEBAR --- */
                    
                    .sidebar-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 22px 20px;
                        border-bottom: 1px solid rgba(255,255,255,.12);
                    }
        
                    .sidebar-header button {
                        background: none;
                        border: none;
                        color: white;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .sidebar-header button:hover {
                        opacity: .8;
                        transition: .3;
                    }
                    
                    /* --- MENU ITEMS --- */
                    
                    .menu-items {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        padding: 5px 3px;
                    }
        
                    .menu-link,
                    .menu-button {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 12px 16px;
                        border: none;
                        background: none;
                        color: white;
                        cursor: pointer;
                        text-decoration: none;
                        transition: .25;
                    }
        
                    .menu-button {
                        width: 100%;
                    }
        
                    .menu-link,
                    .menu-group {
                        border-radius: 3px;
                    }
        
                    .menu-link:hover,
                    .menu-group:hover {
                        background-color: rgba(11, 79, 157, 1);
                    }
                    
                    .menu-link.active,
                    .menu-button.active {
                        background: rgba(0, 122, 156, 1);
                    }
        
                    .menu-left, .submenu-left {
                        display: flex;
                        align-items: center;
                        gap: 14px;
                    }
        
                    .menu-left img {
                        width: 22px;
                        height: 22px;
                    }
        
                    .menu-left span {
                        font-size: 15px;
                        font-weight: bold;
                    }
        
                    .submenu-left img {
                        width: 18px;
                        height: 18px;
                    }
        
                    .submenu-left span {
                        font-size: 14px;
                        font-weight: 600;
                    }
        
                    .arrow {
                        display: flex;
                        align-items: center;
                        transition: transform .25s ease;
                    }
        
                    .submenu {
                        display: none;
                        flex-direction: column;
                        margin-top: 6px;
                        margin-left: 27px;
                        gap: 5px;
                        border-left: 2px solid rgba(255,255,255,1);
                    }
        
                    .submenu-link {
                        color: white;
                        text-decoration: none;
                        padding: 10px 18px;
                        border-radius: 8px;
                        font-size: 14px;
                        transition: .25;
                    }
        
                    .submenu-link:hover {
                        background: rgba(255,255,255,.08);
                    }
                    
                    .menu-group.open .submenu {
                        
                        display:flex;
                        flex-direction: column;
                        transition: transform .25s ease;
                    }

                    .menu-group.open .arrow{
                        transform:rotate(90deg);
                    }

                    /* ---------- FOOTER ---------- */

                    .sidebar-footer{
                        padding: 5px 3px;
                        border-top:1px solid rgba(255,255,255,.12);
                    }
                </style>
                
                <div class="sidebar">
                    <div class="sidebar-header">
                        <img class="logo-header" src="${this.basePath}/assets/img/logos/logo-empresa-celeste.png" alt="logo de empresa PiscinasGP">
                        
                        <!-- ESTO ES UN ICONO HECHO CON SVG PARA MINIMIZAR EL SIDEBAR -->
        
                        <button class="collapse-sidebar">
                            <img src="${this.basePath}/assets/img/iconos/panel-left.svg" alt="icono de colapsar sidebar">
                        </button>
                    </div>
                    
                    <div class="menu-items">
                        ${menuPrincipal.map(item => {
                            if (item.hijos.length > 0) {
                                return `
                                <div class="menu-group">
                                    <button class="menu-button">
                                        <div class="menu-left">
                                            <img src="${this.basePath}/assets/img/iconos/${item.icono}" alt="${item.alt}">
                                            <span>${item.titulo}</span>
                                        </div>

                                        <span class="arrow">
                                            <img src="${this.basePath}/assets/img/iconos/chevron-right.svg" alt="icono flecha">
                                        </span>
                                    </button>
                                    
                                    <div class="submenu">
                                        ${item.hijos.map(hijo => `
                                            <a href="${hijo.path}" class="submenu-link">
                                                <div class="submenu-left">
                                                    <img src="${this.basePath}/assets/img/iconos/${hijo.icono}" alt="${hijo.alt}">
                                                    <span>${hijo.titulo}</span>
                                                </div>
                                            </a>
                                    `   ).join("")}
                                    </div>
                                </div>
                                `;
                            } else {
                                return `
                                    <a href="${item.path}" class="menu-link">
                                        <div class="menu-left">
                                            <img src="${this.basePath}/assets/img/iconos/${item.icono}" alt="${item.alt}">
                                            <span>${item.titulo}</span>
                                        </div>
                                    </a>
                                `;
                            }
                        }).join("")}
                    </div>
                    
                    <div class="sidebar-footer">
                        ${menuFooter.map(item => `
                            <a href="${item.path}" class="menu-link">
                                <div class="menu-left">
                                    <img src="${this.basePath}/assets/img/iconos/${item.icono}" alt="${item.alt}">
                                    <span>${item.titulo}</span>
                                </div>
                            </a>
    `                   ).join("")}
                    </div>
        `;
    }
}

customElements.define("sidebar-menu", SidebarMenu);