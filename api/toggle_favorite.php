<?php
header('Content-Type: application/json');
require_once '../config/db.php';

// POST: Toggle favorito de un producto
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Solo POST']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$producto_id = intval($data['producto_id'] ?? 0);

if (!$producto_id) {
    http_response_code(400);
    echo json_encode(['error' => 'producto_id es obligatorio.']);
    exit;
}

try {
    // Toggle: si es favorito → dejar de ser, viceversa
    $stmt = $pdo->prepare("UPDATE productos SET es_favorito = NOT es_favorito WHERE id = :id");
    $stmt->execute([':id' => $producto_id]);

    // Devolver el nuevo estado
    $stmt2 = $pdo->prepare("SELECT es_favorito FROM productos WHERE id = :id");
    $stmt2->execute([':id' => $producto_id]);
    $row = $stmt2->fetch();

    echo json_encode([
        'success' => true,
        'producto_id' => $producto_id,
        'es_favorito' => (bool)$row['es_favorito']
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
