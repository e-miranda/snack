<?php
/**
 * API REST: Conector con Google Apps Script
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$pdo = getDBConnection();
if (!$pdo) {
    echo json_encode(['success' => false, 'error' => 'Error de base de datos']);
    exit;
}

$action = $_GET['action'] ?? '';

// 1. GUARDAR URL DEL WEBHOOK DE GOOGLE APPS SCRIPT
if ($action === 'guardar_url' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $url = trim($input['url'] ?? '');

    try {
        $stmt = $pdo->prepare("INSERT INTO configuracion (clave, valor) VALUES ('gas_webhook_url', ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)");
        $stmt->execute([$url]);
        
        registrarAuditoria('SISTEMA', 'Actualización Webhook Google Sheets', "Nueva URL guardada");
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 2. TEST DE SINCRONIZACIÓN CON GOOGLE APPS SCRIPT
if ($action === 'test_sync') {
    try {
        $stmt = $pdo->query("SELECT valor FROM configuracion WHERE clave = 'gas_webhook_url'");
        $row = $stmt->fetch();
        $url = $row ? $row['valor'] : '';

        if (empty($url)) {
            echo json_encode(['success' => false, 'message' => 'No hay una URL de Google Apps Script configurada']);
            exit;
        }

        $payload = [
            'action' => 'PING_TEST',
            'mensaje' => 'Conexión exitosa desde Snack POS PHP',
            'timestamp' => date('Y-m-d H:i:s'),
            'sistema' => 'PHP 8.2 + MySQL'
        ];

        $options = [
            'http' => [
                'header'  => "Content-type: application/json\r\n",
                'method'  => 'POST',
                'content' => json_encode($payload),
                'timeout' => 5
            ]
        ];

        $context  = stream_context_create($options);
        $result = @file_get_contents($url, false, $context);

        echo json_encode(['success' => true, 'response' => $result]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'error' => 'Acción no permitida']);
