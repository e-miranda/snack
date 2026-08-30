import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import {
  CircleDollarSign,
  Lock,
  Unlock,
  PlusCircle,
  MinusCircle,
  Receipt,
  FileSpreadsheet,
  Printer,
  Calendar,
  Clock,
  User,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  FileText,
  DollarSign
} from 'lucide-react';

export const CashierPage: React.FC = () => {
  const {
    cashSession,
    openCashSession,
    closeCashSession,
    addCashMovement,
    orders,
    currentUser,
    setLastInvoiceOrder,
    setIsInvoiceModalOpen,
  } = useApp();

  // Modals
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isCloseModal, setIsCloseModal] = useState(false);
  const [isMovementModal, setIsMovementModal] = useState(false);
  const [isXReportModal, setIsXReportModal] = useState(false);

  // Form states
  const [initialCashInput, setInitialCashInput] = useState('150.00');
  const [openNotesInput, setOpenNotesInput] = useState('Apertura turno estándar');
  const [actualCashInput, setActualCashInput] = useState('');
  const [closeNotesInput, setCloseNotesInput] = useState('');

  // Movement Form
  const [movementType, setMovementType] = useState<'ingreso' | 'retiro'>('retiro');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  // Sales Filter
  const [paymentFilter, setPaymentFilter] = useState<string>('todos');
  const [searchInvoice, setSearchInvoice] = useState('');

  const isBoxOpen = cashSession && cashSession.status === 'abierta';

  // Calculate stats for current open session or all today's orders
  const sessionOrders = orders.filter((o) => {
    if (!cashSession) return false;
    return new Date(o.createdAt) >= new Date(cashSession.openedAt) && o.status !== 'cancelado';
  });

  const cashSales = sessionOrders.filter((o) => o.paymentMethod === 'efectivo').reduce((sum, o) => sum + o.total, 0);
  const cardSales = sessionOrders.filter((o) => o.paymentMethod === 'tarjeta').reduce((sum, o) => sum + o.total, 0);
  const qrSales = sessionOrders.filter((o) => o.paymentMethod === 'qr').reduce((sum, o) => sum + o.total, 0);
  const transferSales = sessionOrders.filter((o) => o.paymentMethod === 'transferencia').reduce((sum, o) => sum + o.total, 0);
  const totalSales = sessionOrders.reduce((sum, o) => sum + o.total, 0);

  const totalDeposits = cashSession?.movements.filter((m) => m.type === 'ingreso' && m.reason !== 'Fondo de apertura de caja').reduce((sum, m) => sum + m.amount, 0) || 0;
  const totalWithdrawals = cashSession?.movements.filter((m) => m.type === 'retiro').reduce((sum, m) => sum + m.amount, 0) || 0;

  const expectedCashInBox = (cashSession?.initialCash || 0) + cashSales + totalDeposits - totalWithdrawals;

  // Filtered orders list
  const displayedOrders = sessionOrders.filter((o) => {
    const matchesPay = paymentFilter === 'todos' || o.paymentMethod === paymentFilter;
    const matchesSearch = o.invoiceNumber.toLowerCase().includes(searchInvoice.toLowerCase()) ||
                          o.orderNumber.toLowerCase().includes(searchInvoice.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(searchInvoice.toLowerCase());
    return matchesPay && matchesSearch;
  });

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(initialCashInput) || 0;
    openCashSession(amt, openNotesInput);
    setIsOpenModal(false);
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actual = parseFloat(actualCashInput) || 0;
    closeCashSession(actual, closeNotesInput);
    setIsCloseModal(false);
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(movementAmount) || 0;
    if (amt <= 0 || !movementReason.trim()) return;
    addCashMovement(movementType, amt, movementReason.trim());
    setMovementAmount('');
    setMovementReason('');
    setIsMovementModal(false);
  };

  return (
    <div id="cashier-page" className="min-h-[calc(100vh-80px)] bg-neutral-50 text-neutral-900 p-3 sm:p-6 space-y-6">
      {/* Top Banner with Session Info & Action Buttons */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${
            isBoxOpen
              ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
              : 'bg-rose-100 text-rose-700 border-rose-300'
          }`}>
            {isBoxOpen ? <Unlock className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-neutral-950 font-['Outfit']">Control de Caja &amp; Turnos</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isBoxOpen
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                {isBoxOpen ? 'Caja Abierta' : 'Caja Cerrada'}
              </span>
            </div>
            {cashSession ? (
              <p className="text-xs text-neutral-500 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-600" /> Resp: {cashSession.openedBy}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Abierta: {new Date(cashSession.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-mono text-amber-700 font-bold">
                  Fondo Inicial: Bs. {cashSession.initialCash.toFixed(2)}
                </span>
              </p>
            ) : (
              <p className="text-xs text-neutral-500 mt-1">No hay sesiones activas en este momento.</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {isBoxOpen ? (
            <>
              <button
                onClick={() => setIsMovementModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 text-xs font-bold transition-colors"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
                <span>Ingreso / Retiro</span>
              </button>

              <button
                onClick={() => setIsXReportModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 text-xs font-bold transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span>Reporte Corte X</span>
              </button>

              <button
                onClick={() => {
                  setActualCashInput(expectedCashInBox.toFixed(2));
                  setIsCloseModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Cierre de Caja (Arqueo)</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpenModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black text-xs shadow-sm transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Turno de Caja</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards: Detailed and Totalized Sales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-neutral-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-neutral-500">Total Recaudado</p>
          <p className="text-xl font-black text-amber-600 font-mono mt-1">Bs. {totalSales.toFixed(2)}</p>
          <p className="text-[10px] text-neutral-500 mt-0.5">{sessionOrders.length} transacciones</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-neutral-500">Efectivo en Caja</p>
          <p className="text-xl font-black text-emerald-600 font-mono mt-1">Bs. {expectedCashInBox.toFixed(2)}</p>
          <p className="text-[10px] text-neutral-500 mt-0.5">Ventas: Bs. {cashSales.toFixed(2)}</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-neutral-500">Tarjetas POS</p>
          <p className="text-xl font-black text-blue-600 font-mono mt-1">Bs. {cardSales.toFixed(2)}</p>
          <p className="text-[10px] text-neutral-500 mt-0.5">Crédito &amp; Débito</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-neutral-500">QR / Billeteras</p>
          <p className="text-xl font-black text-purple-600 font-mono mt-1">Bs. {qrSales.toFixed(2)}</p>
          <p className="text-[10px] text-neutral-500 mt-0.5">Yape / Plin / QR</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-neutral-500">Transferencias</p>
          <p className="text-xl font-black text-teal-600 font-mono mt-1">Bs. {transferSales.toFixed(2)}</p>
          <p className="text-[10px] text-neutral-500 mt-0.5">Banca Móvil</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-3.5 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-neutral-500">Retiros de Caja</p>
          <p className="text-xl font-black text-rose-600 font-mono mt-1">Bs. {totalWithdrawals.toFixed(2)}</p>
          <p className="text-[10px] text-neutral-500 mt-0.5">Gastos / Compras</p>
        </div>
      </div>

      {/* Main Grid: Shift Sales Ledger + Cash Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Detailed Shift Sales Ledger (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
              <div>
                <h3 className="font-extrabold text-base text-neutral-900">Detalle de Ventas del Turno</h3>
                <p className="text-xs text-neutral-500">Registro correlativo de tickets y facturas emitidas</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar factura o cliente..."
                    value={searchInvoice}
                    onChange={(e) => setSearchInvoice(e.target.value)}
                    className="bg-neutral-50 border border-neutral-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-1.5 text-xs text-neutral-900"
                >
                  <option value="todos">Todos los pagos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="qr">QR / Billetera</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
            </div>

            {/* Sales Table */}
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 text-[11px] uppercase">
                    <th className="pb-2 font-bold">N° Factura / Orden</th>
                    <th className="pb-2 font-bold">Hora</th>
                    <th className="pb-2 font-bold">Cliente / Mesa</th>
                    <th className="pb-2 font-bold">Método</th>
                    <th className="pb-2 font-bold text-right">Total</th>
                    <th className="pb-2 font-bold text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {displayedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-400">
                        No hay ventas registradas con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    displayedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="py-2.5 font-mono">
                          <p className="font-bold text-neutral-900">{order.invoiceNumber}</p>
                          <p className="text-[10px] text-neutral-500">{order.orderNumber}</p>
                        </td>
                        <td className="py-2.5 text-neutral-600">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5">
                          <p className="font-medium text-neutral-900">{order.customerName}</p>
                          <p className="text-[10px] text-neutral-500">
                            {order.type === 'mesa' ? order.tableNumber : 'Para Llevar'}
                          </p>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            order.paymentMethod === 'efectivo'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : order.paymentMethod === 'tarjeta'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : order.paymentMethod === 'qr'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-teal-100 text-teal-800 border border-teal-300'
                          }`}>
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold font-mono text-amber-700">
                          Bs. {order.total.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={() => {
                              setLastInvoiceOrder(order);
                              setIsInvoiceModalOpen(true);
                            }}
                            title="Ver e Imprimir Comprobante"
                            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-950 rounded-lg transition-colors inline-flex items-center gap-1 border border-neutral-200"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table summary bar */}
          <div className="pt-3 mt-3 border-t border-neutral-200 flex justify-between items-center text-xs text-neutral-500">
            <span>Total mostrado: {displayedOrders.length} ventas</span>
            <span className="font-mono text-neutral-900">
              Suma Total: <strong className="text-amber-700">Bs. {displayedOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Right: Cash Box Movements & Reconciliation History (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="font-extrabold text-base text-neutral-900">Movimientos de Efectivo</h3>
              <span className="text-[11px] text-neutral-500">Caja Chica</span>
            </div>

            {/* List of movements */}
            <div className="space-y-2.5 mt-3 max-h-96 overflow-y-auto pr-1">
              {!cashSession || cashSession.movements.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 text-xs">
                  No hay movimientos registrados en este turno.
                </div>
              ) : (
                cashSession.movements.map((mov) => {
                  const isIngreso = mov.type === 'ingreso';
                  return (
                    <div
                      key={mov.id}
                      className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${
                          isIngreso
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            : 'bg-rose-100 text-rose-700 border-rose-300'
                        }`}>
                          {isIngreso ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-900">{mov.reason}</p>
                          <p className="text-[10px] text-neutral-500 font-mono">
                            {new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; Por {mov.registeredBy}
                          </p>
                        </div>
                      </div>

                      <span className={`text-xs font-mono font-black ${
                        isIngreso ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {isIngreso ? '+' : '-'}Bs. {mov.amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom box summary */}
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-1.5 font-mono mt-4">
            <div className="flex justify-between text-neutral-600">
              <span>Fondo Inicial:</span>
              <span>Bs. {(cashSession?.initialCash || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>+ Ventas Efectivo:</span>
              <span className="text-emerald-700 font-bold">Bs. {cashSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>- Retiros Efectivo:</span>
              <span className="text-rose-700 font-bold">Bs. {totalWithdrawals.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-neutral-950 pt-1 border-t border-neutral-300 text-sm">
              <span>Efectivo Esperado:</span>
              <span className="text-amber-700">Bs. {expectedCashInBox.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Apertura de Caja */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900">Apertura de Turno de Caja</h3>
                <p className="text-xs text-neutral-500">Define el fondo de cambio inicial para comenzar operaciones</p>
              </div>
            </div>

            <form onSubmit={handleOpenSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Monto Inicial en Efectivo (Bs.)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-lg font-black font-mono text-amber-700 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Responsable</label>
                <input
                  type="text"
                  disabled
                  value={currentUser ? currentUser.name : 'Valeria Quispe (Cajera)'}
                  className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Observaciones</label>
                <input
                  type="text"
                  value={openNotesInput}
                  onChange={(e) => setOpenNotesInput(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-4 py-2 text-xs text-neutral-600 hover:text-neutral-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-black rounded-xl text-xs shadow-sm"
                >
                  Confirmar Apertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cierre de Caja & Arqueo */}
      {isCloseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-300">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900">Arqueo &amp; Cierre de Caja (Corte Z)</h3>
                <p className="text-xs text-neutral-500">Verifica el efectivo físico real vs lo calculado por el sistema</p>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-neutral-600">
                <span>Fondo Inicial:</span>
                <span>Bs. {(cashSession?.initialCash || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Total Ventas en Efectivo:</span>
                <span className="text-emerald-700 font-bold">Bs. {cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Total Retiros Realizados:</span>
                <span className="text-rose-700 font-bold">- Bs. {totalWithdrawals.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-neutral-950 pt-2 border-t border-neutral-300 text-sm">
                <span>Efectivo Esperado en Gaveta:</span>
                <span className="text-amber-700">Bs. {expectedCashInBox.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Efectivo Físico Contado (Bs.)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-lg font-black font-mono text-neutral-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Live difference preview */}
              {actualCashInput !== '' && (
                <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
                  parseFloat(actualCashInput) - expectedCashInBox >= 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}>
                  <span>Diferencia de Caja:</span>
                  <span className="font-black text-sm">
                    {parseFloat(actualCashInput) - expectedCashInBox >= 0 ? '+' : ''}
                    Bs. {(parseFloat(actualCashInput) - expectedCashInBox).toFixed(2)}
                    {parseFloat(actualCashInput) - expectedCashInBox === 0 ? ' (Cuadrada exacta)' : ''}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Observaciones de Cierre</label>
                <input
                  type="text"
                  placeholder="Ej. Arqueo conforme de turno mañana..."
                  value={closeNotesInput}
                  onChange={(e) => setCloseNotesInput(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCloseModal(false)}
                  className="px-4 py-2 text-xs text-neutral-600 hover:text-neutral-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Confirmar Cierre de Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Ingreso / Retiro de Dinero */}
      {isMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-neutral-900">Movimiento de Caja Chica</h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('retiro')}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                  movementType === 'retiro'
                    ? 'bg-rose-100 border-rose-300 text-rose-800'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                }`}
              >
                🔴 Retiro de Dinero (Gasto)
              </button>
              <button
                type="button"
                onClick={() => setMovementType('ingreso')}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                  movementType === 'ingreso'
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                }`}
              >
                🟢 Ingreso Extra a Caja
              </button>
            </div>

            <form onSubmit={handleMovementSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Monto (Bs.)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="0.00"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2 text-sm font-black font-mono text-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Motivo / Justificación</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Compra de servilletas, pago a proveedor de pan..."
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModal(false)}
                  className="px-4 py-2 text-xs text-neutral-600 hover:text-neutral-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl text-xs"
                >
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reporte Corte X */}
      {isXReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 space-y-4 text-neutral-900 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm">Reporte de Corte X (Parcial)</h3>
              </div>
              <button onClick={() => setIsXReportModal(false)} className="text-neutral-400 hover:text-neutral-900 text-xs font-bold">
                ✕
              </button>
            </div>

            <div className="bg-neutral-50 text-neutral-950 p-4 rounded-2xl font-mono text-xs space-y-2 border border-neutral-300">
              <div className="text-center pb-2 border-b border-dashed border-neutral-400">
                <p className="font-black text-sm">SNACK IMPERIO - CORTE X PARCIAL</p>
                <p className="text-[10px] text-neutral-600">Fecha: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                <p className="text-[10px] text-neutral-600">Cajero: {currentUser?.name || 'Valeria Quispe'}</p>
              </div>

              <div className="space-y-1 text-[11px] py-1 border-b border-dashed border-neutral-400">
                <div className="flex justify-between"><span>Fondo Inicial:</span><span>Bs. {(cashSession?.initialCash || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Ventas Efectivo ({sessionOrders.filter(o => o.paymentMethod === 'efectivo').length}):</span><span>Bs. {cashSales.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Ventas Tarjetas ({sessionOrders.filter(o => o.paymentMethod === 'tarjeta').length}):</span><span>Bs. {cardSales.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Ventas QR ({sessionOrders.filter(o => o.paymentMethod === 'qr').length}):</span><span>Bs. {qrSales.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Ventas Transf. ({sessionOrders.filter(o => o.paymentMethod === 'transferencia').length}):</span><span>Bs. {transferSales.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold pt-1 border-t border-neutral-300"><span>TOTAL VENTAS:</span><span>Bs. {totalSales.toFixed(2)}</span></div>
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between text-neutral-700"><span>Retiros Efectivo:</span><span>- Bs. {totalWithdrawals.toFixed(2)}</span></div>
                <div className="flex justify-between font-black text-neutral-950 text-xs pt-1 border-t border-neutral-300">
                  <span>EFECTIVO EN GAVETA:</span>
                  <span>Bs. {expectedCashInBox.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsXReportModal(false)}
                className="px-4 py-2 text-xs text-neutral-600 hover:text-neutral-900 font-semibold"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl text-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir Corte X
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
