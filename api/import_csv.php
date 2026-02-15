<?php
require_once '../config/db.php';

// Script para importar el CSV a la base de datos
$csvFile = '../documentation/Mercado 2026 - DIC_25.csv';

if (!file_exists($csvFile)) {
    die("El archivo CSV no existe.");
}

$file = fopen($csvFile, 'r');
$headers = fgetcsv($file); // Saltar cabecera

$count = 0;
while (($data = fgetcsv($file)) !== FALSE) {
    // Validar que la línea tenga contenido y no sea solo comas
    if (empty($data[1]) || $data[1] == 'LISTADO DE PRODUCTOS') continue;
    
    // El CSV tiene: CANT (0), LISTADO (1), O(2), D(3), R(4), MCDO(5), -$(6), TOTAL(7), TIENDA(8)
    $nombre = $data[1];
    $categoria = ''; // Podríamos inferir la categoría si detectamos filas de cabecera en el CSV
    $precio_ref = str_replace(['$', '.', ' '], '', $data[6]);
    $tienda = $data[8];
    $cantidad = (float)$data[0];

    // Evitar filas vacías o de separadores
    if (strlen($nombre) < 3) continue;

    $stmt = $pdo->prepare("INSERT INTO productos (nombre, categoria, precio_referencia, tienda_preferida, cantidad_actual) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$nombre, $categoria, (float)$precio_ref, $tienda, $cantidad]);
    $count++;
}

fclose($file);
echo "Importación completada: $count productos insertados.";
?>
