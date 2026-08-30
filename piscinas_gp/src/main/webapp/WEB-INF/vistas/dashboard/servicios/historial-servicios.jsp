<%@page contentType="text/html" pageEncoding="UTF-8"%>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/main-style.css"/>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/servicios/servicios-style.css"/>
<div class="page servicios-page">
    <div class="page-background"></div>

    <div class="page-content">
        <dashboard-header
            base-path="${pageContext.request.contextPath}"
            titulo="Historial de servicios"
            icono="notepad-text.svg"
            descripcion="Registro completo de servicios realizados"
            botonTexto="+ Nuevo servicio"
            accion="nav:/dashboard/servicios/nuevo"
        ></dashboard-header>

        <historial-servicios></historial-servicios>
    </div>
</div>
            
           