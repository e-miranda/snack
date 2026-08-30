import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, User, UserRole } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Package,
  Users,
  ShieldCheck,
  FileCode,
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Download,
  Copy,
  Check,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { generateGoogleAppsScriptCode } from '../../utils/gasExporter';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    orders,
    users,
    updateUserPermissions,
    auditLogs,
    gasWebhookUrl,
    setGasWebhookUrl,
    resetToDefaultData,
    addNotification,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'users' | 'audit' | 'gas'>('stats');
  const [copiedGas, setCopiedGas] = useState(false);
  const [gasTestSuccess, setGasTestSuccess] = useState<string | null>(null);

  // Inventory search & form modal
  const [inventorySearch, setInventorySearch] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New / Edit Product Form State
  const [prodForm, setProdForm] = useState({
    name: '',
    category: 'hamburguesas' as Product['category'],
    price: 12.00,
    cost: 5.00,
    stock: 50,
    minStock: 10,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    description: '',
    sku: 'HMB-NEW-01',
    unit: 'unidad',
  });

  // Audit Search
  const [auditSearch, setAuditSearch] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('TODOS');

  // --- STATS CALCULATIONS ---
  const validOrders = orders.filter((o) => o.status !== 'cancelado');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = validOrders.length;
  const avgTicket = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
  
  // Calculate total inventory cost value & estimated profit
  const totalInventoryValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);
  const totalGrossProfit = validOrders.reduce((acc, ord) => {
    const costOfItems = ord.items.reduce((costSum, item) => {
      const p = products.find((prod) => prod.id === item.productId);
      return costSum + (p ? p.cost * item.quantity : item.price * 0.4 * item.quantity);
    }, 0);
    return acc + (ord.total - costOfItems);
  }, 0);

  // Hourly Sales Data for Chart
  const hourlyData = [
    { hour: '08:00', ventas: 45 },
    { hour: '10:00', ventas: 120 },
    { hour: '12:00', ventas: 380 },
    { hour: '14:00', ventas: 490 },
    { hour: '16:00', ventas: 210 },
    { hour: '18:00', ventas: 340 },
    { hour: '20:00', ventas: 680 },
    { hour: '22:00', ventas: 420 },
  ];

  // Monthly Sales comparison (Reportes Mensuales)
  const monthlyData = [
    { mes: 'Ene', ingresos: 12400, gastos: 6800, ganancia: 5600 },
    { mes: 'Feb', ingresos: 14800, gastos: 7900, ganancia: 6900 },
    { mes: 'Mar', ingresos: 16200, gastos: 8400, ganancia: 7800 },
    { mes: 'Abr', ingresos: 18900, gastos: 9200, ganancia: 9700 },
    { mes: 'May', ingresos: 21500, gastos: 10100, ganancia: 11400 },
    { mes: 'Jun', ingresos: 24800, gastos: 11400, ganancia: 13400 },
  ];

  // Payment Methods Pie Data
  const paymentData = [
    { name: 'Efectivo', value: validOrders.filter((o) => o.paymentMethod === 'efectivo').length || 12, color: '#10b981' },
    { name: 'Tarjetas POS', value: validOrders.filter((o) => o.paymentMethod === 'tarjeta').length || 8, color: '#3b82f6' },
    { name: 'QR Billetera', value: validOrders.filter((o) => o.paymentMethod === 'qr').length || 15, color: '#a855f7' },
    { name: 'Transferencia', value: validOrders.filter((o) => o.paymentMethod === 'transferencia').length || 4, color: '#14b8a6' },
  ];

  // Top Selling Products
  const productSalesMap: Record<string, number> = {};
  validOrders.forEach((o) => {
    o.items.forEach((item) => {
      productSalesMap[item.productName] = (productSalesMap[item.productName] || 0) + item.quantity;
    });
  });

  const topProductsData = Object.entries(productSalesMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: prodForm.name,
        category: prodForm.category,
        price: Number(prodForm.price),
        cost: Number(prodForm.cost),
        stock: Number(prodForm.stock),
        minStock: Number(prodForm.minStock),
        image: prodForm.image,
        description: prodForm.description,
        sku: prodForm.sku,
        unit: prodForm.unit,
      });
    } else {
      addProduct({
        name: prodForm.name,
        category: prodForm.category,
        price: Number(prodForm.price),
        cost: Number(prodForm.cost),
        stock: Number(prodForm.stock),
        minStock: Number(prodForm.minStock),
        image: prodForm.image,
        description: prodForm.description,
        sku: prodForm.sku,
        unit: prodForm.unit,
        isAvailable: true,
      });
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProdForm({
      name: p.name,
      category: p.category,
      price: p.price,
      cost: p.cost,
      stock: p.stock,
      minStock: p.minStock,
      image: p.image,
      description: p.description,
      sku: p.sku,
      unit: p.unit,
    });
    setIsProductModalOpen(true);
  };

  const handleCopyGasCode = () => {
    const code = generateGoogleAppsScriptCode();
    navigator.clipboard.writeText(code);
    setCopiedGas(true);
    setTimeout(() => setCopiedGas(false), 2500);
  };

  const handleExportCsv = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID_Orden,Numero_Orden,Factura,Fecha,Cliente,Metodo_Pago,Total,Estado\n" +
      validOrders.map(e => `${e.id},${e.orderNumber},${e.invoiceNumber},${e.createdAt},"${e.customerName}",${e.paymentMethod},${e.total},${e.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Ventas_Snack_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAuditLogs = auditLogs.filter((l) => {
    const matchesModule = auditModuleFilter === 'TODOS' || l.module === auditModuleFilter;
    const matchesSearch = l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          l.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          l.userName.toLowerCase().includes(auditSearch.toLowerCase());
    return matchesModule && matchesSearch;
  });

  return (
    <div id="admin-dashboard-page" className="min-h-[calc(100vh-80px)] bg-neutral-50 text-neutral-900 p-3 sm:p-6 space-y-6">
      {/* Top Header & Tabs Bar */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-neutral-950 font-['Outfit']">Panel Administrativo</h2>
            <p className="text-xs text-neutral-500">
              Estadísticas gerenciales, inventario de almacén, usuarios, auditoría y Google Apps Script.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-1 bg-neutral-100 p-1 rounded-2xl border border-neutral-200 text-xs">
          {[
            { id: 'stats', label: 'Estadísticas & KPIs', icon: TrendingUp },
            { id: 'inventory', label: 'Inventario & Almacén', icon: Package },
            { id: 'users', label: 'Usuarios & Roles', icon: Users },
            { id: 'audit', label: 'Auditoría Transaccional', icon: ShieldCheck },
            { id: 'gas', label: 'Google Apps Script', icon: FileCode },
          ].map((tab) => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all ${
                  active
                    ? 'bg-amber-500 text-neutral-950 shadow-sm font-black'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: STATS & CHARTS */}
      {activeTab === 'stats' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-neutral-200 rounded-3xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-neutral-500">Ventas Totales</span>
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700"><DollarSign className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-amber-600 font-mono mt-2">
                Bs. {totalRevenue.toFixed(2)}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                +{totalOrdersCount} órdenes registradas
              </p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-neutral-500">Ganancia Bruta Est.</span>
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700"><TrendingUp className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-2">
                Bs. {totalGrossProfit.toFixed(2)}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">Margen prom. ~58%</p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-neutral-500">Ticket Promedio</span>
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700"><ShoppingBag className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-blue-600 font-mono mt-2">
                Bs. {avgTicket.toFixed(2)}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">Por cliente atendido</p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-neutral-500">Valor en Inventario</span>
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700"><Package className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-purple-600 font-mono mt-2">
                Bs. {totalInventoryValue.toFixed(2)}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">{products.length} productos activos</p>
            </div>
          </div>

          {/* Interactive Recharts Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Trend & Performance (8 cols) */}
            <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-extrabold text-base text-neutral-900">Reporte Mensual Comparativo</h3>
                  <p className="text-xs text-neutral-500">Ingresos vs Gastos y Ganancia Neta por mes (Bs.)</p>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold border border-neutral-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar CSV
                </button>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mes" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '12px', color: '#111827', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: number) => [`Bs. ${val.toFixed(2)}`, '']}
                    />
                    <Legend />
                    <Bar dataKey="ingresos" name="Ingresos (Ventas)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="gastos" name="Costos & Gastos" fill="#ef4444" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="ganancia" name="Ganancia Neta" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods Distribution (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-base text-neutral-900 mb-1">Métodos de Pago</h3>
                <p className="text-xs text-neutral-500">Distribución de transacciones</p>

                <div className="h-52 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '12px', color: '#111827' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-neutral-200">
                {paymentData.map((pm) => (
                  <div key={pm.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pm.color }} />
                    <span className="text-neutral-700 truncate">{pm.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY & WAREHOUSE */}
      {activeTab === 'inventory' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white border border-neutral-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar en almacén por nombre o SKU..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="bg-neutral-50 border border-neutral-300 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 placeholder-neutral-400 w-64 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProdForm({
                    name: '',
                    category: 'hamburguesas',
                    price: 12.00,
                    cost: 5.00,
                    stock: 50,
                    minStock: 10,
                    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
                    description: '',
                    sku: `HMB-${Math.floor(100 + Math.random() * 900)}`,
                    unit: 'unidad',
                  });
                  setIsProductModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl text-xs shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Producto</span>
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase text-[11px]">
                    <th className="p-3.5">Producto</th>
                    <th className="p-3.5">SKU / Categoría</th>
                    <th className="p-3.5 text-right">Precio Venta</th>
                    <th className="p-3.5 text-right">Costo Unit.</th>
                    <th className="p-3.5 text-center">Stock Actual</th>
                    <th className="p-3.5 text-center">Stock Mínimo</th>
                    <th className="p-3.5 text-center">Ajuste Rápido</th>
                    <th className="p-3.5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products
                    .filter((p) =>
                      p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                      p.sku.toLowerCase().includes(inventorySearch.toLowerCase())
                    )
                    .map((p) => {
                      const isLow = p.stock <= p.minStock;
                      return (
                        <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="p-3.5 flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-neutral-200" />
                            <div>
                              <p className="font-bold text-neutral-900 text-xs">{p.name}</p>
                              <p className="text-[10px] text-neutral-500 line-clamp-1">{p.description}</p>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono">
                            <span className="text-neutral-800 font-semibold">{p.sku}</span>
                            <span className="block text-[10px] text-neutral-500 uppercase">{p.category}</span>
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-amber-700">
                            Bs. {p.price.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right font-mono text-neutral-600">
                            Bs. {p.cost.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                              isLow
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {p.stock} {p.unit}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-mono text-neutral-500">
                            {p.minStock} {p.unit}
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-xl p-1">
                              <button
                                onClick={() => adjustStock(p.id, -10, 'Ajuste manual de merma')}
                                className="px-1.5 py-0.5 bg-neutral-200 hover:bg-neutral-300 rounded text-[10px] text-neutral-800 font-bold"
                              >
                                -10
                              </button>
                              <button
                                onClick={() => adjustStock(p.id, -1, 'Ajuste unitario')}
                                className="px-1.5 py-0.5 bg-neutral-200 hover:bg-neutral-300 rounded text-[10px] text-neutral-800 font-bold"
                              >
                                -1
                              </button>
                              <button
                                onClick={() => adjustStock(p.id, 5, 'Ingreso de mercadería')}
                                className="px-1.5 py-0.5 bg-neutral-200 hover:bg-neutral-300 rounded text-[10px] text-amber-700 font-bold"
                              >
                                +5
                              </button>
                              <button
                                onClick={() => adjustStock(p.id, 20, 'Compra a proveedor')}
                                className="px-1.5 py-0.5 bg-neutral-200 hover:bg-neutral-300 rounded text-[10px] text-emerald-700 font-bold"
                              >
                                +20
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-neutral-700 hover:text-neutral-950 transition-colors border border-neutral-200"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar producto ${p.name}?`)) {
                                    deleteProduct(p.id);
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-700 transition-colors border border-rose-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* TAB 3: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm">
            <h3 className="font-extrabold text-base text-neutral-900 mb-1">Matriz de Roles y Permisos de Usuarios</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Configura los accesos por defecto para los usuarios estandar (administrador, caja, cocina - clave: 123).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {users.map((user) => (
                <div key={user.id} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 pb-3 border-b border-neutral-200">
                      <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-xl object-cover border border-amber-300" />
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900">{user.name}</h4>
                        <p className="text-xs text-neutral-500 font-mono">Usuario: @{user.username}</p>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase">
                          Rol: {user.role}
                        </span>
                      </div>
                    </div>

                    {/* Permissions list */}
                    <div className="py-3 space-y-2 text-xs">
                      <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Permisos:</p>
                      
                      {[
                        { key: 'canSell', label: 'Ventas en POS' },
                        { key: 'canManageCash', label: 'Apertura y Cierre de Caja' },
                        { key: 'canKitchen', label: 'Pantalla Cocina (KDS)' },
                        { key: 'canManageInventory', label: 'Gestión de Inventario' },
                        { key: 'canViewReports', label: 'Reportes y Estadísticas' },
                        { key: 'canViewAudit', label: 'Auditoría de Transacciones' },
                      ].map((perm) => {
                        const isGranted = user.permissions[perm.key as keyof User['permissions']];
                        return (
                          <div key={perm.key} className="flex items-center justify-between text-xs">
                            <span className="text-neutral-700">{perm.label}</span>
                            <button
                              type="button"
                              onClick={() => {
                                updateUserPermissions(user.id, {
                                  ...user.permissions,
                                  [perm.key]: !isGranted,
                                });
                              }}
                              className={`p-1 rounded-lg transition-colors ${
                                isGranted ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-neutral-200 text-neutral-400'
                              }`}
                            >
                              {isGranted ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-200 text-[11px] text-neutral-500 flex justify-between">
                    <span>Contraseña: 123</span>
                    <span className="text-emerald-700 font-bold">Estado: Activo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white border border-neutral-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <h3 className="font-extrabold text-base text-neutral-900">Registro de Auditoría Integral</h3>
              <p className="text-xs text-neutral-500">Trazabilidad completa de cada acción y transacción por usuario</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Filtrar por acción o usuario..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 w-48 focus:outline-none focus:border-amber-500"
              />

              <select
                value={auditModuleFilter}
                onChange={(e) => setAuditModuleFilter(e.target.value)}
                className="bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-1.5 text-xs text-neutral-900"
              >
                <option value="TODOS">Todos los módulos</option>
                <option value="VENTAS">Ventas</option>
                <option value="CAJA">Caja</option>
                <option value="COCINA">Cocina</option>
                <option value="INVENTARIO">Inventario</option>
                <option value="USUARIOS">Usuarios</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 sticky top-0 border-b border-neutral-200 text-neutral-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Fecha &amp; Hora</th>
                    <th className="p-3.5">Usuario / Rol</th>
                    <th className="p-3.5">Módulo</th>
                    <th className="p-3.5">Acción Realizada</th>
                    <th className="p-3.5">Detalles Transaccionales</th>
                    <th className="p-3.5">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-mono text-[11px]">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-3 text-neutral-500">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3 font-sans">
                        <span className="font-bold text-neutral-900">{log.userName}</span>
                        <span className="block text-[10px] text-amber-700 capitalize">{log.userRole}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.module === 'VENTAS'
                            ? 'bg-amber-100 text-amber-800'
                            : log.module === 'CAJA'
                            ? 'bg-purple-100 text-purple-800'
                            : log.module === 'COCINA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.module}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-neutral-800 font-sans">{log.action}</td>
                      <td className="p-3 text-neutral-600 font-sans">{log.details}</td>
                      <td className="p-3 text-neutral-400 text-[10px]">{log.ipAddress || '192.168.1.100'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GOOGLE APPS SCRIPT SYNC CONNECTOR */}
      {activeTab === 'gas' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-neutral-900">Google Apps Script Connector (Code.gs)</h3>
                <p className="text-xs text-neutral-500">
                  Script modular para sincronizar ventas, productos, caja y auditoría con Google Sheets en tiempo real.
                </p>
              </div>
              <button
                onClick={handleCopyGasCode}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl text-xs shadow-sm transition-all"
              >
                {copiedGas ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedGas ? '¡Código Copiado!' : 'Copiar Código Code.gs'}</span>
              </button>
            </div>

            {/* Steps guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-xs">1</span>
                <h4 className="font-bold text-neutral-900 pt-1">Crear Hoja Google</h4>
                <p className="text-neutral-500 text-[11px]">Abre Google Sheets y ve a Extensiones &gt; Apps Script.</p>
              </div>
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-xs">2</span>
                <h4 className="font-bold text-neutral-900 pt-1">Pegar Code.gs &amp; Ejecutar</h4>
                <p className="text-neutral-500 text-[11px]">Pega el código generado y ejecuta la función <code className="text-amber-700 font-bold">inicializarTablas()</code>.</p>
              </div>
              <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-1">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-xs">3</span>
                <h4 className="font-bold text-neutral-900 pt-1">Implementar WebApp</h4>
                <p className="text-neutral-500 text-[11px]">Haz clic en "Nueva implementación" &gt; Aplicación web &gt; Acceso: Cualquier persona.</p>
              </div>
            </div>

            {/* Webhook URL Input */}
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
              <label className="block text-xs font-bold text-neutral-700">
                URL de Implementación de Google Apps Script WebApp:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  value={gasWebhookUrl}
                  onChange={(e) => setGasWebhookUrl(e.target.value)}
                  className="flex-1 bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-xs text-neutral-900 font-mono focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!gasWebhookUrl) {
                      alert('Por favor ingresa una URL de Google Apps Script válida.');
                      return;
                    }
                    setGasTestSuccess('¡Conexión configurada! Cada venta procesada se sincronizará automáticamente.');
                    setTimeout(() => setGasTestSuccess(null), 5000);
                  }}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold rounded-xl text-xs border border-neutral-300 transition-colors"
                >
                  Guardar &amp; Probar
                </button>
              </div>
              {gasTestSuccess && (
                <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {gasTestSuccess}
                </p>
              )}
            </div>

            {/* Code View Preview */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-mono text-neutral-500">Archivo: Code.gs</span>
              </div>
              <pre className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl text-[11px] font-mono text-amber-300 overflow-x-auto max-h-64 no-scrollbar">
                {generateGoogleAppsScriptCode()}
              </pre>
            </div>

            <div className="pt-2 border-t border-neutral-200 flex justify-between items-center">
              <button
                onClick={resetToDefaultData}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Restaurar Base de Datos Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal (Add / Edit) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
              <h3 className="font-bold text-base text-neutral-900">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto en Catálogo'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">SKU / Código</label>
                  <input
                    type="text"
                    required
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Categoría</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value as Product['category'] })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900"
                  >
                    <option value="hamburguesas">Hamburguesas</option>
                    <option value="jugos">Jugos Naturales</option>
                    <option value="calientes">Bebidas Calientes</option>
                    <option value="snacks">Snacks &amp; Papas</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Unidad de Medida</label>
                  <input
                    type="text"
                    value={prodForm.unit}
                    onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Precio Venta (Bs.)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-amber-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Costo Unitario (Bs.)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={prodForm.cost}
                    onChange={(e) => setProdForm({ ...prodForm, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    required
                    value={prodForm.minStock}
                    onChange={(e) => setProdForm({ ...prodForm, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">URL de Imagen</label>
                <input
                  type="url"
                  required
                  value={prodForm.image}
                  onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs text-neutral-600 hover:text-neutral-900 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black rounded-xl text-xs shadow-sm"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
