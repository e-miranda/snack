-- ==========================================================
-- Base de Datos: `snack_pos`
-- Sistema Integral para Snack, Restaurante y Punto de Venta
-- ==========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabla de Usuarios y Permisos
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `rol` ENUM('administrador', 'caja', 'cocina') NOT NULL DEFAULT 'caja',
  `avatar` VARCHAR(255) NULL,
  `can_sell` TINYINT(1) DEFAULT 1,
  `can_manage_cash` TINYINT(1) DEFAULT 1,
  `can_kitchen` TINYINT(1) DEFAULT 1,
  `can_manage_inventory` TINYINT(1) DEFAULT 0,
  `can_view_reports` TINYINT(1) DEFAULT 0,
  `can_view_audit` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Categorías de Productos
CREATE TABLE IF NOT EXISTS `categorias` (
  `id` VARCHAR(50) PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `icono` VARCHAR(10) NOT NULL,
  `orden` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Productos del Menú & Almacén
CREATE TABLE IF NOT EXISTS `productos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sku` VARCHAR(50) NOT NULL UNIQUE,
  `nombre` VARCHAR(150) NOT NULL,
  `categoria_id` VARCHAR(50) NOT NULL,
  `precio` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `costo` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `stock` INT NOT NULL DEFAULT 0,
  `min_stock` INT NOT NULL DEFAULT 5,
  `unidad` VARCHAR(20) NOT NULL DEFAULT 'unidad',
  `descripcion` TEXT NULL,
  `imagen` VARCHAR(500) NULL,
  `is_available` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Sesiones de Caja (Turnos)
CREATE TABLE IF NOT EXISTS `caja_sesiones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `abierto_por` VARCHAR(100) NOT NULL,
  `monto_inicial` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `fecha_apertura` DATETIME NOT NULL,
  `fecha_cierre` DATETIME NULL,
  `monto_final_esperado` DECIMAL(10,2) NULL,
  `monto_final_real` DECIMAL(10,2) NULL,
  `diferencia` DECIMAL(10,2) NULL,
  `ventas_efectivo` DECIMAL(10,2) DEFAULT 0.00,
  `ventas_tarjeta` DECIMAL(10,2) DEFAULT 0.00,
  `ventas_qr` DECIMAL(10,2) DEFAULT 0.00,
  `ventas_transferencia` DECIMAL(10,2) DEFAULT 0.00,
  `total_ventas` DECIMAL(10,2) DEFAULT 0.00,
  `estado` ENUM('abierta', 'cerrada') NOT NULL DEFAULT 'abierta',
  `observaciones_apertura` TEXT NULL,
  `observaciones_cierre` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de Movimientos de Caja Chica (Ingresos / Retiros)
CREATE TABLE IF NOT EXISTS `caja_movimientos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sesion_id` INT NOT NULL,
  `tipo` ENUM('ingreso', 'retiro') NOT NULL,
  `monto` DECIMAL(10,2) NOT NULL,
  `motivo` VARCHAR(255) NOT NULL,
  `registrado_por` VARCHAR(100) NOT NULL,
  `fecha` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sesion_id`) REFERENCES `caja_sesiones`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabla de Pedidos y Ventas
