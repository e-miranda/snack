# 🍔 Snack IMPERIO - Sistema POS, Cocina KDS & Almacén

Sistema integral para **Snack IMPERIO** diseñado con React, TypeScript, Tailwind CSS y Vite. Incluye control de punto de venta (POS), comandas de cocina en tiempo real (KDS), arqueo y turnos de caja, gestión de almacén con venta rápida de gaseosas (Coca-Cola, Pepsi, Fanta), tortas y empanadas, y solicitudes de reabastecimiento.

---

## 🚀 Pasos para Ejecutar desde GitHub

### Opción 1: Ejecutar Localmente en tu Computadora

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU_USUARIO/snack-imperio-pos.git
   cd snack-imperio-pos
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. Abre tu navegador web en `http://localhost:3000`.

---

### Opción 2: Despliegue Automático y Gratuito en GitHub Pages

Este repositorio ya cuenta con el flujo de automatización configurado en `.github/workflows/deploy.yml`.

1. Sube tu código a GitHub (`git push origin main`).
2. En tu repositorio de GitHub, ve a **Settings** &gt; **Pages** (en el menú lateral).
3. En la sección **Build and deployment &gt; Source**, selecciona **GitHub Actions**.
4. ¡Listo! En 1 minuto tu aplicación estará publicada en `https://TU_USUARIO.github.io/snack-imperio-pos/`.

---

### Opción 3: Despliegue en 1 Clic con Vercel / Netlify / Render

1. Entra a [Vercel](https://vercel.com) o [Netlify](https://netlify.com).
2. Haz clic en **Add New Project** y selecciona este repositorio de GitHub.
3. El sistema detectará automáticamente **Vite**:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Haz clic en **Deploy**.

---

## 📦 Módulos Incluidos

- **Página de Menú Público:** Catálogo de productos interactivo con carrito de compras y botón de pedido directo por WhatsApp o ingreso al sistema.
- **Almacén & Stock Central:** Venta directa de refrescos (Coca-Cola, Pepsi, Fanta), tortas y empanadas, control de existencias, packs x6/x12/x24, exportación a Excel/CSV.
- **Solicitudes Internas:** Peticiones de reposición desde Barra, Cocina o Mostrador hacia el Almacén con aprobación y descuento automático de inventario.
- **Entradas de Proveedores:** Registro de compras y facturas de distribuidoras con incremento automático de existencias.
- **Punto de Venta (POS):** Cobro rápido en efectivo, QR o tarjeta, cálculo de vuelto automático, emisión e impresión de boletas/tickets.
- **Cocina KDS:** Panel táctil de comandas con alertas sonoras (campana de cocina), temporizador y cambio de estados (*Pendiente*, *En Preparación*, *Listo*).
- **Caja & Arqueo:** Apertura de turno con fondo inicial, movimientos de efectivo y cálculo automático de sobrantes o faltantes.
- **Exportador PHP / MySQL:** Generación de scripts listos para alojar en servidores tradicionales cPanel / XAMPP.
