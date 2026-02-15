<?php
header('Content-Type: text/plain; charset=utf-8');
require_once '../config/db.php';

$csvFile = '../documentation/Mercado 2026 - DIC_25.csv';

if (!file_exists($csvFile)) {
    die("Error: El archivo CSV no existe.\n");
}

try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("TRUNCATE TABLE historial_compras;");
    $pdo->exec("TRUNCATE TABLE precios_tiendas;");
    $pdo->exec("TRUNCATE TABLE productos;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    $fileContent = file_get_contents($csvFile);
    $lines = explode("\n", $fileContent);
    
    $stmt = $pdo->prepare("INSERT INTO productos (nombre_personalizado, categoria, es_favorito) VALUES (?, ?, ?)");
    $stmtPrecio = $pdo->prepare("INSERT INTO precios_tiendas (producto_id, tienda, precio, cantidad_presentacion, precio_por_unidad) VALUES (?, ?, ?, ?, ?)");

    $count = 0;
    $currentCategory = 'GENERAL';

    foreach ($lines as $index => $line) {
        if ($index === 0) continue; // Cabecera
        
        $data = str_getcsv($line, ',');
        if (empty($data) || count($data) < 2) continue;

        $col0 = trim($data[0]);
        $col1 = trim($data[1]);

        // Detectar cambio de categoría (Filas que no tienen cantidad en col0 pero tienen texto en col1)
        if ($col0 === '' && $col1 !== '' && !isset($data[2])) {
            $currentCategory = mb_convert_encoding($col1, "UTF-8", "auto");
            continue;
        }

        // Producto válido (Tiene nombre en col1 y no es un separador vacío)
        if ($col1 !== '' && strlen($col1) > 2 && strpos($col1, '---') === false) {
            $nombre = mb_convert_encoding($col1, "UTF-8", "auto");
            
            // Insertar Producto
            $stmt->execute([$nombre, $currentCategory, 0]);
            $productoId = $pdo->lastInsertId();

            // Mapeo de precios por tienda (Índices del CSV: 2=O, 3=D, 4=R, 5=MCDO)
            $storeMap = [
                'OLIMPICA' => 2,
                'D1' => 3,
                'ARA' => 4,
                'MEGATIENDAS' => 5
            ];

            foreach ($storeMap as $tienda => $idx) {
                if (isset($data[$idx]) && trim($data[$idx]) !== '' && trim($data[$idx]) !== '-') {
                    $precioRaw = $data[$idx];
                    $precio = (float)str_replace(['$', '.', ',', ' '], ['', '', '', ''], $precioRaw);
                    
                    if ($precio > 0) {
                        $stmtPrecio->execute([$productoId, $tienda, $precio, 1.0, $precio]);
                    }
                }
            }
            $count++;
        }
    }

    echo "Éxito: Se han importado $count productos únicos con sus comparativas de precios.\n";

} catch (PDOException $e) {
    echo "Error BD: " . $e->getMessage() . "\n";
}
?>
