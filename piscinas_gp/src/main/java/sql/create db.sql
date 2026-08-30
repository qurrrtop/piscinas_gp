create database if not exists piscinas_gp;

use piscinas_gp;

create table marca_productos (
    id int unsigned primary key auto_increment,
    nombre varchar(40) UNIQUE not null
);

-- como marca y categorias son tablas, creí conveniente, seguir el mismo 
-- patrón para las unidades de medida.

create table unidades_medida (
    id int unsigned primary key auto_increment,
    nombre varchar(50) not null unique,
    abreviatura varchar(10) not null unique
);

create table categoria_productos (
    id int unsigned primary key auto_increment,
    nombre varchar(40) unique not null,
    categoria_producto_padre int unsigned,
    constraint fk_categoria_productos_padre foreign key (categoria_producto_padre) references categoria_productos (id) on update cascade on delete set null
);

create table productos (
    id int unsigned primary key auto_increment,
    nombre varchar(100) not null,
    unidad_medida_id int unsigned not null,
    stock int unsigned not null default 0,
    umbral_stock int unsigned not null default 0,
    precio_actual decimal(10, 2) not null default 0,
    contenido decimal(10, 2) not null default 0,
    descripcion text null,
    marca_producto_id int unsigned not null,
    categoria_producto_id int unsigned not null,
    constraint fk_productos_unidad_medida foreign key (unidad_medida_id) references unidades_medida (id) on update cascade on delete restrict,
    constraint fk_productos_marca foreign key (marca_producto_id) references marca_productos (id) on update cascade on delete restrict,
    constraint fk_productos_categoria foreign key (categoria_producto_id) references categoria_productos (id) on update cascade on delete restrict
);

create table metodo_pagos (
    id int unsigned primary key auto_increment,
    nombre varchar(30) not null unique
);

create table estado_ventas (
    id int unsigned primary key auto_increment,
    nombre varchar(30) not null unique
);

create table tipo_ventas (
    id int unsigned primary key auto_increment,
    nombre varchar(30) not null unique
);

create table clientes (
    id int unsigned primary key auto_increment,
    email varchar(150) null,
    telefono varchar(15) not null,
    calle_numero varchar(150) not null,
    ciudad varchar(40) not null,
    provincia varchar(100) null,
    codigo_postal varchar(20) null,
    observaciones text null
);

create table clientes_particulares (
    cliente_id int unsigned primary key,
    nombre varchar(50) not null,
    apellido varchar(50) not null,
    cuil varchar(11) not null unique,
    constraint fk_clientes_particulares_cliente foreign key (cliente_id) references clientes (id) on update cascade on delete cascade
);

create table clientes_empresas (
    cliente_id int unsigned primary key,
    razon_social varchar(150) not null,
    nombre_fantasia varchar(150) not null,
    rubro varchar(100) null,
    cuit varchar(11) not null unique,
    constraint fk_clientes_empresas_cliente foreign key (cliente_id) references clientes (id) on update cascade on delete cascade
);

create table ventas (
    id int unsigned primary key auto_increment,
    fecha_inicio date not null,
    observacion text null,
    fecha_cierre date null,
    problema text not null,
    diagnostico text null,
    mano_obra decimal(12, 2) null default 0,
    monto decimal(12, 2) not null default 0,
    descuento_global decimal(5, 3) not null default 0,
    fecha_entrega date null,
    metodo_pago_id int unsigned not null,
    estado_venta_id int unsigned not null,
    tipo_venta_id int unsigned not null,
    cliente_id int unsigned not null,
    constraint fk_ventas_metodo_pago foreign key (metodo_pago_id) references metodo_pagos (id) on update cascade on delete restrict,
    constraint fk_ventas_estado_ventas foreign key (estado_venta_id) references estado_ventas (id) on update cascade on delete restrict,
    constraint fk_ventas_tipo_ventas foreign key (tipo_venta_id) references tipo_ventas (id) on update cascade on delete restrict,
    constraint fk_ventas_cliente foreign key (cliente_id) references clientes (id) on update cascade on delete restrict
);

create table detalle_ventas (
    id int unsigned primary key auto_increment,
    precio_unitario decimal(12, 2) not null,
    cantidad int unsigned not null,
    observacion text null,
    venta_id int unsigned not null,
    producto_id int unsigned not null,
    constraint fk_detalle_ventas_venta foreign key (venta_id) references ventas (id) on update cascade on delete cascade,
    constraint fk_detalle_ventas_producto foreign key (producto_id) references productos (id) on update cascade on delete restrict
);

-- INSERTAR LAS TRES CATEGORIAS DE PRODUCTOS --

INSERT INTO categoria_productos (nombre, categoria_producto_padre) VALUES
('Químico', NULL),
('Accesorios de Instalación', NULL),
('Repuesto', NULL);

-- INSERTAR 4 MARCAS DE PRUEBA --

INSERT INTO marca_productos (nombre) VALUES
('AstralPool'), ('Clorotec'), ('Vulcano'), ('Nataclor');

-- INSERTAR UNIDADES DE PRUEBA --

INSERT INTO unidades_medida (nombre, abreviatura) VALUES
('Unidad', 'un'),
('Kilogramo', 'kg'),
('Gramo', 'g'),
('Litro', 'lt'),
('Partes por millón', 'ppm'),
('Metros cúbicos por hora', 'm³/h'),
('Pulgadas', '"');

-- 28/08

-- ------ SI YA CREARON LA BASE DE DATOS EJECUTEN ESTAS SENTENCIAS -----
-- ------ PARA ELIMINAR LAS COLUMNAS PROVINCIA Y CODPOSTAL -----
-- ------ (NO SE USARÁN, POR ESO) ---------

-- 1) eliminamos las columnas que no se usará

ALTER TABLE clientes
DROP COLUMN provincia,
DROP COLUMN codigo_postal;

-- 2) eliminamos el campo ciudad, para crear "localidad_id" en su lugar

-- 2.1)

ALTER TABLE clientes
DROP COLUMN ciudad;

-- 2.2)

ALTER TABLE clientes
ADD COLUMN localidad_id INT UNSIGNED NULL AFTER calle_numero;

-- 2.3

-- ----- NUEVA TABLA DE LOCALIDADES DE CORRIENTES -----
CREATE TABLE localidades (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre varchar(60) NOT NULL UNIQUE
);

-- 2.4 ahora si se agrega la relación de ambas tablas

ALTER TABLE clientes
ADD CONSTRAINT fk_clientes_localidad FOREIGN KEY (localidad_id) REFERENCES localidades(id)
ON UPDATE CASCADE ON DELETE SET NULL;

-- 2.5 insertamos las localidades (ESTAS SON ALGUNAS NOMAS)

INSERT INTO localidades (nombre) VALUES
('Mercedes'), ('Felipe Yofre'), ('Mariano I. Loza'), ('Curuzú Cuatiá'), ('Perugorría'), 
('Chavarría'), ('Paso de los Libres'), ('Bonpland'), ('Parada Pucheta'), ('Tapebicuá'), 
('Monte Caseros'), ('Juan Pujol'), ('Colonia Libertad'), ('Sauce'), ('Mocoretá'),
('Goya'), ('Corrientes Capital');