<?php
$pageTitle = 'Administración & Inventario';
$activePage = 'admin';
require_once __DIR__ . '/includes/header.php';
requirePermission('can_manage_inventory');

$pdo = getDBConnection();
$stats = [
    'total_ventas' => 0.00,
    'total_pedidos' => 0,
    'ticket_promedio' => 0.00,
    'costo_total' => 0.00,
    'ganancia_bruta' => 0.00,
    'valor_inventario' => 0.00,
    'productos_alerta' => 0
];
$productos = [];
$categorias = [];
$usuarios = [];
$logs = [];
$gasUrl = '';

if ($pdo) {
    try {
        // Ventas y KPIs
        $stmtStats = $pdo->query("SELECT COUNT(*) as total_pedidos, COALESCE(SUM(total), 0) as total_ventas FROM pedidos WHERE estado != 'cancelado'");
        $rowStats = $stmtStats->fetch();
        $stats['total_pedidos'] = (int)$rowStats['total_pedidos'];
        $stats['total_ventas'] = (float)$rowStats['total_ventas'];
        if ($stats['total_pedidos'] > 0) {
            $stats['ticket_promedio'] = $stats['total_ventas'] / $stats['total_pedidos'];
        }

        // Inventario y costos
        $productos = $pdo->query("SELECT p.*, c.nombre as categoria_nombre FROM productos p JOIN categorias c ON p.categoria_id = c.id ORDER BY p.stock ASC")->fetchAll();
        $categorias = $pdo->query("SELECT * FROM categorias ORDER BY orden ASC")->fetchAll();
        
        foreach ($productos as $p) {
            $stats['valor_inventario'] += ($p['stock'] * $p['precio']);
            if ($p['stock'] <= $p['min_stock']) {
                $stats['productos_alerta']++;
            }
        }

        // Usuarios
        $usuarios = $pdo->query("SELECT * FROM usuarios ORDER BY id ASC")->fetchAll();

        // Logs de auditoría
        $logs = $pdo->query("SELECT * FROM auditoria_logs ORDER BY created_at DESC LIMIT 20")->fetchAll();

        // Configuración GAS
        $stmtGas = $pdo->query("SELECT valor FROM configuracion WHERE clave = 'gas_webhook_url'");
        $gasRow = $stmtGas->fetch();
        $gasUrl = $gasRow ? $gasRow['valor'] : '';
    } catch (Exception $e) {
        error_log("Error en admin: " . $e->getMessage());
    }
}
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col space-y-6">

    <!-- Header Section -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold">
                <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
            </div>
            <div>
                <h1 class="text-lg font-bold text-white leading-tight">Panel Administrativo & Gestión Integral</h1>
                <p class="text-xs text-slate-400">Control de inventario, usuarios, auditoría y conexión Google Sheets</p>
            </div>
        </div>

        <div class="flex items-center gap-2">
            <button onclick="openModalNuevoProducto()" class="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-lg shadow-orange-600/20 flex items-center gap-1.5">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                <span>Nuevo Producto</span>
            </button>
        </div>
    </div>

    <!-- 4 KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div class="flex items-center justify-between text-slate-400 text-xs">
                <span>Ventas Totales Acumuladas</span>
                <i data-lucide="dollar-sign" class="w-4 h-4 text-emerald-400"></i>
            </div>
            <div class="mt-2">
                <div class="text-2xl font-black text-emerald-400">S/ <?= number_format($stats['total_ventas'], 2) ?></div>
                <p class="text-[11px] text-slate-400 mt-1"><?= $stats['total_pedidos'] ?> pedidos procesados</p>
            </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div class="flex items-center justify-between text-slate-400 text-xs">
                <span>Ticket Promedio</span>
                <i data-lucide="receipt" class="w-4 h-4 text-blue-400"></i>
            </div>
            <div class="mt-2">
                <div class="text-2xl font-black text-white">S/ <?= number_format($stats['ticket_promedio'], 2) ?></div>
                <p class="text-[11px] text-slate-400 mt-1">Por orden cerrada</p>
            </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div class="flex items-center justify-between text-slate-400 text-xs">
                <span>Valoración de Inventario</span>
                <i data-lucide="boxes" class="w-4 h-4 text-amber-400"></i>
            </div>
            <div class="mt-2">
                <div class="text-2xl font-black text-amber-400">S/ <?= number_format($stats['valor_inventario'], 2) ?></div>
                <p class="text-[11px] text-slate-400 mt-1"><?= count($productos) ?> ítems registrados</p>
            </div>
        </div>

        <div class="bg-slate-900 border <?= $stats['productos_alerta'] > 0 ? 'border-rose-500/50' : 'border-slate-800' ?> rounded-2xl p-4 flex flex-col justify-between">
            <div class="flex items-center justify-between text-slate-400 text-xs">
                <span>Alertas de Stock Bajo</span>
                <i data-lucide="alert-triangle" class="w-4 h-4 <?= $stats['productos_alerta'] > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500' ?>"></i>
            </div>
            <div class="mt-2">
                <div class="text-2xl font-black <?= $stats['productos_alerta'] > 0 ? 'text-rose-400' : 'text-white' ?>"><?= $stats['productos_alerta'] ?></div>
                <p class="text-[11px] text-slate-400 mt-1">Productos por debajo del mínimo</p>
            </div>
        </div>

    </div>

    <!-- Admin Navigation Tabs (Inventario, Usuarios, Auditoría, Google Sheets) -->
    <div class="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-thin">
        <button onclick="switchAdminTab('tab-inventario')" class="admin-nav-btn active px-4 py-2 rounded-xl text-xs font-bold transition-all bg-orange-600 text-white flex items-center gap-2" data-tab="tab-inventario">
            <i data-lucide="boxes" class="w-3.5 h-3.5"></i>
            <span>Inventario & Almacén (<?= count($productos) ?>)</span>
        </button>
        <button onclick="switchAdminTab('tab-usuarios')" class="admin-nav-btn px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 flex items-center gap-2" data-tab="tab-usuarios">
            <i data-lucide="users" class="w-3.5 h-3.5"></i>
            <span>Usuarios & Roles (<?= count($usuarios) ?>)</span>
        </button>
        <button onclick="switchAdminTab('tab-auditoria')" class="admin-nav-btn px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 flex items-center gap-2" data-tab="tab-auditoria">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
            <span>Auditoría de Seguridad</span>
        </button>
        <button onclick="switchAdminTab('tab-gas')" class="admin-nav-btn px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 flex items-center gap-2" data-tab="tab-gas">
            <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Google Apps Script (Sheets)</span>
        </button>
    </div>

    <!-- TAB 1: INVENTARIO -->
    <div id="tab-inventario" class="admin-tab-content space-y-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                <div>
                    <h3 class="font-bold text-white text-sm">Catálogo de Productos & Existencias</h3>
                    <p class="text-xs text-slate-400">Modifica precios, costos unitarios y existencias en tiempo real</p>
                </div>
                <div class="relative w-full sm:w-64">
                    <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                    <input type="text" id="admin-search-prod" oninput="filterAdminProducts(this.value)" placeholder="Filtrar catálogo..." class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500">
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                    <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                        <tr>
                            <th class="p-3">SKU</th>
                            <th class="p-3">Producto</th>
                            <th class="p-3">Categoría</th>
                            <th class="p-3">Precio Venta</th>
                            <th class="p-3">Costo Unit.</th>
                            <th class="p-3">Margen %</th>
                            <th class="p-3">Stock Actual</th>
                            <th class="p-3">Mínimo</th>
                            <th class="p-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60" id="admin-products-table">
                        <?php foreach ($productos as $p): 
                            $margen = $p['precio'] > 0 ? ((($p['precio'] - $p['costo']) / $p['precio']) * 100) : 0;
                            $alerta = $p['stock'] <= $p['min_stock'];
                        ?>
                        <tr class="hover:bg-slate-800/40 admin-prod-row" data-name="<?= strtolower(htmlspecialchars($p['nombre'])) ?>" data-sku="<?= strtolower(htmlspecialchars($p['sku'])) ?>">
                            <td class="p-3 font-mono font-bold text-orange-400"><?= htmlspecialchars($p['sku']) ?></td>
                            <td class="p-3">
                                <div class="flex items-center gap-2.5">
                                    <img src="<?= htmlspecialchars($p['imagen'] ?: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80') ?>" class="w-8 h-8 rounded-lg object-cover bg-slate-950">
                                    <span class="font-bold text-white"><?= htmlspecialchars($p['nombre']) ?></span>
                                </div>
                            </td>
                            <td class="p-3 text-slate-400"><?= htmlspecialchars($p['categoria_nombre']) ?></td>
                            <td class="p-3 font-bold text-white">S/ <?= number_format($p['precio'], 2) ?></td>
                            <td class="p-3 text-slate-400">S/ <?= number_format($p['costo'], 2) ?></td>
                            <td class="p-3 font-bold text-emerald-400"><?= number_format($margen, 1) ?>%</td>
                            <td class="p-3">
                                <span class="px-2 py-0.5 rounded-lg text-xs font-black <?= $alerta ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-slate-200' ?>">
                                    <?= (int)$p['stock'] ?> <?= htmlspecialchars($p['unidad']) ?>
                                </span>
                            </td>
                            <td class="p-3 text-slate-500"><?= (int)$p['min_stock'] ?></td>
                            <td class="p-3 text-right">
                                <div class="flex items-center justify-end gap-1.5">
                                    <button onclick="quickAdjustStock(<?= $p['id'] ?>, '<?= htmlspecialchars($p['nombre']) ?>', <?= $p['stock'] ?>)" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white" title="Ajustar Stock">
                                        <i data-lucide="package-plus" class="w-3.5 h-3.5"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- TAB 2: USUARIOS -->
    <div id="tab-usuarios" class="admin-tab-content hidden space-y-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 class="font-bold text-white text-sm mb-4">Usuarios del Sistema y Permisos de Acceso</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <?php foreach ($usuarios as $u): ?>
                <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                    <div class="flex items-center gap-3">
                        <img src="<?= htmlspecialchars($u['avatar']) ?>" class="w-12 h-12 rounded-full object-cover ring-2 ring-orange-500/30">
                        <div>
                            <h4 class="text-sm font-bold text-white"><?= htmlspecialchars($u['nombre']) ?></h4>
                            <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20"><?= htmlspecialchars($u['rol']) ?></span>
                        </div>
                    </div>
                    <div class="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                        <div class="flex items-center gap-1.5"><i data-lucide="<?= $u['can_sell'] ? 'check' : 'x' ?>" class="w-3.5 h-3.5 <?= $u['can_sell'] ? 'text-emerald-400' : 'text-slate-600' ?>"></i> <span>Punto de Venta POS</span></div>
                        <div class="flex items-center gap-1.5"><i data-lucide="<?= $u['can_manage_cash'] ? 'check' : 'x' ?>" class="w-3.5 h-3.5 <?= $u['can_manage_cash'] ? 'text-emerald-400' : 'text-slate-600' ?>"></i> <span>Apertura y Cierre de Caja</span></div>
                        <div class="flex items-center gap-1.5"><i data-lucide="<?= $u['can_kitchen'] ? 'check' : 'x' ?>" class="w-3.5 h-3.5 <?= $u['can_kitchen'] ? 'text-emerald-400' : 'text-slate-600' ?>"></i> <span>Monitor Cocina KDS</span></div>
                        <div class="flex items-center gap-1.5"><i data-lucide="<?= $u['can_manage_inventory'] ? 'check' : 'x' ?>" class="w-3.5 h-3.5 <?= $u['can_manage_inventory'] ? 'text-emerald-400' : 'text-slate-600' ?>"></i> <span>Inventario y Reportes</span></div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <!-- TAB 3: AUDITORÍA -->
    <div id="tab-auditoria" class="admin-tab-content hidden space-y-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 class="font-bold text-white text-sm mb-4">Registro Transaccional de Auditoría</h3>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-300">
                    <thead class="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                        <tr>
                            <th class="p-3">Fecha</th>
                            <th class="p-3">Usuario</th>
                            <th class="p-3">Módulo</th>
                            <th class="p-3">Acción</th>
                            <th class="p-3">Detalles</th>
                            <th class="p-3">IP</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-800/60">
                        <?php foreach ($logs as $l): ?>
                        <tr class="hover:bg-slate-800/40">
                            <td class="p-3 text-slate-400 whitespace-nowrap"><?= date('d/m/Y H:i:s', strtotime($l['created_at'])) ?></td>
                            <td class="p-3 font-bold text-white"><?= htmlspecialchars($l['usuario_nombre']) ?></td>
                            <td class="p-3"><span class="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-slate-800 text-orange-400"><?= htmlspecialchars($l['modulo']) ?></span></td>
                            <td class="p-3 font-semibold text-slate-200"><?= htmlspecialchars($l['accion']) ?></td>
                            <td class="p-3 text-slate-400 text-[11px]"><?= htmlspecialchars($l['detalles']) ?></td>
                            <td class="p-3 text-slate-500 font-mono"><?= htmlspecialchars($l['ip_address']) ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- TAB 4: GOOGLE APPS SCRIPT -->
    <div id="tab-gas" class="admin-tab-content hidden space-y-4">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-3xl space-y-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <i data-lucide="file-spreadsheet" class="w-5 h-5"></i>
                </div>
                <div>
                    <h3 class="font-bold text-white text-base">Conexión con Google Sheets (Google Apps Script)</h3>
                    <p class="text-xs text-slate-400">Sincroniza tus pedidos, ventas y cierres de caja directamente en hojas de cálculo de Google.</p>
                </div>
            </div>

            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <label class="block text-slate-300 font-bold">URL Webhook de Google Apps Script:</label>
                <input type="url" id="gas_webhook_url" value="<?= htmlspecialchars($gasUrl) ?>" placeholder="https://script.google.com/macros/s/AKfycbx.../exec" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500">
                <div class="flex gap-2">
                    <button onclick="saveGasWebhook()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center gap-1.5">
                        <i data-lucide="save" class="w-3.5 h-3.5"></i>
                        <span>Guardar Webhook</span>
                    </button>
                    <button onclick="testGasSync()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5">
                        <i data-lucide="send" class="w-3.5 h-3.5 text-orange-400"></i>
                        <span>Enviar Prueba de Sincronización</span>
                    </button>
                </div>
            </div>

            <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-2">
                <h4 class="font-bold text-slate-200 flex items-center gap-1.5"><i data-lucide="info" class="w-3.5 h-3.5 text-blue-400"></i> ¿Cómo obtener tu Webhook de Google Sheets?</h4>
                <ol class="list-decimal pl-5 space-y-1">
                    <li>Abre una hoja en <b>Google Sheets</b> y ve a <b>Extensiones > Apps Script</b>.</li>
                    <li>Copia y pega el código que está en el archivo <code>gas/Code.gs</code> del proyecto.</li>
                    <li>Haz clic en <b>Implementar > Nueva implementación</b>, selecciona tipo <i>Aplicación web</i>, ejecuta como <i>Yo</i> y acceso para <i>Cualquier usuario</i>.</li>
                    <li>Pega la URL resultante arriba y guarda los cambios.</li>
                </ol>
            </div>
        </div>
    </div>

