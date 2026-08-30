<?php
$pageTitle = 'Control & Arqueo de Caja';
$activePage = 'caja';
require_once __DIR__ . '/includes/header.php';
requirePermission('can_manage_cash');

$pdo = getDBConnection();
$sesionActiva = null;
$movimientos = [];
$ventasSesion = [];
$historialCierres = [];

if ($pdo) {
    try {
        // Sesión activa
        $stmt = $pdo->query("SELECT * FROM caja_sesiones WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1");
        $sesionActiva = $stmt->fetch();

        if ($sesionActiva) {
            $sesionId = $sesionActiva['id'];
            // Movimientos de caja chica
            $stmtMov = $pdo->prepare("SELECT * FROM caja_movimientos WHERE sesion_id = ? ORDER BY fecha DESC");
            $stmtMov->execute([$sesionId]);
            $movimientos = $stmtMov->fetchAll();

            // Ventas de la sesión
            $stmtVentas = $pdo->prepare("SELECT * FROM pedidos WHERE sesion_caja_id = ? ORDER BY created_at DESC");
            $stmtVentas->execute([$sesionId]);
            $ventasSesion = $stmtVentas->fetchAll();
        }

        // Historial de cierres anteriores
        $historialCierres = $pdo->query("SELECT * FROM caja_sesiones WHERE estado = 'cerrada' ORDER BY id DESC LIMIT 10")->fetchAll();
    } catch (Exception $e) {
        error_log("Error cargando caja: " . $e->getMessage());
    }
}

// Cálculos de la sesión activa
$montoInicial = $sesionActiva ? (float)$sesionActiva['monto_inicial'] : 0.00;
$totalIngresosExtra = 0.00;
$totalRetiros = 0.00;
foreach ($movimientos as $m) {
    if ($m['tipo'] === 'ingreso') $totalIngresosExtra += (float)$m['monto'];
    if ($m['tipo'] === 'retiro') $totalRetiros += (float)$m['monto'];
}

$ventasEfectivo = 0.00;
$ventasTarjeta = 0.00;
$ventasQR = 0.00;
$ventasTransferencia = 0.00;
$totalVentasMonto = 0.00;

foreach ($ventasSesion as $v) {
    $monto = (float)$v['total'];
    $totalVentasMonto += $monto;
    if ($v['metodo_pago'] === 'efectivo') $ventasEfectivo += $monto;
    elseif ($v['metodo_pago'] === 'tarjeta') $ventasTarjeta += $monto;
    elseif ($v['metodo_pago'] === 'qr') $ventasQR += $monto;
    elseif ($v['metodo_pago'] === 'transferencia') $ventasTransferencia += $monto;
}

