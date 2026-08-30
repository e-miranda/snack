import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ViewPage, UserRole } from '../../types';
import {
  UtensilsCrossed,
  ShoppingBag,
  CircleDollarSign,
  ChefHat,
  ShieldCheck,
  Bell,
  Volume2,
  VolumeX,
  Users,
  LogOut,
  Sparkles,
  Lock,
  ChevronDown,
  CheckCircle2,
  Clock,
  FileCode2,
  Boxes
} from 'lucide-react';
import { NotificationCenter } from '../notifications/NotificationCenter';

export const Header: React.FC = () => {
  const {
    currentUser,
    currentPage,
    setCurrentPage,
    cashSession,
    unreadNotificationsCount,
    soundEnabled,
    toggleSound,
    switchUser,
    logout,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems: { page: ViewPage; label: string; icon: React.ComponentType<{ className?: string }>; roleRequired?: UserRole[] }[] = [
    { page: 'public', label: 'Inicio & Menú', icon: Sparkles },
    { page: 'warehouse', label: 'Almacén & Stock', icon: Boxes },
    { page: 'pos', label: 'Punto de Venta', icon: ShoppingBag, roleRequired: ['administrador', 'caja'] },
    { page: 'cashier', label: 'Cajero & Turnos', icon: CircleDollarSign, roleRequired: ['administrador', 'caja'] },
    { page: 'kitchen', label: 'Cocina (KDS)', icon: ChefHat, roleRequired: ['administrador', 'cocina'] },
    { page: 'admin', label: 'Administración', icon: ShieldCheck, roleRequired: ['administrador'] },
    { page: 'php_export', label: '📦 Código PHP (GitHub)', icon: FileCode2 },
  ];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'administrador':
        return { label: 'Admin General', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'caja':
        return { label: 'Caja & Cobros', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'cocina':
        return { label: 'Chef Cocina', color: 'bg-amber-50 text-amber-800 border-amber-300' };
      default:
        return { label: 'Invitado', color: 'bg-neutral-100 text-neutral-700 border-neutral-200' };
    }
  };

  const isRoleAllowed = (allowedRoles?: UserRole[]) => {
    if (!allowedRoles) return true;
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 text-neutral-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo & Brand */}
          <div
            id="brand-logo"
            onClick={() => setCurrentPage('public')}
            className="flex items-center gap-3 cursor-pointer group select-none flex-shrink-0"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-neutral-950 font-['Outfit']">
                  SNACK <span className="text-amber-500 font-black">IMPERIO</span>
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Restaurante &amp; POS
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 hidden sm:block font-medium">
                Punto de Venta &bull; Cocina KDS &bull; Control Total
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav id="nav-tabs" className="hidden lg:flex items-center gap-1 bg-neutral-100 p-1.5 rounded-xl border border-neutral-200/80">
            {navItems.map((item) => {
              const active = currentPage === item.page;
              const allowed = isRoleAllowed(item.roleRequired);
              const Icon = item.icon;

              return (
                <button
                  key={item.page}
                  id={`nav-btn-${item.page}`}
                  onClick={() => {
                    if (allowed) {
                      setCurrentPage(item.page);
                    } else if (currentUser) {
                      alert(`Esta sección requiere rol: ${item.roleRequired?.join(' o ')}. Cambie de usuario en el menú superior.`);
                    }
                  }}
                  disabled={!allowed && !currentUser}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                    active
                      ? 'bg-amber-500 text-neutral-950 shadow-sm shadow-amber-500/30'
                      : allowed
                      ? 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200/70'
                      : 'text-neutral-400 hover:text-neutral-500 cursor-not-allowed opacity-40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-neutral-950' : 'text-neutral-600'}`} />
                  <span>{item.label}</span>
                  {!allowed && currentUser && (
                    <Lock className="w-3 h-3 text-neutral-400 ml-0.5" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Cash status, Sound, Notifications, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Clock & Cash Drawer Status */}
            <div className="hidden xl:flex flex-col items-end text-right pr-2 border-r border-neutral-200">
              <div className="flex items-center gap-1.5 text-xs text-neutral-700 font-mono font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentTime}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${cashSession?.status === 'abierta' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[11px] font-semibold text-neutral-600">
                  Caja: {cashSession?.status === 'abierta' ? 'Abierta' : 'Cerrada'}
                </span>
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              id="btn-sound-toggle"
              onClick={toggleSound}
              title={soundEnabled ? 'Sonidos activados (Campana KDS, Caja)' : 'Sonidos desactivados'}
              className="p-2 sm:p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 hover:text-amber-600 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-neutral-800" /> : <VolumeX className="w-4 h-4 text-neutral-400" />}
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                id="btn-notifications-toggle"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 sm:p-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 hover:text-neutral-950 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <NotificationCenter onClose={() => setIsNotifOpen(false)} />
              )}
            </div>

            {/* User Profile & Quick Switcher */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="btn-user-menu-toggle"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/90 border border-neutral-200 text-left transition-all"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-amber-400"
                  />
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-neutral-900 leading-tight truncate max-w-[110px]">
                      {currentUser.name.split(' ')[0]}
                    </p>
                    <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-semibold ${getRoleBadge(currentUser.role).color}`}>
                      {getRoleBadge(currentUser.role).label}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                </button>

                {isUserMenuOpen && (
                  <div
                    id="user-dropdown-menu"
                    className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-neutral-200 py-3 px-3 z-50 animate-in fade-in slide-in-from-top-2 text-neutral-900"
                  >
                    <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 px-1">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-xl object-cover border-2 border-amber-400"
                      />
                      <div>
                        <p className="text-sm font-bold text-neutral-950 leading-snug">{currentUser.name}</p>
                        <p className="text-xs text-neutral-500 font-mono">Usuario: @{currentUser.username}</p>
                        <span className={`inline-block text-[10px] px-1.5 py-0.5 mt-1 rounded border font-bold ${getRoleBadge(currentUser.role).color}`}>
                          {getRoleBadge(currentUser.role).label}
                        </span>
                      </div>
                    </div>

                    {/* Quick Role Switcher for Demo */}
                    <div className="pt-3">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[11px] font-bold tracking-wide uppercase text-neutral-500 flex items-center gap-1">
                          <Users className="w-3 h-3 text-amber-500" /> Cambiar Perfil Demo (123)
                        </span>
                      </div>

                      <div className="space-y-1">
                        {(['administrador', 'caja', 'cocina'] as UserRole[]).map((role) => {
                          const isActive = currentUser.role === role;
                          return (
                            <button
                              key={role}
                              id={`btn-switch-role-${role}`}
                              onClick={() => {
                                switchUser(role);
                                setIsUserMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-colors ${
                                isActive
                                  ? 'bg-amber-50 text-amber-900 border border-amber-300'
                                  : 'text-neutral-700 hover:bg-neutral-100'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="capitalize">{role === 'administrador' ? 'Administrador' : role === 'caja' ? 'Caja / POS' : 'Cocina (KDS)'}</span>
                              </div>
                              {isActive && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-100 flex justify-between gap-2">
                      <button
                        id="btn-logout"
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-neutral-100 hover:bg-rose-50 hover:text-rose-700 text-neutral-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-login-header"
                onClick={() => setCurrentPage('public')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-950 rounded-xl text-xs font-extrabold shadow-sm transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                Ingresar al Sistema
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-neutral-200 no-scrollbar">
          {navItems.map((item) => {
            const active = currentPage === item.page;
            const allowed = isRoleAllowed(item.roleRequired);
            const Icon = item.icon;

            return (
              <button
                key={item.page}
                id={`mobile-nav-${item.page}`}
                onClick={() => {
                  if (allowed) {
                    setCurrentPage(item.page);
                  } else {
                    alert(`Requiere rol: ${item.roleRequired?.join(' o ')}`);
                  }
                }}
                disabled={!allowed && !currentUser}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-bold transition-all ${
                  active
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : allowed
                    ? 'text-neutral-700 hover:text-neutral-950 bg-neutral-100'
                    : 'text-neutral-400 opacity-40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
