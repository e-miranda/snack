<?php
/**
 * Gestión de Sesión, Roles y Permisos
 * Snack & Restaurant System
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Inicializar usuario por defecto si no existe sesión activa
if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 1;
    $_SESSION['user_nombre'] = 'Carlos Alva (Administrador)';
    $_SESSION['user_username'] = 'admin';
    $_SESSION['user_rol'] = 'administrador';
    $_SESSION['user_avatar'] = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    $_SESSION['permisos'] = [
        'can_sell' => true,
        'can_manage_cash' => true,
        'can_kitchen' => true,
        'can_manage_inventory' => true,
        'can_view_reports' => true,
        'can_view_audit' => true,
    ];
}

// Procesar cambio rápido de rol si se envía por GET/POST (Modo Demo / Quick Switch)
if (isset($_GET['cambiar_rol'])) {
    $nuevoRol = $_GET['cambiar_rol'];
    if ($nuevoRol === 'administrador') {
        $_SESSION['user_id'] = 1;
        $_SESSION['user_nombre'] = 'Carlos Alva (Administrador)';
        $_SESSION['user_username'] = 'admin';
        $_SESSION['user_rol'] = 'administrador';
        $_SESSION['user_avatar'] = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
        $_SESSION['permisos'] = [
            'can_sell' => true,
            'can_manage_cash' => true,
            'can_kitchen' => true,
            'can_manage_inventory' => true,
            'can_view_reports' => true,
            'can_view_audit' => true,
        ];
    } elseif ($nuevoRol === 'caja') {
        $_SESSION['user_id'] = 2;
        $_SESSION['user_nombre'] = 'Valeria Quispe (Cajera)';
        $_SESSION['user_username'] = 'caja';
        $_SESSION['user_rol'] = 'caja';
        $_SESSION['user_avatar'] = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80';
        $_SESSION['permisos'] = [
            'can_sell' => true,
            'can_manage_cash' => true,
            'can_kitchen' => false,
            'can_manage_inventory' => false,
            'can_view_reports' => false,
            'can_view_audit' => false,
        ];
    } elseif ($nuevoRol === 'cocina') {
        $_SESSION['user_id'] = 3;
        $_SESSION['user_nombre'] = 'Chef Mateo Torres (Cocina)';
        $_SESSION['user_username'] = 'cocina';
        $_SESSION['user_rol'] = 'cocina';
        $_SESSION['user_avatar'] = 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80';
        $_SESSION['permisos'] = [
            'can_sell' => false,
            'can_manage_cash' => false,
            'can_kitchen' => true,
            'can_manage_inventory' => false,
            'can_view_reports' => false,
            'can_view_audit' => false,
        ];
    }
    
    // Redirigir limpiando el parámetro
    $urlLimpia = strtok($_SERVER["REQUEST_URI"], '?');
    header("Location: " . $urlLimpia);
    exit;
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
