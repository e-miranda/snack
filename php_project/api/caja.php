<?php
/**
 * API REST: Gestión de Caja y Turnos
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

// 1. APERTURA DE CAJA
if ($action === 'abrir' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $montoInicial = (float)($input['monto_inicial'] ?? 0);
    $obs = $input['observaciones'] ?? '';
    $usuario = $_SESSION['user_nombre'] ?? 'Cajero';

    try {
        // Verificar si ya hay caja abierta
        $stmtCheck = $pdo->query("SELECT id FROM caja_sesiones WHERE estado = 'abierta'");
        if ($stmtCheck->fetch()) {
            echo json_encode(['success' => false, 'error' => 'Ya existe un turno de caja abierto actualmente']);
            exit;
        }

        $stmt = $pdo->prepare("
            INSERT INTO caja_sesiones (abierto_por, monto_inicial, fecha_apertura, estado, observaciones_apertura)
            VALUES (?, ?, NOW(), 'abierta', ?)
        ");
        $stmt->execute([$usuario, $montoInicial, $obs]);

        registrarAuditoria('CAJA', 'Apertura de Turno', "Fondo inicial: S/ " . number_format($montoInicial, 2));

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 2. REGISTRAR MOVIMIENTO (INGRESO / RETIRO)
if ($action === 'movimiento' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $tipo = $input['tipo'] ?? 'retiro';
    $monto = (float)($input['monto'] ?? 0);
    $motivo = $input['motivo'] ?? '';
    $usuario = $_SESSION['user_nombre'] ?? 'Cajero';

    try {
        $stmtCaja = $pdo->query("SELECT id FROM caja_sesiones WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1");
        $sesion = $stmtCaja->fetch();
        if (!$sesion) {
            echo json_encode(['success' => false, 'error' => 'No hay una sesión de caja abierta para registrar movimientos']);
            exit;
        }

        $stmt = $pdo->prepare("
            INSERT INTO caja_movimientos (sesion_id, tipo, monto, motivo, registrado_por)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$sesion['id'], $tipo, $monto, $motivo, $usuario]);

        registrarAuditoria('CAJA', "Movimiento " . strtoupper($tipo), "Monto: S/ " . number_format($monto, 2) . " - $motivo");

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 3. CIERRE DE CAJA (CORTE Z)
if ($action === 'cerrar' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $montoReal = (float)($input['monto_final_real'] ?? 0);
    $obs = $input['observaciones'] ?? '';

    try {
        $stmtCaja = $pdo->query("SELECT * FROM caja_sesiones WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1");
        $sesion = $stmtCaja->fetch();
        if (!$sesion) {
            echo json_encode(['success' => false, 'error' => 'No hay una sesión de caja abierta para cerrar']);
            exit;
        }

        $sesionId = $sesion['id'];

        // Calcular ventas por método
        $stmtVentas = $pdo->prepare("SELECT metodo_pago, SUM(total) as suma FROM pedidos WHERE sesion_caja_id = ? GROUP BY metodo_pago");
        $stmtVentas->execute([$sesionId]);
        $ventasPorMetodo = $stmtVentas->fetchAll();

        $ventasEfectivo = 0.00;
        $ventasTarjeta = 0.00;
        $ventasQR = 0.00;
        $ventasTransferencia = 0.00;
        $totalVentas = 0.00;

        foreach ($ventasPorMetodo as $vm) {
            $m = (float)$vm['suma'];
            $totalVentas += $m;
            if ($vm['metodo_pago'] === 'efectivo') $ventasEfectivo += $m;
            elseif ($vm['metodo_pago'] === 'tarjeta') $ventasTarjeta += $m;
            elseif ($vm['metodo_pago'] === 'qr') $ventasQR += $m;
            elseif ($vm['metodo_pago'] === 'transferencia') $ventasTransferencia += $m;
        }

        // Movimientos
        $stmtMov = $pdo->prepare("SELECT tipo, SUM(monto) as suma FROM caja_movimientos WHERE sesion_id = ? GROUP BY tipo");
        $stmtMov->execute([$sesionId]);
        $movs = $stmtMov->fetchAll();
        $ingresosExtra = 0.00;
        $retiros = 0.00;
        foreach ($movs as $mv) {
            if ($mv['tipo'] === 'ingreso') $ingresosExtra += (float)$mv['suma'];
            if ($mv['tipo'] === 'retiro') $retiros += (float)$mv['suma'];
        }

        $montoEsperado = ((float)$sesion['monto_inicial']) + $ventasEfectivo + $ingresosExtra - $retiros;
        $diferencia = $montoReal - $montoEsperado;

        $stmtCierre = $pdo->prepare("
            UPDATE caja_sesiones SET
                fecha_cierre = NOW(),
                monto_final_esperado = ?,
                monto_final_real = ?,
                diferencia = ?,
                ventas_efectivo = ?,
                ventas_tarjeta = ?,
                ventas_qr = ?,
                ventas_transferencia = ?,
                total_ventas = ?,
                estado = 'cerrada',
                observaciones_cierre = ?
            WHERE id = ?
        ");

        $stmtCierre->execute([
            $montoEsperado, $montoReal, $diferencia,
            $ventasEfectivo, $ventasTarjeta, $ventasQR, $ventasTransferencia, $totalVentas,
            $obs, $sesionId
        ]);

        registrarAuditoria('CAJA', 'Cierre de Turno (Corte Z)', "Sesión #$sesionId cerrada. Total Ventas: S/ " . number_format($totalVentas, 2) . " - Diferencia: S/ " . number_format($diferencia, 2));

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'error' => 'Acción no permitida']);
