-- Esquema evolucionado para Despensa Inteligente
-- Creado: 14/02/2026

CREATE DATABASE IF NOT EXISTS despensa_inteligente;

USE despensa_inteligente;

-- Tabla de Productos basada en el CSV de mercado
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),
    unidad_medida VARCHAR(20),
    precio_referencia DECIMAL(10, 2),
    tienda_preferida VARCHAR(50),
    cantidad_actual DECIMAL(10, 2) DEFAULT 0,
    cantidad_minima DECIMAL(10, 2) DEFAULT 1,
    url_olimpica TEXT,
    url_d1 TEXT,
    url_ara TEXT,
    url_megatiendas TEXT,
    selector_olimpica VARCHAR(255),
    selector_d1 VARCHAR(255),
    selector_ara VARCHAR(255),
    selector_megatiendas VARCHAR(255),
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla para comparar precios entre tiendas
CREATE TABLE IF NOT EXISTS precios_tiendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT,
    tienda ENUM(
        'D1',
        'OLIMPICA',
        'ARA',
        'EXITO',
        'MEGATIENDAS',
        'OTRO'
    ),
    precio DECIMAL(10, 2),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos (id)
);

-- Tabla para el seguimiento de compras/mercado
CREATE TABLE IF NOT EXISTS historial_mercado (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT,
    fecha_compra DATE,
    precio_pagado DECIMAL(10, 2),
    tienda VARCHAR(50),
    cantidad_comprada DECIMAL(10, 2),
    FOREIGN KEY (producto_id) REFERENCES productos (id)
);