$efectivoTeoricoEnCaja = $montoInicial + $ventasEfectivo + $totalIngresosExtra - $totalRetiros;
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col space-y-6">

    <!-- Header Section -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold">
                <i data-lucide="vault" class="w-5 h-5"></i>
            </div>
            <div>
                <h1 class="text-lg font-bold text-white leading-tight">Módulo de Caja, Turnos & Arqueo</h1>
                <p class="text-xs text-slate-400">Control de flujo de efectivo, cuadre Z y auditoría de ingresos</p>
            </div>
        </div>

        <div class="flex items-center gap-2">
            <?php if ($sesionActiva): ?>
                <button onclick="openModalMovimiento()" class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-700">
                    <i data-lucide="arrow-up-down" class="w-3.5 h-3.5 text-amber-400"></i>
                    <span>Registrar Ingreso / Retiro</span>
                </button>
                <button onclick="openModalCierre()" class="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20 flex items-center gap-1.5">
                    <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                    <span>Cerrar Turno (Corte Z)</span>
                </button>
            <?php else: ?>
                <button onclick="openModalApertura()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-1.5">
                    <i data-lucide="key" class="w-3.5 h-3.5"></i>
                    <span>Aperturar Nuevo Turno de Caja</span>
                </button>
            <?php endif; ?>
        </div>
    </div>

    <?php if ($sesionActiva): ?>
    <!-- Active Shift Dashboard: 4 Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div class="flex items-center justify-between text-slate-400 text-xs">
                <span>Fondo Inicial</span>
                <i data-lucide="piggy-bank" class="w-4 h-4 text-orange-400"></i>
            </div>
            <div class="mt-2">
                <div class="text-2xl font-black text-white">S/ <?= number_format($montoInicial, 2) ?></div>
                <p class="text-[11px] text-slate-400 mt-1">Aperturado: <?= date('d/m/Y H:i', strtotime($sesionActiva['fecha_apertura'])) ?></p>
            </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div class="flex items-center justify-between text-slate-400 text-xs">
                <span>Ventas Totales (<?= count($ventasSesion) ?> ord.)</span>
                <i data-lucide="trending-up" class="w-4 h-4 text-emerald-400"></i>
            </div>
            <div class="mt-2">
                <div class="text-2xl font-black text-emerald-400">S/ <?= number_format($totalVentasMonto, 2) ?></div>
                <p class="text-[11px] text-slate-400 mt-1">Efectivo: S/ <?= number_format($ventasEfectivo, 2) ?> | Digital: S/ <?= number_format($totalVentasMonto - $ventasEfectivo, 2) ?></p>
            </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div class="flex items-center justify-between text-slate-400 text-xs">
                <span>Movimientos Caja Chica</span>
                <i data-lucide="arrow-left-right" class="w-4 h-4 text-amber-400"></i>
            </div>
            <div class="mt-2">
                <div class="text-lg font-black text-white flex items-center gap-2">
                    <span class="text-emerald-400">+S/ <?= number_format($totalIngresosExtra, 2) ?></span>
                    <span class="text-slate-600">/</span>
                    <span class="text-rose-400">-S/ <?= number_format($totalRetiros, 2) ?></span>
                </div>
                <p class="text-[11px] text-slate-400 mt-1"><?= count($movimientos) ?> registros manuales</p>
            </div>
        </div>

        <div class="bg-gradient-to-br from-slate-900 to-slate-950 border border-orange-500/40 rounded-2xl p-4 flex flex-col justify-between shadow-xl">
            <div class="flex items-center justify-between text-orange-400 text-xs font-bold uppercase tracking-wider">
                <span>Efectivo Físico Esperado</span>
                <i data-lucide="calculator" class="w-4 h-4 text-orange-400"></i>
            </div>
            <div class="mt-2">
                <div class="text-2xl font-black text-orange-400">S/ <?= number_format($efectivoTeoricoEnCaja, 2) ?></div>
                <p class="text-[10px] text-slate-400 mt-1">Fondo + Ventas Efectivo + Ingresos - Retiros</p>
            </div>
        </div>

    </div>

    <!-- Middle: Two Columns (Left: Sales Breakdown by Method & Details, Right: Cash Movements log) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Sales Breakdown (7 Cols) -->
        <div class="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 class="font-bold text-white text-sm flex items-center gap-2">
                    <i data-lucide="receipt" class="w-4 h-4 text-orange-500"></i>
                    Reporte Parcial de Ventas (Corte X)
                </h3>
                <span class="text-xs text-slate-400">Sesión #<?= $sesionActiva['id'] ?></span>
            </div>

            <!-- Payment Methods Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span class="text-slate-400 block text-[10px]">💵 Efectivo</span>
                    <span class="text-sm font-black text-white">S/ <?= number_format($ventasEfectivo, 2) ?></span>
                </div>
                <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span class="text-slate-400 block text-[10px]">💳 Tarjeta POS</span>
                    <span class="text-sm font-black text-white">S/ <?= number_format($ventasTarjeta, 2) ?></span>
                </div>
                <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span class="text-slate-400 block text-[10px]">📱 QR Yape/Plin</span>
                    <span class="text-sm font-black text-white">S/ <?= number_format($ventasQR, 2) ?></span>
                </div>
                <div class="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span class="text-slate-400 block text-[10px]">🏦 Transferencia</span>
                    <span class="text-sm font-black text-white">S/ <?= number_format($ventasTransferencia, 2) ?></span>
                </div>
            </div>

            <!-- Detailed Sales Table -->
            <div class="flex-1 overflow-y-auto max-h-72">
                <h4 class="text-xs font-bold text-slate-300 mb-2">Últimas Transacciones del Turno:</h4>
                <?php if (empty($ventasSesion)): ?>
                    <p class="text-xs text-slate-500 text-center py-6">Aún no hay ventas registradas en este turno.</p>
                <?php else: ?>
                    <div class="space-y-1.5">
                        <?php foreach ($ventasSesion as $v): ?>
                        <div class="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                            <div>
                                <div class="font-bold text-white flex items-center gap-2">
                                    <span><?= htmlspecialchars($v['numero_factura']) ?></span>
                                    <span class="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-slate-800 text-orange-400"><?= htmlspecialchars($v['metodo_pago']) ?></span>
                                </div>
                                <span class="text-[10px] text-slate-400"><?= htmlspecialchars($v['cliente_nombre']) ?> • <?= date('H:i:s', strtotime($v['created_at'])) ?></span>
                            </div>
                            <div class="text-right">
                                <span class="font-black text-orange-400">S/ <?= number_format($v['total'], 2) ?></span>
                                <a href="imprimir_ticket.php?id=<?= $v['id'] ?>" target="_blank" class="block text-[10px] text-slate-400 hover:text-white underline">Ticket</a>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Right: Cash Movements (5 Cols) -->
        <div class="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 class="font-bold text-white text-sm flex items-center gap-2">
                    <i data-lucide="arrow-up-down" class="w-4 h-4 text-amber-500"></i>
                    Movimientos de Caja Chica
                </h3>
                <span class="text-xs text-slate-400"><?= count($movimientos) ?> reg.</span>
            </div>

            <div class="flex-1 overflow-y-auto max-h-96 space-y-2">
                <?php if (empty($movimientos)): ?>
                    <p class="text-xs text-slate-500 text-center py-10">No hay ingresos ni egresos extraordinarios.</p>
                <?php else: ?>
                    <?php foreach ($movimientos as $m): ?>
                    <div class="p-3 rounded-xl border <?= $m['tipo'] === 'ingreso' ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-rose-950/20 border-rose-800/40' ?> text-xs flex items-center justify-between">
                        <div>
                            <div class="flex items-center gap-1.5 font-bold <?= $m['tipo'] === 'ingreso' ? 'text-emerald-400' : 'text-rose-400' ?>">
                                <i data-lucide="<?= $m['tipo'] === 'ingreso' ? 'arrow-down-left' : 'arrow-up-right' ?>" class="w-3.5 h-3.5"></i>
                                <span><?= strtoupper($m['tipo']) ?>: S/ <?= number_format($m['monto'], 2) ?></span>
                            </div>
                            <p class="text-[11px] text-slate-300 mt-0.5"><?= htmlspecialchars($m['motivo']) ?></p>
                            <span class="text-[9px] text-slate-500"><?= htmlspecialchars($m['registrado_por']) ?> • <?= date('H:i', strtotime($m['fecha'])) ?></span>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

    </div>

    <?php else: ?>
    <!-- No Active Shift State -->
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto my-8 shadow-2xl">
        <div class="w-16 h-16 rounded-2xl bg-orange-600/20 text-orange-400 flex items-center justify-center mx-auto mb-4">
            <i data-lucide="lock" class="w-8 h-8"></i>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">No hay un turno de caja abierto</h2>
        <p class="text-slate-400 text-xs mb-6 leading-relaxed">
            Para poder procesar ventas en el Punto de Venta (POS) y registrar cobros en efectivo, debes aperturar un turno indicando el fondo inicial para cambio.
        </p>
        <button onclick="openModalApertura()" class="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-xl shadow-orange-600/30 transition-all inline-flex items-center gap-2">
            <i data-lucide="key" class="w-4 h-4"></i>
            <span>Aperturar Turno con Fondo Inicial</span>
        </button>
    </div>
    <?php endif; ?>

    <!-- History of Closed Shifts -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 class="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <i data-lucide="history" class="w-4 h-4 text-slate-400"></i>
            Historial de Cierres de Caja Anteriores (Corte Z)
        </h3>
        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                        <th class="p-3">ID</th>
                        <th class="p-3">Aperturado Por</th>
                        <th class="p-3">Fondo Inicial</th>
                        <th class="p-3">Total Ventas</th>
                        <th class="p-3">Monto Real Físico</th>
                        <th class="p-3">Diferencia</th>
                        <th class="p-3">Fecha Cierre</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                    <?php if (empty($historialCierres)): ?>
                        <tr><td colspan="7" class="p-4 text-center text-slate-500">No hay historial previo registrado</td></tr>
                    <?php else: ?>
                        <?php foreach ($historialCierres as $h): ?>
                        <tr class="hover:bg-slate-800/40">
                            <td class="p-3 font-bold text-white">#<?= $h['id'] ?></td>
                            <td class="p-3"><?= htmlspecialchars($h['abierto_por']) ?></td>
                            <td class="p-3 font-medium">S/ <?= number_format($h['monto_inicial'], 2) ?></td>
                            <td class="p-3 font-bold text-emerald-400">S/ <?= number_format($h['total_ventas'], 2) ?></td>
                            <td class="p-3 font-bold text-white">S/ <?= number_format($h['monto_final_real'], 2) ?></td>
                            <td class="p-3 font-bold <?= (float)$h['diferencia'] < 0 ? 'text-rose-400' : ((float)$h['diferencia'] > 0 ? 'text-emerald-400' : 'text-slate-400') ?>">
                                <?= (float)$h['diferencia'] >= 0 ? '+' : '' ?>S/ <?= number_format($h['diferencia'], 2) ?>
                            </td>
                            <td class="p-3 text-slate-400"><?= date('d/m/Y H:i', strtotime($h['fecha_cierre'])) ?></td>
                        </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