</div>

<!-- Modal Nuevo Producto -->
<div id="modal-nuevo-prod" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm hidden items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl">
        <h3 class="font-bold text-white text-base mb-4 flex items-center gap-2">
            <i data-lucide="plus-circle" class="w-5 h-5 text-orange-400"></i>
            Agregar Nuevo Producto al Catálogo
        </h3>
        
        <form onsubmit="submitNuevoProducto(event)" class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-slate-300 font-bold mb-1">SKU / Código:</label>
                    <input type="text" id="np_sku" required placeholder="HMB-003" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white">
                </div>
                <div>
                    <label class="block text-slate-300 font-bold mb-1">Categoría:</label>
                    <select id="np_categoria" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white">
                        <?php foreach ($categorias as $cat): ?>
                        <option value="<?= $cat['id'] ?>"><?= $cat['icono'] ?> <?= $cat['nombre'] ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-slate-300 font-bold mb-1">Nombre del Producto / Plato:</label>
                <input type="text" id="np_nombre" required placeholder="Ej: Hamburguesa Monster Suprema" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white">
            </div>

            <div class="grid grid-cols-3 gap-3">
                <div>
                    <label class="block text-slate-300 font-bold mb-1">Precio Venta (S/):</label>
                    <input type="number" step="0.50" id="np_precio" required placeholder="15.00" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white">
                </div>
                <div>
                    <label class="block text-slate-300 font-bold mb-1">Costo Unit. (S/):</label>
                    <input type="number" step="0.50" id="np_costo" required placeholder="6.50" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white">
                </div>
                <div>
                    <label class="block text-slate-300 font-bold mb-1">Stock Inicial:</label>
                    <input type="number" id="np_stock" required placeholder="30" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white">
                </div>
            </div>

            <div>
                <label class="block text-slate-300 font-bold mb-1">URL de Imagen (Unsplash / CDN):</label>
                <input type="url" id="np_imagen" placeholder="https://images.unsplash.com/photo-..." class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white">
            </div>

            <div>
                <label class="block text-slate-300 font-bold mb-1">Descripción corta:</label>
                <textarea id="np_descripcion" rows="2" placeholder="Ingredientes y detalles..." class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"></textarea>
            </div>

            <div class="flex gap-2 pt-2">
                <button type="submit" class="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-lg">Guardar Producto</button>
                <button type="button" onclick="closeModalNuevoProducto()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">Cancelar</button>
            </div>
        </form>
    </div>
