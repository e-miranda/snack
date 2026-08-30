# 🍔 Snack & Restaurant PRO - Sistema Integral en PHP & MySQL

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
   - **Calculadora integrada de efectivo**: cálculo de subtotal, IGV (18%), botones de denominaciones rápidas (+S/ 10, 20, 50, 100, 200, Exacto) y cálculo en tiempo real del vuelto/cambio.
   - Métodos de pago: Efectivo, Tarjeta POS, QR Billetera (Yape/Plin), Transferencia.
   - Emisión instantánea de tickets y facturas imprimibles en formato 80mm/58mm y A4.

3. **Control y Arqueo de Caja**:
   - **Apertura de Turno** con fondo de cambio inicial.
   - **Cierre de Caja (Corte Z)**: Cuadre entre efectivo físico contado vs. ventas del sistema con cálculo de diferencias (sobrantes/faltantes).
   - **Registro de Movimientos**: Ingresos y retiros justificados de caja chica.
   - **Reporte Corte X**: Resumen parcial de ventas desglosado por método de pago.

4. **Pantalla de Cocina (KDS)**:
   - Monitor de comandas en tiempo real con semáforo de tiempos de espera (Verde < 5min, Ámbar < 10min, Rojo urgente > 10min).
   - Cambio de estados de orden: *Pendiente -> En Cocción -> Listo para Servir -> Entregado*.
   - Timbre sonoro de cocina con Web Audio API para alertar al personal de salón.

5. **Panel de Administración & Inventario**:
   - Estadísticas gerenciales: Ventas totales, Ganancia bruta estimada, Ticket promedio, Valor de inventario.
   - Reportes mensuales comparativos de ingresos vs. costos.
   - Gestión de productos, costos unitarios, existencias, alertas de stock mínimo y ajuste rápido de merma/compras.
   - Matriz de usuarios y permisos (`administrador`, `caja`, `cocina`).
   - Auditoría transaccional detallada de todas las operaciones.

6. **Integración con Google Apps Script (Google Sheets)**:
   - Sincronización automática de cada venta, inventario y movimientos de caja en hojas de cálculo de Google.

---

## 📂 Estructura del Proyecto

```text
snack-pos-php/
├── config/
│   ├── db.php                  # Conexión PDO a MySQL
│   └── session.php             # Control de autenticación y sesiones
├── includes/
│   ├── header.php              # Cabecera HTML y assets (Tailwind CSS, Lucide Icons)
│   ├── navbar.php              # Barra de navegación y selector de roles
│   └── footer.php              # Pie de página y modales globales
├── api/
│   ├── pedidos.php             # API REST para crear y actualizar pedidos
│   ├── caja.php                # API REST para apertura, cierre y movimientos
│   ├── productos.php           # API REST para inventario y stock
│   └── gas_sync.php            # Conector con Google Apps Script
├── gas/
│   └── Code.gs                 # Código Google Apps Script para Google Sheets
├── index.php                   # Página pública / Menú interactivo
├── pos.php                     # Punto de Venta (POS)
├── caja.php                    # Control y Arqueo de Caja
├── cocina.php                  # Pantalla de Cocina (KDS)
├── admin.php                   # Panel de Administración e Inventario
├── imprimir_ticket.php         # Vista para impresión de tickets térmicos
├── database.sql                # Script de creación de tablas y datos semilla
├── .htaccess                   # Configuración de servidor Apache
└── README.md                   # Documentación del proyecto
```

---

## 🛠️ Requisitos de Instalación

- Servidor Web: **Apache / Nginx** (XAMPP, Laragon, WampServer, CPanel o Hosting VPS).
- Versión de PHP: **PHP 8.0 o superior** con extensión `pdo_mysql` activada.
- Base de Datos: **MySQL 5.7+ o MariaDB 10.3+**.

---

## 📦 Instrucciones de Instalación Local (XAMPP / Laragon)

1. **Clonar o descargar este repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/snack-pos-php.git
   ```
   Coloca la carpeta dentro de `htdocs` (XAMPP) o `www` (Laragon).

2. **Crear la Base de Datos**:
   - Abre `phpMyAdmin` (o tu cliente MySQL favorito como HeidiSQL / DBeaver).
   - Crea una nueva base de datos llamada `snack_pos`.
   - Importa el archivo `database.sql` incluido en la raíz del proyecto.

3. **Configurar la conexión**:
   - Abre `config/db.php` y ajusta tus credenciales si es necesario:
     ```php
     define('DB_HOST', 'localhost');
     define('DB_NAME', 'snack_pos');
     define('DB_USER', 'root');
     define('DB_PASS', '');
     define('DB_PORT', '3306');
     ```

4. **Acceder a la aplicación**:
   - Abre tu navegador web en: `http://localhost/snack-pos-php/`

---

## 👤 Usuarios y Credenciales por Defecto

| Rol | Usuario | Contraseña | Acceso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin` | `123` | Control total, Inventario, Estadísticas, Auditoría |
| **Cajero** | `caja` | `123` | Punto de Venta POS, Control y Arqueo de Caja |
| **Cocinero** | `cocina` | `123` | Pantalla de Cocina KDS y Despacho |

---

## 📊 Configuración de Google Sheets (Google Apps Script)

1. Abre [Google Sheets](https://sheets.new) y crea una nueva hoja de cálculo.
2. Ve a **Extensiones > Apps Script**.
3. Pega el contenido del archivo `gas/Code.gs`.
4. Ejecuta la función `inicializarTablas()` para crear automáticamente las pestañas necesarias.
5. Haz clic en **Implementar > Nueva implementación > Aplicación web**:
   - *Ejecutar como:* **Yo**
   - *Quién tiene acceso:* **Cualquier usuario**
6. Copia la URL generada (`https://script.google.com/macros/s/.../exec`) y configúrala en el panel `admin.php` > pestaña **Google Apps Script**.

---

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia MIT. Puedes usarlo, modificarlo y distribuirlo libremente para tu negocio o clientes.