</div>

<!-- Modal Apertura de Caja -->
<div id="modal-apertura" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm hidden items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
        <h3 class="font-bold text-white text-base mb-2 flex items-center gap-2">
            <i data-lucide="key" class="w-5 h-5 text-emerald-400"></i>
            Aperturar Turno de Caja
        </h3>
        <p class="text-xs text-slate-400 mb-4">Ingresa el monto de fondo inicial en efectivo para vuelto/cambio.</p>
        
        <form onsubmit="submitApertura(event)" class="space-y-4 text-xs">
            <div>
                <label class="block text-slate-300 font-bold mb-1">Monto Inicial en Efectivo (S/):</label>
                <input type="number" step="0.50" id="apertura_monto" required value="100.00" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-lg font-black text-white focus:outline-none focus:border-orange-500">
            </div>
            <div>
                <label class="block text-slate-300 font-bold mb-1">Observaciones de Apertura (Opcional):</label>
                <textarea id="apertura_obs" rows="2" placeholder="Ej: Billetes de 10 y monedas de 1 y 2 soles" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-orange-500"></textarea>
            </div>
            <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg">Aperturar Caja</button>
                <button type="button" onclick="closeModalApertura()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">Cancelar</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal Movimiento de Caja Chica -->
<div id="modal-movimiento" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm hidden items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
        <h3 class="font-bold text-white text-base mb-2 flex items-center gap-2">
            <i data-lucide="arrow-up-down" class="w-5 h-5 text-amber-400"></i>
            Movimiento de Caja Chica
        </h3>
        <p class="text-xs text-slate-400 mb-4">Registra ingresos extras o retiros de efectivo con justificación.</p>
        
        <form onsubmit="submitMovimiento(event)" class="space-y-4 text-xs">
            <div>
                <label class="block text-slate-300 font-bold mb-1">Tipo de Movimiento:</label>
                <select id="mov_tipo" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-orange-500">
                    <option value="retiro">🔻 Retiro / Egreso (Pago a proveedor, compra urgente, etc)</option>
                    <option value="ingreso">🔺 Ingreso Extra (Aporte de cambio, cobranza externa, etc)</option>
                </select>
            </div>
            <div>
                <label class="block text-slate-300 font-bold mb-1">Monto (S/):</label>
                <input type="number" step="0.50" id="mov_monto" required placeholder="0.00" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-base font-black text-white focus:outline-none focus:border-orange-500">
            </div>
            <div>
                <label class="block text-slate-300 font-bold mb-1">Motivo / Justificación:</label>
                <input type="text" id="mov_motivo" required placeholder="Ej: Compra de hielo y servilletas de emergencia" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-orange-500">
            </div>
            <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-lg">Registrar Movimiento</button>
                <button type="button" onclick="closeModalMovimiento()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">Cancelar</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal Cierre de Caja (Corte Z) -->
