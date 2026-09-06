USE piscinas_gp;

INSERT INTO categoria_productos (nombre, categoria_producto_padre)
VALUES
('Químico', NULL),
('Accesorios de Instalación', NULL),
('Repuesto', NULL);

INSERT INTO marca_productos (nombre)
VALUES
('AstralPool'),
('Clorotec'),
('Vulcano'),
('Nataclor');

INSERT INTO unidades_medida (nombre, abreviatura)
VALUES
('Unidad', 'un'),
('Kilogramo', 'kg'),
('Gramo', 'g'),
('Litro', 'lt'),
('Partes por millón', 'ppm'),
('Metros cúbicos por hora', 'm³/h'),
('Pulgadas', '"');

INSERT INTO localidades (nombre)
VALUES
('Mercedes'),
('Felipe Yofre'),
('Mariano I. Loza'),
('Curuzú Cuatiá'),
('Perugorría'),
('Chavarría'),
('Paso de los Libres'),
('Bonpland'),
('Parada Pucheta'),
('Tapebicuá'),
('Monte Caseros'),
('Juan Pujol'),
('Colonia Libertad'),
('Sauce'),
('Mocoretá'),
('Goya'),
('Corrientes Capital');

-- Tipos de venta disponibles. Se usan para identificar qué módulo
-- creó cada registro de la tabla ventas.
insert into tipo_ventas (nombre)
values
('producto'),
('servicio_tecnico'),
('asesoramiento');

-- Estados posibles de una venta.
insert into estado_ventas (nombre)
values
('pendiente'),
('cerrada'),
('cancelada');

-- Métodos de pago disponibles.
insert into metodo_pagos (nombre)
values
('efectivo'),
('transferencia'),
('debito'),
('credito');