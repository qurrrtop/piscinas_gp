-- Datos mínimos y repetibles para ejecutar las pruebas manuales de ventas.
-- Puede ejecutarse más de una vez: evita crear duplicados de los datos fijos.

USE piscinas_gp;

START TRANSACTION;

INSERT IGNORE INTO tipo_ventas (nombre) VALUES ('producto');
INSERT IGNORE INTO estado_ventas (nombre) VALUES ('cerrada');
INSERT IGNORE INTO metodo_pagos (nombre) VALUES ('efectivo');
INSERT IGNORE INTO localidades (nombre) VALUES ('Localidad de prueba');
INSERT IGNORE INTO unidades_medida (nombre, abreviatura)
VALUES ('Unidad de prueba', 'ut');
INSERT IGNORE INTO marca_productos (nombre) VALUES ('Marca de prueba');
INSERT IGNORE INTO categoria_productos (nombre, categoria_producto_padre)
VALUES ('Categoria de prueba', NULL);

INSERT INTO clientes (email, telefono, calle_numero, localidad_id, observaciones)
SELECT
    'cliente.prueba@piscinas.local',
    '3794000000',
    'Calle de prueba 123',
    (SELECT id FROM localidades WHERE nombre = 'Localidad de prueba'),
    'Cliente creado para pruebas manuales'
WHERE NOT EXISTS (
    SELECT 1 FROM clientes_particulares WHERE cuil = '20123456789'
);

INSERT IGNORE INTO clientes_particulares (cliente_id, nombre, apellido, cuil)
VALUES (
    (SELECT id FROM clientes WHERE email = 'cliente.prueba@piscinas.local' LIMIT 1),
    'Cliente', 'Prueba', '20123456789'
);

INSERT INTO productos (
    nombre, unidad_medida_id, stock, umbral_stock, precio_actual,
    contenido, descripcion, marca_producto_id, categoria_producto_id
)
SELECT
    'Producto de prueba A',
    (SELECT id FROM unidades_medida WHERE nombre = 'Unidad de prueba'),
    50, 5, 2500.00, 1.00,
    'Producto creado para pruebas manuales',
    (SELECT id FROM marca_productos WHERE nombre = 'Marca de prueba'),
    (SELECT id FROM categoria_productos WHERE nombre = 'Categoria de prueba')
WHERE NOT EXISTS (
    SELECT 1 FROM productos WHERE nombre = 'Producto de prueba A'
);

INSERT INTO productos (
    nombre, unidad_medida_id, stock, umbral_stock, precio_actual,
    contenido, descripcion, marca_producto_id, categoria_producto_id
)
SELECT
    'Producto de prueba B',
    (SELECT id FROM unidades_medida WHERE nombre = 'Unidad de prueba'),
    50, 5, 5000.00, 1.00,
    'Producto creado para pruebas manuales',
    (SELECT id FROM marca_productos WHERE nombre = 'Marca de prueba'),
    (SELECT id FROM categoria_productos WHERE nombre = 'Categoria de prueba')
WHERE NOT EXISTS (
    SELECT 1 FROM productos WHERE nombre = 'Producto de prueba B'
);

INSERT INTO ventas (
    fecha_inicio, observacion, fecha_cierre, problema, diagnostico,
    mano_obra, monto, descuento_global, fecha_entrega,
    metodo_pago_id, estado_venta_id, tipo_venta_id, cliente_id
)
SELECT
    CURDATE(), 'PRUEBA_AUTOMATICA_VENTAS', CURDATE(), NULL, NULL,
    NULL, 10000.00, 0, NULL,
    (SELECT id FROM metodo_pagos WHERE nombre = 'efectivo'),
    (SELECT id FROM estado_ventas WHERE nombre = 'cerrada'),
    (SELECT id FROM tipo_ventas WHERE nombre = 'producto'),
    (SELECT cliente_id FROM clientes_particulares WHERE cuil = '20123456789')
WHERE NOT EXISTS (
    SELECT 1 FROM ventas WHERE observacion = 'PRUEBA_AUTOMATICA_VENTAS'
);

SET @venta_prueba_id = (
    SELECT id FROM ventas
    WHERE observacion = 'PRUEBA_AUTOMATICA_VENTAS'
    ORDER BY id DESC
    LIMIT 1
);

INSERT INTO detalle_ventas (
    precio_unitario, cantidad, observacion, venta_id, producto_id
)
SELECT
    2500.00, 2, 'Detalle de prueba A', @venta_prueba_id,
    (SELECT id FROM productos WHERE nombre = 'Producto de prueba A')
WHERE NOT EXISTS (
    SELECT 1 FROM detalle_ventas
    WHERE venta_id = @venta_prueba_id
      AND producto_id = (SELECT id FROM productos WHERE nombre = 'Producto de prueba A')
);

INSERT INTO detalle_ventas (
    precio_unitario, cantidad, observacion, venta_id, producto_id
)
SELECT
    5000.00, 1, 'Detalle de prueba B', @venta_prueba_id,
    (SELECT id FROM productos WHERE nombre = 'Producto de prueba B')
WHERE NOT EXISTS (
    SELECT 1 FROM detalle_ventas
    WHERE venta_id = @venta_prueba_id
      AND producto_id = (SELECT id FROM productos WHERE nombre = 'Producto de prueba B')
);

COMMIT;

SELECT
    v.id AS venta_prueba_id,
    v.monto AS total,
    COUNT(dv.id) AS cantidad_detalles
FROM ventas v
LEFT JOIN detalle_ventas dv ON dv.venta_id = v.id
WHERE v.observacion = 'PRUEBA_AUTOMATICA_VENTAS'
GROUP BY v.id, v.monto;
