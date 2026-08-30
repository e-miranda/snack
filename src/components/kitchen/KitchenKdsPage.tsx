import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { OrderStatus } from '../../types';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Play,
  Bell,
  UtensilsCrossed,
  AlertCircle,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  RotateCcw
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export const KitchenKdsPage: React.FC = () => {
  const {
    orders,
    updateOrderStatus,
    soundEnabled,
    toggleSound,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendiente' | 'en_preparacion' | 'listo'>('todos');
  const [now, setNow] = useState<number>(Date.now());

  // Real-time live timer update every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter kitchen active orders (exclude cancelled or already delivered from primary view, unless selected)
  const kitchenOrders = orders.filter((o) => {
    if (o.status === 'cancelado') return false;
    if (statusFilter === 'todos') {
      return o.status === 'pendiente' || o.status === 'en_preparacion' || o.status === 'listo';
    }
    return o.status === statusFilter;
  });

  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = now - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const getUrgencyColor = (minutes: number, status: OrderStatus) => {
    if (status === 'listo') return 'border-emerald-300 bg-emerald-50/70 text-neutral-900';
    if (minutes < 5) return 'border-neutral-200 bg-white text-neutral-900 shadow-sm';
    if (minutes < 10) return 'border-amber-300 bg-amber-50/70 text-neutral-900';
    return 'border-rose-400 bg-rose-50/80 text-neutral-900 animate-pulse';
  };

  const pendingCount = orders.filter((o) => o.status === 'pendiente').length;
  const inPrepCount = orders.filter((o) => o.status === 'en_preparacion').length;
  const readyCount = orders.filter((o) => o.status === 'listo').length;

  return (
    <div id="kitchen-kds-page" className="min-h-[calc(100vh-80px)] bg-neutral-50 text-neutral-900 p-3 sm:p-6 space-y-5">
      {/* Top KDS Header */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-300">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-neutral-950 font-['Outfit']">Pantalla de Cocina (KDS)</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Tiempo Real
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Control de preparación de platos, tiempos de cocción y llamado a salón.
            </p>
          </div>
        </div>

        {/* Status Filters & Sound */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'todos' ? 'bg-amber-500 text-neutral-950 shadow font-extrabold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Todos ({kitchenOrders.length})
            </button>
            <button
              onClick={() => setStatusFilter('pendiente')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'pendiente' ? 'bg-amber-500 text-neutral-950 shadow font-extrabold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('en_preparacion')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'en_preparacion' ? 'bg-amber-500 text-neutral-950 shadow font-extrabold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              En Cocción ({inPrepCount})
            </button>
            <button
              onClick={() => setStatusFilter('listo')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                statusFilter === 'listo' ? 'bg-amber-500 text-neutral-950 shadow font-extrabold' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Listos ({readyCount})
            </button>
          </div>

          <button
            onClick={() => sounds.playKitchenBell()}
            title="Sonar timbre de llamada a mozos"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors"
          >
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Timbre de Cocina</span>
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {kitchenOrders.length === 0 ? (
        <div className="bg-white border border-dashed border-neutral-300 rounded-3xl p-16 text-center text-neutral-500 shadow-sm">
          <ChefHat className="w-16 h-16 mx-auto mb-3 opacity-30 text-neutral-400" />
          <h3 className="text-base font-bold text-neutral-800">¡Cocina al día! No hay pedidos pendientes</h3>
          <p className="text-xs text-neutral-500 mt-1">Los nuevos pedidos ingresados desde POS o web aparecerán automáticamente aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kitchenOrders.map((order) => {
            const elapsed = getElapsedMinutes(order.createdAt);
            const isPending = order.status === 'pendiente';
            const isPrep = order.status === 'en_preparacion';
            const isReady = order.status === 'listo';

            return (
              <div
                key={order.id}
                id={`kds-card-${order.id}`}
                className={`border rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${getUrgencyColor(
                  elapsed,
                  order.status
                )}`}
              >
                <div>
                  {/* Card Header: Order #, Table, Timer */}
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-sm text-neutral-900">{order.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          order.type === 'mesa'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-blue-100 text-blue-900 border border-blue-300'
                        }`}>
                          {order.type === 'mesa' ? order.tableNumber : 'Para Llevar'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Cliente: {order.customerName}</p>
                    </div>

                    {/* Timer */}
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono font-bold text-xs ${
                      isReady
                        ? 'bg-emerald-500 text-neutral-950 font-black'
                        : elapsed > 10
                        ? 'bg-rose-500 text-white animate-pulse'
                        : elapsed > 5
                        ? 'bg-amber-500 text-neutral-950 font-black'
                        : 'bg-neutral-100 text-neutral-800'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{elapsed} min</span>
                    </div>
                  </div>

                  {/* General order note if present */}
                  {order.notes && (
                    <div className="my-2 p-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-700" />
                      <span className="line-clamp-2">Nota: {order.notes}</span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="py-3 space-y-2.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-2xl border border-neutral-200 shadow-sm">
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center font-mono border border-amber-300 flex-shrink-0">
                              {item.quantity}x
                            </span>
                            <span className="font-extrabold text-sm sm:text-base text-neutral-900 leading-snug tracking-wide">
                              {item.productName}
                            </span>
                          </div>
                        </div>

                        {item.notes && (
                          <div className="mt-2 text-xs text-amber-900 font-bold bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200 flex items-start gap-1.5">
                            <span className="flex-shrink-0">👉</span>
                            <span>{item.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Actions Footer based on status */}
                <div className="pt-3 border-t border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                    <span>Hora: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-bold uppercase text-amber-700">{order.status.replace('_', ' ')}</span>
                  </div>

                  {isPending && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'en_preparacion')}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Empezar a Preparar</span>
                    </button>
                  )}

                  {isPrep && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'listo')}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>¡Marcar como Listo! (Timbre)</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'entregado')}
                      className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs flex items-center justify-center gap-2 border border-neutral-300 transition-colors"
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Despachado / Entregado</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
