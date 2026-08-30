<?php
$pageTitle = 'Punto de Venta POS';
$activePage = 'pos';
require_once __DIR__ . '/includes/header.php';
requirePermission('can_sell');

$pdo = getDBConnection();
$categorias = [];
$productos = [];
$sesionCajaActiva = null;

if ($pdo) {
    try {
        $categorias = $pdo->query("SELECT * FROM categorias ORDER BY orden ASC")->fetchAll();
        $productos = $pdo->query("SELECT p.*, c.nombre as categoria_nombre FROM productos p JOIN categorias c ON p.categoria_id = c.id WHERE p.is_available = 1 ORDER BY p.categoria_id, p.nombre")->fetchAll();
        
        // Verificar si hay caja abierta
        $stmtCaja = $pdo->query("SELECT * FROM caja_sesiones WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1");
        $sesionCajaActiva = $stmtCaja->fetch();
    } catch (Exception $e) {
        error_log("Error en POS: " . $e->getMessage());
    }
}
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col">

    <!-- Top Bar: Cash Session Alert & Quick Info -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold">
                <i data-lucide="calculator" class="w-5 h-5"></i>
            </div>
            <div>
                <h1 class="text-lg font-bold text-white leading-tight">Terminal de Ventas & Facturación POS</h1>
                <p class="text-xs text-slate-400">Atención rápida en salón y pedidos para llevar</p>
            </div>
        </div>

        <div class="flex items-center gap-3">
            <?php if ($sesionCajaActiva): ?>
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Caja Abierta #<?= $sesionCajaActiva['id'] ?> (Fondo: S/ <?= number_format($sesionCajaActiva['monto_inicial'], 2) ?>)</span>
            </div>
            <?php else: ?>
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                <span>Caja Cerrada (Aperturar en módulo Caja)</span>
            </div>
            <?php endif; ?>

            <a href="cocina.php" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5">
                <i data-lucide="flame" class="w-3.5 h-3.5 text-orange-400"></i>
                <span>Ver KDS Cocina</span>
            </a>
        </div>
    </div>

    <!-- Main POS Grid Layout (Left: Catalog & Filters, Right: Interactive Cart & Cash Calculator) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        <!-- LEFT: Catalog & Search (7 Cols) -->
        <div class="lg:col-span-7 flex flex-col space-y-4">
            
            <!-- Search & Quick Filters -->
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row gap-3">
                <div class="relative flex-1">
                    <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                    <input type="text" id="pos-search" oninput="searchProducts(this.value)" placeholder="Buscar por plato o código SKU (ej: Hamburguesa, HMB-001)..." class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500">
                </div>
            </div>

            <!-- Category Pills -->
            <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button onclick="posFilterCategory('all')" class="pos-cat-pill active px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-orange-600 text-white shadow-md flex items-center gap-1.5 whitespace-nowrap" data-cat="all">
                    <span>🍽️</span> Todos
                </button>
                <?php foreach ($categorias as $cat): ?>
                <button onclick="posFilterCategory('<?= htmlspecialchars($cat['id']) ?>')" class="pos-cat-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 flex items-center gap-1.5 whitespace-nowrap" data-cat="<?= htmlspecialchars($cat['id']) ?>">
                    <span><?= htmlspecialchars($cat['icono']) ?></span> <?= htmlspecialchars($cat['nombre']) ?>
                </button>
                <?php endforeach; ?>
            </div>

            <!-- Products Grid -->
            <div id="pos-product-grid" class="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[600px] pr-1">
                <?php foreach ($productos as $p): ?>
                <div onclick="posAddToCart(<?= htmlspecialchars(json_encode($p)) ?>)" class="pos-card cursor-pointer group bg-slate-900/90 rounded-xl border border-slate-800 p-3 hover:border-orange-500/60 hover:shadow-lg transition-all flex flex-col justify-between active:scale-[0.98]" data-cat="<?= htmlspecialchars($p['categoria_id']) ?>" data-name="<?= strtolower(htmlspecialchars($p['nombre'])) ?>" data-sku="<?= strtolower(htmlspecialchars($p['sku'])) ?>">
                    <div>
                        <div class="relative h-24 rounded-lg overflow-hidden mb-2 bg-slate-950">
                            <img src="<?= htmlspecialchars($p['imagen'] ?: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80') ?>" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                            <span class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white">Stk: <?= (int)$p['stock'] ?></span>
                        </div>
                        <h4 class="text-xs font-bold text-white line-clamp-2 leading-tight group-hover:text-orange-400"><?= htmlspecialchars($p['nombre']) ?></h4>
                        <span class="text-[10px] text-slate-400"><?= htmlspecialchars($p['sku']) ?></span>
                    </div>
                    <div class="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span class="text-xs font-black text-orange-400">S/ <?= number_format($p['precio'], 2) ?></span>
                        <span class="w-6 h-6 rounded-lg bg-orange-600/20 text-orange-400 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center transition-colors">
                            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                        </span>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>

        </div>

        <!-- RIGHT: Order Summary & Interactive Calculator (5 Cols) -->
        <div class="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
            
            <!-- Order Header -->
            <div class="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
                <div>
                    <h3 class="font-bold text-white text-sm flex items-center gap-2">
                        <i data-lucide="receipt" class="w-4 h-4 text-orange-500"></i>
                        Comanda / Venta Actual
                    </h3>
                    <span class="text-[11px] text-slate-400">Cajero: <?= htmlspecialchars($_SESSION['user_nombre'] ?? 'Cajero') ?></span>
                </div>
                <button onclick="clearPosCart()" class="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20">
                    Limpiar
                </button>
            </div>

            <!-- Customer & Type Selectors -->
            <div class="p-3 border-b border-slate-800 bg-slate-900 space-y-2 text-xs">
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="block text-[10px] text-slate-400 mb-0.5">Tipo de Venta:</label>
                        <select id="pos-tipo" onchange="togglePosMesaInput()" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500">
                            <option value="mesa">🍽️ Consumo en Mesa</option>
                            <option value="llevar">🥡 Para Llevar</option>
                        </select>
                    </div>
                    <div id="pos-mesa-box">
                        <label class="block text-[10px] text-slate-400 mb-0.5">Mesa / Ubicación:</label>
                        <input type="text" id="pos-mesa" value="Mesa 1" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="block text-[10px] text-slate-400 mb-0.5">Cliente:</label>
                        <input type="text" id="pos-cliente" value="Cliente General" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500">
                    </div>
                    <div>
                        <label class="block text-[10px] text-slate-400 mb-0.5">DNI / RUC (Opcional):</label>
                        <input type="text" id="pos-doc" placeholder="00000000" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500">
                    </div>
                </div>
            </div>

            <!-- Items List -->
            <div id="pos-items-container" class="flex-1 overflow-y-auto p-3 space-y-2 max-h-56 min-h-40">
                <div class="text-center py-8 text-slate-500 text-xs">
                    <i data-lucide="shopping-bag" class="w-8 h-8 mx-auto mb-1 opacity-40"></i>
                    <p>Agrega productos del catálogo izquierdo</p>
                </div>
            </div>

            <!-- Totals, Cash Calculator & Payment -->
            <div class="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
                
                <!-- Financial Breakdown -->
                <div class="space-y-1 text-xs text-slate-300">
                    <div class="flex justify-between">
                        <span class="text-slate-400">Op. Gravada (Subtotal):</span>
                        <span id="pos-subtotal" class="font-semibold">S/ 0.00</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-400">IGV (18%):</span>
                        <span id="pos-igv" class="font-semibold">S/ 0.00</span>
                    </div>
                    <div class="flex justify-between text-base font-black text-white pt-1 border-t border-slate-800">
                        <span>TOTAL A COBRAR:</span>
                        <span id="pos-total" class="text-orange-400 text-lg">S/ 0.00</span>
                    </div>
                </div>

                <!-- Payment Method Buttons -->
                <div>
                    <label class="block text-[10px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">Método de Pago:</label>
                    <div class="grid grid-cols-4 gap-1.5">
                        <button type="button" onclick="setPosPayment('efectivo')" class="pos-pay-btn active px-2 py-2 rounded-lg text-xs font-bold bg-orange-600 text-white flex flex-col items-center gap-1 shadow" data-method="efectivo">
                            <i data-lucide="banknote" class="w-3.5 h-3.5"></i>
                            <span>Efectivo</span>
                        </button>
                        <button type="button" onclick="setPosPayment('tarjeta')" class="pos-pay-btn px-2 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 flex flex-col items-center gap-1" data-method="tarjeta">
                            <i data-lucide="credit-card" class="w-3.5 h-3.5"></i>
                            <span>Tarjeta</span>
                        </button>
                        <button type="button" onclick="setPosPayment('qr')" class="pos-pay-btn px-2 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 flex flex-col items-center gap-1" data-method="qr">
                            <i data-lucide="qr-code" class="w-3.5 h-3.5"></i>
                            <span>Yape/QR</span>
                        </button>
                        <button type="button" onclick="setPosPayment('transferencia')" class="pos-pay-btn px-2 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 flex flex-col items-center gap-1" data-method="transferencia">
                            <i data-lucide="arrow-right-left" class="w-3.5 h-3.5"></i>
                            <span>Transf.</span>
                        </button>
                    </div>
                </div>

                <!-- Cash Calculator Section (Active if Efectivo) -->
                <div id="pos-cash-calculator" class="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div class="flex items-center justify-between gap-3">
                        <div class="flex-1">
                            <label class="block text-[10px] text-slate-400 mb-0.5 font-bold">Efectivo Recibido (S/):</label>
                            <input type="number" step="0.50" id="pos-cash-received" oninput="calculateChange()" placeholder="0.00" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-black text-white focus:outline-none focus:border-orange-500">
                        </div>
                        <div class="flex-1 text-right">
                            <label class="block text-[10px] text-slate-400 mb-0.5 font-bold">Vuelto / Cambio:</label>
                            <span id="pos-change-amount" class="text-base font-black text-emerald-400 block pt-1">S/ 0.00</span>
                        </div>
                    </div>

                    <!-- Quick Denominations -->
                    <div class="flex items-center gap-1 pt-1">
                        <button type="button" onclick="setQuickCash('exact')" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 flex-1">Exacto</button>
                        <button type="button" onclick="setQuickCash(10)" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 flex-1">+S/ 10</button>
                        <button type="button" onclick="setQuickCash(20)" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 flex-1">+S/ 20</button>
                        <button type="button" onclick="setQuickCash(50)" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 flex-1">+S/ 50</button>
                        <button type="button" onclick="setQuickCash(100)" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-200 flex-1">+S/ 100</button>
                    </div>
                </div>

                <!-- Process Order & Issue Ticket Button -->
                <button type="button" onclick="processPosOrder()" id="btn-process-pos" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm shadow-xl shadow-orange-600/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    <i data-lucide="printer" class="w-4 h-4"></i>
                    <span>Cobrar & Generar Comprobante</span>
                </button>

            </div>

        </div>

    </div>

