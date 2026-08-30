import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, Download, X, CheckCircle, FileText, QrCode, Share2, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export const InvoiceModal: React.FC = () => {
  const { lastInvoiceOrder, isInvoiceModalOpen, setIsInvoiceModalOpen } = useApp();
  const [ticketFormat, setTicketFormat] = useState<'termico' | 'factura'>('termico');
  const [copied, setCopied] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  if (!isInvoiceModalOpen || !lastInvoiceOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `*COMPROBANTE ELECTRÓNICO - SNACK IMPERIO*\nOrden: ${lastInvoiceOrder.orderNumber}\nFactura: ${lastInvoiceOrder.invoiceNumber}\nCliente: ${lastInvoiceOrder.customerName}\nTotal: Bs. ${lastInvoiceOrder.total.toFixed(2)}\n¡Gracias por su preferencia!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  return (
    <div id="invoice-modal-overlay" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-neutral-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="p-4 bg-white border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900">Comprobante de Pago Electrónico</h3>
              <p className="text-[11px] text-neutral-500 font-mono">{lastInvoiceOrder.invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle */}
            <div className="flex bg-neutral-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setTicketFormat('termico')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${ticketFormat === 'termico' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                Ticket 80mm
              </button>
              <button
                onClick={() => setTicketFormat('factura')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${ticketFormat === 'factura' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                Factura A4
              </button>
            </div>

            <button
              onClick={() => setIsInvoiceModalOpen(false)}
              className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-neutral-100 flex justify-center">
          {ticketFormat === 'termico' ? (
            /* Thermal POS 80mm Format */
            <div
              ref={ticketRef}
              id="printable-ticket"
              className="w-full max-w-[340px] bg-white text-neutral-950 p-6 rounded-2xl shadow-xl font-mono text-xs border border-neutral-300 select-all"
            >
              {/* Header */}
              <div className="text-center pb-3 border-b border-dashed border-neutral-400">
                <p className="font-black text-base tracking-wider">SNACK IMPERIO</p>
                <p className="text-[10px] text-neutral-600">RUC: 20608945123</p>
                <p className="text-[10px] text-neutral-600">Av. Las Delicias 450 - Centro</p>
                <p className="text-[10px] text-neutral-600">Tel: (01) 489-2210 / 987-654-321</p>
                <div className="mt-2 py-1 bg-neutral-100 rounded text-[11px] font-bold">
                  BOLETA DE VENTA ELECTRÓNICA
                </div>
                <p className="font-bold text-xs mt-1">{lastInvoiceOrder.invoiceNumber}</p>
              </div>

              {/* Order Meta */}
              <div className="py-2 border-b border-dashed border-neutral-400 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Fecha:</span>
                  <span>{new Date(lastInvoiceOrder.createdAt).toLocaleDateString('es-ES')} {new Date(lastInvoiceOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Orden N°:</span>
                  <span className="font-bold">{lastInvoiceOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Tipo:</span>
                  <span className="uppercase font-semibold">{lastInvoiceOrder.type === 'mesa' ? `Mesa: ${lastInvoiceOrder.tableNumber}` : 'Para Llevar'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Cliente:</span>
                  <span className="font-semibold">{lastInvoiceOrder.customerName}</span>
                </div>
                {lastInvoiceOrder.customerDoc && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">DNI/RUC:</span>
                    <span>{lastInvoiceOrder.customerDoc}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-600">Cajero:</span>
                  <span>{lastInvoiceOrder.cashierName}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-3 border-b border-dashed border-neutral-400">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-neutral-300 text-[10px] text-neutral-600 uppercase">
                      <th className="pb-1">Cant/Desc</th>
                      <th className="pb-1 text-right">P.Unit</th>
                      <th className="pb-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {lastInvoiceOrder.items.map((item, idx) => (
                      <tr key={idx} className="text-[11px]">
                        <td className="py-1 pr-1">
                          <span className="font-bold">{item.quantity}x</span> {item.productName}
                          {item.notes && <p className="text-[9px] text-neutral-500 italic pl-3">*{item.notes}</p>}
                        </td>
                        <td className="py-1 text-right whitespace-nowrap">Bs. {item.price.toFixed(2)}</td>
                        <td className="py-1 text-right font-bold whitespace-nowrap">Bs. {item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Op. Gravada (Subtotal):</span>
                  <span>Bs. {lastInvoiceOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>I.G.V. (18%):</span>
                  <span>Bs. {lastInvoiceOrder.tax.toFixed(2)}</span>
                </div>
                {lastInvoiceOrder.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Descuento:</span>
                    <span>- Bs. {lastInvoiceOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-neutral-300">
                  <span>IMPORTE TOTAL:</span>
                  <span>Bs. {lastInvoiceOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="py-2 border-b border-dashed border-neutral-400 space-y-1 text-[11px] text-neutral-600">
                <div className="flex justify-between">
                  <span>Método de Pago:</span>
                  <span className="font-bold text-neutral-900 uppercase">{lastInvoiceOrder.paymentMethod}</span>
                </div>
                {lastInvoiceOrder.paymentMethod === 'efectivo' && lastInvoiceOrder.cashReceived !== undefined && (
                  <>
                    <div className="flex justify-between">
                      <span>Efectivo Recibido:</span>
                      <span className="font-semibold text-neutral-900">Bs. {lastInvoiceOrder.cashReceived.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>Vuelto (Cambio):</span>
                      <span>Bs. {(lastInvoiceOrder.changeGiven || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Fiscal QR & Footer */}
              <div className="pt-3 text-center space-y-2">
                <div className="flex justify-center">
                  <div className="p-2 border border-neutral-300 rounded bg-white inline-block">
                    <QrCode className="w-16 h-16 text-neutral-800" />
                  </div>
                </div>
                <p className="text-[9px] text-neutral-500 leading-tight">
                  Representación impresa de la Boleta de Venta Electrónica. Consulte su validez en www.sunat.gob.pe
                </p>
                <p className="text-[10px] font-bold text-neutral-800">¡GRACIAS POR SU COMPRA!</p>
              </div>
            </div>
          ) : (
            /* Professional A4 Factura Format */
            <div className="w-full bg-white text-neutral-950 p-6 sm:p-8 rounded-2xl shadow-xl font-sans text-xs border border-neutral-300">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-neutral-200">
                <div>
                  <h2 className="text-xl font-black text-amber-600 font-['Outfit']">SNACK IMPERIO S.A.C.</h2>
                  <p className="text-xs text-neutral-600 font-medium">Servicios de Alimentos y Bebidas Rápidas</p>
                  <p className="text-xs text-neutral-500">Dirección: Av. Las Delicias 450, Centro Gastronómico</p>
                  <p className="text-xs text-neutral-500">Email: contacto@snackimperio.bo &bull; Tel: (01) 489-2210</p>
                </div>

                <div className="p-4 rounded-xl border-2 border-neutral-800 bg-neutral-50 text-center min-w-[200px]">
                  <p className="font-bold text-xs text-neutral-700">R.U.C. N° 20608945123</p>
                  <p className="font-extrabold text-sm text-neutral-900 my-1 py-1 bg-amber-100 rounded">
                    FACTURA ELECTRÓNICA
                  </p>
                  <p className="font-mono font-bold text-xs text-neutral-800">{lastInvoiceOrder.invoiceNumber}</p>
                </div>
              </div>

              {/* Customer Box */}
              <div className="my-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-neutral-500">Señor(es): </span>
                  <span className="font-bold text-neutral-900">{lastInvoiceOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-neutral-500">DNI / RUC: </span>
                  <span className="font-bold text-neutral-900">{lastInvoiceOrder.customerDoc || '10458921471'}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Fecha de Emisión: </span>
                  <span className="text-neutral-800">{new Date(lastInvoiceOrder.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Condición de Pago: </span>
                  <span className="font-semibold text-neutral-900 uppercase">Contado ({lastInvoiceOrder.paymentMethod})</span>
                </div>
              </div>

              {/* Item Table */}
              <table className="w-full text-left my-4 border border-neutral-200 rounded-lg overflow-hidden">
                <thead className="bg-neutral-800 text-white text-[11px] uppercase">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5">Descripción</th>
                    <th className="p-2.5 text-center">Cant.</th>
                    <th className="p-2.5 text-right">P. Unit</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-xs">
                  {lastInvoiceOrder.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="p-2.5 text-neutral-500">{idx + 1}</td>
                      <td className="p-2.5 font-medium">
                        {item.productName}
                        {item.notes && <span className="text-neutral-500 text-[10px] block">Obs: {item.notes}</span>}
                      </td>
                      <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                      <td className="p-2.5 text-right">Bs. {item.price.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold">Bs. {item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals block */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-neutral-200">
                <div className="flex items-center gap-3">
                  <QrCode className="w-14 h-14 text-neutral-800 p-1 border border-neutral-300 rounded" />
                  <div className="text-[10px] text-neutral-500 max-w-xs">
                    Código Hash: 9d832a8f0b12c4e5... Emisión electrónica autorizada por Impuestos.
                  </div>
                </div>

                <div className="w-full sm:w-60 space-y-1 text-xs text-right">
                  <div className="flex justify-between text-neutral-600">
                    <span>Op. Gravada:</span>
                    <span>Bs. {lastInvoiceOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>I.V.A. (13%):</span>
                    <span>Bs. {lastInvoiceOrder.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-neutral-950 pt-1 border-t border-neutral-300">
                    <span>TOTAL:</span>
                    <span className="text-amber-700">Bs. {lastInvoiceOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-white border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold border border-neutral-300 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-neutral-700" />}
              {copied ? 'Copiado' : 'Copiar Texto'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInvoiceModalOpen(false)}
              className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 text-xs font-semibold hover:bg-neutral-100 transition-colors"
            >
              Cerrar
            </button>
            <button
              id="btn-print-ticket"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-xs shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimir Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
