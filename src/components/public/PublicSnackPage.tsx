import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCategory, Product, OrderItem } from '../../types';
import {
  UtensilsCrossed,
  Sparkles,
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  Flame,
  Coffee,
  Plus,
  Minus,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  ArrowRight,
  ShieldCheck,
  Send,
  X,
  CreditCard,
  QrCode
} from 'lucide-react';

const HERO_SLIDES = [
  {
    title: 'Hamburguesas Artesanales 100% Carne de Res',
    subtitle: 'Preparadas al instante en pan brioche con queso fundido y salsas caseras.',
    tag: 'Especialidad de la Casa',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=80',
    badge: 'Hamburguesa Doble Bs. 18.50',
  },
  {
    title: 'Gaseosas Heladas, Tortas & Empanadas Caseras',
    subtitle: 'Coca-Cola, Pepsi, Fanta heladas, tortas húmedas de chocolate y empanadas horneadas.',
    tag: 'Almacén & Snack',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=1200&auto=format&fit=crop&q=80',
    badge: 'Empanada Suprema Bs. 6.00',
  },
  {
    title: 'Jugos Naturales & Batidos Tropicales',
    subtitle: 'Frutas seleccionadas frescas: Plátano de seda, Papaya andina y combinaciones refrescantes.',
    tag: '100% Natural',
    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=1200&auto=format&fit=crop&q=80',
    badge: 'Jugo de Plátano Bs. 7.00',
  },
  {
    title: 'Bebidas Calientes, Café de Altura e Infusiones',
    subtitle: 'El mejor aroma con café pasado, mate digestivo tradicional y té clásico de selección.',
    tag: 'Calientitos del Día',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&auto=format&fit=crop&q=80',
    badge: 'Café Pasado Bs. 5.00',
  },
];

