<%@page contentType="text/html" pageEncoding="UTF-8"%>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/main-style.css"/>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/servicios/servicios-style.css"/>
<div class="page servicios-page">
    <div class="page-background"></div>

    <div class="page-content">
        <dashboard-header
            base-path="${pageContext.request.contextPath}"
            titulo="Nuevo servicio"
            icono="hammer.svg"
            descripcion="Complete los datos para registrar un nuevo servicio"
            botonTexto="Ver historial"
            accion="nav:/dashboard/servicios/historial"
        ></dashboard-header>

        <nuevo-servicio></nuevo-servicio>
    </div>
</div>
            
           