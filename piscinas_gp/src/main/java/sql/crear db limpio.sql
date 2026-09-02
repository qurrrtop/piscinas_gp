CREATE DATABASE IF NOT EXISTS piscinas_gp
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE piscinas_gp;

CREATE TABLE marca_productos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE unidades_medida (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    abreviatura VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE categoria_productos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(40) NOT NULL UNIQUE,
    categoria_producto_padre INT UNSIGNED NULL,
    CONSTRAINT fk_categoria_productos_padre
        FOREIGN KEY (categoria_producto_padre)
        REFERENCES categoria_productos(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE TABLE localidades (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE productos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    unidad_medida_id INT UNSIGNED NOT NULL,
    stock INT UNSIGNED NOT NULL DEFAULT 0,
    umbral_stock INT UNSIGNED NOT NULL DEFAULT 0,
    precio_actual DECIMAL(10, 2) NOT NULL DEFAULT 0,
    contenido DECIMAL(10, 2) NOT NULL DEFAULT 0,
    descripcion TEXT NULL,
    marca_producto_id INT UNSIGNED NOT NULL,
    categoria_producto_id INT UNSIGNED NOT NULL,

    CONSTRAINT fk_productos_unidad_medida
        FOREIGN KEY (unidad_medida_id)
        REFERENCES unidades_medida(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_productos_marca
        FOREIGN KEY (marca_producto_id)
        REFERENCES marca_productos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_productos_categoria
        FOREIGN KEY (categoria_producto_id)
        REFERENCES categoria_productos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE metodo_pagos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE estado_ventas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE tipo_ventas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE clientes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NULL,
    telefono VARCHAR(15) NOT NULL,
    calle_numero VARCHAR(150) NOT NULL,
    localidad_id INT UNSIGNED NULL,
    observaciones TEXT NULL,

    CONSTRAINT fk_clientes_localidad
        FOREIGN KEY (localidad_id)
        REFERENCES localidades(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

CREATE TABLE clientes_particulares (
    cliente_id INT UNSIGNED PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    cuil VARCHAR(11) NOT NULL UNIQUE,

    CONSTRAINT fk_clientes_particulares_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE clientes_empresas (
    cliente_id INT UNSIGNED PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL,
    nombre_fantasia VARCHAR(150) NOT NULL,
    rubro VARCHAR(100) NULL,
    cuit VARCHAR(11) NOT NULL UNIQUE,

    CONSTRAINT fk_clientes_empresas_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE ventas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fecha_inicio DATE NOT NULL,
    observacion TEXT NULL,
    fecha_cierre DATE NULL,

    problema TEXT NULL,
    diagnostico TEXT NULL,
    mano_obra DECIMAL(12, 2) NULL,
    monto DECIMAL(12, 2) NOT NULL DEFAULT 0,
    descuento_global DECIMAL(5, 3) NOT NULL DEFAULT 0,
    fecha_entrega DATE NULL,

    metodo_pago_id INT UNSIGNED NOT NULL,
    estado_venta_id INT UNSIGNED NOT NULL,
    tipo_venta_id INT UNSIGNED NOT NULL,
    cliente_id INT UNSIGNED NOT NULL,

    CONSTRAINT fk_ventas_metodo_pago
        FOREIGN KEY (metodo_pago_id)
        REFERENCES metodo_pagos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ventas_estado
        FOREIGN KEY (estado_venta_id)
        REFERENCES estado_ventas(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ventas_tipo
        FOREIGN KEY (tipo_venta_id)
        REFERENCES tipo_ventas(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ventas_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE TABLE detalle_ventas (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    precio_unitario DECIMAL(12, 2) NOT NULL,
    cantidad INT UNSIGNED NOT NULL,
    observacion TEXT NULL,
    venta_id INT UNSIGNED NOT NULL,
    producto_id INT UNSIGNED NOT NULL,

    CONSTRAINT fk_detalle_ventas_venta
        FOREIGN KEY (venta_id)
        REFERENCES ventas(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_ventas_producto
        FOREIGN KEY (producto_id)
        REFERENCES productos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);