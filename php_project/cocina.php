<?php
$pageTitle = 'Cocina & Despacho KDS';
$activePage = 'cocina';
require_once __DIR__ . '/includes/header.php';
requirePermission('can_kitchen');
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col space-y-6">

    <!-- KDS Header & Controls -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold">
                <i data-lucide="flame" class="w-5 h-5"></i>
            </div>
            <div>
                <h1 class="text-lg font-bold text-white leading-tight">Pantalla de Cocina & Despacho (KDS)</h1>
                <p class="text-xs text-slate-400">Control de comandas en tiempo real con semáforo de tiempos</p>
            </div>
        </div>

        <div class="flex items-center gap-3">
            <!-- Audio chime toggle -->
            <button onclick="toggleAudioChime()" id="btn-audio-toggle" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700">
                <i data-lucide="bell" id="bell-icon" class="w-3.5 h-3.5 text-amber-400"></i>
                <span id="audio-status-text">Sonido: Activo</span>
            </button>

            <!-- Auto refresh indicator -->
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>En Vivo (Auto-Sync 4s)</span>
            </div>
        </div>
    </div>

    <!-- Status Tabs / Filter Pills -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button onclick="filterKds('all')" class="kds-tab active px-4 py-2 rounded-xl text-xs font-bold transition-all bg-orange-600 text-white shadow-md flex items-center gap-2" data-status="all">
            <span>Todos los Activos</span>
            <span id="badge-all" class="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">0</span>
        </button>
        <button onclick="filterKds('pendiente')" class="kds-tab px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 flex items-center gap-2" data-status="pendiente">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Pendientes</span>
            <span id="badge-pendiente" class="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">0</span>
        </button>
        <button onclick="filterKds('en_preparacion')" class="kds-tab px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 flex items-center gap-2" data-status="en_preparacion">
            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>En Preparación</span>
            <span id="badge-en_preparacion" class="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 text-[10px]">0</span>
        </button>
        <button onclick="filterKds('listo')" class="kds-tab px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 flex items-center gap-2" data-status="listo">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Listos para Servir</span>
            <span id="badge-listo" class="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">0</span>
        </button>
    </div>

    <!-- Orders Grid -->
    <div id="kds-orders-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1">
        <!-- Rendered via JS -->
        <div class="col-span-full text-center py-20 text-slate-500">
            <i data-lucide="loader" class="w-10 h-10 mx-auto mb-2 animate-spin text-orange-500"></i>
            <p class="text-sm">Cargando comandas de cocina...</p>
        </div>
    </div>

</div>

<script>
let kdsOrders = [];
let currentFilter = 'all';
let audioEnabled = true;
let knownOrderIds = new Set();

// Kitchen Sound Bell synthesizer with Web Audio API
function playKitchenChime() {
    if (!audioEnabled) return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // Note A5
        osc1.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1320, audioCtx.currentTime); // Note E6

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.8);
        osc2.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
        console.warn("Audio Context error:", e);
    }
}

function toggleAudioChime() {
    audioEnabled = !audioEnabled;
    const text = document.getElementById('audio-status-text');
    const icon = document.getElementById('bell-icon');
    if (audioEnabled) {
        text.innerText = 'Sonido: Activo';
        icon.className = 'w-3.5 h-3.5 text-amber-400';
        playKitchenChime();
    } else {
        text.innerText = 'Sonido: Silenciado';
        icon.className = 'w-3.5 h-3.5 text-slate-500';
    }
}

function filterKds(status) {
    currentFilter = status;
    document.querySelectorAll('.kds-tab').forEach(btn => {
        if (btn.dataset.status === status) {
            btn.classList.remove('bg-slate-900', 'text-slate-300', 'border', 'border-slate-800');
            btn.classList.add('bg-orange-600', 'text-white', 'shadow-md');
        } else {
            btn.classList.remove('bg-orange-600', 'text-white', 'shadow-md');
            btn.classList.add('bg-slate-900', 'text-slate-300', 'border', 'border-slate-800');
        }
    });
    renderKdsGrid();
}

async function fetchKdsOrders() {
    try {
        const res = await fetch('api/pedidos.php?action=kds_orders');
        const data = await res.json();
        
        if (data.success) {
            const newOrders = data.pedidos || [];
            
            // Check for newly arrived orders to sound the bell
            let hasNew = false;
            newOrders.forEach(o => {
                if (!knownOrderIds.has(o.id) && o.estado === 'pendiente') {
                    hasNew = true;
                }
                knownOrderIds.add(o.id);
            });

            if (hasNew && knownOrderIds.size > newOrders.length) {
                playKitchenChime();
            }

            kdsOrders = newOrders;
            updateBadges();
            renderKdsGrid();
        }
    } catch (err) {
        console.error("Error al sincronizar KDS:", err);
    }
}

