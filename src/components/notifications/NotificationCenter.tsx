import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCheck, Trash2, X, UtensilsCrossed, AlertTriangle, CircleDollarSign, Info } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const NotificationCenter: React.FC<Props> = ({ onClose }) => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    unreadNotificationsCount,
    setCurrentPage,
  } = useApp();

  const [filter, setFilter] = useState<'todos' | 'no_leidos'>('todos');

  const filtered = notifications.filter(n => filter === 'todos' ? true : !n.read);

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('Notificaciones Push Activadas', {
          body: 'Recibirás alertas en tiempo real de nuevos pedidos y estado de cocina.',
        });
      }
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'nueva_orden':
        return <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30"><UtensilsCrossed className="w-4 h-4" /></div>;
      case 'orden_lista':
        return <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><CheckCheck className="w-4 h-4" /></div>;
      case 'stock_bajo':
        return <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30"><AlertTriangle className="w-4 h-4" /></div>;
      case 'caja':
        return <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30"><CircleDollarSign className="w-4 h-4" /></div>;
      default:
        return <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30"><Info className="w-4 h-4" /></div>;
    }
  };

  return (
    <div
      id="notification-center-drawer"
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 text-white"
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-sm">Notificaciones del Sistema</h3>
          {unreadNotificationsCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500 text-neutral-950">
              {unreadNotificationsCount} nuevas
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action bar & filter */}
      <div className="px-4 py-2 bg-neutral-950/30 border-b border-neutral-800/80 flex items-center justify-between text-xs">
        <div className="flex gap-1">
          <button
            onClick={() => setFilter('todos')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${filter === 'todos' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('no_leidos')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${filter === 'no_leidos' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'}`}
          >
            Sin leer ({unreadNotificationsCount})
          </button>
        </div>

        {unreadNotificationsCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar leídas
          </button>
        )}
      </div>

      {/* Push Notification Activator */}
      {'Notification' in window && Notification.permission !== 'granted' && (
        <div className="mx-3 my-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
          <span className="text-amber-200 text-[11px]">¿Deseas recibir alertas de escritorio?</span>
          <button
            onClick={requestBrowserPermission}
            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-[10px] shadow"
          >
            Activar Push
          </button>
        </div>
      )}

      {/* Notification list */}
      <div className="max-h-80 overflow-y-auto divide-y divide-neutral-800/50">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No hay notificaciones en esta vista</p>
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                markNotificationRead(notif.id);
                if (notif.type === 'nueva_orden' || notif.type === 'orden_lista') {
                  setCurrentPage('kitchen');
                  onClose();
                } else if (notif.type === 'caja') {
                  setCurrentPage('cashier');
                  onClose();
                } else if (notif.type === 'stock_bajo') {
                  setCurrentPage('admin');
                  onClose();
                }
              }}
              className={`p-3.5 flex items-start gap-3 hover:bg-neutral-800/60 cursor-pointer transition-colors ${
                !notif.read ? 'bg-amber-500/5' : ''
              }`}
            >
              {getNotifIcon(notif.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-neutral-100 truncate">{notif.title}</p>
                  <span className="text-[10px] text-neutral-400 whitespace-nowrap">
                    {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
