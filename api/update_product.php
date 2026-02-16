<?php
header('Content-Type: application/json');
require_once '../config/db.php';

// POST: Actualizar URL/selector de un producto para una tienda específica
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Solo POST']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$producto_id = intval($data['producto_id'] ?? 0);
$tienda = strtolower(trim($data['tienda'] ?? ''));
$url = trim($data['url'] ?? '');
$selector = trim($data['selector'] ?? '');

$tiendas_validas = ['olimpica', 'd1', 'ara', 'megatiendas'];

if (!$producto_id || !$tienda || !in_array($tienda, $tiendas_validas)) {
    http_response_code(400);
    echo json_encode(['error' => 'producto_id y tienda válida son obligatorios.']);
    exit;
}

try {
    // Construir UPDATE dinámico según la tienda
    $campos = [];
    $params = [':id' => $producto_id];

    if ($url) {
        $campos[] = "url_{$tienda} = :url";
        $params[':url'] = $url;
    }

    if ($selector) {
        $campos[] = "selector_{$tienda} = :sel";
        $params[':sel'] = $selector;
    }

    if (empty($campos)) {
        http_response_code(400);
        echo json_encode(['error' => 'Debes enviar url o selector.']);
        exit;
    }

    $sql = "UPDATE productos SET " . implode(', ', $campos) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        'success' => true,
        'mensaje' => "Producto $producto_id actualizado para tienda $tienda."
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
