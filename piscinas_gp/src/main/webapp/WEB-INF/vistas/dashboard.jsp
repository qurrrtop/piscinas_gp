<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard-style.css"/>
        <script src="${pageContext.request.contextPath}/assets/js/wc/dashboard/SidebarMenu.js" type="module" defer></script>
        <script src="${pageContext.request.contextPath}/assets/js/wc/dashboard/DashboardSection.js" type="module" defer></script>
        <script src="${pageContext.request.contextPath}/assets/js/wc/dashboard/DashboardHeader.js" type="module" defer></script>
        <script src="${pageContext.request.contextPath}/assets/js/wc/dashboard/ModalComponent.js" type="module" defer></script>
        <script src="${pageContext.request.contextPath}/assets/js/wc/productos/FormularioProducto.js" type="module" defer></script>
        <script src="${pageContext.request.contextPath}/assets/js/wc/TablaGenerica.js" type="module" defer></script>
        <script src="${pageContext.request.contextPath}/assets/js/wc/productos/ListadoProductos.js" type="module" defer></script>
        <script src="${pageContext.request.contextPath}/assets/js/wc/TarjetasResumen.js" type="module" defer></script>
        <script src="${pageContext.request.contextPath}/assets/js/wc/NotificacionToast.js" type="module" defer></script>
        <script src="${pageContext.request.contextPath}/assets/js/wc/DetalleProducto.js" type="module" defer></script>
        
        <title>PiscinasGP</title>
    </head>
    <body>
        <main class="dashboard-layout">
            <nav>
                <sidebar-menu base-path="${pageContext.request.contextPath}"></sidebar-menu>
            </nav>

            <section>
                <dashboard-section base-path="${pageContext.request.contextPath}"></dashboard-section>
            </section>
        </main>
            
        <notificacion-toast></notificacion-toast>
    </body>
</html>