</div>

<script>
function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.remove('bg-slate-900', 'text-slate-300', 'border', 'border-slate-800');
            btn.classList.add('bg-orange-600', 'text-white');
        } else {
            btn.classList.remove('bg-orange-600', 'text-white');
            btn.classList.add('bg-slate-900', 'text-slate-300', 'border', 'border-slate-800');
        }
    });

    document.querySelectorAll('.admin-tab-content').forEach(content => {
        if (content.id === tabId) {
            content.classList.remove('hidden');
        } else {
            content.classList.add('hidden');
        }
    });
}

function filterAdminProducts(q) {
    const val = q.trim().toLowerCase();
    document.querySelectorAll('.admin-prod-row').forEach(row => {
        const name = row.dataset.name || '';
        const sku = row.dataset.sku || '';
        if (name.includes(val) || sku.includes(val)) {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    });
}

function openModalNuevoProducto() { document.getElementById('modal-nuevo-prod').classList.remove('hidden'); document.getElementById('modal-nuevo-prod').classList.add('flex'); }
function closeModalNuevoProducto() { document.getElementById('modal-nuevo-prod').classList.add('hidden'); document.getElementById('modal-nuevo-prod').classList.remove('flex'); }

async function submitNuevoProducto(e) {
    e.preventDefault();
    const payload = {
        sku: document.getElementById('np_sku').value,
        categoria_id: document.getElementById('np_categoria').value,
        nombre: document.getElementById('np_nombre').value,
        precio: document.getElementById('np_precio').value,
        costo: document.getElementById('np_costo').value,
        stock: document.getElementById('np_stock').value,
        imagen: document.getElementById('np_imagen').value,
        descripcion: document.getElementById('np_descripcion').value
    };

    const res = await fetch('api/productos.php?action=crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
        location.reload();
    } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.error, background: '#0f172a', color: '#fff' });
    }
}

