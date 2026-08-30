<?php
/**
 * API REST: Gestión de Pedidos y Órdenes
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$pdo = getDBConnection();
if (!$pdo) {
    echo json_encode(['success' => false, 'error' => 'Error de conexión a base de datos']);
    exit;
}

$action = $_GET['action'] ?? '';

// 1. CREAR NUEVO PEDIDO
if ($action === 'crear' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['items'])) {
        echo json_encode(['success' => false, 'error' => 'Datos incompletos o sin productos']);
        exit;
    }

    try {
        $pdo->beginTransaction();

        // Obtener última orden correlativa
        $stmtSeq = $pdo->query("SELECT MAX(id) as max_id FROM pedidos");
        $nextId = ((int)$stmtSeq->fetch()['max_id']) + 1;
        $numOrden = str_pad($nextId, 3, '0', STR_PAD_LEFT);
        $numFactura = "B001-" . str_pad($nextId, 6, '0', STR_PAD_LEFT);

        // Sesión de caja activa
        $stmtCaja = $pdo->query("SELECT id FROM caja_sesiones WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1");
        $sesionCaja = $stmtCaja->fetch();
        $sesionCajaId = $sesionCaja ? $sesionCaja['id'] : null;

        // Calcular totales
        $total = 0.00;
        foreach ($input['items'] as $item) {
            $total += ((float)$item['precio'] * (int)$item['cantidad']);
        }
        $subtotal = $total / 1.18;
        $igv = $total - $subtotal;

        $tipo = $input['tipo'] ?? 'mesa';
        $numeroMesa = $input['numero_mesa'] ?? 'Mesa 1';
        $clienteNombre = $input['cliente_nombre'] ?? 'Cliente General';
        $clienteDoc = $input['cliente_doc'] ?? '';
        $metodoPago = $input['metodo_pago'] ?? 'efectivo';
        $efectivoRecibido = (float)($input['efectivo_recibido'] ?? $total);
        $vueltoEntregado = (float)($input['vuelto_entregado'] ?? 0.00);
        $atendidoPor = $_SESSION['user_nombre'] ?? 'Cajero';

        $stmtPedido = $pdo->prepare("
            INSERT INTO pedidos (
                numero_orden, numero_factura, tipo, numero_mesa, cliente_nombre, cliente_doc,
                metodo_pago, efectivo_recibido, vuelto_entregado, subtotal, igv, total,
                estado, sesion_caja_id, atendido_por
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)
        ");

        $stmtPedido->execute([
            $numOrden, $numFactura, $tipo, $numeroMesa, $clienteNombre, $clienteDoc,
            $metodoPago, $efectivoRecibido, $vueltoEntregado, $subtotal, $igv, $total,
            $sesionCajaId, $atendidoPor
        ]);

        $pedidoId = $pdo->lastInsertId();

        // Insertar items y descontar stock
        $stmtItem = $pdo->prepare("
            INSERT INTO detalle_pedidos (pedido_id, producto_id, producto_nombre, precio_unitario, costo_unitario, cantidad, subtotal, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmtStock = $pdo->prepare("UPDATE productos SET stock = stock - ? WHERE id = ?");

        foreach ($input['items'] as $it) {
            $cant = (int)$it['cantidad'];
            $precio = (float)$it['precio'];
            $costo = (float)($it['costo'] ?? 0);
            $itemSubtotal = $precio * $cant;
            $notas = $it['notas'] ?? '';

            $stmtItem->execute([
                $pedidoId, $it['id'], $it['nombre'], $precio, $costo, $cant, $itemSubtotal, $notas
            ]);

            $stmtStock->execute([$cant, $it['id']]);
        }

        // Auditoría
        registrarAuditoria('VENTAS', 'Nueva Venta / Pedido', "Orden #$numOrden - Factura $numFactura por S/ " . number_format($total, 2));

        $pdo->commit();

        // Enviar a GAS Webhook en segundo plano si está configurado
        try {
            $stmtGas = $pdo->query("SELECT valor FROM configuracion WHERE clave = 'gas_webhook_url'");
            $gasUrl = $stmtGas->fetch()['valor'] ?? '';
            if (!empty($gasUrl)) {
                $payloadGas = [
                    'action' => 'REGISTRAR_VENTA',
                    'orden' => $numOrden,
                    'factura' => $numFactura,
                    'cliente' => $clienteNombre,
                    'total' => $total,
                    'metodo_pago' => $metodoPago,
                    'fecha' => date('Y-m-d H:i:s')
                ];
                @file_get_contents($gasUrl, false, stream_context_create([
                    'http' => [
                        'method' => 'POST',
                        'header' => "Content-type: application/json\r\n",
                        'content' => json_encode($payloadGas),
                        'timeout' => 2
                    ]
                ]));
            }
        } catch (Exception $e) {
            // Ignorar error de webhook externo
        }

        echo json_encode([
            'success' => true,
            'pedido_id' => $pedidoId,
            'numero_orden' => $numOrden,
            'numero_factura' => $numFactura,
            'pedido' => [
                'id' => $pedidoId,
                'numero_orden' => $numOrden,
                'numero_factura' => $numFactura,
                'tipo' => $tipo,
                'numero_mesa' => $numeroMesa,
                'cliente_nombre' => $clienteNombre,
                'metodo_pago' => $metodoPago,
                'subtotal' => $subtotal,
                'igv' => $igv,
                'total' => $total,
                'efectivo_recibido' => $efectivoRecibido,
                'vuelto_entregado' => $vueltoEntregado,
                'items' => $input['items']
            ]
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 2. LISTAR PEDIDOS PARA COCINA (KDS)
if ($action === 'kds_orders') {
    try {
        $stmt = $pdo->query("
            SELECT * FROM pedidos 
            WHERE estado IN ('pendiente', 'en_preparacion', 'listo')
            ORDER BY created_at ASC
        ");
        $pedidos = $stmt->fetchAll();

        $result = [];
        foreach ($pedidos as $p) {
            $stmtItems = $pdo->prepare("SELECT * FROM detalle_pedidos WHERE pedido_id = ?");
            $stmtItems->execute([$p['id']]);
            $p['items'] = $stmtItems->fetchAll();
            $result[] = $p;
        }

        echo json_encode(['success' => true, 'pedidos' => $result]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 3. CAMBIAR ESTADO DE PEDIDO
if ($action === 'cambiar_estado' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $pedidoId = (int)($input['pedido_id'] ?? 0);
    $nuevoEstado = $input['estado'] ?? '';

    $validos = ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'];
    if (!$pedidoId || !in_array($nuevoEstado, $validos)) {
        echo json_encode(['success' => false, 'error' => 'Parámetros inválidos']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE pedidos SET estado = ? WHERE id = ?");
        $stmt->execute([$nuevoEstado, $pedidoId]);

        registrarAuditoria('COCINA', 'Cambio de Estado', "Pedido #$pedidoId cambiado a $nuevoEstado");
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'error' => 'Acción no reconocida']);
