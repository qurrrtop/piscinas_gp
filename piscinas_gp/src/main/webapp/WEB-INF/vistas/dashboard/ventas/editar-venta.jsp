<%@page contentType="text/html" pageEncoding="UTF-8"%>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/main-style.css"/>
<link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/dashboard/ventas/ventas-style.css"/>
<div class="page ventas-page">
    <div class="page-background"></div>

    <div class="page-content">
        <dashboard-header
            base-path="${pageContext.request.contextPath}"
            titulo="Editar venta"
            icono="pencil.svg"
            descripcion="Modificá los datos de la venta seleccionada"
            botonTexto="Ver historial"
            accion="nav:/dashboard/ventas/historial"
            ></dashboard-header>

        <nueva-venta venta-id="${param.id}" base-path="${pageContext.request.contextPath}"></nueva-venta>
        <br><br><br><br><br>
    </div>
</div>