CREATE TABLE IF NOT EXISTS `pedidos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_orden` VARCHAR(20) NOT NULL UNIQUE,
  `numero_factura` VARCHAR(30) NOT NULL UNIQUE,
  `tipo` ENUM('mesa', 'llevar') NOT NULL DEFAULT 'mesa',
  `numero_mesa` VARCHAR(50) NULL,
  `cliente_nombre` VARCHAR(150) NOT NULL DEFAULT 'Cliente General',
  `cliente_doc` VARCHAR(20) NULL,
  `metodo_pago` ENUM('efectivo', 'tarjeta', 'qr', 'transferencia') NOT NULL DEFAULT 'efectivo',
  `efectivo_recibido` DECIMAL(10,2) DEFAULT 0.00,
  `vuelto_entregado` DECIMAL(10,2) DEFAULT 0.00,
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `igv` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `descuento` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `estado` ENUM('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
  `notas` TEXT NULL,
  `sesion_caja_id` INT NULL,
  `atendido_por` VARCHAR(100) NOT NULL DEFAULT 'Cajero',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sesion_caja_id`) REFERENCES `caja_sesiones`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabla de Detalle de Items del Pedido
CREATE TABLE IF NOT EXISTS `detalle_pedidos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pedido_id` INT NOT NULL,
  `producto_id` INT NOT NULL,
  `producto_nombre` VARCHAR(150) NOT NULL,
  `precio_unitario` DECIMAL(10,2) NOT NULL,
  `costo_unitario` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `cantidad` INT NOT NULL DEFAULT 1,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `notas` VARCHAR(255) NULL,
  FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabla de Auditoría Transaccional
CREATE TABLE IF NOT EXISTS `auditoria_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_nombre` VARCHAR(100) NOT NULL,
  `usuario_rol` VARCHAR(50) NOT NULL,
  `modulo` ENUM('VENTAS', 'CAJA', 'COCINA', 'INVENTARIO', 'USUARIOS', 'SISTEMA') NOT NULL,
  `accion` VARCHAR(150) NOT NULL,
  `detalles` TEXT NULL,
  `ip_address` VARCHAR(50) DEFAULT '127.0.0.1',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabla de Configuración General
CREATE TABLE IF NOT EXISTS `configuracion` (
  `clave` VARCHAR(50) PRIMARY KEY,
  `valor` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- DATOS SEMILLA (INSERTS INICIALES)
-- ==========================================================

-- Categorías
INSERT INTO `categorias` (`id`, `nombre`, `icono`, `orden`) VALUES
('hamburguesas', 'Hamburguesas', '🍔', 1),
('jugos', 'Jugos Naturales', '🥤', 2),
('calientes', 'Bebidas Calientes', '☕', 3),
('snacks', 'Snacks & Papas', '🍟', 4)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Usuarios por defecto (Contraseña: 123)
-- Hash generado para '123' o soporte en texto plano según compatibilidad
INSERT INTO `usuarios` (`username`, `password`, `nombre`, `rol`, `avatar`, `can_sell`, `can_manage_cash`, `can_kitchen`, `can_manage_inventory`, `can_view_reports`, `can_view_audit`) VALUES
('admin', '123', 'Carlos Alva (Administrador)', 'administrador', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 1, 1, 1, 1, 1, 1),
('caja', '123', 'Valeria Quispe (Cajera)', 'caja', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 1, 1, 0, 0, 0, 0),
('cocina', '123', 'Chef Mateo Torres (Cocina)', 'cocina', 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80', 0, 0, 1, 0, 0, 0)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

-- Catálogo de Productos con Stock
INSERT INTO `productos` (`sku`, `nombre`, `categoria_id`, `precio`, `costo`, `stock`, `min_stock`, `unidad`, `descripcion`, `imagen`, `is_available`) VALUES
('HMB-001', 'Hamburguesa Simple Clásica', 'hamburguesas', 10.50, 4.50, 45, 10, 'unidad', 'Carne 100% res 150g, lechuga fresca, tomate, pepinillos y salsas de la casa en pan artesanal.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', 1),
('HMB-002', 'Hamburguesa Doble Royal con Queso', 'hamburguesas', 16.00, 7.20, 30, 8, 'unidad', 'Doble carne artesanal de 150g c/u, doble queso cheddar fundido, huevo frito y tocino crujiente.', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80', 1),
('JUG-001', 'Jugo de Plátano Especial con Leche', 'jugos', 7.50, 2.50, 50, 12, 'vaso 16oz', 'Plátano de seda fresco licuado con leche entera pasteurizada, esencia de vainilla y un toque de miel.', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=80', 1),
('JUG-002', 'Jugo de Papaya Natural', 'jugos', 6.50, 2.00, 40, 10, 'vaso 16oz', 'Papaya dulce seleccionada al instante, bajo en azúcar, refrescante y digestivo.', 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&auto=format&fit=crop&q=80', 1),
('BEB-001', 'Té Caliente Aromático', 'calientes', 4.00, 0.80, 80, 20, 'taza', 'Infusión caliente de té negro premium servido con limón fresco y azúcar rubia.', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', 1),
('BEB-002', 'Café Pasado Gourmet', 'calientes', 5.00, 1.20, 65, 15, 'taza', 'Café de altura 100% arábica recién pasado al estilo tradicional en gota a gota.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80', 1),
('BEB-003', 'Mate de Coca / Hierbas Digestivas', 'calientes', 4.50, 0.90, 70, 15, 'taza', 'Infusión andina natural de hojas de coca enteras o manzanilla pura reconfortante.', 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&auto=format&fit=crop&q=80', 1),
('SNK-001', 'Papas Fritas Nativas Rústicas', 'snacks', 8.00, 2.80, 55, 15, 'porción', 'Porción generosa de papas amarillas fritas crocantes al punto de sal con salsa tártara.', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80', 1),
('SNK-002', 'Tequeños Rellenos de Queso (6 uds)', 'snacks', 9.50, 3.20, 25, 5, 'porción', 'Crujientes tequeños de masa wantán rellenos de abundante queso andino con salsa guacamole.', 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80', 1)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `precio` = VALUES(`precio`);

-- Configuración inicial
INSERT INTO `configuracion` (`clave`, `valor`) VALUES
('nombre_restaurante', 'SNACK & RESTAURANT PRO'),
('ruc', '20601234567'),
('direccion', 'Av. Gastronomía 456, Lima - Perú'),
('telefono', '+51 987 654 321'),
('igv_porcentaje', '18'),
('gas_webhook_url', '')
ON DUPLICATE KEY UPDATE `valor` = VALUES(`valor`);

-- Sesión de Caja Activa Inicial (Fondo S/ 150.00)
INSERT INTO `caja_sesiones` (`id`, `abierto_por`, `monto_inicial`, `fecha_apertura`, `estado`, `observaciones_apertura`) VALUES
(1, 'Valeria Quispe (Cajera)', 150.00, NOW(), 'abierta', 'Apertura de turno de demostración')
ON DUPLICATE KEY UPDATE `abierto_por` = VALUES(`abierto_por`);

-- Registro de Auditoría Inicial
INSERT INTO `auditoria_logs` (`usuario_nombre`, `usuario_rol`, `modulo`, `accion`, `detalles`) VALUES
('Sistema', 'administrador', 'SISTEMA', 'Inicialización de Base de Datos', 'Tablas y catálogo semilla creados correctamente.');

SET FOREIGN_KEY_CHECKS = 1;
