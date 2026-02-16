<?php
header('Content-Type: application/json');
require_once '../config/db.php';

// POST: Agregar un producto nuevo
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Solo POST']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$nombre = trim($data['nombre'] ?? '');
$categoria = trim($data['categoria'] ?? 'General');
$termino_busqueda = trim($data['termino_busqueda'] ?? '');

if (!$nombre) {
    http_response_code(400);
    echo json_encode(['error' => 'El nombre del producto es obligatorio.']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO productos (nombre_personalizado, categoria, termino_busqueda) VALUES (:nombre, :cat, :termino)");
    $stmt->execute([
        ':nombre' => strtoupper($nombre),
        ':cat' => strtoupper($categoria),
        ':termino' => $termino_busqueda ?: null
    ]);

    $id = $pdo->lastInsertId();
    echo json_encode(['success' => true, 'id' => $id, 'mensaje' => "Producto '$nombre' agregado con ID $id."]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
