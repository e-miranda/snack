<?php
$currentUser = $_SESSION['user_nombre'] ?? 'Usuario';
$currentRole = $_SESSION['user_rol'] ?? 'caja';
$currentAvatar = $_SESSION['user_avatar'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
?>
<header class="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
            
            <!-- Logo & Brand -->
            <div class="flex items-center gap-3">
                <a href="index.php" class="flex items-center gap-3 group">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                        <i data-lucide="utensils" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-black text-lg tracking-tight bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">SNACK PRO</span>
                            <span class="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded">PHP 8</span>
                        </div>
                        <p class="text-[11px] text-slate-400">Sistema Gastronómico Integral</p>
                    </div>
                </a>
            </div>

            <!-- Main Navigation Links -->
            <nav class="hidden md:flex items-center gap-1">
                <a href="index.php" class="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 <?= $activePage === 'inicio' ? 'bg-slate-800 text-orange-400 shadow-sm border border-slate-700' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white' ?>">
                    <i data-lucide="store" class="w-4 h-4"></i>
                    <span>Menú Público</span>
                </a>

                <?php if (checkPermission('can_sell')): ?>
                <a href="pos.php" class="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 <?= $activePage === 'pos' ? 'bg-slate-800 text-orange-400 shadow-sm border border-slate-700' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white' ?>">
                    <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                    <span>Punto de Venta POS</span>
                </a>
                <?php endif; ?>

                <?php if (checkPermission('can_manage_cash')): ?>
                <a href="caja.php" class="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 <?= $activePage === 'caja' ? 'bg-slate-800 text-orange-400 shadow-sm border border-slate-700' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white' ?>">
                    <i data-lucide="wallet" class="w-4 h-4"></i>
                    <span>Control de Caja</span>
                </a>
                <?php endif; ?>

                <?php if (checkPermission('can_kitchen')): ?>
                <a href="cocina.php" class="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 <?= $activePage === 'cocina' ? 'bg-slate-800 text-orange-400 shadow-sm border border-slate-700' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white' ?>">
                    <i data-lucide="flame" class="w-4 h-4"></i>
                    <span>Cocina KDS</span>
                </a>
                <?php endif; ?>

                <?php if (checkPermission('can_manage_inventory') || checkPermission('can_view_reports')): ?>
                <a href="admin.php" class="px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 <?= $activePage === 'admin' ? 'bg-slate-800 text-orange-400 shadow-sm border border-slate-700' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white' ?>">
                    <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                    <span>Administración</span>
                </a>
                <?php endif; ?>
            </nav>

            <!-- User Profile & Quick Role Switcher -->
            <div class="flex items-center gap-3">
                <div class="hidden lg:flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
                    <span class="text-slate-400">Rol Activo:</span>
                    <select onchange="window.location.href='?cambiar_rol=' + this.value" class="bg-slate-900 text-orange-400 font-semibold rounded px-2 py-0.5 border border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer">
                        <option value="administrador" <?= $currentRole === 'administrador' ? 'selected' : '' ?>>👑 Administrador</option>
                        <option value="caja" <?= $currentRole === 'caja' ? 'selected' : '' ?>>💼 Cajero(a)</option>
                        <option value="cocina" <?= $currentRole === 'cocina' ? 'selected' : '' ?>>👨‍🍳 Cocina KDS</option>
                    </select>
                </div>

                <div class="flex items-center gap-2 pl-2 border-l border-slate-800">
                    <img src="<?= htmlspecialchars($currentAvatar) ?>" alt="Avatar" class="w-8 h-8 rounded-full object-cover ring-2 ring-orange-500/30">
                    <div class="hidden sm:block text-left text-xs leading-tight">
                        <p class="font-medium text-slate-200"><?= htmlspecialchars(explode(' ', $currentUser)[0]) ?></p>
                        <p class="text-[10px] text-orange-400 font-semibold uppercase"><?= htmlspecialchars($currentRole) ?></p>
                    </div>
                </div>
            </div>

        </div>
    </div>
</header>