function updateBadges() {
    const counts = {
        all: kdsOrders.length,
        pendiente: kdsOrders.filter(o => o.estado === 'pendiente').length,
        en_preparacion: kdsOrders.filter(o => o.estado === 'en_preparacion').length,
        listo: kdsOrders.filter(o => o.estado === 'listo').length
    };

    document.getElementById('badge-all').innerText = counts.all;
    document.getElementById('badge-pendiente').innerText = counts.pendiente;
    document.getElementById('badge-en_preparacion').innerText = counts.en_preparacion;
    document.getElementById('badge-listo').innerText = counts.listo;
}

function getElapsedMinutes(createdAt) {
    const orderTime = new Date(createdAt).getTime();
    const now = new Date().getTime();
    return Math.floor((now - orderTime) / 60000);
}

function renderKdsGrid() {
    const container = document.getElementById('kds-orders-container');
    const filtered = currentFilter === 'all' 
        ? kdsOrders 
        : kdsOrders.filter(o => o.estado === currentFilter);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-20 bg-slate-900/60 rounded-2xl border border-slate-800">
                <i data-lucide="check-circle" class="w-12 h-12 mx-auto mb-2 text-emerald-500/50"></i>
                <h3 class="text-base font-bold text-white">¡Cocina al Día!</h3>
                <p class="text-xs text-slate-400 mt-1">No hay comandas activas pendientes en este momento.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    let html = '';
    filtered.forEach(order => {
        const mins = getElapsedMinutes(order.created_at);
        
        // Status color & Badge
        let statusBadge = '';
        let borderClass = 'border-slate-800';
        let headerBg = 'bg-slate-950';

        if (order.estado === 'pendiente') {
            statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">Pendiente</span>';
            borderClass = 'border-amber-500/50';
        } else if (order.estado === 'en_preparacion') {
            statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">En Cocción</span>';
            borderClass = 'border-blue-500/50';
        } else if (order.estado === 'listo') {
            statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Listo para Servir</span>';
            borderClass = 'border-emerald-500/50';
        }

        // Time tag color
        let timeColor = 'text-emerald-400';
        if (mins >= 10) timeColor = 'text-rose-400 font-black animate-pulse';
        else if (mins >= 5) timeColor = 'text-amber-400 font-bold';

        // Items list
        let itemsHtml = '';
        (order.items || []).forEach(it => {
            itemsHtml += `
                <li class="py-1.5 border-b border-slate-800/80 last:border-0">
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded-md bg-slate-800 text-white font-black text-xs flex items-center justify-center">${it.cantidad}x</span>
                            <span class="text-xs font-bold text-slate-100">${it.producto_nombre}</span>
                        </div>
                    </div>
                    ${it.notas ? `<p class="text-[11px] text-amber-300 mt-1 pl-8 italic font-semibold">⚠️ ${it.notas}</p>` : ''}
                </li>
            `;
        });

        // Action Button
        let actionBtn = '';
        if (order.estado === 'pendiente') {
            actionBtn = `
                <button onclick="updateOrderStatus(${order.id}, 'en_preparacion')" class="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5">
                    <i data-lucide="play" class="w-3.5 h-3.5"></i>
                    <span>Iniciar Preparación</span>
                </button>
            `;
        } else if (order.estado === 'en_preparacion') {
            actionBtn = `
                <button onclick="updateOrderStatus(${order.id}, 'listo')" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    <span>Marcar Listo para Servir</span>
                </button>
            `;
        } else if (order.estado === 'listo') {
            actionBtn = `
                <button onclick="updateOrderStatus(${order.id}, 'entregado')" class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-1.5">
                    <i data-lucide="check-check" class="w-3.5 h-3.5 text-emerald-400"></i>
                    <span>Completar / Despachado</span>
                </button>
            `;
        }

        html += `
            <div class="bg-slate-900 rounded-2xl border ${borderClass} shadow-xl flex flex-col justify-between overflow-hidden">
                <div>
                    <!-- Card Top -->
                    <div class="p-3.5 ${headerBg} border-b border-slate-800 flex items-center justify-between">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-black text-white">#${order.numero_orden}</span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                                    ${order.tipo === 'mesa' ? '🍽️ ' + (order.numero_mesa || 'Mesa') : '🥡 Para Llevar'}
                                </span>
                            </div>
                            <span class="text-[10px] text-slate-400 block mt-0.5">${order.cliente_nombre}</span>
                        </div>
                        <div class="text-right">
                            ${statusBadge}
                            <span class="text-[10px] ${timeColor} block mt-1">⏱️ ${mins} min</span>
                        </div>
                    </div>

                    <!-- Items Body -->
                    <div class="p-3.5">
                        <ul class="space-y-1">
                            ${itemsHtml}
                        </ul>
                    </div>
                </div>

                <!-- Footer Action -->
                <div class="p-3 bg-slate-950/60 border-t border-slate-800">
                    ${actionBtn}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    lucide.createIcons();
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch('api/pedidos.php?action=cambiar_estado', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pedido_id: orderId, estado: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            fetchKdsOrders();
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: data.error, background: '#0f172a', color: '#fff' });
        }
    } catch (e) {
        console.error("Error al actualizar estado:", e);
    }
}

// Initial fetch & Polling every 4 seconds
fetchKdsOrders();
setInterval(fetchKdsOrders, 4000);
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