</div>

<!-- Modal para Vista Previa de Ticket Térmico -->
<div id="ticket-modal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm hidden items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl flex flex-col">
        <div class="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 class="font-bold text-white text-sm flex items-center gap-2">
                <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i>
                ¡Venta Registrada Exitosamente!
            </h3>
            <button onclick="closeTicketModal()" class="text-slate-400 hover:text-white">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>

        <div id="ticket-preview-content" class="bg-white text-black p-4 rounded-lg font-mono text-xs shadow-inner space-y-2">
            <!-- Rendered by JS -->
        </div>

        <div class="flex gap-2 mt-4">
            <button onclick="printCurrentTicket()" class="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5">
                <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                <span>Imprimir Térmico</span>
            </button>
            <button onclick="closeTicketModal()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs">
                Cerrar
            </button>
        </div>
    </div>
</div>

<script>
let posCart = [];
let currentPaymentMethod = 'efectivo';
let lastCompletedOrder = null;

function posFilterCategory(catId) {
    document.querySelectorAll('.pos-cat-pill').forEach(btn => {
        if (btn.dataset.cat === catId) {
            btn.classList.remove('bg-slate-900', 'text-slate-300', 'border', 'border-slate-800');
            btn.classList.add('bg-orange-600', 'text-white', 'shadow-md');
        } else {
            btn.classList.remove('bg-orange-600', 'text-white', 'shadow-md');
            btn.classList.add('bg-slate-900', 'text-slate-300', 'border', 'border-slate-800');
        }
    });

    document.querySelectorAll('.pos-card').forEach(card => {
        if (catId === 'all' || card.dataset.cat === catId) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

function searchProducts(q) {
    const val = q.trim().toLowerCase();
    document.querySelectorAll('.pos-card').forEach(card => {
        const name = card.dataset.name || '';
        const sku = card.dataset.sku || '';
        if (name.includes(val) || sku.includes(val)) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

function posAddToCart(prod) {
    const item = posCart.find(i => i.id === prod.id);
    if (item) {
        item.cantidad += 1;
    } else {
        posCart.push({
            id: prod.id,
            nombre: prod.nombre,
            precio: parseFloat(prod.precio),
            costo: parseFloat(prod.costo || 0),
            cantidad: 1,
            notas: ''
        });
    }
    renderPosCart();
}

function changePosQty(index, delta) {
    posCart[index].cantidad += delta;
    if (posCart[index].cantidad <= 0) {
        posCart.splice(index, 1);
    }
    renderPosCart();
}

function updatePosNotes(index, val) {
    posCart[index].notas = val;
}

function clearPosCart() {
    posCart = [];
    renderPosCart();
}

function renderPosCart() {
    const container = document.getElementById('pos-items-container');
    const btnProcess = document.getElementById('btn-process-pos');

    if (posCart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-500 text-xs">
                <i data-lucide="shopping-bag" class="w-8 h-8 mx-auto mb-1 opacity-40"></i>
                <p>Agrega productos del catálogo izquierdo</p>
            </div>
        `;
        document.getElementById('pos-subtotal').innerText = 'S/ 0.00';
        document.getElementById('pos-igv').innerText = 'S/ 0.00';
        document.getElementById('pos-total').innerText = 'S/ 0.00';
        document.getElementById('pos-cash-received').value = '';
        document.getElementById('pos-change-amount').innerText = 'S/ 0.00';
        btnProcess.disabled = true;
        lucide.createIcons();
        return;
    }

    btnProcess.disabled = false;
    let html = '';
    let total = 0;

    posCart.forEach((item, idx) => {
        const itemTotal = item.precio * item.cantidad;
        total += itemTotal;
        html += `
            <div class="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                    <div class="flex-1 pr-2">
                        <h4 class="text-xs font-bold text-white line-clamp-1">${item.nombre}</h4>
                        <span class="text-[10px] text-orange-400 font-semibold">S/ ${item.precio.toFixed(2)} c/u</span>
                    </div>
                    <span class="text-xs font-black text-white">S/ ${itemTotal.toFixed(2)}</span>
                </div>
                <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-900">
                    <input type="text" placeholder="Nota de cocina (ej: Sin sal)" value="${item.notas || ''}" onchange="updatePosNotes(${idx}, this.value)" class="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-200 focus:outline-none focus:border-orange-500">
                    <div class="flex items-center gap-1">
                        <button type="button" onclick="changePosQty(${idx}, -1)" class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold">-</button>
                        <span class="w-5 text-center text-xs font-bold text-white">${item.cantidad}</span>
                        <button type="button" onclick="changePosQty(${idx}, 1)" class="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold">+</button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    
    const subtotal = total / 1.18;
    const igv = total - subtotal;
    document.getElementById('pos-subtotal').innerText = 'S/ ' + subtotal.toFixed(2);
    document.getElementById('pos-igv').innerText = 'S/ ' + igv.toFixed(2);
    document.getElementById('pos-total').innerText = 'S/ ' + total.toFixed(2);
    
    calculateChange();
    lucide.createIcons();
}

function setPosPayment(method) {
    currentPaymentMethod = method;
    document.querySelectorAll('.pos-pay-btn').forEach(btn => {
        if (btn.dataset.method === method) {
            btn.classList.remove('bg-slate-900', 'text-slate-300', 'border', 'border-slate-800');
            btn.classList.add('bg-orange-600', 'text-white', 'shadow');
        } else {
            btn.classList.remove('bg-orange-600', 'text-white', 'shadow');
            btn.classList.add('bg-slate-900', 'text-slate-300', 'border', 'border-slate-800');
        }
    });

    const calcBox = document.getElementById('pos-cash-calculator');
    if (method === 'efectivo') {
        calcBox.classList.remove('hidden');
    } else {
        calcBox.classList.add('hidden');
    }
}

function calculateChange() {
    const total = posCart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const receivedInput = document.getElementById('pos-cash-received');
    const received = parseFloat(receivedInput.value) || 0;
    const changeBox = document.getElementById('pos-change-amount');

    if (received >= total && total > 0) {
        const change = received - total;
        changeBox.innerText = 'S/ ' + change.toFixed(2);
        changeBox.className = 'text-base font-black text-emerald-400 block pt-1';
    } else if (received > 0 && received < total) {
        const missing = total - received;
        changeBox.innerText = 'Falta S/ ' + missing.toFixed(2);
        changeBox.className = 'text-base font-black text-rose-400 block pt-1';
    } else {
        changeBox.innerText = 'S/ 0.00';
        changeBox.className = 'text-base font-black text-slate-400 block pt-1';
    }
}

function setQuickCash(val) {
    const total = posCart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const receivedInput = document.getElementById('pos-cash-received');
    
    if (val === 'exact') {
        receivedInput.value = total.toFixed(2);
    } else {
        const current = parseFloat(receivedInput.value) || 0;
        receivedInput.value = (current + val).toFixed(2);
    }
    calculateChange();
}

function togglePosMesaInput() {
    const tipo = document.getElementById('pos-tipo').value;
    const mesaBox = document.getElementById('pos-mesa-box');
    if (tipo === 'mesa') {
        mesaBox.classList.remove('hidden');
    } else {
        mesaBox.classList.add('hidden');
    }
}

async function processPosOrder() {
    if (posCart.length === 0) return;

    const tipo = document.getElementById('pos-tipo').value;
    const mesa = tipo === 'mesa' ? document.getElementById('pos-mesa').value : 'Para Llevar';
    const cliente = document.getElementById('pos-cliente').value || 'Cliente General';
    const doc = document.getElementById('pos-doc').value || '';
    
    const total = posCart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    let cashReceived = 0;
    let changeGiven = 0;

    if (currentPaymentMethod === 'efectivo') {
        cashReceived = parseFloat(document.getElementById('pos-cash-received').value) || total;
        if (cashReceived < total) {
            Swal.fire({
                icon: 'warning',
                title: 'Efectivo Insuficiente',
                text: `El monto recibido (S/ ${cashReceived.toFixed(2)}) es menor que el total de la orden (S/ ${total.toFixed(2)}).`,
                background: '#0f172a',
                color: '#fff'
            });
            return;
        }
        changeGiven = cashReceived - total;
    } else {
        cashReceived = total;
        changeGiven = 0;
    }

    const payload = {
        tipo,
        numero_mesa: mesa,
        cliente_nombre: cliente,
        cliente_doc: doc,
        metodo_pago: currentPaymentMethod,
        efectivo_recibido: cashReceived,
        vuelto_entregado: changeGiven,
        items: posCart
    };

    try {
        const res = await fetch('api/pedidos.php?action=crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success) {
            lastCompletedOrder = data.pedido;
            showTicketModal(data.pedido);
            clearPosCart();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error al procesar venta',
                text: data.error || 'No se pudo guardar la venta',
                background: '#0f172a',
                color: '#fff'
            });
        }
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Error de Servidor',
            text: 'Error conectando con la API de PHP',
            background: '#0f172a',
            color: '#fff'
        });
    }
}

function showTicketModal(order) {
    const modal = document.getElementById('ticket-modal');
    const preview = document.getElementById('ticket-preview-content');

    let itemsRows = '';
    (order.items || []).forEach(it => {
        itemsRows += `
            <div class="flex justify-between py-0.5 border-b border-dashed border-gray-300">
                <span>${it.cantidad}x ${it.producto_nombre}</span>
                <span>S/ ${(it.precio_unitario * it.cantidad).toFixed(2)}</span>
            </div>
        `;
    });

    preview.innerHTML = `
        <div class="text-center font-bold pb-2 border-b border-black">
            <h4 class="text-sm uppercase">SNACK & RESTAURANT PRO</h4>
            <p class="text-[10px] text-gray-600">RUC: 20601234567 | Av. Gastronomía 456</p>
            <p class="text-[10px] text-gray-600">BOLETA ELECTRÓNICA: ${order.numero_factura}</p>
        </div>
        <div class="text-[10px] py-1 border-b border-dashed border-gray-400 space-y-0.5">
            <div>Fecha: ${new Date().toLocaleString()}</div>
            <div>Orden: #${order.numero_orden} (${order.tipo === 'mesa' ? order.numero_mesa : 'Para Llevar'})</div>
            <div>Cliente: ${order.cliente_nombre}</div>
            <div>Pago: ${order.metodo_pago.toUpperCase()}</div>
        </div>
        <div class="py-1">
            ${itemsRows}
        </div>
        <div class="pt-2 border-t border-black space-y-0.5 font-bold">
            <div class="flex justify-between"><span>Subtotal:</span><span>S/ ${parseFloat(order.subtotal).toFixed(2)}</span></div>
            <div class="flex justify-between"><span>IGV (18%):</span><span>S/ ${parseFloat(order.igv).toFixed(2)}</span></div>
            <div class="flex justify-between text-sm"><span>TOTAL:</span><span>S/ ${parseFloat(order.total).toFixed(2)}</span></div>
            ${order.metodo_pago === 'efectivo' ? `
                <div class="flex justify-between text-[11px] text-gray-700"><span>Recibido:</span><span>S/ ${parseFloat(order.efectivo_recibido).toFixed(2)}</span></div>
                <div class="flex justify-between text-[11px] text-emerald-700"><span>Vuelto:</span><span>S/ ${parseFloat(order.vuelto_entregado).toFixed(2)}</span></div>
            ` : ''}
        </div>
        <div class="text-center text-[10px] pt-3 text-gray-500">
            ¡Gracias por su preferencia!
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    lucide.createIcons();
}

function closeTicketModal() {
    const modal = document.getElementById('ticket-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function printCurrentTicket() {
    if (lastCompletedOrder) {
        window.open('imprimir_ticket.php?id=' + lastCompletedOrder.id, '_blank');
    }
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
