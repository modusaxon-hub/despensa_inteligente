<?php
// Configuración de conexión a la base de datos (Estándar ADSO)
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'despensa_inteligente');
define('DB_USER', 'root');
define('DB_PASS', '');

// Ruta absoluta a Python (Instalación Global)
define('PYTHON_PATH', 'C:\\Program Files\\Python312\\python.exe');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}
?>
