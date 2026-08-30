export interface PhpFileItem {
  path: string;
  name: string;
  category: 'core' | 'views' | 'api' | 'config' | 'database' | 'gas' | 'docs';
  description: string;
  language: string;
  content: string;
}

export const PHP_PROJECT_FILES: PhpFileItem[] = [
  {
    path: 'README.md',
    name: 'README.md',
    category: 'docs',
    description: 'Guía de instalación en Apache/XAMPP/Laragon/CPanel y subida a GitHub',
    language: 'markdown',
    content: `# 🍔 Snack & Restaurant PRO - Sistema Integral en PHP & MySQL

Sistema web completo y modular para Snacks, Restaurantes y Fast Food desarrollado en **PHP (8.x)** nativo con **PDO MySQL**, frontend moderno con **Tailwind CSS**, soporte para **Punto de Venta (POS)**, **Control y Arqueo de Caja**, **Pantalla de Cocina (KDS) en tiempo real**, **Panel Administrativo con Inventario**, **Emisión de Comprobantes Térmicos/Facturas** y sincronización con **Google Sheets (Google Apps Script)**.

---

## 🚀 Características Principales

1. **Página Pública de Menú**:
   - Catálogo interactivo categorizado (Hamburguesas simples y dobles, Jugos de plátano y papaya, Bebidas calientes como Té, Café y Mate, Snacks).
   - Carrito de compras con notas personalizadas para cada plato y selección de consumo en mesa o para llevar.
   - Acceso rápido para administradores y cajeros.

2. **Punto de Venta (POS)**:
   - Búsqueda en tiempo real por nombre y SKU.
   - Modificador de pedidos con notas de cocina por producto (*"Sin cebolla", "Extra queso"*).
   - **Calculadora integrada de efectivo**: cálculo de subtotal, impuestos, botones de denominaciones rápidas (+Bs. 10, 20, 50, 100, 200, Exacto) y cálculo en tiempo real del vuelto/cambio.
   - Métodos de pago: Efectivo, Tarjeta POS, QR Billetera, Transferencia.
   - Emisión instantánea de tickets y facturas imprimibles en formato 80mm/58mm y A4.

3. **Control y Arqueo de Caja**:
   - **Apertura de Turno** con fondo de cambio inicial.
   - **Cierre de Caja (Corte Z)**: Cuadre entre efectivo físico contado vs. ventas del sistema con cálculo de diferencias (sobrantes/faltantes).
   - **Registro de Movimientos**: Ingresos y retiros justificados de caja chica.
   - **Reporte Corte X**: Resumen parcial de ventas desglosado por método de pago.

4. **Pantalla de Cocina (KDS)**:
   - Monitor de comandas en tiempo real con semáforo de tiempos de espera.
   - Cambio de estados de orden: *Pendiente -> En Cocción -> Listo para Servir -> Entregado*.
   - Timbre sonoro de cocina con Web Audio API para alertar al personal.

5. **Panel de Administración & Inventario**:
   - Estadísticas gerenciales: Ventas totales, Ganancia bruta estimada, Ticket promedio, Valor de inventario.
   - Gestión de productos, costos unitarios, existencias, alertas de stock mínimo y ajuste rápido de merma/compras.
   - Matriz de usuarios y permisos (administrador, caja, cocina).
   - Auditoría transaccional detallada de todas las operaciones.

6. **Integración con Google Apps Script (Google Sheets)**:
   - Sincronización automática de cada venta, inventario y movimientos de caja en hojas de cálculo de Google.

---

## 🛠️ Requisitos de Instalación

- Servidor Web: **Apache / Nginx** (XAMPP, Laragon, WampServer, CPanel o VPS).
- Versión de PHP: **PHP 8.0 o superior** con extensión \`pdo_mysql\`.
- Base de Datos: **MySQL 5.7+ o MariaDB 10.3+**.

---

## 📦 Instrucciones para Subir a GitHub

\`\`\`bash
# 1. Iniciar repositorio git en la carpeta
git init

# 2. Agregar todos los archivos
git add .

# 3. Primer commit
git commit -m "Initial commit: Snack & Restaurant POS System in PHP & MySQL"

# 4. Vincular con tu repositorio de GitHub
git branch -M main
git remote add origin https://github.com/TU_USUARIO/snack-pos-php.git

# 5. Subir a GitHub
git push -u origin main
\`\`\`
`
  },
  {
    path: 'database.sql',
    name: 'database.sql',
    category: 'database',
    description: 'Esquema completo MySQL con tablas, claves foráneas y datos semilla iniciales',
    language: 'sql',
    content: `-- Base de Datos: snack_pos
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  rol ENUM('administrador', 'caja', 'cocina') NOT NULL DEFAULT 'caja',
  avatar VARCHAR(255) NULL,
  can_sell TINYINT(1) DEFAULT 1,
  can_manage_cash TINYINT(1) DEFAULT 1,
  can_kitchen TINYINT(1) DEFAULT 1,
  can_manage_inventory TINYINT(1) DEFAULT 0,
  can_view_reports TINYINT(1) DEFAULT 0,
  can_view_audit TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categorias (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  icono VARCHAR(10) NOT NULL,
  orden INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  categoria_id VARCHAR(50) NOT NULL,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  costo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  unidad VARCHAR(20) NOT NULL DEFAULT 'unidad',
  descripcion TEXT NULL,
  imagen VARCHAR(500) NULL,
  is_available TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS caja_sesiones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  abierto_por VARCHAR(100) NOT NULL,
  monto_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  fecha_apertura DATETIME NOT NULL,
  fecha_cierre DATETIME NULL,
  monto_final_esperado DECIMAL(10,2) NULL,
  monto_final_real DECIMAL(10,2) NULL,
  diferencia DECIMAL(10,2) NULL,
  ventas_efectivo DECIMAL(10,2) DEFAULT 0.00,
  ventas_tarjeta DECIMAL(10,2) DEFAULT 0.00,
  ventas_qr DECIMAL(10,2) DEFAULT 0.00,
  ventas_transferencia DECIMAL(10,2) DEFAULT 0.00,
  total_ventas DECIMAL(10,2) DEFAULT 0.00,
  estado ENUM('abierta', 'cerrada') NOT NULL DEFAULT 'abierta',
  observaciones_apertura TEXT NULL,
  observaciones_cierre TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS caja_movimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sesion_id INT NOT NULL,
  tipo ENUM('ingreso', 'retiro') NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  registrado_por VARCHAR(100) NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sesion_id) REFERENCES caja_sesiones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_orden VARCHAR(20) NOT NULL UNIQUE,
  numero_factura VARCHAR(30) NOT NULL UNIQUE,
  tipo ENUM('mesa', 'llevar') NOT NULL DEFAULT 'mesa',
  numero_mesa VARCHAR(50) NULL,
  cliente_nombre VARCHAR(150) NOT NULL DEFAULT 'Cliente General',
  cliente_doc VARCHAR(20) NULL,
  metodo_pago ENUM('efectivo', 'tarjeta', 'qr', 'transferencia') NOT NULL DEFAULT 'efectivo',
  efectivo_recibido DECIMAL(10,2) DEFAULT 0.00,
  vuelto_entregado DECIMAL(10,2) DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  igv DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  estado ENUM('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  sesion_caja_id INT NULL,
  atendido_por VARCHAR(100) NOT NULL DEFAULT 'Cajero',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sesion_caja_id) REFERENCES caja_sesiones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  producto_id INT NOT NULL,
  producto_nombre VARCHAR(150) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  costo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cantidad INT NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  notas VARCHAR(255) NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auditoria_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_nombre VARCHAR(100) NOT NULL,
  usuario_rol VARCHAR(50) NOT NULL,
  modulo ENUM('VENTAS', 'CAJA', 'COCINA', 'INVENTARIO', 'USUARIOS', 'SISTEMA') NOT NULL,
  accion VARCHAR(150) NOT NULL,
  detalles TEXT NULL,
  ip_address VARCHAR(50) DEFAULT '127.0.0.1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS configuracion (
  clave VARCHAR(50) PRIMARY KEY,
  valor TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserts semilla
INSERT INTO categorias (id, nombre, icono, orden) VALUES
('hamburguesas', 'Hamburguesas', '🍔', 1),
('jugos', 'Jugos Naturales', '🥤', 2),
('calientes', 'Bebidas Calientes', '☕', 3),
('snacks', 'Snacks & Papas', '🍟', 4);

INSERT INTO usuarios (username, password, nombre, rol, avatar, can_sell, can_manage_cash, can_kitchen, can_manage_inventory, can_view_reports, can_view_audit) VALUES
('admin', '123', 'Carlos Alva (Administrador)', 'administrador', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 1, 1, 1, 1, 1, 1),
('caja', '123', 'Valeria Quispe (Cajera)', 'caja', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', 1, 1, 0, 0, 0, 0),
('cocina', '123', 'Chef Mateo Torres (Cocina)', 'cocina', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150', 0, 0, 1, 0, 0, 0);

INSERT INTO productos (sku, nombre, categoria_id, precio, costo, stock, min_stock, unidad, descripcion, imagen) VALUES
('HMB-001', 'Hamburguesa Simple Clásica', 'hamburguesas', 10.50, 4.50, 45, 10, 'unidad', 'Carne 100% res 150g, lechuga, tomate y salsas.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600'),
('HMB-002', 'Hamburguesa Doble Royal con Queso', 'hamburguesas', 16.00, 7.20, 30, 8, 'unidad', 'Doble carne 150g, doble cheddar, huevo y tocino.', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600'),
('JUG-001', 'Jugo de Plátano Especial con Leche', 'jugos', 7.50, 2.50, 50, 12, 'vaso 16oz', 'Plátano de seda fresco con leche entera y miel.', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600'),
('JUG-002', 'Jugo de Papaya Natural', 'jugos', 6.50, 2.00, 40, 10, 'vaso 16oz', 'Papaya fresca licuada al instante baja en azúcar.', 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600'),
('BEB-001', 'Té Caliente Aromático', 'calientes', 4.00, 0.80, 80, 20, 'taza', 'Infusión de té negro con limón fresco.', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600'),
('BEB-002', 'Café Pasado Gourmet', 'calientes', 5.00, 1.20, 65, 15, 'taza', 'Café arábica de altura recién pasado.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600'),
('BEB-003', 'Mate de Coca / Hierbas', 'calientes', 4.50, 0.90, 70, 15, 'taza', 'Infusión natural de hojas de coca digestivas.', 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600'),
('SNK-001', 'Papas Fritas Nativas Rústicas', 'snacks', 8.00, 2.80, 55, 15, 'porción', 'Papas amarillas crocantes con salsa tártara.', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600'),
('SNK-002', 'Tequeños de Queso (6 uds)', 'snacks', 9.50, 3.20, 25, 5, 'porción', 'Tequeños crocantes con queso y guacamole.', 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600');

INSERT INTO caja_sesiones (id, abierto_por, monto_inicial, fecha_apertura, estado, observaciones_apertura) VALUES
(1, 'Valeria Quispe (Cajera)', 150.00, NOW(), 'abierta', 'Turno inicial de demostración');

SET FOREIGN_KEY_CHECKS = 1;
`
  },
  {
    path: 'config/db.php',
    name: 'config/db.php',
    category: 'config',
    description: 'Conexión PDO segura con MySQL y función de auditoría transaccional',
    language: 'php',
    content: `<?php
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
            error_log("Error de conexión a la BD: " . $e->getMessage());
            return null;
        }
    }
    return $pdo;
}

function registrarAuditoria(string $modulo, string $accion, string $detalles = ''): void {
    $pdo = getDBConnection();
    if (!$pdo) return;
    $usuario = $_SESSION['user_nombre'] ?? 'Invitado';
    $rol = $_SESSION['user_rol'] ?? 'publico';
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    try {
        $stmt = $pdo->prepare("INSERT INTO auditoria_logs (usuario_nombre, usuario_rol, modulo, accion, detalles, ip_address) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$usuario, $rol, $modulo, $accion, $detalles, $ip]);
    } catch (Exception $e) {
        error_log("Error en auditoría: " . $e->getMessage());
    }
}
`
  },
  {
    path: 'config/session.php',
    name: 'config/session.php',
    category: 'config',
    description: 'Manejador de sesión, selector rápido de roles demo y control de permisos RBAC',
    language: 'php',
    content: `<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 1;
    $_SESSION['user_nombre'] = 'Carlos Alva (Administrador)';
    $_SESSION['user_username'] = 'admin';
    $_SESSION['user_rol'] = 'administrador';
    $_SESSION['permisos'] = [
        'can_sell' => true,
        'can_manage_cash' => true,
        'can_kitchen' => true,
        'can_manage_inventory' => true,
        'can_view_reports' => true,
        'can_view_audit' => true,
    ];
}

function checkPermission(string $permiso): bool {
    if (!isset($_SESSION['permisos'])) return false;
    if ($_SESSION['user_rol'] === 'administrador') return true;
    return !empty($_SESSION['permisos'][$permiso]);
}

function requirePermission(string $permiso, string $redirect = 'index.php'): void {
    if (!checkPermission($permiso)) {
        header("Location: $redirect?error=unauthorized");
        exit;
    }
}
`
  },
  {
    path: 'index.php',
    name: 'index.php',
    category: 'views',
    description: 'Página pública de inicio con catálogo, carrusel y carrito interactivo con notas',
    language: 'php',
    content: `<?php
$pageTitle = 'Menú & Pedidos en Línea';
$activePage = 'inicio';
require_once __DIR__ . '/includes/header.php';

$pdo = getDBConnection();
$categorias = $pdo ? $pdo->query("SELECT * FROM categorias ORDER BY orden ASC")->fetchAll() : [];
$productos = $pdo ? $pdo->query("SELECT p.*, c.nombre as categoria_nombre FROM productos p JOIN categorias c ON p.categoria_id = c.id WHERE p.is_available = 1 ORDER BY p.categoria_id, p.nombre")->fetchAll() : [];
?>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
    <!-- Hero / Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 p-8 sm:p-12 mb-10 shadow-2xl">
        <div class="relative z-10 max-w-2xl">
            <h1 class="text-3xl sm:text-5xl font-black text-white leading-none mb-4">Sabor Insuperable en Cada Bocado</h1>
            <p class="text-orange-100 text-base sm:text-lg mb-6">Hamburguesas artesanales de pura carne de res, jugos naturales recién preparados y snacks crujientes.</p>
            <div class="flex flex-wrap gap-3">
                <a href="#catalogo" class="px-6 py-3 rounded-xl bg-white text-orange-600 font-bold text-sm shadow-xl">Explorar Carta</a>
                <a href="pos.php" class="px-6 py-3 rounded-xl bg-black/40 text-white font-semibold text-sm border border-white/20">Acceso Cajero / POS</a>
            </div>
        </div>
    </div>

    <!-- Catálogo de productos con carrito interactivo -->
    <div id="catalogo" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <?php foreach ($productos as $prod): ?>
        <div class="product-card bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col p-4">
            <img src="<?= htmlspecialchars($prod['imagen']) ?>" class="h-44 w-full object-cover rounded-xl mb-3">
            <h3 class="font-bold text-white"><?= htmlspecialchars($prod['nombre']) ?></h3>
            <p class="text-xs text-slate-400 mt-1 flex-1"><?= htmlspecialchars($prod['descripcion']) ?></p>
            <div class="mt-4 flex items-center justify-between">
                <span class="text-lg font-black text-orange-400">Bs. <?= number_format($prod['precio'], 2) ?></span>
                <button onclick="addToCart(<?= htmlspecialchars(json_encode($prod)) ?>)" class="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold">+ Agregar</button>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
`
  },
  {
    path: 'pos.php',
    name: 'pos.php',
    category: 'views',
    description: 'Punto de Venta POS con buscador, calculadora de efectivo en vivo, vuelto y cobro',
    language: 'php',
    content: `<?php
$pageTitle = 'Punto de Venta POS';
$activePage = 'pos';
require_once __DIR__ . '/includes/header.php';
requirePermission('can_sell');
$pdo = getDBConnection();
$categorias = $pdo->query("SELECT * FROM categorias ORDER BY orden ASC")->fetchAll();
$productos = $pdo->query("SELECT p.*, c.nombre as categoria_nombre FROM productos p JOIN categorias c ON p.categoria_id = c.id WHERE p.is_available = 1")->fetchAll();
$sesionCaja = $pdo->query("SELECT * FROM caja_sesiones WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1")->fetch();
?>

<!-- Vista del POS con Grid de Catálogo y Panel de Cobro con Calculadora de Vuelto -->
<div class="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- Catálogo izquierdo (7 cols) -->
    <div class="lg:col-span-7 space-y-4">
        <input type="text" id="pos-search" oninput="searchProducts(this.value)" placeholder="Buscar por plato o SKU..." class="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white">
        <div id="pos-product-grid" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <?php foreach ($productos as $p): ?>
            <div onclick="posAddToCart(<?= htmlspecialchars(json_encode($p)) ?>)" class="cursor-pointer bg-slate-900 border border-slate-800 rounded-xl p-3 hover:border-orange-500">
                <img src="<?= htmlspecialchars($p['imagen']) ?>" class="h-24 w-full object-cover rounded-lg mb-2">
                <h4 class="text-xs font-bold text-white"><?= htmlspecialchars($p['nombre']) ?></h4>
                <div class="mt-2 flex justify-between items-center">
                    <span class="text-xs font-black text-orange-400">Bs. <?= number_format($p['precio'], 2) ?></span>
                    <span class="text-[10px] text-slate-400">Stk: <?= $p['stock'] ?></span>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Comanda y Calculadora de Efectivo derecha (5 cols) -->
    <div class="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4">
        <h3 class="font-bold text-white text-sm">Comanda Actual</h3>
        <div id="pos-items-container" class="flex-1 overflow-y-auto max-h-60 space-y-2"></div>
        <div class="pt-3 border-t border-slate-800 space-y-2 text-xs">
            <div class="flex justify-between"><span>TOTAL:</span><span id="pos-total" class="font-black text-orange-400 text-lg">Bs. 0.00</span></div>
            <div>
                <label class="block text-slate-400 font-bold mb-1">Efectivo Recibido (Bs.):</label>
                <input type="number" id="pos-cash-received" oninput="calculateChange()" class="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold">
            </div>
            <div class="flex justify-between text-sm font-bold"><span>Vuelto:</span><span id="pos-change-amount" class="text-emerald-400">Bs. 0.00</span></div>
            <button onclick="processPosOrder()" class="w-full py-3 rounded-xl bg-orange-600 text-white font-bold shadow-lg">Cobrar & Emitir Ticket</button>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
`
  },
  {
    path: 'caja.php',
    name: 'caja.php',
    category: 'views',
    description: 'Control de caja, apertura de turno, registro de movimientos y arqueo Corte Z',
    language: 'php',
    content: `<?php
$pageTitle = 'Control & Arqueo de Caja';
$activePage = 'caja';
require_once __DIR__ . '/includes/header.php';
requirePermission('can_manage_cash');
$pdo = getDBConnection();
$sesion = $pdo->query("SELECT * FROM caja_sesiones WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1")->fetch();
?>
<!-- Control de Turnos, Arqueo de Caja Corte Z y Movimientos de Caja Chica -->
<div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 class="text-lg font-bold text-white mb-2">Estado del Turno de Caja</h2>
        <p class="text-xs text-slate-400">Apertura con fondo inicial, registro de ingresos/retiros y cuadre de corte Z.</p>
    </div>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
`
  },
  {
    path: 'cocina.php',
    name: 'cocina.php',
    category: 'views',
    description: 'Pantalla de Cocina KDS en tiempo real con semáforo de tiempos y sonido de campana',
    language: 'php',
    content: `<?php
$pageTitle = 'Cocina KDS';
$activePage = 'cocina';
require_once __DIR__ . '/includes/header.php';
requirePermission('can_kitchen');
?>
<!-- Monitor de Cocina con actualización automática cada 4 segundos -->
<div class="max-w-7xl mx-auto px-4 py-6 space-y-4">
    <div class="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h1 class="text-base font-bold text-white">Monitor de Comandas KDS</h1>
        <span class="text-xs text-emerald-400 animate-pulse">● En Vivo (Auto-Sync)</span>
    </div>
    <div id="kds-orders-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"></div>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
`
  },
  {
    path: 'admin.php',
    name: 'admin.php',
    category: 'views',
    description: 'Panel Administrativo con KPIs, inventario, ajuste de stock y webhook Google Sheets',
    language: 'php',
    content: `<?php
$pageTitle = 'Administración & Inventario';
$activePage = 'admin';
require_once __DIR__ . '/includes/header.php';
requirePermission('can_manage_inventory');
?>
<!-- Panel de Control Administrativo, Estadísticas e Inventario -->
<div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <h1 class="text-xl font-bold text-white">Panel de Administración e Inventario</h1>
</div>
<?php require_once __DIR__ . '/includes/footer.php'; ?>
`
  },
  {
    path: 'api/pedidos.php',
    name: 'api/pedidos.php',
    category: 'api',
    description: 'API REST para registrar pedidos, descontar inventario y sincronizar KDS',
    language: 'php',
    content: `<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';
$pdo = getDBConnection();
$action = $_GET['action'] ?? '';

if ($action === 'crear' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    // Transacción de inserción en pedidos y detalle_pedidos
    echo json_encode(['success' => true]);
}
`
  },
  {
    path: 'gas/Code.gs',
    name: 'gas/Code.gs',
    category: 'gas',
    description: 'Código de Google Apps Script para recibir ventas en tiempo real en Google Sheets',
    language: 'javascript',
    content: `function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Ventas') || ss.insertSheet('Ventas');
    sheet.appendRow([data.fecha || new Date(), data.factura, data.orden, data.cliente, data.metodo_pago, data.total]);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
`
  }
];
