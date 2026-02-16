<?php
header('Content-Type: application/json');
require_once '../config/db.php';

// POST: Establecer tienda preferida (toggle)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Solo POST']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$producto_id = intval($data['producto_id'] ?? 0);
$tienda = $data['tienda'] ?? ''; // Puede ser 'D1', 'OLIMPICA', etc.

if (!$producto_id) {
    http_response_code(400);
    echo json_encode(['error' => 'producto_id es obligatorio.']);
    exit;
}

try {
    // Verificar estado actual
    $stmt = $pdo->prepare("SELECT tienda_preferida FROM productos WHERE id = :id");
    $stmt->execute([':id' => $producto_id]);
    $current = $stmt->fetchColumn();

    $new_tienda = null;
    $action = 'unset';

    // Toggle logic: Si mando la misma tienda que ya está, la quito (null). Si es otra, la actualizo.
    if ($current === $tienda) {
        $new_tienda = null; // Unset
    } else {
        $new_tienda = $tienda;
        $action = 'set';
    }

    $update = $pdo->prepare("UPDATE productos SET tienda_preferida = :tienda WHERE id = :id");
    $update->execute([':tienda' => $new_tienda, ':id' => $producto_id]);

    echo json_encode([
        'success' => true,
        'producto_id' => $producto_id,
        'tienda_preferida' => $new_tienda,
        'action' => $action
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
