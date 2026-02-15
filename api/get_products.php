<?php
header('Content-Type: application/json');
require_once '../config/db.php';

try {
    // Consulta para obtener todos los productos y sus precios comparativos (si existen)
    $sql = "SELECT 
                p.id, 
                p.nombre, 
                p.categoria,
                p.precio_referencia,
                p.tienda_preferida,
                p.url_d1, p.url_olimpica, p.url_ara, p.url_megatiendas,
                (SELECT precio FROM precios_tiendas WHERE producto_id = p.id AND tienda = 'D1' ORDER BY fecha_registro DESC LIMIT 1) as precio_d1,
                (SELECT precio FROM precios_tiendas WHERE producto_id = p.id AND tienda = 'OLIMPICA' ORDER BY fecha_registro DESC LIMIT 1) as precio_olimpica,
                (SELECT precio FROM precios_tiendas WHERE producto_id = p.id AND tienda = 'ARA' ORDER BY fecha_registro DESC LIMIT 1) as precio_ara,
                (SELECT precio FROM precios_tiendas WHERE producto_id = p.id AND tienda = 'MEGATIENDAS' ORDER BY fecha_registro DESC LIMIT 1) as precio_megatiendas
            FROM productos p
            ORDER BY p.categoria, p.nombre";

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll();
    
    $productos = [];
    foreach ($rows as $row) {
        // Si el nombre está vacío o es un separador de categoría (compras CSV), lo saltamos
        if (empty($row['nombre']) || strlen($row['nombre']) < 3) continue;

        $precios = [];
        if ($row['precio_d1']) $precios['D1'] = (float)$row['precio_d1'];
        if ($row['precio_olimpica']) $precios['OLIMPICA'] = (float)$row['precio_olimpica'];
        if ($row['precio_ara']) $precios['ARA'] = (float)$row['precio_ara'];
        if ($row['precio_megatiendas']) $precios['MEGATIENDAS'] = (float)$row['precio_megatiendas'];

        // Fallback: Si no hay precios comparativos, usar el precio de referencia del CSV
        if (empty($precios) && $row['precio_referencia'] > 0) {
            $tienda = $row['tienda_preferida'] ?: 'REFERENCIA';
            $precios[$tienda] = (float)$row['precio_referencia'];
        }

        $productos[] = [
            'id' => $row['id'],
            'nombre' => $row['nombre'],
            'categoria' => $row['categoria'] ?: 'General',
            'precios' => $precios,
            'urls' => [
                'D1' => $row['url_d1'],
                'OLIMPICA' => $row['url_olimpica'],
                'ARA' => $row['url_ara'],
                'MEGATIENDAS' => $row['url_megatiendas']
            ]
        ];
    }
    
    echo json_encode($productos);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
