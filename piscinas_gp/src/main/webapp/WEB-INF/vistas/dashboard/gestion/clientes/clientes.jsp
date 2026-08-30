<%@page contentType="text/html" pageEncoding="UTF-8"%>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/main-style.css"/>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/gestion/clientes/clientes-style.css"/>
<div class="page productos-page">
    <div class="page-background"></div>
    
    <div class="page-content">
        <dashboard-header 
            base-path="${pageContext.request.contextPath}"
            titulo="Clientes"
            icono="users.svg"
            descripcion="Clientes registrados en el sistema"
            botonTexto="+ Nuevo cliente"
            accion="nuevo-cliente"
        ></dashboard-header>

            <listado-clientes base-path="${pageContext.request.contextPath}"></listado-clientes>
        <br><br><br><br><br><br>
    </div>
</div>