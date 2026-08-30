// Google Apps Script generator for automated Google Sheets backend synchronization

export function generateGoogleAppsScriptCode(): string {
  return `/**
 * ====================================================================
 * SNACK POS & KITCHEN SYSTEM - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ====================================================================
 * Instrucciones:
 * 1. Crea una nueva Hoja de Cálculo en Google Sheets (ej: "BD_Snack_Sistema").
 * 2. Ve a Extensiones > Apps Script.
 * 3. Reemplaza todo el código con este script y guarda el proyecto.
 * 4. Ejecuta una vez la función 'inicializarTablas()' para crear automáticamente
 *    las pestañas: 'PRODUCTOS', 'VENTAS', 'DETALLE_VENTAS', 'CAJA', 'AUDITORIA'.
 * 5. Haz clic en "Implementar" > "Nueva implementación" > Tipo: "Aplicación Web".
 * 6. Acceso: "Cualquier persona" (Anyone) y copia la URL generada.
 */

// Función para inicializar y dar formato a las hojas de Google Sheets
function inicializarTablas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Hoja PRODUCTOS
  var sheetProd = getOrCreateSheet(ss, "PRODUCTOS");
  sheetProd.clear();
  sheetProd.appendRow(["ID", "SKU", "Nombre", "Categoria", "Precio", "Costo", "Stock", "Stock_Minimo", "Disponible"]);
  sheetProd.getRange(1, 1, 1, 9).setBackground("#f59e0b").setFontColor("#ffffff").setFontWeight("bold");
  sheetProd.appendRow(["prod-1", "HMB-SMP-01", "Hamburguesa Simple", "hamburguesas", 12.00, 5.50, 45, 10, true]);
  sheetProd.appendRow(["prod-2", "HMB-DBL-02", "Hamburguesa Doble", "hamburguesas", 18.50, 8.50, 35, 8, true]);
  sheetProd.appendRow(["prod-3", "JUG-PLT-03", "Jugo de Platano", "jugos", 7.00, 2.20, 60, 15, true]);
  sheetProd.appendRow(["prod-4", "JUG-PAP-04", "Jugo de Papaya", "jugos", 7.50, 2.30, 50, 12, true]);
  sheetProd.appendRow(["prod-5", "INF-TEC-05", "Te Clasico", "calientes", 3.50, 0.80, 120, 25, true]);
  sheetProd.appendRow(["prod-6", "INF-CAF-06", "Cafe Pasado Americano", "calientes", 5.00, 1.20, 90, 20, true]);
  sheetProd.appendRow(["prod-7", "INF-MAT-07", "Mate de Coca / Hierbas", "calientes", 4.00, 0.90, 85, 20, true]);
  
  // 2. Hoja VENTAS
  var sheetVentas = getOrCreateSheet(ss, "VENTAS");
  sheetVentas.clear();
  sheetVentas.appendRow(["ID_Orden", "Numero_Orden", "Factura", "Fecha_Hora", "Tipo", "Mesa", "Cliente", "Metodo_Pago", "Subtotal", "Impuesto", "Total", "Estado", "Cajero"]);
  sheetVentas.getRange(1, 1, 1, 13).setBackground("#3b82f6").setFontColor("#ffffff").setFontWeight("bold");
  
  // 3. Hoja DETALLE_VENTAS
  var sheetDetalle = getOrCreateSheet(ss, "DETALLE_VENTAS");
  sheetDetalle.clear();
  sheetDetalle.appendRow(["ID_Orden", "Numero_Orden", "ID_Producto", "Producto", "Cantidad", "Precio_Unitario", "Subtotal_Item", "Notas"]);
  sheetDetalle.getRange(1, 1, 1, 8).setBackground("#10b981").setFontColor("#ffffff").setFontWeight("bold");
  
  // 4. Hoja CAJA
  var sheetCaja = getOrCreateSheet(ss, "CAJA");
  sheetCaja.clear();
  sheetCaja.appendRow(["ID_Sesion", "Fecha_Apertura", "Fecha_Cierre", "Responsable", "Monto_Inicial", "Total_Efectivo", "Total_Tarjeta", "Total_QR", "Total_General", "Estado", "Diferencia"]);
  sheetCaja.getRange(1, 1, 1, 11).setBackground("#8b5cf6").setFontColor("#ffffff").setFontWeight("bold");
  
  // 5. Hoja AUDITORIA
  var sheetAudit = getOrCreateSheet(ss, "AUDITORIA");
  sheetAudit.clear();
  sheetAudit.appendRow(["ID_Log", "Fecha_Hora", "Usuario", "Rol", "Modulo", "Accion", "Detalles", "IP"]);
  sheetAudit.getRange(1, 1, 1, 8).setBackground("#6b7280").setFontColor("#ffffff").setFontWeight("bold");
  
  sheetAudit.appendRow(["log-init", new Date().toISOString(), "Sistema", "administrador", "SISTEMA", "Inicializacion", "Tablas creadas exitosamente", "127.0.0.1"]);
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// Endpoint WebApp GET para consultar datos
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === "getProducts") {
    var sheet = ss.getSheetByName("PRODUCTOS");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows = data.slice(1).map(function(r) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = r[i]; });
      return obj;
    });
    return createJsonResponse({ success: true, data: rows });
  }
  
  if (action === "getSales") {
    var sheet = ss.getSheetByName("VENTAS");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rows = data.slice(1).map(function(r) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = r[i]; });
      return obj;
    });
    return createJsonResponse({ success: true, data: rows });
  }
  
  return createJsonResponse({ status: "ok", message: "API Google Apps Script Snack POS Activa", timestamp: new Date() });
}

// Endpoint WebApp POST para registrar nuevas ventas, caja o auditoría
function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "registrarVenta") {
      var order = postData.order;
      var sheetVentas = ss.getSheetByName("VENTAS");
      sheetVentas.appendRow([
        order.id,
        order.orderNumber,
        order.invoiceNumber || "",
        order.createdAt || new Date().toISOString(),
        order.type,
        order.tableNumber || "N/A",
        order.customerName,
        order.paymentMethod,
        order.subtotal,
        order.tax,
        order.total,
        order.status,
        order.cashierName
      ]);
      
      var sheetDetalle = ss.getSheetByName("DETALLE_VENTAS");
      if (order.items && order.items.length) {
        order.items.forEach(function(item) {
          sheetDetalle.appendRow([
            order.id,
            order.orderNumber,
            item.productId,
            item.productName,
            item.quantity,
            item.price,
            item.subtotal,
            item.notes || ""
          ]);
        });
      }
      
      // Registrar log de auditoría
      var sheetAudit = ss.getSheetByName("AUDITORIA");
      sheetAudit.appendRow([
        "aud-" + new Date().getTime(),
        new Date().toISOString(),
        order.cashierName || "Cajero",
        "caja",
        "VENTAS",
        "Venta Registrada",
        "Orden: " + order.orderNumber + " Total: S/ " + order.total,
        "WebClient"
      ]);
      
      return createJsonResponse({ success: true, message: "Venta guardada en Google Sheets con exito" });
    }
    
    if (action === "registrarAuditoria") {
      var log = postData.log;
      var sheetAudit = ss.getSheetByName("AUDITORIA");
      sheetAudit.appendRow([
        log.id,
        log.timestamp || new Date().toISOString(),
        log.userName,
        log.userRole,
        log.module,
        log.action,
        log.details,
        log.ipAddress || ""
      ]);
      return createJsonResponse({ success: true, message: "Log de auditoria guardado" });
    }
    
    return createJsonResponse({ success: false, message: "Accion no reconocida" });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}
