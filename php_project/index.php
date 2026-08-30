<?php
$pageTitle = 'Menú & Pedidos en Línea';
$activePage = 'inicio';
require_once __DIR__ . '/includes/header.php';

$pdo = getDBConnection();
$categorias = [];
$productos = [];

if ($pdo) {
    try {
        $categorias = $pdo->query("SELECT * FROM categorias ORDER BY orden ASC")->fetchAll();
        $productos = $pdo->query("SELECT p.*, c.nombre as categoria_nombre FROM productos p JOIN categorias c ON p.categoria_id = c.id WHERE p.is_available = 1 ORDER BY p.categoria_id, p.nombre")->fetchAll();
    } catch (Exception $e) {
        error_log("Error cargando productos: " . $e->getMessage());
    }
}
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

    <!-- Hero / Carousel Section -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 p-8 sm:p-12 mb-10 shadow-2xl border border-orange-500/30">
        <div class="absolute -right-10 -bottom-10 opacity-20 pointer-events-none">
            <i data-lucide="utensils" class="w-96 h-96 text-white"></i>
        </div>
        
        <div class="relative z-10 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-orange-200 text-xs font-semibold uppercase tracking-wider mb-4">
                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-300"></i>
                Snack & Fast Food Artesanal
            </div>
            <h1 class="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none mb-4">
                Sabor Insuperable en Cada Bocado
            </h1>
            <p class="text-orange-100 text-base sm:text-lg mb-6 leading-relaxed">
                Hamburguesas artesanales de pura carne de res, jugos naturales recién preparados, infusiones reconfortantes y los mejores snacks crujientes.
            </p>
            <div class="flex flex-wrap items-center gap-3">
                <a href="#catalogo" class="px-6 py-3 rounded-xl bg-white text-orange-600 font-bold text-sm shadow-xl hover:bg-orange-50 transition-all flex items-center gap-2">
                    <i data-lucide="book-open" class="w-4 h-4"></i>
                    Explorar Carta
                </a>
                <a href="pos.php" class="px-6 py-3 rounded-xl bg-black/40 text-white font-semibold text-sm hover:bg-black/60 transition-all border border-white/20 flex items-center gap-2">
                    <i data-lucide="layout-grid" class="w-4 h-4"></i>
                    Acceso Cajero / POS
                </a>
            </div>
        </div>
    </div>

    <!-- Featured Category Filter Pills -->
    <div id="catalogo" class="mb-8">
        <div class="flex items-center justify-between gap-4 mb-4">
            <div>
                <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                    <i data-lucide="utensils-crossed" class="w-6 h-6 text-orange-500"></i>
                    Nuestra Carta & Especialidades
                </h2>
                <p class="text-xs text-slate-400">Selecciona tus platos y agrégalos al carrito para ordenar</p>
            </div>
            
            <button onclick="toggleCartDrawer()" class="relative px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/30 transition-all flex items-center gap-2">
                <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                <span class="hidden sm:inline">Ver Pedido</span>
                <span id="cart-badge-count" class="w-5 h-5 rounded-full bg-white text-orange-600 text-xs font-black flex items-center justify-center">0</span>
            </button>
        </div>

        <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button onclick="filterCategory('all')" class="cat-filter active px-4 py-2 rounded-xl text-xs font-bold transition-all bg-orange-600 text-white shadow-md flex items-center gap-1.5 whitespace-nowrap" data-cat="all">
                <span>🍽️</span> Todos
            </button>
            <?php foreach ($categorias as $cat): ?>
            <button onclick="filterCategory('<?= htmlspecialchars($cat['id']) ?>')" class="cat-filter px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800 flex items-center gap-1.5 whitespace-nowrap" data-cat="<?= htmlspecialchars($cat['id']) ?>">
                <span><?= htmlspecialchars($cat['icono']) ?></span> <?= htmlspecialchars($cat['nombre']) ?>
            </button>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Product Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <?php foreach ($productos as $prod): ?>
        <div class="product-card group bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden flex flex-col hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300" data-cat="<?= htmlspecialchars($prod['categoria_id']) ?>">
            <div class="relative h-44 overflow-hidden bg-slate-950">
                <img src="<?= htmlspecialchars($prod['imagen'] ?: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80') ?>" alt="<?= htmlspecialchars($prod['nombre']) ?>" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-orange-300">
                    <?= htmlspecialchars($prod['sku']) ?>
                </div>
                <div class="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black text-white">
                    Stock: <?= (int)$prod['stock'] ?>
                </div>
            </div>
            
            <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <span class="text-[10px] uppercase font-bold text-orange-400 tracking-wider"><?= htmlspecialchars($prod['categoria_nombre']) ?></span>
                    <h3 class="text-sm font-bold text-white mt-1 group-hover:text-orange-400 transition-colors line-clamp-1">
                        <?= htmlspecialchars($prod['nombre']) ?>
                    </h3>
                    <p class="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        <?= htmlspecialchars($prod['descripcion']) ?>
                    </p>
                </div>
                
                <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div>
                        <span class="text-[10px] text-slate-500 block leading-none">Precio</span>
                        <span class="text-lg font-black text-orange-400">S/ <?= number_format($prod['precio'], 2) ?></span>
                    </div>
                    
                    <button onclick="addToCart(<?= htmlspecialchars(json_encode($prod)) ?>)" class="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md hover:shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5">
                        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                        <span>Agregar</span>
                    </button>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>

