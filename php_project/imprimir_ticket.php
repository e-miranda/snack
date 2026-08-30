<?php
require_once __DIR__ . '/config/db.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$pdo = getDBConnection();
$pedido = null;
$items = [];
$config = [];

if ($pdo && $id > 0) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM pedidos WHERE id = ?");
        $stmt->execute([$id]);
        $pedido = $stmt->fetch();

        if ($pedido) {
            $stmtItems = $pdo->prepare("SELECT * FROM detalle_pedidos WHERE pedido_id = ?");
            $stmtItems->execute([$id]);
            $items = $stmtItems->fetchAll();
        }

        $stmtCfg = $pdo->query("SELECT clave, valor FROM configuracion");
        while ($row = $stmtCfg->fetch()) {
            $config[$row['clave']] = $row['valor'];
        }
    } catch (Exception $e) {
        error_log("Error al imprimir ticket: " . $e->getMessage());
    }
}

if (!$pedido) {
    die("Pedido no encontrado");
}

$nombreEmpresa = $config['nombre_restaurante'] ?? 'SNACK & RESTAURANT PRO';
$ruc = $config['ruc'] ?? '20601234567';
$direccion = $config['direccion'] ?? 'Av. Gastronomía 456, Lima - Perú';
$telefono = $config['telefono'] ?? '+51 987 654 321';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket <?= htmlspecialchars($pedido['numero_factura']) ?></title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Courier New', Courier, monospace;
        }
        body {
            background-color: #f3f4f6;
            padding: 20px;
            display: flex;
            justify-content: center;
        }
        .ticket {
            width: 80mm;
            background: white;
            padding: 15px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            font-size: 11px;
            line-height: 1.3;
            color: #000;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
        }
        .divider-solid {
            border-top: 1px solid #000;
            margin: 8px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        table th {
            text-align: left;
            border-bottom: 1px dashed #000;
            padding-bottom: 4px;
        }
        table td {
            padding: 3px 0;
        }
        .flex {
            display: flex;
            justify-content: space-between;
        }
        .actions {
            margin-bottom: 15px;
            text-align: center;
        }
        .btn-print {
            background: #ea580c;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .ticket {
                width: 100%;
                box-shadow: none;
                padding: 0;
            }
            .actions {
                display: none;
            }
        }
    </style>
</head>
<body>

<div>
    <div class="actions">
        <button onclick="window.print()" class="btn-print">🖨️ Imprimir Ticket</button>
    </div>

    <div class="ticket">
        
        <!-- Header -->
        <div class="text-center">
            <h2 style="font-size: 14px; font-weight: 900;"><?= htmlspecialchars($nombreEmpresa) ?></h2>
            <p>RUC: <?= htmlspecialchars($ruc) ?></p>
            <p><?= htmlspecialchars($direccion) ?></p>
            <p>Tel: <?= htmlspecialchars($telefono) ?></p>
            <div class="divider-solid"></div>
            <h3 style="font-size: 12px; font-weight: bold;"><?= htmlspecialchars($pedido['numero_factura']) ?></h3>
            <p>ORDEN DE SERVICIO: #<?= htmlspecialchars($pedido['numero_orden']) ?></p>
        </div>

        <div class="divider"></div>

        <!-- Details -->
        <div>
            <p><b>Fecha/Hora:</b> <?= date('d/m/Y H:i:s', strtotime($pedido['created_at'])) ?></p>
            <p><b>Tipo:</b> <?= $pedido['tipo'] === 'mesa' ? 'Consumo en Mesa (' . htmlspecialchars($pedido['numero_mesa']) . ')' : 'Para Llevar' ?></p>
            <p><b>Cliente:</b> <?= htmlspecialchars($pedido['cliente_nombre']) ?></p>
            <?php if (!empty($pedido['cliente_doc'])): ?>
                <p><b>DNI/RUC:</b> <?= htmlspecialchars($pedido['cliente_doc']) ?></p>
            <?php endif; ?>
            <p><b>Atendido por:</b> <?= htmlspecialchars($pedido['atendido_por']) ?></p>
            <p><b>Forma de Pago:</b> <?= strtoupper(htmlspecialchars($pedido['metodo_pago'])) ?></p>
        </div>

        <div class="divider"></div>

        <!-- Items Table -->
        <table>
            <thead>
                <tr>
                    <th style="width: 15%;">Cant</th>
                    <th style="width: 55%;">Descripción</th>
                    <th style="width: 30%;" class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($items as $item): ?>
                <tr>
                    <td class="font-bold"><?= $item['cantidad'] ?></td>
                    <td>
                        <?= htmlspecialchars($item['producto_nombre']) ?>
                        <?php if (!empty($item['notas'])): ?>
                            <br><small style="font-style: italic;">* <?= htmlspecialchars($item['notas']) ?></small>
                        <?php endif; ?>
                    </td>
                    <td class="text-right">S/ <?= number_format($item['subtotal'], 2) ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <div class="divider"></div>

        <!-- Totals -->
        <div style="font-size: 11px;">
            <div class="flex">
                <span>Op. Gravada:</span>
                <span>S/ <?= number_format($pedido['subtotal'], 2) ?></span>
            </div>
            <div class="flex">
                <span>I.G.V. (18%):</span>
                <span>S/ <?= number_format($pedido['igv'], 2) ?></span>
            </div>
            <div class="flex font-bold" style="font-size: 13px; margin-top: 4px; border-top: 1px solid #000; padding-top: 4px;">
                <span>IMPORTE TOTAL:</span>
                <span>S/ <?= number_format($pedido['total'], 2) ?></span>
            </div>
            <?php if ($pedido['metodo_pago'] === 'efectivo'): ?>
            <div class="flex" style="margin-top: 2px;">
                <span>Efectivo Recibido:</span>
                <span>S/ <?= number_format($pedido['efectivo_recibido'], 2) ?></span>
            </div>
            <div class="flex font-bold" style="color: #000;">
                <span>Vuelto / Cambio:</span>
                <span>S/ <?= number_format($pedido['vuelto_entregado'], 2) ?></span>
            </div>
            <?php endif; ?>
        </div>

        <div class="divider"></div>

        <!-- Footer -->
        <div class="text-center" style="font-size: 10px; margin-top: 8px;">
            <p class="font-bold">¡GRACIAS POR SU COMPRA!</p>
            <p>Representación Impresa de Boleta de Venta Electrónica</p>
        </div>

    </div>
</div>

<script>
    // Auto launch print dialog
    window.addEventListener('load', () => {
        // window.print();
    });
</script>

</body>
</html>
