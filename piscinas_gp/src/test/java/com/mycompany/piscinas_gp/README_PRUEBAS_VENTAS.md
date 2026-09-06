# Pruebas manuales de ventas

Primero ejecutar el archivo sql qui esta en la carpeta de sql TEST. El script crea, solo si
no existen, un cliente, dos productos y una venta de prueba con dos detalles.
Luego, las dos clases Java realizan solo consultas y no modifican la base.

## PruebaVentaProductoServicio

Lista las ventas de productos mediante `VentaProductoServicio`.

La clase localiza automáticamente la venta cuya observación es
`PRUEBA_AUTOMATICA_VENTAS` y muestra también sus detalles.

## PruebaDetalleVentaDAO

Prueba directamente `DetalleVentaDAO.buscarPorVentaId` sobre la venta de
prueba creada por el script SQL.