</div>

<!-- Cart Drawer / Modal -->
<div id="cart-drawer" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden transition-opacity">
    <div class="fixed inset-y-0 right-0 max-w-md w-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center">
                    <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                </div>
                <h3 class="font-bold text-white text-base">Mi Pedido</h3>
            </div>
            <button onclick="toggleCartDrawer()" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
        </div>

        <div id="cart-items-container" class="flex-1 overflow-y-auto p-4 space-y-3">
            <!-- Items rendered via JS -->
            <div class="text-center py-12 text-slate-500">
                <i data-lucide="shopping-cart" class="w-12 h-12 mx-auto mb-2 opacity-30"></i>
                <p class="text-sm">Tu pedido está vacío</p>
            </div>
        </div>

        <!-- Checkout Form & Totals -->
        <div class="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
            <div class="space-y-2 text-xs">
                <div class="flex items-center justify-between text-slate-400">
                    <span>Tipo de Consumo:</span>
                    <div class="flex gap-2">
                        <label class="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="order_type" value="mesa" checked class="text-orange-500 focus:ring-0">
                            <span>En Mesa</span>
                        </label>
                        <label class="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="order_type" value="llevar" class="text-orange-500 focus:ring-0">
                            <span>Para Llevar</span>
                        </label>
                    </div>
                </div>
                
                <div id="table-number-row" class="flex items-center justify-between gap-2">
                    <span class="text-slate-400">N° de Mesa:</span>
                    <input type="text" id="order_table" value="Mesa 1" class="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white w-32 focus:border-orange-500 focus:outline-none">
                </div>

                <div class="flex items-center justify-between gap-2">
                    <span class="text-slate-400">Nombre Cliente:</span>
                    <input type="text" id="order_client" placeholder="Opcional" class="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white w-48 focus:border-orange-500 focus:outline-none">
                </div>

                <div class="pt-2 border-t border-slate-800 space-y-1 text-slate-300">
                    <div class="flex justify-between">
                        <span>Subtotal:</span>
                        <span id="cart-subtotal" class="font-semibold">S/ 0.00</span>
                    </div>
                    <div class="flex justify-between">
                        <span>IGV (18% incl.):</span>
                        <span id="cart-igv" class="text-slate-400 font-semibold">S/ 0.00</span>
                    </div>
                    <div class="flex justify-between text-base font-black text-orange-400 pt-1">
                        <span>Total a Pagar:</span>
                        <span id="cart-total">S/ 0.00</span>
                    </div>
                </div>
            </div>

            <button onclick="submitOnlineOrder()" id="btn-submit-order" class="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-xl shadow-orange-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                <i data-lucide="check-circle" class="w-4 h-4"></i>
                <span>Enviar Pedido a Cocina</span>
            </button>
        </div>

    </div>
</div>

<script>
let cart = [];