<div id="modal-cierre" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm hidden items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
        <h3 class="font-bold text-white text-base mb-2 flex items-center gap-2">
            <i data-lucide="lock" class="w-5 h-5 text-rose-400"></i>
            Cierre de Turno & Arqueo (Corte Z)
        </h3>
        <p class="text-xs text-slate-400 mb-4">Ingresa el recuento físico de efectivo para verificar sobrantes o faltantes.</p>
        
        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 text-xs space-y-1">
            <div class="flex justify-between text-slate-400"><span>Efectivo Esperado en Gaveta:</span><span class="font-bold text-white">S/ <?= number_format($efectivoTeoricoEnCaja, 2) ?></span></div>
            <div class="flex justify-between text-slate-400"><span>Ventas Totales del Turno:</span><span class="font-bold text-emerald-400">S/ <?= number_format($totalVentasMonto, 2) ?></span></div>
        </div>

        <form onsubmit="submitCierre(event)" class="space-y-4 text-xs">
            <div>
                <label class="block text-slate-300 font-bold mb-1">Efectivo Físico Contado (S/):</label>
                <input type="number" step="0.50" id="cierre_monto_real" oninput="checkDiferencia(this.value, <?= $efectivoTeoricoEnCaja ?>)" required placeholder="0.00" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-lg font-black text-white focus:outline-none focus:border-orange-500">
                <div id="cierre_diff_alert" class="text-xs font-bold mt-1 text-slate-400">Diferencia: S/ 0.00</div>
            </div>
            <div>
                <label class="block text-slate-300 font-bold mb-1">Observaciones de Cierre:</label>
                <textarea id="cierre_obs" rows="2" placeholder="Notas sobre el cuadre de caja..." class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-orange-500"></textarea>
            </div>
            <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg">Confirmar Cierre de Turno</button>
                <button type="button" onclick="closeModalCierre()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">Cancelar</button>
            </div>
        </form>
    </div>