export const PublicSnackPage: React.FC = () => {
  const {
    products,
    setCurrentPage,
    currentUser,
    login,
    switchUser,
    createOrder,
  } = useApp();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'todas'>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Public Client Cart (Customer Ordering Online)
  const [clientCart, setClientCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<'mesa' | 'llevar'>('mesa');
  const [tableNumber, setTableNumber] = useState('Mesa 1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');

  // Login Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [pinInput, setPinInput] = useState('123');
  const [loginError, setLoginError] = useState('');

  // Hero carousel auto-timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'todas' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch && p.isAvailable;
  });

  const addToClientCart = (product: Product) => {
    setClientCart((prev) => {
      const exists = prev.find((it) => it.productId === product.id);
      if (exists) {
        return prev.map((it) =>
          it.productId === product.id
            ? { ...it, quantity: it.quantity + 1, subtotal: (it.quantity + 1) * it.price }
            : it
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          subtotal: product.price,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const updateClientQuantity = (productId: string, delta: number) => {
    setClientCart((prev) => {
      return prev
        .map((it) => {
          if (it.productId === productId) {
            const nextQty = it.quantity + delta;
            return nextQty > 0 ? { ...it, quantity: nextQty, subtotal: nextQty * it.price } : null;
          }
          return it;
        })
        .filter(Boolean) as OrderItem[];
    });
  };

  const clientCartTotal = clientCart.reduce((sum, it) => sum + it.subtotal, 0);

  const handleSendOnlineOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientCart.length === 0) return;

    const newOrder = createOrder({
      type: orderType,
      tableNumber: orderType === 'mesa' ? tableNumber : undefined,
      customerName: customerName.trim() || 'Cliente Web',
      customerPhone: customerPhone.trim(),
      paymentMethod: 'efectivo',
      items: clientCart,
      notes: orderNotes,
    });

    setClientCart([]);
    setIsCartOpen(false);
    setOrderSuccessMsg(`¡Orden #${newOrder.orderNumber} recibida con éxito! Tu pedido ya está en cocina.`);
    setTimeout(() => setOrderSuccessMsg(''), 8000);
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(usernameInput, pinInput);
    if (success) {
      setIsLoginModalOpen(false);
      setLoginError('');
      // Navigate to corresponding screen
      if (usernameInput === 'cocina') {
        setCurrentPage('kitchen');
      } else if (usernameInput === 'caja') {
        setCurrentPage('pos');
      } else {
        setCurrentPage('admin');
      }
    } else {
      setLoginError('Credenciales incorrectas. Verifique usuario o contraseña (123)');
    }
  };

  const categories: { id: ProductCategory | 'todas'; label: string; icon: string }[] = [
    { id: 'todas', label: 'Todo el Menú', icon: '✨' },
    { id: 'refrescos', label: 'Refrescos & Gaseosas', icon: '🥤' },
    { id: 'tortas', label: 'Tortas & Postres', icon: '🍰' },
    { id: 'empanadas', label: 'Empanadas', icon: '🥟' },
    { id: 'hamburguesas', label: 'Hamburguesas', icon: '🍔' },
    { id: 'jugos', label: 'Jugos Naturales', icon: '🍹' },
    { id: 'calientes', label: 'Bebidas Calientes', icon: '☕' },
    { id: 'snacks', label: 'Snacks & Papas', icon: '🍟' },
  ];

  return (
    <div id="public-snack-page" className="min-h-screen bg-neutral-50 text-neutral-900 pb-20">
      {/* Top Banner Alert if Order was sent */}
      {orderSuccessMsg && (
        <div className="bg-amber-500 text-neutral-950 px-4 py-3 text-center font-extrabold text-sm sticky top-16 sm:top-20 z-30 shadow-md flex items-center justify-center gap-2 animate-in slide-in-from-top">
          <Sparkles className="w-5 h-5" />
          <span>{orderSuccessMsg}</span>
          <button onClick={() => setOrderSuccessMsg('')} className="ml-4 p-1 hover:bg-amber-600 rounded text-neutral-950">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hero Carousel Section */}
      <section className="relative h-[480px] sm:h-[540px] overflow-hidden bg-neutral-950">
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image with Dark Gradient Overlays */}
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover transform scale-105 transition-transform duration-10000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-neutral-950/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/40 to-transparent" />

            {/* Slide Content */}
            <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16 z-20">
              <div className="max-w-2xl space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500 text-neutral-950 text-xs font-black uppercase tracking-wider shadow">
                  <Flame className="w-3.5 h-3.5 text-neutral-950" />
                  <span>{slide.tag}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-['Outfit'] tracking-tight leading-tight">
                  {slide.title}
                </h1>

                <p className="text-sm sm:text-base text-neutral-200 leading-relaxed font-medium">
                  {slide.subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#menu-section"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-black text-sm shadow-xl shadow-amber-500/30 transition-all transform hover:-translate-y-0.5"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Realizar Pedido Online</span>
                  </a>

                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/30 text-sm font-bold backdrop-blur-md transition-colors"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Acceso al Sistema Web</span>
                  </button>

                  <div className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-700 text-amber-400 font-mono font-bold text-xs">
                    {slide.badge}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Navigation Dots & Arrows */}
        <div className="absolute bottom-4 right-4 sm:right-8 z-30 flex items-center gap-2">
          <button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
            className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700/60 backdrop-blur-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1.5 px-2">
            {HERO_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentSlide ? 'bg-amber-400 w-6' : 'bg-neutral-600'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700/60 backdrop-blur-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Info Highlights Bar */}
      <section className="bg-white border-y border-neutral-200 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-neutral-900">Atención Rápida</p>
              <p className="text-neutral-500 text-[11px]">8:00 AM - 11:00 PM</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-neutral-900">En Salón y Llevar</p>
              <p className="text-neutral-500 text-[11px]">Mesas cómodas con Wifi</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-neutral-900">Pagos Múltiples</p>
              <p className="text-neutral-500 text-[11px]">Efectivo, Tarjetas, QR</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-neutral-900">Factura Automática</p>
              <p className="text-neutral-500 text-[11px]">Comprobante al instante</p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu & Products Section */}
      <section id="menu-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold mb-2">
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
              <span>Nuestra Carta Digital</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 font-['Outfit']">
              Deliciosas Opciones para Cada Momento
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1 font-medium">
              Selecciona tus platos favoritos y envíalos directamente a cocina.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Buscar hamburguesa, jugo, café..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-300 rounded-xl px-4 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm font-medium"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-6 no-scrollbar">
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-extrabold'
                    : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 shadow-sm'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filteredProducts.map((product) => {
            const inCart = clientCart.find((it) => it.productId === product.id);

            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden hover:border-amber-400 transition-all flex flex-col group hover:shadow-xl shadow-sm"
              >
                {/* Product Image */}
                <div className="relative h-44 overflow-hidden bg-neutral-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-neutral-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-neutral-800 text-amber-400 font-extrabold font-mono text-sm shadow">
                    Bs. {product.price.toFixed(2)}
                  </div>
                  <div className="absolute bottom-2 left-3 px-2 py-0.5 rounded bg-white/95 text-[10px] uppercase font-extrabold text-neutral-800 border border-neutral-200 shadow-sm">
                    {product.category}
                  </div>
                </div>

                {/* Info & Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-neutral-900 group-hover:text-amber-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-neutral-600 mt-1.5 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500 font-mono font-medium">
                      Stock: {product.stock} disp.
                    </span>

                    {inCart ? (
                      <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-300">
                        <button
                          onClick={() => updateClientQuantity(product.id, -1)}
                          className="p-1 rounded-lg hover:bg-neutral-200 text-neutral-800"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-extrabold text-xs px-2 text-amber-600">{inCart.quantity}</span>
                        <button
                          onClick={() => updateClientQuantity(product.id, 1)}
                          className="p-1 rounded-lg hover:bg-neutral-200 text-neutral-800"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToClientCart(product)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Floating Cart Button for Mobile & Quick Access */}
      {clientCart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 right-6 z-40 animate-bounce">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-sm shadow-2xl shadow-amber-500/40"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Ver Pedido ({clientCart.reduce((sum, it) => sum + it.quantity, 0)})</span>
            <span className="bg-neutral-950 text-white px-2 py-0.5 rounded-lg text-xs font-mono">
              Bs. {clientCartTotal.toFixed(2)}
            </span>
          </button>
        </div>
      )}

      {/* Client Online Order Drawer / Slide-Over Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="w-full max-w-md bg-white border-l border-neutral-200 h-full flex flex-col shadow-2xl text-neutral-900">
            {/* Drawer Header */}
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-sm text-neutral-900">Tu Pedido Online</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                  {clientCart.length} items
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items Scroll */}
            <div className="p-4 flex-1 overflow-y-auto divide-y divide-neutral-100 space-y-3">
              {clientCart.length === 0 ? (
                <div className="text-center py-16 text-neutral-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30 text-neutral-500" />
                  <p className="text-sm">Tu bandeja de pedido está vacía</p>
                </div>
              ) : (
                clientCart.map((item) => (
                  <div key={item.productId} className="pt-3 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-neutral-900">{item.productName}</p>
                      <p className="text-[11px] text-neutral-500 font-mono">Bs. {item.price.toFixed(2)} c/u</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-neutral-100 rounded-lg border border-neutral-300 p-0.5">
                        <button
                          onClick={() => updateClientQuantity(item.productId, -1)}
                          className="p-1 text-neutral-700 hover:text-neutral-950"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-bold text-amber-600">{item.quantity}</span>
                        <button
                          onClick={() => updateClientQuantity(item.productId, 1)}
                          className="p-1 text-neutral-700 hover:text-neutral-950"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-extrabold text-xs font-mono w-16 text-right text-neutral-900">
                        Bs. {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Form */}
            {clientCart.length > 0 && (
              <form onSubmit={handleSendOnlineOrder} className="p-4 bg-neutral-50 border-t border-neutral-200 space-y-3">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType('mesa')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                        orderType === 'mesa'
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 font-extrabold'
                          : 'bg-white border-neutral-300 text-neutral-700'
                      }`}
                    >
                      🍽️ Consumo en Mesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('llevar')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                        orderType === 'llevar'
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 font-extrabold'
                          : 'bg-white border-neutral-300 text-neutral-700'
                      }`}
                    >
                      🛍️ Para Llevar
                    </button>
                  </div>

                  {orderType === 'mesa' && (
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">Número de Mesa</label>
                      <select
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 font-medium"
                      >
                        <option value="Mesa 1">Mesa 1 (Salón Principal)</option>
                        <option value="Mesa 2">Mesa 2 (Salón Principal)</option>
                        <option value="Mesa 3">Mesa 3 (Ventanal)</option>
                        <option value="Mesa 4">Mesa 4 (Terraza)</option>
                        <option value="Mesa 5">Mesa 5 (Terraza)</option>
                        <option value="Barra 1">Barra Alta 1</option>
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Juan Pérez"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">Teléfono</label>
                      <input
                        type="text"
                        placeholder="Ej. 987654321"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 mb-1">Indicaciones para Cocina</label>
                    <input
                      type="text"
                      placeholder="Ej. Sin cebolla, poco dulce, salsa aparte..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-sm">
                  <span className="text-neutral-600 font-medium">Total a Pagar:</span>
                  <span className="text-xl font-black text-amber-600 font-mono">
                    Bs. {clientCartTotal.toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Pedido a Cocina</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Staff Login Modal with Demo Pre-sets */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-neutral-900">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-300">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-neutral-950 font-['Outfit']">Acceso al Sistema Web</h3>
              <p className="text-xs text-neutral-500 mt-1">
                Ingresa con tu usuario y contraseña (Demo: contraseña <span className="font-mono font-bold text-amber-600">123</span>)
              </p>
            </div>

            {/* Quick Demo Role Selectors */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-neutral-600 uppercase tracking-wider mb-2">
                Ingreso Rápido con 1 Clic (Demo):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    switchUser('administrador');
                    setIsLoginModalOpen(false);
                    setCurrentPage('admin');
                  }}
                  className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold text-center transition-colors shadow-sm"
                >
                  👑 Admin
                  <span className="block text-[10px] font-medium text-rose-600">Control Total</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    switchUser('caja');
                    setIsLoginModalOpen(false);
                    setCurrentPage('pos');
                  }}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold text-center transition-colors shadow-sm"
                >
                  💼 Caja / POS
                  <span className="block text-[10px] font-medium text-emerald-600">Ventas & Turnos</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    switchUser('cocina');
                    setIsLoginModalOpen(false);
                    setCurrentPage('kitchen');
                  }}
                  className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold text-center transition-colors shadow-sm"
                >
                  👨‍🍳 Cocina KDS
                  <span className="block text-[10px] font-medium text-amber-700">Preparación</span>
                </button>
              </div>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-neutral-400 text-[10px] font-bold">O ingresa manualmente</span></div>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleStaffLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Usuario</label>
                <input
                  type="text"
                  required
                  placeholder="administrador / caja / cocina"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="123"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {loginError && (
                <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 font-medium">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 mt-2"
              >
                Ingresar al Sistema
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
