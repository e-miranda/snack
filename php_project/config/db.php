<?php
/**
 * Conexión a Base de Datos MySQL con PDO
 * Snack & Restaurant System
 */

// Parámetros de conexión configurables
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'snack_pos');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_CHARSET', 'utf8mb4');

function getDBConnection(): ?PDO {
    static $pdo = null;
    
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // En producción registrar en logs y mostrar mensaje amigable
            error_log("Error de conexión a la BD: " . $e->getMessage());
            return null;
        }
    }
    
    return $pdo;
}

// Función auxiliar para registrar logs de auditoría
function registrarAuditoria(string $modulo, string $accion, string $detalles = ''): void {
    $pdo = getDBConnection();
    if (!$pdo) return;
    
    $usuario = $_SESSION['user_nombre'] ?? 'Invitado/Público';
    $rol = $_SESSION['user_rol'] ?? 'publico';
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    
    try {
        $stmt = $pdo->prepare("INSERT INTO auditoria_logs (usuario_nombre, usuario_rol, modulo, accion, detalles, ip_address) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$usuario, $rol, $modulo, $accion, $detalles, $ip]);
    } catch (Exception $e) {
        error_log("Error en auditoría: " . $e->getMessage());
    }
}
