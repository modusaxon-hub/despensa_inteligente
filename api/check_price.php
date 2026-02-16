<?php
header('Content-Type: application/json');

// Recibe URL y Selector, ejecuta el bot en modo chequeo rápido y devuelve el precio.
if (php_sapi_name() !== 'cli' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

set_time_limit(120); // 2 minutos máximo

$data = json_decode(file_get_contents('php://input'), true);
$url = trim($data['url'] ?? '');
$selector = trim($data['selector'] ?? '');

if (!$url) {
    http_response_code(400);
    echo json_encode(['error' => 'Falta URL']);
    exit;
}

// Configurar ruta de navegadores compartidos
putenv("PLAYWRIGHT_BROWSERS_PATH=" . realpath(__DIR__ . '/../scrapers/browsers_final'));
putenv('PYTHONIOENCODING=utf-8');

$scriptPath = realpath(__DIR__ . '/../scrapers/auto_bot.py');
if (!$scriptPath) {
    echo json_encode(['success' => false, 'error' => 'No se encuentra el script scrapeador']);
    exit;
}

$cmd = escapeshellarg(PYTHON_PATH) . " " . escapeshellarg($scriptPath) . " --check " . escapeshellarg($url) . " " . escapeshellarg($selector);

// Ejecutar comando
$output = shell_exec($cmd . " 2>&1"); // Capturar stderr también

// Buscar el resultado en la salida
if (preg_match('/RESULT_PRICE:(\d+)/', $output, $matches)) {
    $price = intval($matches[1]);
    
    // Si se encontró precio, guardarlo en BD si tenemos los datos necesarios
    $producto_id = intval($data['producto_id'] ?? 0);
    $tienda = trim($data['tienda'] ?? '');
    
    $guardado = false;
    if ($price > 0 && $producto_id && $tienda) {
        try {
            $stmt = $pdo->prepare("INSERT INTO precios_tiendas (producto_id, tienda, precio, fecha_registro) VALUES (:pid, :tienda, :precio, NOW())");
            $stmt->execute([
                ':pid' => $producto_id,
                ':tienda' => strtoupper($tienda),
                ':precio' => $price
            ]);
            $guardado = true;
        } catch (PDOException $e) {
            // Ignorar error de BD, pero reportarlo en debug si es necesario
        }
    }

    echo json_encode([
        'success' => true,
        'precio' => $price,
        'mensaje' => $price > 0 ? "✅ Precio actualizado: $$price" : "Precio 0 encontrado.",
        'guardado' => $guardado
    ]);
} else {
    // Analizar error
    $errorMsg = "Error desconocido al ejecutar el bot.";
    if (preg_match('/ERROR_SCRAPE:(.+)/', $output, $errMatches)) {
        $errorMsg = trim($errMatches[1]);
    }
    
    echo json_encode([
        'success' => false, 
        'error' => $errorMsg,
        'debug_output' => $output // Útil para depurar
    ]);
}
?>
