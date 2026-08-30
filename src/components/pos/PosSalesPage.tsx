import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCategory, Product, PaymentMethod, OrderType } from '../../types';
import {
  Search,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Calculator,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRightLeft,
  User,
  Hash,
  Sparkles,
  AlertCircle,
  FileCheck2,
  Receipt,
  MessageSquarePlus,
  CheckCircle2,
  Lock,
  Percent,
  X
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export const PosSalesPage: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    updateCartItemNotes,
    clearCart,
    cartSubtotal,
    cartTax,
    cartTotal,
    createOrder,
    cashSession,
    openCashSession,
    setCurrentPage,
    currentUser,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'todas'>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('mesa');
  const [tableNumber, setTableNumber] = useState('Mesa 1');
  const [customerName, setCustomerName] = useState('Cliente General');
  const [customerDoc, setCustomerDoc] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState('');

  // Item note modal
  const [editingItemNote, setEditingItemNote] = useState<{ productId: string; name: string; note: string } | null>(null);

  // Quick Open Cash Box Modal
  const [isOpenBoxModal, setIsOpenBoxModal] = useState(false);
  const [initialBoxAmount, setInitialBoxAmount] = useState('150.00');

  const finalTotal = Math.max(0, cartTotal - discountAmount);
  const changeToReturn = paymentMethod === 'efectivo' && cashReceived >= finalTotal ? cashReceived - finalTotal : 0;

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'todas' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleQuickCash = (amount: number) => {
    sounds.playClick();
    setCashReceived((prev) => prev + amount);
  };

  const handleExactCash = () => {
    sounds.playClick();
    setCashReceived(finalTotal);
  };

  const handleProcessSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!cashSession || cashSession.status === 'cerrada') {
      alert('La caja se encuentra cerrada. Por favor abra la caja para registrar transacciones de venta.');
      setIsOpenBoxModal(true);
      return;
    }

    if (paymentMethod === 'efectivo' && cashReceived < finalTotal) {
      alert(`El efectivo recibido (Bs. ${cashReceived.toFixed(2)}) es menor que el total de la venta (Bs. ${finalTotal.toFixed(2)}).`);
      return;
    }

    createOrder({
      type: orderType,
      tableNumber: orderType === 'mesa' ? tableNumber : undefined,
      customerName: customerName.trim() || 'Cliente General',
      customerDoc: customerDoc.trim() || undefined,
      paymentMethod,
      cashReceived: paymentMethod === 'efectivo' ? cashReceived : undefined,
      changeGiven: paymentMethod === 'efectivo' ? changeToReturn : undefined,
      discount: discountAmount,
      notes: orderNotes,
    });

    // Reset local form values
    setCashReceived(0);
    setDiscountAmount(0);
    setOrderNotes('');
  };

  const categories: { id: ProductCategory | 'todas'; label: string; icon: string }[] = [
    { id: 'todas', label: 'Todos', icon: '🍽️' },
    { id: 'refrescos', label: 'Refrescos / Bebidas', icon: '🥤' },
    { id: 'tortas', label: 'Tortas & Postres', icon: '🍰' },
    { id: 'empanadas', label: 'Empanadas', icon: '🥟' },
    { id: 'hamburguesas', label: 'Hamburguesas', icon: '🍔' },
    { id: 'jugos', label: 'Jugos', icon: '🍹' },
    { id: 'calientes', label: 'Calientes', icon: '☕' },
    { id: 'snacks', label: 'Snacks', icon: '🍟' },
  ];

  return (
    <div id="pos-sales-page" className="min-h-[calc(100vh-80px)] bg-neutral-50 text-neutral-900 p-3 sm:p-6">
      {/* Cash box status warning banner */}
      {(!cashSession || cashSession.status === 'cerrada') && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-3 text-rose-800 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>
              <strong>Atención:</strong> La caja registradora está <strong>CERRADA</strong>. Debes abrir un turno para procesar cobros y ventas.
            </span>
          </div>
          <button
            onClick={() => setIsOpenBoxModal(true)}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl whitespace-nowrap shadow transition-colors"
          >
            Abrir Caja Ahora
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
        {/* LEFT & CENTER: Product Catalog (7 columns on desktop) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-3.5 space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <button
                onClick={() => {
                  setSelectedCategory('todas');
                  setSearchQuery('');
                }}
                className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-xs text-neutral-700 font-bold transition-colors"
              >
                Limpiar
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {categories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
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

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock <= product.minStock && product.stock > 0;

                return (
                  <button
                    key={product.id}
                    id={`pos-product-${product.id}`}
                    onClick={() => {
                      if (!isOutOfStock) addToCart(product);
                    }}
                    disabled={isOutOfStock}
                    className={`group bg-white border rounded-2xl p-2.5 text-left transition-all relative overflow-hidden flex flex-col justify-between shadow-sm ${
                      isOutOfStock
                        ? 'border-neutral-200 opacity-40 cursor-not-allowed'
                        : 'border-neutral-200 hover:border-amber-500 hover:shadow-md active:scale-95'
                    }`}
                  >
                    <div className="relative h-24 w-full rounded-xl overflow-hidden mb-2 bg-neutral-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-1.5 right-1.5 bg-neutral-950/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-amber-400 font-black text-xs font-mono">
                        Bs. {product.price.toFixed(2)}
                      </div>
                      {isLowStock && (
                        <div className="absolute bottom-1 left-1 bg-amber-500 text-neutral-950 text-[9px] font-black px-1.5 py-0.2 rounded">
                          Stock: {product.stock}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-neutral-900 group-hover:text-amber-600 line-clamp-1">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                      <span>{product.sku}</span>
                      <span className="text-amber-600 group-hover:underline flex items-center gap-0.5 font-bold">
                        <Plus className="w-3 h-3" /> Añadir
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Order Cart & Cash Calculator (5 columns on desktop) */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-lg text-neutral-900">
          {/* Cart Header */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-neutral-900">Orden de Venta Actual</h3>
                  <p className="text-[10px] text-neutral-500">Atiende: {currentUser ? currentUser.name : 'Cajero'}</p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-rose-600 transition-colors font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Vaciar
                </button>
              )}
            </div>

            {/* Order Type & Table Selector */}
            <div className="grid grid-cols-2 gap-2 my-3">
              <button
                type="button"
                onClick={() => setOrderType('mesa')}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  orderType === 'mesa'
                    ? 'bg-amber-500 text-neutral-950 border-amber-500 font-extrabold'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                }`}
              >
                🍽️ En Mesa
              </button>
              <button
                type="button"
                onClick={() => setOrderType('llevar')}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  orderType === 'llevar'
                    ? 'bg-amber-500 text-neutral-950 border-amber-500 font-extrabold'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                }`}
              >
                🛍️ Para Llevar
              </button>
            </div>

            {/* Table & Customer Row */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              {orderType === 'mesa' && (
                <div>
                  <label className="text-[10px] text-neutral-600 block mb-0.5 font-bold">Mesa Asignada</label>
                  <select
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-1.5 text-xs text-neutral-900 font-medium"
                  >
                    <option value="Mesa 1">Mesa 1</option>
                    <option value="Mesa 2">Mesa 2</option>
                    <option value="Mesa 3">Mesa 3</option>
                    <option value="Mesa 4">Mesa 4</option>
                    <option value="Mesa 5">Mesa 5</option>
                    <option value="Barra 1">Barra 1</option>
                  </select>
                </div>
              )}

              <div className={orderType === 'llevar' ? 'col-span-2' : ''}>
                <label className="text-[10px] text-neutral-600 block mb-0.5 font-bold">Cliente / DNI (Opcional)</label>
                <input
                  type="text"
                  placeholder="Nombre o DNI..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-2.5 py-1.5 text-xs text-neutral-900 font-medium"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="max-h-48 overflow-y-auto divide-y divide-neutral-100 border-y border-neutral-200 my-2 pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-neutral-400">
                  <Receipt className="w-8 h-8 mx-auto mb-1.5 opacity-30 text-neutral-500" />
                  <p className="text-xs">No hay productos en la orden</p>
                  <p className="text-[10px] text-neutral-500">Haz clic en los productos del menú para agregar</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="py-2 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-neutral-900 truncate">{item.productName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                        <span>Bs. {item.price.toFixed(2)}</span>
                        {item.notes ? (
                          <span className="text-amber-600 italic">({item.notes})</span>
                        ) : (
                          <button
                            onClick={() =>
                              setEditingItemNote({
                                productId: item.productId,
                                name: item.productName,
                                note: item.notes || '',
                              })
                            }
                            className="text-neutral-400 hover:text-amber-600 flex items-center gap-0.5"
                          >
                            <MessageSquarePlus className="w-3 h-3" /> +Nota
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-neutral-100 border border-neutral-300 rounded-lg p-0.5">
                        <button
                          onClick={() => updateCartItemQuantity(item.productId, item.quantity - 1)}
                          className="p-1 hover:bg-neutral-200 rounded text-neutral-700"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold font-mono text-amber-600">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(item.productId, item.quantity + 1)}
                          className="p-1 hover:bg-neutral-200 rounded text-neutral-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-bold text-xs font-mono w-16 text-right text-neutral-900">
                        Bs. {item.subtotal.toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-neutral-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CALCULATOR & PAYMENT SECTION */}
          <div className="space-y-3 pt-2">
            {/* Payment Method Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block mb-1.5">
                Método de Pago:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
                  { id: 'tarjeta', label: 'Tarjeta POS', icon: CreditCard },
                  { id: 'qr', label: 'QR Billetera', icon: QrCode },
                  { id: 'transferencia', label: 'Transf.', icon: ArrowRightLeft },
                ].map((pm) => {
                  const active = paymentMethod === pm.id;
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setPaymentMethod(pm.id as PaymentMethod);
                      }}
                      className={`p-2 rounded-xl text-center text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                        active
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-md font-extrabold'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] leading-none">{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Tender / Change Calculator if Efectivo is chosen */}
            {paymentMethod === 'efectivo' && (
              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 font-bold flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5 text-amber-600" /> Calculadora de Efectivo:
                  </span>
                  <button
                    type="button"
                    onClick={handleExactCash}
                    className="text-[11px] text-amber-700 hover:underline font-bold"
                  >
                    Exacto (Bs. {finalTotal.toFixed(2)})
                  </button>
                </div>

                {/* Quick denomination pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[10, 20, 50, 100, 200].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      onClick={() => handleQuickCash(bill)}
                      className="px-2.5 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg text-xs font-bold font-mono text-neutral-800 shadow-sm"
                    >
                      +Bs. {bill}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashReceived(0)}
                    className="px-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg text-[10px] text-neutral-600"
                  >
                    Cero
                  </button>
                </div>

                {/* Cash received input & Live change result */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-neutral-600 font-bold block mb-0.5">Efectivo Recibido</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500 font-mono">Bs.</span>
                      <input
                        type="number"
                        step="0.5"
                        value={cashReceived === 0 ? '' : cashReceived}
                        onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full bg-white border border-neutral-300 rounded-xl pl-8 pr-2 py-1.5 text-sm font-bold font-mono text-neutral-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex flex-col justify-center text-right">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Vuelto (Cambio):</span>
                    <span className="text-base font-extrabold text-emerald-700 font-mono">
                      Bs. {changeToReturn.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Totals Breakdown */}
            <div className="space-y-1 text-xs pt-1 border-t border-neutral-200 font-mono">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span>Bs. {cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>I.G.V. (18%):</span>
                <span>Bs. {cartTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-black text-neutral-900 pt-1 border-t border-neutral-200">
                <span>TOTAL A COBRAR:</span>
                <span className="text-amber-600">Bs. {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              id="btn-process-sale"
              onClick={handleProcessSale}
              disabled={cart.length === 0}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all ${
                cart.length === 0
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-950 shadow-amber-500/20 active:scale-[0.99]'
              }`}
            >
              <FileCheck2 className="w-5 h-5" />
              <span>Cobrar &amp; Emitir Factura (Bs. {finalTotal.toFixed(2)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Item Note Modal */}
      {editingItemNote && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-xl">
            <h4 className="font-bold text-sm text-neutral-900">
              Nota especial: {editingItemNote.name}
            </h4>
            <input
              type="text"
              placeholder="Ej. Sin cebolla, extra queso, bien caliente..."
              value={editingItemNote.note}
              onChange={(e) => setEditingItemNote({ ...editingItemNote, note: e.target.value })}
              className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 font-medium"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingItemNote(null)}
                className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  updateCartItemNotes(editingItemNote.productId, editingItemNote.note);
                  setEditingItemNote(null);
                }}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs"
              >
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Open Box Modal */}
      {isOpenBoxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-neutral-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900">Apertura de Caja Registradora</h3>
                <p className="text-xs text-neutral-500">Ingresa el fondo inicial de efectivo para este turno</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Monto Inicial en Efectivo (Bs.)</label>
              <input
                type="number"
                step="10"
                value={initialBoxAmount}
                onChange={(e) => setInitialBoxAmount(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 text-lg font-bold font-mono text-amber-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsOpenBoxModal(false)}
                className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const amt = parseFloat(initialBoxAmount) || 0;
                  openCashSession(amt, 'Apertura de turno desde POS');
                  setIsOpenBoxModal(false);
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20"
              >
                Abrir Caja con Bs. {parseFloat(initialBoxAmount || '0').toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
