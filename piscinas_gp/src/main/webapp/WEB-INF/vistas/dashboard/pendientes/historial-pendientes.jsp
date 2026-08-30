<%@page contentType="text/html" pageEncoding="UTF-8"%>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/main-style.css"/>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/pendientes/pendientes-style.css"/>
<div class="page pendientes-page">
    <div class="page-background"></div>

    <div class="page-content">
        <dashboard-header
            base-path="${pageContext.request.contextPath}"
            titulo="Historial de pendientes"
            icono="notepad-text.svg"
            descripcion="Aquí encontrará ventas, servicios técnicos y asesoramientos pendientes"
            botonTexto=""
            accion=""
        ></dashboard-header>

        <historial-pendientes></historial-pendientes>
    </div>
</div>