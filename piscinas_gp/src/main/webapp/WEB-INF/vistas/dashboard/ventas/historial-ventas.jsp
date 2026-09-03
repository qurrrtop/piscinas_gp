<%@page contentType="text/html" pageEncoding="UTF-8"%>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/main-style.css"/>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/ventas/ventas-style.css"/>
<div class="page ventas-page">
    <div class="page-background"></div>

    <div class="page-content">
        <dashboard-header
            base-path="${pageContext.request.contextPath}"
            titulo="Historial de ventas"
            icono="notepad-text.svg"
            descripcion="Registro completo de ventas realizadas"
            botonTexto="+ Nueva venta"
            accion="nav:/dashboard/ventas/nueva"
        ></dashboard-header>

        <historial-ventas></historial-ventas>
        <br><br><br><br><br>
    </div>
</div>