function filterCategory(catId) {
    document.querySelectorAll('.cat-filter').forEach(btn => {
        if (btn.dataset.cat === catId) {
            btn.classList.remove('bg-slate-900', 'text-slate-300', 'border', 'border-slate-800');
            btn.classList.add('bg-orange-600', 'text-white', 'shadow-md');
        } else {
            btn.classList.remove('bg-orange-600', 'text-white', 'shadow-md');
            btn.classList.add('bg-slate-900', 'text-slate-300', 'border', 'border-slate-800');
        }
    });

    document.querySelectorAll('.product-card').forEach(card => {
        if (catId === 'all' || card.dataset.cat === catId) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

function addToCart(prod) {
    const existing = cart.find(item => item.id === prod.id);
    if (existing) {
        existing.cantidad += 1;
    } else {
        cart.push({
            id: prod.id,
            nombre: prod.nombre,
            precio: parseFloat(prod.precio),
            costo: parseFloat(prod.costo || 0),
            cantidad: 1,
            notas: ''
        });
    }
    renderCart();
    
    // Quick toast
    Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: 'success',
        title: `+1 ${prod.nombre}`,
        showConfirmButton: false,
        timer: 1500,
        background: '#0f172a',
        color: '#fff'
    });
}

function changeQty(index, delta) {
    cart[index].cantidad += delta;
    if (cart[index].cantidad <= 0) {
        cart.splice(index, 1);
    }
    renderCart();
}

function updateNotes(index, val) {
    cart[index].notas = val;
}

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const badge = document.getElementById('cart-badge-count');
    const btnSubmit = document.getElementById('btn-submit-order');
    
    const totalCount = cart.reduce((acc, item) => acc + item.cantidad, 0);
    badge.innerText = totalCount;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 text-slate-500">
                <i data-lucide="shopping-cart" class="w-12 h-12 mx-auto mb-2 opacity-30"></i>
                <p class="text-sm">Tu pedido está vacío</p>
            </div>
        `;
        document.getElementById('cart-subtotal').innerText = 'S/ 0.00';
        document.getElementById('cart-igv').innerText = 'S/ 0.00';
        document.getElementById('cart-total').innerText = 'S/ 0.00';
        btnSubmit.disabled = true;
        lucide.createIcons();
        return;
    }

    btnSubmit.disabled = false;
    let html = '';
    let total = 0;

    cart.forEach((item, idx) => {
        const itemTotal = item.precio * item.cantidad;
        total += itemTotal;
        html += `
            <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                    <div>
                        <h4 class="text-xs font-bold text-white">${item.nombre}</h4>
                        <span class="text-[11px] text-orange-400">S/ ${item.precio.toFixed(2)} c/u</span>
                    </div>
                    <span class="text-xs font-black text-white">S/ ${itemTotal.toFixed(2)}</span>
                </div>
                <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-900">
                    <input type="text" placeholder="Nota especial (ej: Sin cebolla)" value="${item.notas || ''}" onchange="updateNotes(${idx}, this.value)" class="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:border-orange-500">
                    <div class="flex items-center gap-1">
                        <button onclick="changeQty(${idx}, -1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold">-</button>
                        <span class="w-6 text-center text-xs font-bold text-white">${item.cantidad}</span>
                        <button onclick="changeQty(${idx}, 1)" class="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold">+</button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    
    const subtotal = total / 1.18;
    const igv = total - subtotal;
    document.getElementById('cart-subtotal').innerText = 'S/ ' + subtotal.toFixed(2);
    document.getElementById('cart-igv').innerText = 'S/ ' + igv.toFixed(2);
    document.getElementById('cart-total').innerText = 'S/ ' + total.toFixed(2);
    lucide.createIcons();
}

function toggleCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    drawer.classList.toggle('hidden');
}

async function submitOnlineOrder() {
    if (cart.length === 0) return;
    
    const orderType = document.querySelector('input[name="order_type"]:checked').value;
    const mesa = document.getElementById('order_table').value;
    const cliente = document.getElementById('order_client').value || 'Cliente Menú Web';

    const orderData = {
        tipo: orderType,
        numero_mesa: orderType === 'mesa' ? mesa : 'Para Llevar',
        cliente_nombre: cliente,
        metodo_pago: 'efectivo',
        items: cart
    };

    try {
        const res = await fetch('api/pedidos.php?action=crear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await res.json();

        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Pedido Enviado a Cocina!',
                html: `Orden <b>#${data.numero_orden}</b> registrada con éxito.<br>El equipo de cocina ya está preparando tu comida.`,
                background: '#0f172a',
                color: '#fff',
                confirmButtonColor: '#ea580c'
            });
            cart = [];
            renderCart();
            toggleCartDrawer();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'No se pudo enviar el pedido',
                background: '#0f172a',
                color: '#fff'
            });
        }
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Error de Red',
            text: 'Verifique la conexión con el servidor PHP',
            background: '#0f172a',
            color: '#fff'
        });
    }
}
</script>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