</div>

<script>
function openModalApertura() { document.getElementById('modal-apertura').classList.remove('hidden'); document.getElementById('modal-apertura').classList.add('flex'); }
function closeModalApertura() { document.getElementById('modal-apertura').classList.add('hidden'); document.getElementById('modal-apertura').classList.remove('flex'); }

function openModalMovimiento() { document.getElementById('modal-movimiento').classList.remove('hidden'); document.getElementById('modal-movimiento').classList.add('flex'); }
function closeModalMovimiento() { document.getElementById('modal-movimiento').classList.add('hidden'); document.getElementById('modal-movimiento').classList.remove('flex'); }

function openModalCierre() { document.getElementById('modal-cierre').classList.remove('hidden'); document.getElementById('modal-cierre').classList.add('flex'); }
function closeModalCierre() { document.getElementById('modal-cierre').classList.add('hidden'); document.getElementById('modal-cierre').classList.remove('flex'); }

function checkDiferencia(val, expected) {
    const real = parseFloat(val) || 0;
    const diff = real - expected;
    const alert = document.getElementById('cierre_diff_alert');
    if (diff === 0) {
        alert.innerText = 'Cuadre perfecto (Diferencia: S/ 0.00)';
        alert.className = 'text-xs font-bold mt-1 text-emerald-400';
    } else if (diff > 0) {
        alert.innerText = `Sobrante en caja: +S/ ${diff.toFixed(2)}`;
        alert.className = 'text-xs font-bold mt-1 text-emerald-400';
    } else {
        alert.innerText = `Faltante en caja: S/ ${diff.toFixed(2)}`;
        alert.className = 'text-xs font-bold mt-1 text-rose-400';
    }
}

async function submitApertura(e) {
    e.preventDefault();
    const monto = document.getElementById('apertura_monto').value;
    const obs = document.getElementById('apertura_obs').value;

    const res = await fetch('api/caja.php?action=abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto_inicial: monto, observaciones: obs })
    });
    const data = await res.json();
    if (data.success) {
        location.reload();
    } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.error, background: '#0f172a', color: '#fff' });
    }
}

async function submitMovimiento(e) {
    e.preventDefault();
    const tipo = document.getElementById('mov_tipo').value;
    const monto = document.getElementById('mov_monto').value;
    const motivo = document.getElementById('mov_motivo').value;

    const res = await fetch('api/caja.php?action=movimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, monto, motivo })
    });
    const data = await res.json();
    if (data.success) {
        location.reload();
    } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.error, background: '#0f172a', color: '#fff' });
    }
}

async function submitCierre(e) {
    e.preventDefault();
    const montoReal = document.getElementById('cierre_monto_real').value;
    const obs = document.getElementById('cierre_obs').value;

    const res = await fetch('api/caja.php?action=cerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto_final_real: montoReal, observaciones: obs })
    });
    const data = await res.json();
    if (data.success) {
        Swal.fire({
            icon: 'success',
            title: 'Turno Cerrado',
            text: 'Corte Z generado exitosamente.',
            background: '#0f172a',
            color: '#fff'
        }).then(() => location.reload());
    } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.error, background: '#0f172a', color: '#fff' });
    }
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
