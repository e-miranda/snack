/**
 * Google Apps Script - Snack & Restaurant Webhook Receiver
 * Pegar este código en Extensiones > Apps Script de tu Google Sheet
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (data.action === 'REGISTRAR_VENTA') {
      let sheet = ss.getSheetByName('Ventas');
      if (!sheet) {
        sheet = ss.insertSheet('Ventas');
        sheet.appendRow(['Fecha', 'Factura', 'Orden', 'Cliente', 'Método Pago', 'Total S/']);
      }
      sheet.appendRow([
        data.fecha || new Date(),
        data.factura || '',
        data.orden || '',
        data.cliente || '',
        data.metodo_pago || '',
        data.total || 0
      ]);
    } else if (data.action === 'PING_TEST') {
      let sheet = ss.getSheetByName('Logs_Conexion');
      if (!sheet) {
        sheet = ss.insertSheet('Logs_Conexion');
        sheet.appendRow(['Timestamp', 'Mensaje', 'Sistema']);
      }
      sheet.appendRow([
        new Date(),
        data.mensaje || 'Test OK',
        data.sistema || 'PHP'
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'active', app: 'Snack POS Webhook' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function inicializarTablas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Hoja Ventas
  let sVentas = ss.getSheetByName('Ventas') || ss.insertSheet('Ventas');
  if (sVentas.getLastRow() === 0) {
    sVentas.appendRow(['Fecha', 'Factura', 'Orden', 'Cliente', 'Método Pago', 'Total S/']);
    sVentas.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#ea580c').setFontColor('#ffffff');
  }
  
  // Hoja Cierres Caja
  let sCierres = ss.getSheetByName('Cierres_Caja') || ss.insertSheet('Cierres_Caja');
  if (sCierres.getLastRow() === 0) {
    sCierres.appendRow(['ID Cierre', 'Aperturado Por', 'Fondo Inicial', 'Total Ventas', 'Físico Real', 'Diferencia', 'Fecha Cierre']);
    sCierres.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#2563eb').setFontColor('#ffffff');
  }
  
  SpreadsheetApp.getUi().alert('¡Hojas de cálculo inicializadas con éxito!');
}
