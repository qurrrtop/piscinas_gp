<%@page contentType="text/html" pageEncoding="UTF-8"%>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/main-style.css"/>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/gestion/actualizarprecios/actualizarprecios-style.css"/>
<div class="page productos-page">
    <div class="page-background"></div>
    
    <div class="page-content">
        <dashboard-header 
            base-path="${pageContext.request.contextPath}"
            titulo="Actualizar precios"
            icono="trending-up.svg"
            descripcion="Subí el Excel del proveedor para comparar y actualizar precios de productos existentes.
                         Se van a mostrar únicamente los
                         productos que ya existen en el sistema y cuyo precio cambió respecto al que tenés cargado."
        ></dashboard-header>

        <actualizar-precios base-path="${pageContext.request.contextPath}"></actualizar-precios>
        <br><br><br><br><br><br>
    </div>
</div>