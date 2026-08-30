/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { PublicSnackPage } from './components/public/PublicSnackPage';
import { PosSalesPage } from './components/pos/PosSalesPage';
import { CashierPage } from './components/cashier/CashierPage';
import { KitchenKdsPage } from './components/kitchen/KitchenKdsPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { InvoiceModal } from './components/invoice/InvoiceModal';
import { PhpExportPage } from './components/php_export/PhpExportPage';
import { WarehousePage } from './components/warehouse/WarehousePage';

const MainLayout: React.FC = () => {
  const { currentPage } = useApp();

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Universal Header with Navigation, Sound & Role Switcher */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentPage === 'public' && <PublicSnackPage />}
        {currentPage === 'warehouse' && <WarehousePage />}
        {currentPage === 'pos' && <PosSalesPage />}
        {currentPage === 'cashier' && <CashierPage />}
        {currentPage === 'kitchen' && <KitchenKdsPage />}
        {currentPage === 'admin' && <AdminDashboard />}
        {currentPage === 'php_export' && <PhpExportPage />}
      </main>

      {/* Global Invoice / Printable Receipt Modal */}
      <InvoiceModal />

      {/* Footer for Public View */}
      {currentPage === 'public' && (
        <footer className="bg-white border-t border-neutral-200 py-8 text-center text-xs text-neutral-600">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <p className="font-extrabold text-neutral-900 font-['Outfit'] text-sm tracking-wide">
              SNACK <span className="text-amber-500">IMPERIO</span> &bull; SABOR &amp; TRADICIÓN
            </p>
            <p className="text-[11px] text-neutral-500">
              Punto de Venta &bull; Cocina KDS &bull; Control de Caja &bull; Sincronización en Tiempo Real
            </p>
            <p className="text-[10px] text-neutral-400">
              © {new Date().getFullYear()} Snack IMPERIO. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
