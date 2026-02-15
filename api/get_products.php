<?php
header('Content-Type: application/json');
require_once '../config/db.php';

try {
    $sql = "SELECT 
                p.id, 
                p.nombre_personalizado as nombre, 
                p.categoria,
                (SELECT precio FROM precios_tiendas WHERE producto_id = p.id AND tienda = 'D1' ORDER BY fecha_registro DESC LIMIT 1) as precio_d1,
                (SELECT precio FROM precios_tiendas WHERE producto_id = p.id AND tienda = 'OLIMPICA' ORDER BY fecha_registro DESC LIMIT 1) as precio_olimpica,
                (SELECT precio FROM precios_tiendas WHERE producto_id = p.id AND tienda = 'ARA' ORDER BY fecha_registro DESC LIMIT 1) as precio_ara,
                (SELECT precio FROM precios_tiendas WHERE producto_id = p.id AND tienda = 'MEGATIENDAS' ORDER BY fecha_registro DESC LIMIT 1) as precio_megatiendas
            FROM productos p
            ORDER BY 
                CASE WHEN p.categoria IN ('CARNES', 'VERDURAS') THEN 0 ELSE 1 END,
                p.categoria, p.nombre_personalizado";

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll();
    
    $productos = [];
    foreach ($rows as $row) {
        $precios = [];
        if ($row['precio_d1']) $precios['D1'] = (float)$row['precio_d1'];
        if ($row['precio_olimpica']) $precios['OLIMPICA'] = (float)$row['precio_olimpica'];
        if ($row['precio_ara']) $precios['ARA'] = (float)$row['precio_ara'];
        if ($row['precio_megatiendas']) $precios['MEGATIENDAS'] = (float)$row['precio_megatiendas'];

        $productos[] = [
            'id' => $row['id'],
            'nombre' => $row['nombre'],
            'categoria' => $row['categoria'] ?: 'General',
            'precios' => $precios
        ];
    }
    
    echo json_encode($productos);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
