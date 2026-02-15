-- Esquema evolucionado para Despensa Inteligente - Versión Planificador Financiero
-- Creado: 15/02/2026

CREATE DATABASE IF NOT EXISTS despensa_inteligente;

USE despensa_inteligente;

-- Tabla de Productos: Define la identidad que el usuario reconoce
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_personalizado VARCHAR(255) NOT NULL, -- El nombre que el usuario le da
    categoria VARCHAR(100),
    es_favorito BOOLEAN DEFAULT FALSE,
    cantidad_actual DECIMAL(10, 2) DEFAULT 0,
    cantidad_minima DECIMAL(10, 2) DEFAULT 1,
    unidad_medida_base VARCHAR(20) DEFAULT 'un', -- un, gr, kg, ml

-- URLs para el scraper
url_olimpica TEXT,
url_d1 TEXT,
url_ara TEXT,
url_megatiendas TEXT,

-- Selectores para el scraper
selector_olimpica VARCHAR(255),
    selector_d1 VARCHAR(255),
    selector_ara VARCHAR(255),
    selector_megatiendas VARCHAR(255),
    
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla para comparar precios con inteligencia de presentación (PUM)
CREATE TABLE IF NOT EXISTS precios_tiendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT,
    tienda EN_ENUM (
        'D1',
        'OLIMPICA',
        'ARA',
        'EXITO',
        'MEGATIENDAS',
        'OTRO'
    ),
    precio DECIMAL(10, 2),
    cantidad_presentacion DECIMAL(10, 2) DEFAULT 1.0, -- Ej: 180
    unidad_presentacion VARCHAR(10) DEFAULT 'un', -- Ej: gr
    precio_por_unidad DECIMAL(10, 4), -- Precio calculado (PUM)
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES productos (id)
);

-- Tabla de Historial: El registro de ahorros y decisiones
CREATE TABLE IF NOT EXISTS historial_compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tienda_elegida VARCHAR(50),
    precio_pagado DECIMAL(10, 2),
    cantidad_comprada DECIMAL(10, 2),
    ahorro_estimado DECIMAL(10, 2), -- Diferencia vs. opción más cara
    FOREIGN KEY (producto_id) REFERENCES productos (id)
);