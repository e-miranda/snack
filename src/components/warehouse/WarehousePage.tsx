import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory, PaymentMethod, WarehouseRequestItem } from '../../types';
import {
  Boxes,
  PackagePlus,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Banknote,
  QrCode,
  CreditCard,
  Plus,
  Minus,
  Check,
  X,
  Truck,
  RotateCcw,
  Store,
  FileCode2,
  Github,
  Terminal,
  ExternalLink,
  Copy,
  Receipt,
  Info,
  Calendar,
  Filter,
  UserCheck
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export const WarehousePage: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    adjustStock,
    warehouseRequests,
    createWarehouseRequest,
    dispatchWarehouseRequest,
    cancelWarehouseRequest,
    supplierPurchases,
    addSupplierPurchase,
    quickWarehouseSale,
    cashSession,
    currentUser,
  } = useApp();

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'venta_rapida' | 'stock' | 'solicitudes' | 'proveedores' | 'github_guide'>('venta_rapida');

  // Venta Rápida State
  const [saleCategory, setSaleCategory] = useState<ProductCategory | 'todas'>('refrescos');
  const [saleSearch, setSaleSearch] = useState('');
  const [selectedProductForSale, setSelectedProductForSale] = useState<Product | null>(null);
  const [saleQuantity, setSaleQuantity] = useState<number>(1);
  const [salePaymentMethod, setSalePaymentMethod] = useState<PaymentMethod>('efectivo');
  const [saleCashReceived, setSaleCashReceived] = useState<number>(0);
  const [saleCustomerName, setSaleCustomerName] = useState<string>('Cliente de Almacén');
  const [saleSuccessMessage, setSaleSuccessMessage] = useState<string>('');

  // Stock Management State
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState<ProductCategory | 'todas'>('todas');
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Ingreso de mercadería / Reposición');

  // New Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('refrescos');
  const [newProdPrice, setNewProdPrice] = useState('7.00');
  const [newProdCost, setNewProdCost] = useState('3.50');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdMinStock, setNewProdMinStock] = useState('15');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('botella 500ml');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [newProdImage, setNewProdImage] = useState('');

  // Solicitud Modal State
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [requestArea, setRequestArea] = useState<'Cocina' | 'Barra' | 'Mostrador' | 'Delivery'>('Barra');
  const [requestItemsList, setRequestItemsList] = useState<{ productId: string; quantity: number; notes: string }[]>([
    { productId: products.find(p => p.category === 'refrescos')?.id || products[0]?.id || '', quantity: 12, notes: 'Para refrigerador' }
  ]);
  const [requestGeneralNotes, setRequestGeneralNotes] = useState('');

  // Purchase Supplier Modal State
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [purchaseInvoice, setPurchaseInvoice] = useState('');
  const [purchaseSupplier, setPurchaseSupplier] = useState('Distribuidora Andina de Bebidas');
  const [purchaseItems, setPurchaseItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([
    { productId: products.find(p => p.category === 'refrescos')?.id || products[0]?.id || '', quantity: 24, unitCost: 3.20 }
  ]);

  // Copied state helper
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    sounds.playClick();
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Calculations
  const totalProductsCount = products.length;
  const totalUnitsInStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalInventoryCost = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;
  const pendingRequestsCount = warehouseRequests.filter(r => r.status === 'pendiente').length;

  // Filtered Products for Venta Rápida
  const saleProducts = products.filter(p => {
    const matchesCat = saleCategory === 'todas' || p.category === saleCategory;
    const matchesSearch = p.name.toLowerCase().includes(saleSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(saleSearch.toLowerCase());
    return matchesCat && matchesSearch && p.isAvailable;
  });

  // Filtered Products for Stock Table
  const stockFilteredProducts = products.filter(p => {
    const matchesCat = stockCategoryFilter === 'todas' || p.category === stockCategoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(stockSearch.toLowerCase()) ||
                          p.description.toLowerCase().includes(stockSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handlers
  const handleSelectProductForSale = (prod: Product) => {
    sounds.playClick();
    setSelectedProductForSale(prod);
    setSaleQuantity(1);
    setSaleCashReceived(prod.price);
  };

  const handleExecuteQuickSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForSale) return;

    if (selectedProductForSale.stock < saleQuantity) {
      alert(`Stock insuficiente. Solo quedan ${selectedProductForSale.stock} unidades en almacén.`);
      return;
    }

    const totalToPay = selectedProductForSale.price * saleQuantity;
    if (salePaymentMethod === 'efectivo' && saleCashReceived < totalToPay) {
      alert(`El monto recibido (Bs. ${saleCashReceived.toFixed(2)}) es menor que el total (Bs. ${totalToPay.toFixed(2)}).`);
      return;
    }

    const order = quickWarehouseSale({
      productId: selectedProductForSale.id,
      quantity: saleQuantity,
      paymentMethod: salePaymentMethod,
      cashReceived: salePaymentMethod === 'efectivo' ? saleCashReceived : totalToPay,
      customerName: saleCustomerName.trim() || 'Cliente Mostrador / Almacén',
    });

    setSaleSuccessMessage(`¡Venta realizada con éxito! Orden #${order.orderNumber} por Bs. ${order.total.toFixed(2)} registrada.`);
    setSelectedProductForSale(null);
    setSaleQuantity(1);
    setTimeout(() => setSaleSuccessMessage(''), 7000);
  };

  const handleCreateNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    addProduct({
      name: newProdName.trim(),
      category: newProdCategory,
      price: parseFloat(newProdPrice) || 0,
      cost: parseFloat(newProdCost) || 0,
      stock: parseInt(newProdStock) || 0,
      minStock: parseInt(newProdMinStock) || 5,
      sku: newProdSku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
      unit: newProdUnit.trim() || 'unidad',
      description: newProdDescription.trim() || 'Producto registrado en almacén',
      image: newProdImage.trim() || 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
    });

    sounds.playCashRegister();
    setIsNewProductModalOpen(false);
    // Reset
    setNewProdName('');
    setNewProdSku('');
    setNewProdDescription('');
    setNewProdImage('');
  };

  const handleExecuteStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust) return;

    adjustStock(selectedProductForAdjust.id, adjustDelta, adjustReason);
    sounds.playClick();
    setIsAdjustModalOpen(false);
    setSelectedProductForAdjust(null);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedItems: WarehouseRequestItem[] = requestItemsList.map(it => {
      const prod = products.find(p => p.id === it.productId);
      return {
        productId: it.productId,
        productName: prod ? prod.name : 'Producto',
        quantityRequested: it.quantity,
        unit: prod ? prod.unit : 'unidad',
        notes: it.notes,
      };
    });

    createWarehouseRequest({
      area: requestArea,
      items: formattedItems,
      notes: requestGeneralNotes,
    });

    setIsNewRequestModalOpen(false);
    setRequestGeneralNotes('');
  };

  const handleCreateSupplierPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedItems = purchaseItems.map(it => {
      const prod = products.find(p => p.id === it.productId);
      return {
        productId: it.productId,
        productName: prod ? prod.name : 'Producto',
        quantity: it.quantity,
        unitCost: it.unitCost,
        subtotal: it.quantity * it.unitCost,
      };
    });

    addSupplierPurchase({
      invoiceNumber: purchaseInvoice.trim() || `FAC-PROV-${Date.now().toString().slice(-4)}`,
      supplierName: purchaseSupplier.trim() || 'Distribuidor General',
      items: formattedItems,
    });

    setIsNewPurchaseModalOpen(false);
    setPurchaseInvoice('');
  };

  const exportInventoryCSV = () => {
    const headers = ['ID,SKU,Nombre,Categoría,Precio Venta (Bs.),Costo (Bs.),Stock Actual,Stock Mínimo,Unidad,Valor Total Costo,Valor Total Venta'];
    const rows = products.map(p => 
      `"${p.id}","${p.sku}","${p.name.replace(/"/g, '""')}","${p.category}",${p.price.toFixed(2)},${p.cost.toFixed(2)},${p.stock},${p.minStock},"${p.unit}",${(p.cost * p.stock).toFixed(2)},${(p.price * p.stock).toFixed(2)}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventario_almacen_imperio_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sounds.playClick();
  };

  return (
    <div id="warehouse-page" className="min-h-[calc(100vh-80px)] bg-neutral-50 text-neutral-900 p-3 sm:p-6 space-y-6">
      {/* Top Banner Alert on Sale */}
      {saleSuccessMessage && (
        <div className="bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-md flex items-center justify-between gap-3 animate-in slide-in-from-top">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>{saleSuccessMessage}</span>
          </div>
          <button onClick={() => setSaleSuccessMessage('')} className="p-1 hover:bg-emerald-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & High-Level KPIs */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-neutral-950 shadow-lg shadow-amber-500/20 flex-shrink-0">
              <Boxes className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] tracking-tight text-neutral-950">
                  Almacén &amp; Control de Stock
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-black uppercase rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Gaseosas, Tortas, Empanadas
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 font-medium">
                Venta directa de refrescos, tortas y empanadas, gestión de solicitudes internas, entradas de proveedores y guía GitHub.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-export-csv"
              onClick={exportInventoryCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-all border border-neutral-200"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Excel/CSV</span>
            </button>
            <button
              id="btn-new-product-modal"
              onClick={() => setIsNewProductModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-950 rounded-xl text-xs font-black shadow-md transition-all"
            >
              <PackagePlus className="w-4 h-4" />
              <span>+ Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-neutral-100">
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" /> Variedad de Productos
            </span>
            <p className="text-xl sm:text-2xl font-black text-neutral-950 font-['Outfit'] mt-1">
              {totalProductsCount} <span className="text-xs font-semibold text-neutral-500">ítems</span>
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">{totalUnitsInStock} unidades en stock</p>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Valor Total en Venta
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 font-['Outfit'] mt-1">
              Bs. {totalInventoryValue.toFixed(2)}
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Costo: Bs. {totalInventoryCost.toFixed(2)}</p>
          </div>

          <div className={`border rounded-2xl p-3.5 ${lowStockCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-neutral-50 border-neutral-200 text-neutral-900'}`}>
            <span className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1">
              <AlertTriangle className={`w-3.5 h-3.5 ${lowStockCount > 0 ? 'text-rose-600' : 'text-neutral-400'}`} /> Stock Crítico
            </span>
            <p className="text-xl sm:text-2xl font-black font-['Outfit'] mt-1">
              {lowStockCount} <span className="text-xs font-semibold">productos</span>
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">Por debajo del mínimo</p>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5 text-amber-500" /> Solicitudes Pendientes
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-700 font-['Outfit'] mt-1">
              {pendingRequestsCount} <span className="text-xs font-semibold text-neutral-500">pedidos</span>
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Barra, Cocina y Mostrador</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white p-1.5 rounded-2xl border border-neutral-200 shadow-sm">
        <button
          onClick={() => setActiveTab('venta_rapida')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'venta_rapida'
              ? 'bg-amber-500 text-neutral-950 font-black shadow'
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>⚡ Venta Rápida (Refrescos, Tortas, Empanadas)</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'stock'
              ? 'bg-amber-500 text-neutral-950 font-black shadow'
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>📦 Catálogo &amp; Control de Stock</span>
        </button>

        <button
          onClick={() => setActiveTab('solicitudes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'solicitudes'
              ? 'bg-amber-500 text-neutral-950 font-black shadow'
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>📋 Solicitudes de Reabastecimiento</span>
          {pendingRequestsCount > 0 && (
            <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('proveedores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'proveedores'
              ? 'bg-amber-500 text-neutral-950 font-black shadow'
              : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>📥 Compras &amp; Proveedores</span>
        </button>

        <button
          onClick={() => setActiveTab('github_guide')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'github_guide'
              ? 'bg-neutral-900 text-amber-400 font-black shadow'
              : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
          }`}
        >
          <Github className="w-4 h-4" />
          <span>🚀 Guía Despliegue en GitHub</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VENTA RÁPIDA DE ALMACÉN (Refrescos, Tortas, Empanadas) */}
      {/* ========================================================================= */}
      {activeTab === 'venta_rapida' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Products Grid (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filter Bar */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar Coca-Cola, Pepsi, Fanta, Tortas, Empanadas..."
                    value={saleSearch}
                    onChange={(e) => setSaleSearch(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
                {saleSearch && (
                  <button
                    onClick={() => setSaleSearch('')}
                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-xs font-bold text-neutral-700"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Category pills */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {[
                  { id: 'refrescos', label: 'Refrescos & Gaseosas', icon: '🥤' },
                  { id: 'tortas', label: 'Tortas & Postres', icon: '🍰' },
                  { id: 'empanadas', label: 'Empanadas', icon: '🥟' },
                  { id: 'snacks', label: 'Snacks & Salchipapas', icon: '🍟' },
                  { id: 'jugos', label: 'Jugos Naturales', icon: '🍹' },
                  { id: 'calientes', label: 'Bebidas Calientes', icon: '☕' },
                  { id: 'todas', label: 'Ver Todo', icon: '✨' },
                ].map(cat => {
                  const active = saleCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSaleCategory(cat.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        active
                          ? 'bg-amber-500 text-neutral-950 font-black shadow'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {saleProducts.map((prod) => {
                const isSelected = selectedProductForSale?.id === prod.id;
                const isLow = prod.stock <= prod.minStock;
                const isOutOfStock = prod.stock <= 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => !isOutOfStock && handleSelectProductForSale(prod)}
                    className={`bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all cursor-pointer group shadow-sm hover:shadow-md ${
                      isSelected
                        ? 'border-amber-500 ring-2 ring-amber-400 bg-amber-50/20'
                        : isOutOfStock
                        ? 'opacity-50 cursor-not-allowed border-neutral-200 bg-neutral-100'
                        : 'border-neutral-200 hover:border-amber-400'
                    }`}
                  >
                    <div>
                      {/* Product Image */}
                      <div className="relative aspect-video sm:aspect-square rounded-xl overflow-hidden mb-2.5 bg-neutral-100">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-neutral-950/80 text-amber-400 text-[10px] font-mono font-black backdrop-blur-sm">
                          Bs. {prod.price.toFixed(2)}
                        </span>
                        <span className={`absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isOutOfStock ? 'bg-rose-600 text-white' : isLow ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-900/80 text-white'
                        }`}>
                          Stock: {prod.stock}
                        </span>
                      </div>

                      <p className="text-xs font-black text-neutral-900 leading-snug line-clamp-2">
                        {prod.name}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                        {prod.sku} &bull; {prod.unit}
                      </p>
                    </div>

                    <button
                      disabled={isOutOfStock}
                      className={`w-full mt-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors ${
                        isSelected
                          ? 'bg-amber-500 text-neutral-950 font-black shadow'
                          : isOutOfStock
                          ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                          : 'bg-neutral-100 hover:bg-amber-500 hover:text-neutral-950 text-neutral-800'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{isSelected ? 'Seleccionado' : 'Despachar'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Sale Checkout Panel (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm sticky top-24 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-500" />
                  <h2 className="text-base font-black text-neutral-950 font-['Outfit']">
                    Despacho &amp; Cobro Express
                  </h2>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                  Almacén
                </span>
              </div>

              {selectedProductForSale ? (
                <form onSubmit={handleExecuteQuickSale} className="space-y-4">
                  {/* Selected Item Summary */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                    <img
                      src={selectedProductForSale.image}
                      alt={selectedProductForSale.name}
                      className="w-12 h-12 rounded-xl object-cover border border-amber-300 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-extrabold text-neutral-900 truncate">
                        {selectedProductForSale.name}
                      </p>
                      <p className="text-[11px] text-amber-800 font-mono font-bold">
                        Precio: Bs. {selectedProductForSale.price.toFixed(2)} / {selectedProductForSale.unit}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        Existencias disponibles: {selectedProductForSale.stock}
                      </p>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Cantidad a Despachar:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSaleQuantity(prev => Math.max(1, prev - 1))}
                        className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-900 font-bold text-base"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={selectedProductForSale.stock}
                        value={saleQuantity}
                        onChange={(e) => setSaleQuantity(Math.max(1, Math.min(selectedProductForSale.stock, parseInt(e.target.value) || 1)))}
                        className="flex-1 text-center bg-neutral-50 border border-neutral-300 rounded-xl py-2 font-black text-sm text-neutral-950 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setSaleQuantity(prev => Math.min(selectedProductForSale.stock, prev + 1))}
                        className="w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-900 font-bold text-base"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick pack multipliers for sodas */}
                    <div className="flex gap-1.5 mt-2">
                      {[1, 2, 6, 12, 24].map(q => (
                        <button
                          key={q}
                          type="button"
                          disabled={q > selectedProductForSale.stock}
                          onClick={() => setSaleQuantity(q)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                            saleQuantity === q
                              ? 'bg-amber-500 text-neutral-950 border-amber-400 font-black'
                              : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          x{q}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Cliente / Destino:
                    </label>
                    <input
                      type="text"
                      value={saleCustomerName}
                      onChange={(e) => setSaleCustomerName(e.target.value)}
                      placeholder="Ej. Venta rápida mostrador, Cliente Juan..."
                      className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Método de Pago:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['efectivo', 'qr', 'tarjeta'] as PaymentMethod[]).map(pm => {
                        const active = salePaymentMethod === pm;
                        return (
                          <button
                            key={pm}
                            type="button"
                            onClick={() => setSalePaymentMethod(pm)}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              active
                                ? 'bg-neutral-950 text-amber-400 border-neutral-950 font-black shadow'
                                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            <span className="block text-xs font-bold capitalize">{pm}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cash received calculator if efectivo */}
                  {salePaymentMethod === 'efectivo' && (
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-1">
                        <span>Efectivo Recibido:</span>
                        <span className="text-neutral-500 font-mono text-[11px]">
                          Total: Bs. {(selectedProductForSale.price * saleQuantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.50"
                          value={saleCashReceived || ''}
                          onChange={(e) => setSaleCashReceived(parseFloat(e.target.value) || 0)}
                          placeholder="Monto entregado"
                          className="flex-1 bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setSaleCashReceived(selectedProductForSale.price * saleQuantity)}
                          className="px-3 py-2 bg-neutral-200 hover:bg-neutral-300 rounded-xl text-xs font-bold text-neutral-800"
                        >
                          Exacto
                        </button>
                      </div>

                      {saleCashReceived >= (selectedProductForSale.price * saleQuantity) && (
                        <p className="text-xs font-extrabold text-emerald-600 mt-1.5 font-mono">
                          Vuelto a entregar: Bs. {(saleCashReceived - (selectedProductForSale.price * saleQuantity)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Total summary & action */}
                  <div className="pt-3 border-t border-neutral-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-600">Total a Cobrar:</span>
                      <span className="text-2xl font-black text-neutral-950 font-mono">
                        Bs. {(selectedProductForSale.price * saleQuantity).toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-neutral-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Confirmar Venta &amp; Emitir Ticket</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-10 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                    <Store className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-neutral-700">Ningún producto seleccionado</p>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Haz clic en una gaseosa (Coca-Cola, Pepsi, Fanta), torta o empanada del catálogo para despacharla al instante.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STOCK & CATÁLOGO DE ALMACÉN */}
      {/* ========================================================================= */}
      {activeTab === 'stock' && (
        <div className="bg-white border border-neutral-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filtrar por SKU, nombre, categoría..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={stockCategoryFilter}
                onChange={(e) => setStockCategoryFilter(e.target.value as any)}
                className="bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-amber-500"
              >
                <option value="todas">Todas las Categorías</option>
                <option value="refrescos">Refrescos &amp; Gaseosas</option>
                <option value="tortas">Tortas &amp; Postres</option>
                <option value="empanadas">Empanadas</option>
                <option value="hamburguesas">Hamburguesas</option>
                <option value="jugos">Jugos Naturales</option>
                <option value="calientes">Bebidas Calientes</option>
                <option value="snacks">Snacks</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewProductModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-xl text-xs font-black shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Producto</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-neutral-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">SKU / Unidad</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-right">Precio Venta</th>
                  <th className="py-3 px-4 text-right">Costo Unit.</th>
                  <th className="py-3 px-4 text-center">Stock Actual</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones de Ajuste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {stockFilteredProducts.map((prod) => {
                  const isLow = prod.stock <= prod.minStock && prod.stock > 0;
                  const isOutOfStock = prod.stock <= 0;

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-10 h-10 rounded-xl object-cover border border-neutral-200 flex-shrink-0"
                          />
                          <div>
                            <p className="font-extrabold text-neutral-900 leading-tight">{prod.name}</p>
                            <p className="text-[11px] text-neutral-500 line-clamp-1 max-w-xs">{prod.description}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-neutral-600">
                        <span className="font-bold text-neutral-800">{prod.sku}</span>
                        <span className="block text-[10px] text-neutral-400">{prod.unit}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize bg-neutral-100 text-neutral-700 border border-neutral-200">
                          {prod.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-neutral-900 font-mono">
                        Bs. {prod.price.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-neutral-500">
                        Bs. {prod.cost.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-sm font-mono text-neutral-900">
                          {prod.stock}
                        </span>
                        <span className="block text-[10px] text-neutral-400 font-mono">
                          Mín: {prod.minStock}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black uppercase">
                            Agotado
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black uppercase">
                            Stock Bajo
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase">
                            Óptimo
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedProductForAdjust(prod);
                              setAdjustDelta(12);
                              setIsAdjustModalOpen(true);
                            }}
                            title="Ingreso rápido (+12)"
                            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-emerald-100 text-neutral-700 hover:text-emerald-800 transition-colors font-bold text-[11px]"
                          >
                            +12
                          </button>

                          <button
                            onClick={() => {
                              setSelectedProductForAdjust(prod);
                              setAdjustDelta(24);
                              setIsAdjustModalOpen(true);
                            }}
                            title="Ingreso Pack (+24)"
                            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-emerald-100 text-neutral-700 hover:text-emerald-800 transition-colors font-bold text-[11px]"
                          >
                            +24
                          </button>

                          <button
                            onClick={() => {
                              setSelectedProductForAdjust(prod);
                              setAdjustDelta(-1);
                              setIsAdjustModalOpen(true);
                            }}
                            title="Registrar merma / salida (-1)"
                            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-rose-100 text-neutral-700 hover:text-rose-800 transition-colors font-bold text-[11px]"
                          >
                            -1
                          </button>

                          <button
                            onClick={() => {
                              setSelectedProductForAdjust(prod);
                              setAdjustDelta(10);
                              setIsAdjustModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition-colors"
                          >
                            Ajustar...
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SOLICITUDES DE REABASTECIMIENTO */}
      {/* ========================================================================= */}
      {activeTab === 'solicitudes' && (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-neutral-950 font-['Outfit']">
                Solicitudes Internas de Reabastecimiento
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Peticiones de reposición generadas por Cocina, Barra de Bebidas o Mostrador hacia el Almacén central.
              </p>
            </div>

            <button
              onClick={() => setIsNewRequestModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-xl text-xs font-black shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Crear Nueva Solicitud</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouseRequests.map((req) => {
              const isPending = req.status === 'pendiente';
              const isDispatched = req.status === 'despachado';

              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-3xl border p-5 shadow-sm space-y-3 transition-all ${
                    isPending ? 'border-amber-400 ring-1 ring-amber-300' : 'border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-neutral-950">
                        {req.requestNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-neutral-100 text-neutral-800 border border-neutral-200">
                        Área: {req.area}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isPending ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' :
                      isDispatched ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="text-xs text-neutral-500 space-y-0.5">
                    <p>Solicitado por: <strong>{req.requestedBy}</strong></p>
                    <p>Fecha: {new Date(req.createdAt).toLocaleString('es-ES')}</p>
                    {req.dispatchDate && (
                      <p className="text-emerald-700 font-medium">
                        Despachado: {new Date(req.dispatchDate).toLocaleString('es-ES')} por {req.dispatchedBy}
                      </p>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200/80 space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider block mb-1">
                      Productos Solicitados:
                    </span>
                    {req.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-semibold text-neutral-800">
                        <span>&bull; {it.productName}</span>
                        <span className="font-mono font-bold text-amber-700">
                          {it.quantityRequested} {it.unit}
                        </span>
                      </div>
                    ))}
                    {req.notes && (
                      <p className="text-[11px] text-neutral-500 italic pt-1 border-t border-neutral-200 mt-2">
                        Nota: "{req.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                      <button
                        onClick={() => cancelWarehouseRequest(req.id)}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-rose-50 hover:text-rose-700 rounded-xl text-xs font-bold text-neutral-600 transition-colors"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => dispatchWarehouseRequest(req.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprobar &amp; Despachar de Almacén</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COMPRAS & PROVEEDORES */}
      {/* ========================================================================= */}
      {activeTab === 'proveedores' && (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-neutral-950 font-['Outfit']">
                Entradas de Proveedores &amp; Facturas de Compra
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                Registro de lotes de gaseosas (Coca-Cola, Pepsi, Fanta), tortas y empanadas ingresados al almacén.
              </p>
            </div>

            <button
              onClick={() => setIsNewPurchaseModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-xl text-xs font-black shadow transition-all"
            >
              <PackagePlus className="w-4 h-4" />
              <span>+ Registrar Factura de Proveedor</span>
            </button>
          </div>

          <div className="space-y-3">
            {supplierPurchases.map((pur) => (
              <div key={pur.id} className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-mono font-black text-xs">
                      FAC
                    </div>
                    <div>
                      <p className="text-sm font-black text-neutral-950">{pur.supplierName}</p>
                      <p className="text-xs font-mono text-neutral-500">
                        N° Comprobante: {pur.invoiceNumber} &bull; {new Date(pur.date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-neutral-500 block">Total Factura:</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      Bs. {pur.totalCost.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items breakdown */}
                <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200/80">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {pur.items.map((it, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-xl border border-neutral-200 text-xs">
                        <p className="font-bold text-neutral-900 truncate">{it.productName}</p>
                        <p className="text-[11px] text-neutral-500 font-mono">
                          {it.quantity} unidades @ Bs. {it.unitCost.toFixed(2)} = <strong>Bs. {it.subtotal.toFixed(2)}</strong>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GUÍA DE DESPLIEGUE Y EJECUCIÓN DESDE GITHUB (Paso a Paso) */}
      {/* ========================================================================= */}
      {activeTab === 'github_guide' && (
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-amber-400 flex items-center justify-center">
                <Github className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-neutral-950 font-['Outfit']">
                  Pasos para Ejecutar y Desplegar desde GitHub
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 font-medium">
                  Guía paso a paso para compilar, alojar en la web de forma 100% gratuita y ejecutar localmente desde tu repositorio.
                </p>
              </div>
            </div>
          </div>

          {/* Step 1: Subir código a GitHub */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="text-base font-extrabold text-neutral-950">
                Paso 1: Subir el Proyecto a tu Repositorio de GitHub
              </h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed pl-9">
              Abre tu terminal en la carpeta de tu proyecto (o tras descargarlo desde el menú Settings &gt; Export to ZIP) e inicializa el repositorio Git:
            </p>

            <div className="ml-9 relative bg-neutral-950 text-neutral-100 rounded-2xl p-4 font-mono text-xs overflow-x-auto">
              <button
                onClick={() => copyToClipboard(`git init
git add .
git commit -m "feat: Snack IMPERIO POS con Almacén y Control de Stock"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/snack-imperio-pos.git
git push -u origin main`, 'git-push')}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-[11px] flex items-center gap-1.5 transition-colors"
              >
                {copiedCodeId === 'git-push' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeId === 'git-push' ? '¡Copiado!' : 'Copiar Comandos'}</span>
              </button>
              <pre className="text-amber-300"># Inicializar y subir a tu repositorio en GitHub:</pre>
              <pre className="mt-1 text-emerald-400">git init</pre>
              <pre>git add .</pre>
              <pre>git commit -m "feat: Snack IMPERIO POS con Almacén y Control de Stock"</pre>
              <pre>git branch -M main</pre>
              <pre>git remote add origin https://github.com/TU_USUARIO/snack-imperio-pos.git</pre>
              <pre className="text-amber-400 font-bold">git push -u origin main</pre>
            </div>
          </div>

          {/* Step 2: Método 1 - GitHub Pages Automático con GitHub Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="text-base font-extrabold text-neutral-950">
                Opción A: Despliegue Automático con GitHub Pages &amp; Actions (Gratis)
              </h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed pl-9">
              Crea el archivo de automatización <code className="bg-neutral-100 px-1.5 py-0.5 rounded font-mono text-amber-800">.github/workflows/deploy.yml</code> en la raíz de tu proyecto. En cada <code className="bg-neutral-100 px-1.5 py-0.5 rounded font-mono">git push</code>, GitHub compilará el frontend y lo publicará en la web:
            </p>

            <div className="ml-9 relative bg-neutral-950 text-neutral-100 rounded-2xl p-4 font-mono text-xs overflow-x-auto">
              <button
                onClick={() => copyToClipboard(`name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Project
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`, 'workflow-yaml')}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-[11px] flex items-center gap-1.5 transition-colors"
              >
                {copiedCodeId === 'workflow-yaml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeId === 'workflow-yaml' ? '¡Copiado!' : 'Copiar deploy.yml'}</span>
              </button>
              <pre className="text-amber-400"># .github/workflows/deploy.yml</pre>
              <pre className="text-neutral-400">name: Deploy to GitHub Pages</pre>
              <pre className="text-neutral-400">on: push: branches: [ main ]</pre>
              <pre className="text-emerald-400"># Compila automáticamente con 'npm run build' y publica la carpeta 'dist'</pre>
            </div>

            <div className="ml-9 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-1.5 text-amber-950">
              <p className="font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Activar en GitHub:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-neutral-800 font-medium">
                <li>Ve a tu repositorio en GitHub: <strong>https://github.com/TU_USUARIO/snack-imperio-pos</strong></li>
                <li>Entra a <strong>Settings</strong> &gt; <strong>Pages</strong> (en la barra lateral izquierda).</li>
                <li>En <strong>Build and deployment &gt; Source</strong>, selecciona <strong>"GitHub Actions"</strong>.</li>
                <li>¡Listo! Tu web estará online en <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold">https://TU_USUARIO.github.io/snack-imperio-pos/</code></li>
              </ol>
            </div>
          </div>

          {/* Step 3: Opción B - Vercel o Render en 1 clic */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="text-base font-extrabold text-neutral-950">
                Opción B: Despliegue Instantáneo en Vercel o Render (1 Clic)
              </h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed pl-9">
              Si prefieres HTTPS automático, dominio personalizado y despliegues automáticos con cero configuración:
            </p>

            <div className="ml-9 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-black text-neutral-950">Vercel (Recomendado)</p>
                <p className="text-[11px] text-neutral-600">
                  1. Entra a <strong>vercel.com</strong> e inicia sesión con tu cuenta de GitHub.<br />
                  2. Haz clic en <strong>"Add New... &gt; Project"</strong> y selecciona tu repositorio.<br />
                  3. Vercel detecta Vite automáticamente. Haz clic en <strong>"Deploy"</strong>.
                </p>
              </div>

              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-black text-neutral-950">Render / Netlify</p>
                <p className="text-[11px] text-neutral-600">
                  1. Conecta tu GitHub a <strong>render.com</strong> o <strong>netlify.com</strong>.<br />
                  2. Build Command: <code className="bg-white px-1 font-mono">npm run build</code><br />
                  3. Publish Directory: <code className="bg-white px-1 font-mono">dist</code>
                </p>
              </div>
            </div>
          </div>

          {/* Step 4: Ejecución Local */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="text-base font-extrabold text-neutral-950">
                Opción C: Ejecución Local en tu Computadora desde el Clon de GitHub
              </h3>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed pl-9">
              Cualquier persona puede clonar el repositorio de GitHub y ejecutarlo en su entorno local con Node.js:
            </p>

            <div className="ml-9 relative bg-neutral-950 text-neutral-100 rounded-2xl p-4 font-mono text-xs overflow-x-auto">
              <button
                onClick={() => copyToClipboard(`git clone https://github.com/TU_USUARIO/snack-imperio-pos.git
cd snack-imperio-pos
npm install
npm run dev`, 'local-clone')}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-bold text-[11px] flex items-center gap-1.5 transition-colors"
              >
                {copiedCodeId === 'local-clone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeId === 'local-clone' ? '¡Copiado!' : 'Copiar Comandos'}</span>
              </button>
              <pre className="text-amber-300"># Clonar e iniciar servidor de desarrollo local:</pre>
              <pre className="text-emerald-400">git clone https://github.com/TU_USUARIO/snack-imperio-pos.git</pre>
              <pre>cd snack-imperio-pos</pre>
              <pre className="text-amber-400 font-bold">npm install</pre>
              <pre className="text-emerald-400 font-black">npm run dev</pre>
              <pre className="text-neutral-400"># Abre tu navegador en: http://localhost:3000</pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVO PRODUCTO */}
      {/* ========================================================================= */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-neutral-950 font-['Outfit']">
                  Agregar Nuevo Producto a Almacén &amp; Menú
                </h3>
              </div>
              <button
                onClick={() => setIsNewProductModalOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ej. Coca-Cola 500ml, Torta Selva Negra, Empanada..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Categoría</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="refrescos">Refrescos &amp; Gaseosas</option>
                    <option value="tortas">Tortas &amp; Postres</option>
                    <option value="empanadas">Empanadas</option>
                    <option value="hamburguesas">Hamburguesas</option>
                    <option value="jugos">Jugos Naturales</option>
                    <option value="calientes">Bebidas Calientes</option>
                    <option value="snacks">Snacks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Código / SKU</label>
                  <input
                    type="text"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                    placeholder="Ej. REF-COCA-500"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Precio Venta (Bs.)</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Costo (Bs.)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    value={newProdMinStock}
                    onChange={(e) => setNewProdMinStock(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Presentación / Unidad</label>
                <input
                  type="text"
                  value={newProdUnit}
                  onChange={(e) => setNewProdUnit(e.target.value)}
                  placeholder="Ej. botella 500ml, porción, unidad, 2 Litros..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={newProdDescription}
                  onChange={(e) => setNewProdDescription(e.target.value)}
                  placeholder="Detalles de preparación, ingredientes o sabor..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">URL de Imagen (Opcional)</label>
                <input
                  type="url"
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl text-xs shadow"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AJUSTE RÁPIDO DE STOCK */}
      {/* ========================================================================= */}
      {isAdjustModalOpen && selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-neutral-950 font-['Outfit']">
                  Ajuste de Existencias
                </h3>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteStockAdjust} className="space-y-3">
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                <p className="font-extrabold text-neutral-900 text-sm">{selectedProductForAdjust.name}</p>
                <p className="text-xs text-neutral-500 font-mono">
                  SKU: {selectedProductForAdjust.sku} &bull; Stock Actual: <strong>{selectedProductForAdjust.stock}</strong> {selectedProductForAdjust.unit}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Cantidad a Modificar (+ Entrada / - Salida):
                </label>
                <input
                  type="number"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseInt(e.target.value) || 0)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 font-mono font-black text-sm text-neutral-950 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                  Nuevo stock resultante: <strong>{Math.max(0, selectedProductForAdjust.stock + adjustDelta)}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Motivo del Ajuste:</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ej. Ingreso de mercadería, Merma, Conteo físico..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl text-xs shadow"
                >
                  Confirmar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVA SOLICITUD INTERNA */}
      {/* ========================================================================= */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-neutral-950 font-['Outfit']">
                  Nueva Solicitud a Almacén
                </h3>
              </div>
              <button
                onClick={() => setIsNewRequestModalOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Área Solicitante:</label>
                <select
                  value={requestArea}
                  onChange={(e) => setRequestArea(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-amber-500"
                >
                  <option value="Barra">Barra de Bebidas &amp; Refrescos</option>
                  <option value="Cocina">Cocina Principal (KDS)</option>
                  <option value="Mostrador">Mostrador / Caja</option>
                  <option value="Delivery">Despacho Delivery</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-700">Productos Solicitados:</label>
                  <button
                    type="button"
                    onClick={() => setRequestItemsList(prev => [...prev, { productId: products[0]?.id || '', quantity: 6, notes: '' }])}
                    className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1"
                  >
                    + Agregar Ítem
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {requestItemsList.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-neutral-50 p-2 rounded-xl border border-neutral-200">
                      <select
                        value={row.productId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRequestItemsList(prev => prev.map((it, i) => i === idx ? { ...it, productId: val } : it));
                        }}
                        className="flex-1 bg-white border border-neutral-300 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stock})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setRequestItemsList(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                        }}
                        className="w-16 text-center bg-white border border-neutral-300 rounded-lg px-1 py-1.5 text-xs font-mono font-bold"
                      />

                      {requestItemsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setRequestItemsList(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Notas de Urgencia / Detalle:</label>
                <input
                  type="text"
                  value={requestGeneralNotes}
                  onChange={(e) => setRequestGeneralNotes(e.target.value)}
                  placeholder="Ej. Reposición urgente para turno almuerzo..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl text-xs shadow"
                >
                  Enviar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVA COMPRA DE PROVEEDOR */}
      {/* ========================================================================= */}
      {isNewPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-neutral-950 font-['Outfit']">
                  Registrar Entrada de Mercadería / Proveedor
                </h3>
              </div>
              <button
                onClick={() => setIsNewPurchaseModalOpen(false)}
                className="p-1 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplierPurchase} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">N° Factura / Boleta</label>
                  <input
                    type="text"
                    required
                    value={purchaseInvoice}
                    onChange={(e) => setPurchaseInvoice(e.target.value)}
                    placeholder="Ej. FAC-00984"
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Nombre del Proveedor</label>
                  <input
                    type="text"
                    required
                    value={purchaseSupplier}
                    onChange={(e) => setPurchaseSupplier(e.target.value)}
                    placeholder="Distribuidora Coca-Cola, Panadería..."
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-700">Ítems Ingresados:</label>
                  <button
                    type="button"
                    onClick={() => setPurchaseItems(prev => [...prev, { productId: products[0]?.id || '', quantity: 24, unitCost: 3.50 }])}
                    className="text-xs text-amber-700 font-bold hover:underline flex items-center gap-1"
                  >
                    + Agregar Producto
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {purchaseItems.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-neutral-50 p-2 rounded-xl border border-neutral-200">
                      <select
                        value={row.productId}
                        onChange={(e) => {
                          const val = e.target.value;
                          const prod = products.find(p => p.id === val);
                          setPurchaseItems(prev => prev.map((it, i) => i === idx ? { ...it, productId: val, unitCost: prod?.cost || 3.00 } : it));
                        }}
                        className="flex-1 bg-white border border-neutral-300 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>

                      <div className="w-16">
                        <input
                          type="number"
                          min="1"
                          placeholder="Cant."
                          value={row.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setPurchaseItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                          }}
                          className="w-full text-center bg-white border border-neutral-300 rounded-lg px-1 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          step="0.10"
                          placeholder="Costo"
                          value={row.unitCost}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPurchaseItems(prev => prev.map((it, i) => i === idx ? { ...it, unitCost: val } : it));
                          }}
                          className="w-full text-center bg-white border border-neutral-300 rounded-lg px-1 py-1.5 text-xs font-mono font-bold"
                        />
                      </div>

                      {purchaseItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPurchaseItems(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-neutral-100 rounded-2xl flex items-center justify-between font-mono">
                <span className="text-xs font-bold text-neutral-600">Total Compra Calculado:</span>
                <span className="text-base font-black text-emerald-800">
                  Bs. {purchaseItems.reduce((sum, it) => sum + (it.quantity * it.unitCost), 0).toFixed(2)}
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPurchaseModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl text-xs shadow"
                >
                  Registrar e Incrementar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
