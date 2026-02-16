<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';

// Ejecutar el scraper completo (todos los productos)
// Esto puede tardar varios minutos.

// Aumentar tiempo de ejecución
set_time_limit(600); // 10 minutos

// Ruta al script
$scriptPath = realpath(__DIR__ . '/../scrapers/auto_bot.py');
if (!$scriptPath) {
    echo json_encode(['success' => false, 'error' => 'No se encuentra el script']);
    exit;
}

// Configurar ruta de navegadores compartidos para evitar error de Playwright
putenv("PLAYWRIGHT_BROWSERS_PATH=" . realpath(__DIR__ . '/../scrapers/browsers_final'));
// Forzar UTF-8 para evitar errores de codificación en logs
putenv('PYTHONIOENCODING=utf-8');

// Ejecutar sin argumentos = Modo Full
// Usamos PYTHON_PATH definido en config/db.php para evitar problemas de permisos
$cmd = escapeshellarg(PYTHON_PATH) . " " . escapeshellarg($scriptPath);

// Ejecutar y capturar salida
$output = shell_exec($cmd . " 2>&1");

// Verificar si hubo éxito
if (strpos($output, 'Sincronización finalizada') !== false) {
    echo json_encode([
        'success' => true,
        'mensaje' => '✅ Escaneo completo finalizado exitosamente.',
        'log' => substr($output, -1000) // Últimos 1000 caracteres
    ]);
} else {
    // En caso de error, devolver TODO el output para debug
    echo json_encode([
        'success' => false,
        'error' => 'El scraper terminó con posibles errores o no completó.',
        'log' => $output
    ]);
}
?>
