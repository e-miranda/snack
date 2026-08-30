<?php
/**
 * API REST: Gestión de Productos e Inventario
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/session.php';

$pdo = getDBConnection();
if (!$pdo) {
    echo json_encode(['success' => false, 'error' => 'Error de base de datos']);
    exit;
}

$action = $_GET['action'] ?? '';

// 1. CREAR PRODUCTO
if ($action === 'crear' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $sku = trim($input['sku'] ?? '');
    $nombre = trim($input['nombre'] ?? '');
    $categoriaId = $input['categoria_id'] ?? 'hamburguesas';
    $precio = (float)($input['precio'] ?? 0);
    $costo = (float)($input['costo'] ?? 0);
    $stock = (int)($input['stock'] ?? 0);
    $imagen = trim($input['imagen'] ?? '');
    $descripcion = trim($input['descripcion'] ?? '');

    if (empty($sku) || empty($nombre) || $precio <= 0) {
        echo json_encode(['success' => false, 'error' => 'SKU, nombre y precio son obligatorios']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO productos (sku, nombre, categoria_id, precio, costo, stock, imagen, descripcion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$sku, $nombre, $categoriaId, $precio, $costo, $stock, $imagen, $descripcion]);

        registrarAuditoria('INVENTARIO', 'Nuevo Producto Creado', "SKU: $sku - $nombre (Stock: $stock)");

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// 2. AJUSTAR STOCK RÁPIDO
if ($action === 'ajustar_stock' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $id = (int)($input['id'] ?? 0);
    $nuevoStock = (int)($input['stock'] ?? 0);
    $motivo = $input['motivo'] ?? 'Ajuste manual de inventario';

    if (!$id) {
        echo json_encode(['success' => false, 'error' => 'ID inválido']);
        exit;
    }

    try {
        $stmtOld = $pdo->prepare("SELECT nombre, stock FROM productos WHERE id = ?");
        $stmtOld->execute([$id]);
        $prod = $stmtOld->fetch();

        $stmt = $pdo->prepare("UPDATE productos SET stock = ? WHERE id = ?");
        $stmt->execute([$nuevoStock, $id]);

        registrarAuditoria('INVENTARIO', 'Ajuste de Stock', "{$prod['nombre']}: de {$prod['stock']} a $nuevoStock. Motivo: $motivo");

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'error' => 'Acción no permitida']);