async function quickAdjustStock(id, nombre, currentStock) {
    const { value: formValues } = await Swal.fire({
        title: `Ajustar Stock: ${nombre}`,
        html: `
            <p class="text-xs text-slate-400 mb-2">Stock actual: <b>${currentStock}</b></p>
            <input id="swal-input-stock" type="number" class="swal2-input" placeholder="Nueva cantidad de existencias" value="${currentStock}">
            <input id="swal-input-motivo" type="text" class="swal2-input" placeholder="Motivo (Ej: Compra de insumos / Merma)">
        `,
        focusConfirm: false,
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#ea580c',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return [
                document.getElementById('swal-input-stock').value,
                document.getElementById('swal-input-motivo').value
            ];
        }
    });

    if (formValues) {
        const [nuevoStock, motivo] = formValues;
        const res = await fetch('api/productos.php?action=ajustar_stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, stock: nuevoStock, motivo })
        });
        const data = await res.json();
        if (data.success) {
            location.reload();
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: data.error, background: '#0f172a', color: '#fff' });
        }
    }
}

async function saveGasWebhook() {
    const url = document.getElementById('gas_webhook_url').value;
    const res = await fetch('api/gas_sync.php?action=guardar_url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (data.success) {
        Swal.fire({ icon: 'success', title: 'Guardado', text: 'Webhook de Google Apps Script actualizado.', background: '#0f172a', color: '#fff' });
    }
}

async function testGasSync() {
    const res = await fetch('api/gas_sync.php?action=test_sync');
    const data = await res.json();
    if (data.success) {
        Swal.fire({ icon: 'success', title: '¡Sincronización Exitosa!', text: 'Los datos fueron enviados a Google Sheets correctamente.', background: '#0f172a', color: '#fff' });
    } else {
        Swal.fire({ icon: 'warning', title: 'Aviso', text: data.message || 'Verifica que la URL sea válida.', background: '#0f172a', color: '#fff' });
    }
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
