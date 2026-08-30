<%@page contentType="text/html" pageEncoding="UTF-8"%>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/main-style.css"/>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/gestion/productos/productos-style.css"/>
<div class="page productos-page">
    <div class="page-background"></div>
    
    <div class="page-content">
        <dashboard-header 
            base-path="${pageContext.request.contextPath}"
            titulo="Productos"
            icono="package.svg"
            descripcion="Catálogo completo de productos del negocio"
            botonTexto="+ Nuevo producto"
            accion="nuevo-producto"
            ></dashboard-header>

        <listado-productos></listado-productos>
        <br><br><br><br><br><br>
    </div>
</div>