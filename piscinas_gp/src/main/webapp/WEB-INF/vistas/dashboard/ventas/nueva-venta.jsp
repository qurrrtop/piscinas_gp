<%@page contentType="text/html" pageEncoding="UTF-8"%>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/main-style.css"/>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/ventas/ventas-style.css"/>
<div class="page ventas-page">
    <div class="page-background"></div>

    <div class="page-content">
        <dashboard-header
            base-path="${pageContext.request.contextPath}"
            titulo="Nueva venta"
            icono="shopping-cart.svg"
            descripcion="Complete los datos para registrar una nueva venta"
            botonTexto="Ver historial"
            accion="nav:/dashboard/ventas/historial"
        ></dashboard-header>

        <nueva-venta></nueva-venta>
    </div>
</div>