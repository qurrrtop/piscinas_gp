class DashboardSection extends HTMLElement {
    constructor () {
        super();
        this.attachShadow({mode: 'open'});
        this.basePath = "";
    }
    
    connectedCallback() {
        this.basePath = this.getAttribute('base-path') || "";
        this.setupListeners();
        
        this.loadContent(`${this.basePath}/dashboard/principal`);
    }
    
    setupListeners() {
        document.addEventListener("navigateTo", (event) => {
            const path = event.detail.path;
            
            console.log("DashboardSection recibió:", path);
            
            this.loadContent(path);
        });
    }
    
    async loadContent(path) {
        const response = await fetch(path);
        const html = await response.text();
        
        this.shadowRoot.innerHTML = html;
    }
}

customElements.define('dashboard-section', DashboardSection);