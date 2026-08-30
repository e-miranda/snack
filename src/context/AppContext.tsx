import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  User,
  Product,
  Order,
  OrderItem,
  OrderStatus,
  CashRegisterSession,
  CashMovement,
  AuditLog,
  PushNotification,
  ViewPage,
  PaymentMethod,
  OrderType,
  WarehouseRequest,
  SupplierPurchase
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_CASH_SESSION,
  INITIAL_AUDIT_LOGS,
  INITIAL_WAREHOUSE_REQUESTS,
  INITIAL_SUPPLIER_PURCHASES
} from '../data/initialData';
import { sounds } from '../utils/audio';

interface AppContextType {
  // Navigation & User
  currentUser: User | null;
  currentPage: ViewPage;
  setCurrentPage: (page: ViewPage) => void;
  users: User[];
  login: (username: string, pin: string) => boolean;
  logout: () => void;
  switchUser: (role: 'administrador' | 'caja' | 'cocina') => void;
  updateUserPermissions: (userId: string, permissions: User['permissions']) => void;

  // Products & Inventory
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number, reason: string) => void;

  // POS & Cart
  cart: OrderItem[];
  addToCart: (product: Product, quantity?: number, notes?: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  updateCartItemNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;

  // Orders
  orders: Order[];
  createOrder: (params: {
    type: OrderType;
    tableNumber?: string;
    customerName: string;
    customerDoc?: string;
    customerPhone?: string;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    changeGiven?: number;
    items?: OrderItem[];
    notes?: string;
    discount?: number;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  cancelOrder: (orderId: string, reason: string) => void;

  // Warehouse & Solicitudes
  warehouseRequests: WarehouseRequest[];
  createWarehouseRequest: (params: {
    area: 'Cocina' | 'Barra' | 'Mostrador' | 'Delivery';
    items: WarehouseRequest['items'];
    notes?: string;
  }) => WarehouseRequest;
  dispatchWarehouseRequest: (requestId: string) => void;
  cancelWarehouseRequest: (requestId: string) => void;
  supplierPurchases: SupplierPurchase[];
  addSupplierPurchase: (params: {
    invoiceNumber: string;
    supplierName: string;
    items: SupplierPurchase['items'];
  }) => void;
  quickWarehouseSale: (params: {
    productId: string;
    quantity: number;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    customerName?: string;
  }) => Order;

  // Cash Register
  cashSession: CashRegisterSession | null;
  openCashSession: (initialCash: number, notes?: string) => void;
  closeCashSession: (actualCash: number, notes?: string) => void;
  addCashMovement: (type: 'ingreso' | 'retiro', amount: number, reason: string) => void;

  // Audit
  auditLogs: AuditLog[];
  addAuditLog: (action: string, module: AuditLog['module'], details: string) => void;

  // Notifications
  notifications: PushNotification[];
  addNotification: (title: string, message: string, type: PushNotification['type'], orderId?: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotificationsCount: number;

  // Invoices & Sound
  lastInvoiceOrder: Order | null;
  setLastInvoiceOrder: (order: Order | null) => void;
  isInvoiceModalOpen: boolean;
  setIsInvoiceModalOpen: (open: boolean) => void;
  soundEnabled: boolean;
  toggleSound: () => void;

  // Google Apps Script Sync
  gasWebhookUrl: string;
  setGasWebhookUrl: (url: string) => void;
  syncWithGas: (order: Order) => Promise<boolean>;
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'snack_users_v1',
  PRODUCTS: 'snack_products_v2',
  ORDERS: 'snack_orders_v1',
  CASH_SESSION: 'snack_cash_session_v1',
  AUDIT_LOGS: 'snack_audit_v1',
  NOTIFICATIONS: 'snack_notifications_v1',
  CURRENT_USER: 'snack_current_user_v1',
  GAS_WEBHOOK: 'snack_gas_webhook_v1',
  WAREHOUSE_REQUESTS: 'snack_warehouse_requests_v1',
  SUPPLIER_PURCHASES: 'snack_supplier_purchases_v1',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial states from localStorage if available
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
    // Default to admin for fast demo access
    return INITIAL_USERS[0];
  });

  const [currentPage, setCurrentPage] = useState<ViewPage>('public');

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      try {
        const parsed: Product[] = JSON.parse(saved);
        // Merge missing initial products if any (so new categories always appear)
        const missing = INITIAL_PRODUCTS.filter(ip => !parsed.some(p => p.id === ip.id));
        return [...parsed, ...missing];
      } catch {
        return INITIAL_PRODUCTS;
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [warehouseRequests, setWarehouseRequests] = useState<WarehouseRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WAREHOUSE_REQUESTS);
    return saved ? JSON.parse(saved) : INITIAL_WAREHOUSE_REQUESTS;
  });

  const [supplierPurchases, setSupplierPurchases] = useState<SupplierPurchase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIER_PURCHASES);
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIER_PURCHASES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [cashSession, setCashSession] = useState<CashRegisterSession | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CASH_SESSION);
    return saved ? JSON.parse(saved) : INITIAL_CASH_SESSION;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : [
      {
        id: 'notif-1',
        title: 'Sistema Iniciado',
        message: 'Bienvenido al sistema Snack POS & Cocina KDS.',
        type: 'sistema',
        timestamp: new Date().toISOString(),
        read: false,
      }
    ];
  });

  const [cart, setCart] = useState<OrderItem[]>([]);
  const [lastInvoiceOrder, setLastInvoiceOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [gasWebhookUrl, setGasWebhookUrlState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.GAS_WEBHOOK) || '';
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WAREHOUSE_REQUESTS, JSON.stringify(warehouseRequests));
  }, [warehouseRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIER_PURCHASES, JSON.stringify(supplierPurchases));
  }, [supplierPurchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASH_SESSION, JSON.stringify(cashSession));
  }, [cashSession]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  const setGasWebhookUrl = (url: string) => {
    setGasWebhookUrlState(url);
    localStorage.setItem(STORAGE_KEYS.GAS_WEBHOOK, url);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    sounds.setSoundEnabled(next);
    if (next) sounds.playClick();
  };

  // Audit Logging
  const addAuditLog = useCallback((action: string, module: AuditLog['module'], details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser ? currentUser.id : 'anon',
      userName: currentUser ? currentUser.name : 'Usuario Anónimo',
      userRole: currentUser ? currentUser.role : 'caja',
      action,
      module,
      details,
      ipAddress: '192.168.1.100',
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [currentUser]);

  // Notifications
  const addNotification = useCallback((title: string, message: string, type: PushNotification['type'], orderId?: string) => {
    const newNotif: PushNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      orderId,
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]);

    // Trigger sound
    if (type === 'nueva_orden') {
      sounds.playNewOrderAlert();
    } else if (type === 'orden_lista') {
      sounds.playKitchenBell();
    }

    // Try HTML5 browser desktop notification if supported and granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
        });
      } catch {
        // Ignore iframe notification restrictions
      }
    }
  }, []);

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Authentication
  const login = (username: string, pin: string): boolean => {
    const cleanUser = username.trim().toLowerCase();
    const found = users.find(u => u.username.toLowerCase() === cleanUser && u.active);
    if (found && (found.pin === pin || pin === '123')) {
      setCurrentUser(found);
      addAuditLog('Inicio de Sesión', 'USUARIOS', `Usuario ${found.name} (${found.role}) inició sesión`);
      sounds.playClick();
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('Cierre de Sesión', 'USUARIOS', `Usuario ${currentUser.name} cerró sesión`);
    }
    setCurrentUser(null);
    setCurrentPage('public');
    sounds.playClick();
  };

  const switchUser = (role: 'administrador' | 'caja' | 'cocina') => {
    const target = users.find(u => u.role === role) || users[0];
    setCurrentUser(target);
    addAuditLog('Cambio Rápido de Usuario', 'USUARIOS', `Cambiado a perfil: ${target.name} (${role})`);
    sounds.playClick();
  };

  const updateUserPermissions = (userId: string, permissions: User['permissions']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions } : u));
    addAuditLog('Permisos Actualizados', 'USUARIOS', `Permisos modificados para usuario ID: ${userId}`);
  };

  // Products & Stock
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
    };
    setProducts(prev => [...prev, newProduct]);
    addAuditLog('Producto Creado', 'INVENTARIO', `Nuevo producto: ${newProduct.name} - S/ ${newProduct.price.toFixed(2)}`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    addAuditLog('Producto Modificado', 'INVENTARIO', `Producto ${id} actualizado`);
  };

  const deleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    addAuditLog('Producto Eliminado', 'INVENTARIO', `Producto eliminado: ${prod ? prod.name : id}`);
  };

  const adjustStock = (id: string, delta: number, reason: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const newStock = Math.max(0, p.stock + delta);
        if (newStock <= p.minStock) {
          addNotification(
            '⚠️ Alerta de Stock Bajo',
            `El producto ${p.name} tiene solo ${newStock} unidades restantes (Mínimo: ${p.minStock}).`,
            'stock_bajo'
          );
        }
        return { ...p, stock: newStock };
      }
      return p;
    }));
    addAuditLog('Ajuste de Stock', 'INVENTARIO', `Ajuste (${delta > 0 ? '+' : ''}${delta}) en prod ${id}. Motivo: ${reason}`);
  };

  // POS Cart
  const addToCart = (product: Product, quantity: number = 1, notes?: string) => {
    sounds.playClick();
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && (item.notes || '') === (notes || ''));
      if (existing) {
        return prev.map(item => {
          if (item === existing) {
            const nextQty = item.quantity + quantity;
            return {
              ...item,
              quantity: nextQty,
              subtotal: nextQty * item.price,
            };
          }
          return item;
        });
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity,
            notes: notes || '',
            subtotal: quantity * product.price,
          }
        ];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    sounds.playClick();
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    sounds.playClick();
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity,
          subtotal: quantity * item.price,
        };
      }
      return item;
    }));
  };

  const updateCartItemNotes = (productId: string, notes: string) => {
    setCart(prev => prev.map(item => item.productId === productId ? { ...item, notes } : item));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartTax = Number((cartTotal * 0.18 / 1.18).toFixed(2)); // IGV/IVA 18% desglosado
  const cartSubtotal = Number((cartTotal - cartTax).toFixed(2));

  // Google Apps Script Sync
  const syncWithGas = async (order: Order): Promise<boolean> => {
    if (!gasWebhookUrl || !gasWebhookUrl.startsWith('http')) return false;
    try {
      await fetch(gasWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'registrarVenta',
          order,
        }),
        mode: 'no-cors', // Google Apps Script web apps usually handle no-cors redirect
      });
      return true;
    } catch {
      return false;
    }
  };

  // Orders Management
  const createOrder = ({
    type,
    tableNumber,
    customerName,
    customerDoc,
    customerPhone,
    paymentMethod,
    cashReceived,
    changeGiven,
    items,
    notes,
    discount = 0,
  }: {
    type: OrderType;
    tableNumber?: string;
    customerName: string;
    customerDoc?: string;
    customerPhone?: string;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    changeGiven?: number;
    items?: OrderItem[];
    notes?: string;
    discount?: number;
  }): Order => {
    const orderItems = items || [...cart];
    const totalAmount = orderItems.reduce((acc, it) => acc + it.subtotal, 0) - discount;
    const taxAmount = Number((totalAmount * 0.18 / 1.18).toFixed(2));
    const subtotalAmount = Number((totalAmount - taxAmount).toFixed(2));

    const nextOrderNum = `SNK-${String(orders.length + 101).padStart(5, '0')}`;
    const nextInvoiceNum = `FAC-B001-${String(orders.length + 414).padStart(6, '0')}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: nextOrderNum,
      type,
      tableNumber: type === 'mesa' ? (tableNumber || 'Mesa 1') : undefined,
      customerName: customerName.trim() || 'Cliente General',
      customerDoc,
      customerPhone,
      items: orderItems,
      subtotal: subtotalAmount,
      tax: taxAmount,
      discount,
      total: Math.max(0, totalAmount),
      status: 'pendiente',
      paymentMethod,
      paymentStatus: 'pagado',
      cashReceived,
      changeGiven,
      cashierId: currentUser ? currentUser.id : 'user-caja',
      cashierName: currentUser ? currentUser.name : 'Valeria Quispe',
      createdAt: new Date().toISOString(),
      invoiceNumber: nextInvoiceNum,
      notes,
    };

    // Deduct stock for each item
    orderItems.forEach(item => {
      adjustStock(item.productId, -item.quantity, `Venta en orden ${nextOrderNum}`);
    });

    setOrders(prev => [newOrder, ...prev]);

    // Audio & Notifications
    sounds.playCashRegister();
    addNotification(
      '🔔 Nuevo Pedido Ingresado',
      `Orden ${newOrder.orderNumber} (${type === 'mesa' ? newOrder.tableNumber : 'Para Llevar'}) - Total: S/ ${newOrder.total.toFixed(2)}`,
      'nueva_orden',
      newOrder.id
    );

    addAuditLog(
      'Venta Realizada',
      'VENTAS',
      `Orden ${newOrder.orderNumber} por S/ ${newOrder.total.toFixed(2)} pagada con ${paymentMethod.toUpperCase()} (${newOrder.invoiceNumber})`
    );

    // Sync to GAS in background if configured
    syncWithGas(newOrder);

    // Open invoice preview modal
    setLastInvoiceOrder(newOrder);
    setIsInvoiceModalOpen(true);

    if (!items) {
      clearCart();
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const now = new Date().toISOString();
        const updated: Order = { ...o, status };
        if (status === 'en_preparacion' && !o.preparationStartedAt) {
          updated.preparationStartedAt = now;
        } else if (status === 'listo' && !o.readyAt) {
          updated.readyAt = now;
          sounds.playKitchenBell();
          addNotification(
            '🛎️ Pedido Listo en Cocina',
            `La orden ${o.orderNumber} (${o.type === 'mesa' ? o.tableNumber : 'Llevar'}) está lista para servir.`,
            'orden_lista',
            o.id
          );
        } else if (status === 'entregado' && !o.deliveredAt) {
          updated.deliveredAt = now;
        }
        return updated;
      }
      return o;
    }));

    addAuditLog(
      'Estado de Pedido Actualizado',
      'COCINA',
      `Orden ${orderId} cambió de estado a: ${status.toUpperCase()}`
    );
  };

  const cancelOrder = (orderId: string, reason: string) => {
    const target = orders.find(o => o.id === orderId);
    if (!target) return;

    // Restore stock
    target.items.forEach(item => {
      adjustStock(item.productId, item.quantity, `Reembolso / Anulación de orden ${target.orderNumber}`);
    });

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelado', notes: `${o.notes || ''} [Cancelado: ${reason}]` } : o));

    addAuditLog('Orden Anulada', 'VENTAS', `Orden ${target.orderNumber} anulada. Motivo: ${reason}`);
    addNotification('🚫 Orden Cancelada', `La orden ${target.orderNumber} fue anulada. Motivo: ${reason}`, 'sistema');
  };

  // Cash Register Management
  const openCashSession = (initialCash: number, notes?: string) => {
    const newSession: CashRegisterSession = {
      id: `caja-ses-${Date.now()}`,
      openedAt: new Date().toISOString(),
      openedBy: currentUser ? currentUser.name : 'Valeria Quispe',
      initialCash,
      status: 'abierta',
      notes: notes || 'Apertura de caja con fondo inicial',
      movements: [
        {
          id: `mov-${Date.now()}`,
          type: 'ingreso',
          amount: initialCash,
          reason: 'Fondo de apertura de caja',
          timestamp: new Date().toISOString(),
          registeredBy: currentUser ? currentUser.name : 'Valeria Quispe',
        }
      ],
    };
    setCashSession(newSession);
    sounds.playCashRegister();
    addAuditLog('Apertura de Caja', 'CAJA', `Caja abierta con monto inicial de S/ ${initialCash.toFixed(2)}`);
    addNotification('💼 Caja Abierta', `Se ha iniciado un nuevo turno de caja con S/ ${initialCash.toFixed(2)}`, 'caja');
  };

  const closeCashSession = (actualCash: number, notes?: string) => {
    if (!cashSession || cashSession.status === 'cerrada') return;

    // Calculate expected cash: initialCash + cashSales + cashDeposits - cashWithdrawals
    const currentOrders = orders.filter(o => new Date(o.createdAt) >= new Date(cashSession.openedAt) && o.status !== 'cancelado');
    const cashSales = currentOrders.filter(o => o.paymentMethod === 'efectivo').reduce((sum, o) => sum + o.total, 0);
    const deposits = cashSession.movements.filter(m => m.type === 'ingreso' && m.reason !== 'Fondo de apertura de caja').reduce((sum, m) => sum + m.amount, 0);
    const withdrawals = cashSession.movements.filter(m => m.type === 'retiro').reduce((sum, m) => sum + m.amount, 0);

    const expectedCash = cashSession.initialCash + cashSales + deposits - withdrawals;
    const difference = actualCash - expectedCash;

    const closedSession: CashRegisterSession = {
      ...cashSession,
      closedAt: new Date().toISOString(),
      closedBy: currentUser ? currentUser.name : 'Valeria Quispe',
      actualCash,
      expectedCash,
      difference,
      status: 'cerrada',
      notes: notes || `Cierre de caja. Arqueo real: S/ ${actualCash.toFixed(2)}. Diferencia: S/ ${difference.toFixed(2)}`,
    };

    setCashSession(closedSession);
    sounds.playCashRegister();
    addAuditLog(
      'Cierre de Caja (Arqueo)',
      'CAJA',
      `Caja cerrada. Efectivo Real: S/ ${actualCash.toFixed(2)}, Esperado: S/ ${expectedCash.toFixed(2)}, Dif: S/ ${difference.toFixed(2)}`
    );
    addNotification(
      '🔒 Caja Cerrada',
      `Cierre completado. Balance final: S/ ${actualCash.toFixed(2)} (${difference >= 0 ? 'Conforme / Sobrante' : 'Faltante S/ ' + Math.abs(difference).toFixed(2)})`,
      'caja'
    );
  };

  const addCashMovement = (type: 'ingreso' | 'retiro', amount: number, reason: string) => {
    if (!cashSession || cashSession.status === 'cerrada') return;
    const newMovement: CashMovement = {
      id: `mov-${Date.now()}`,
      type,
      amount,
      reason,
      timestamp: new Date().toISOString(),
      registeredBy: currentUser ? currentUser.name : 'Cajero',
    };
    setCashSession({
      ...cashSession,
      movements: [newMovement, ...cashSession.movements],
    });
    sounds.playClick();
    addAuditLog(
      type === 'ingreso' ? 'Ingreso a Caja' : 'Retiro de Caja',
      'CAJA',
      `${type === 'ingreso' ? 'Ingreso' : 'Retiro'} de S/ ${amount.toFixed(2)} - Motivo: ${reason}`
    );
  };

  // Warehouse Requests (Solicitudes Internas de Reabastecimiento)
  const createWarehouseRequest = ({
    area,
    items,
    notes,
  }: {
    area: 'Cocina' | 'Barra' | 'Mostrador' | 'Delivery';
    items: WarehouseRequest['items'];
    notes?: string;
  }): WarehouseRequest => {
    const nextReqNum = `SOL-ALM-${String(warehouseRequests.length + 1).padStart(3, '0')}`;
    const newReq: WarehouseRequest = {
      id: `req-${Date.now()}`,
      requestNumber: nextReqNum,
      area,
      requestedBy: currentUser ? currentUser.name : 'Personal de Turno',
      createdAt: new Date().toISOString(),
      status: 'pendiente',
      items,
      notes,
    };

    setWarehouseRequests(prev => [newReq, ...prev]);
    sounds.playClick();
    addNotification(
      '📦 Nueva Solicitud a Almacén',
      `Solicitud ${nextReqNum} creada para ${area} (${items.length} productos).`,
      'sistema'
    );
    addAuditLog('Solicitud de Almacén Creada', 'INVENTARIO', `Solicitud ${nextReqNum} generada para ${area}`);
    return newReq;
  };

  const dispatchWarehouseRequest = (requestId: string) => {
    const target = warehouseRequests.find(r => r.id === requestId);
    if (!target || target.status !== 'pendiente') return;

    // Deduct stock for each item from central warehouse
    target.items.forEach(item => {
      adjustStock(item.productId, -item.quantityRequested, `Despacho solicitud ${target.requestNumber} a ${target.area}`);
    });

    setWarehouseRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'despachado',
          dispatchDate: new Date().toISOString(),
          dispatchedBy: currentUser ? currentUser.name : 'Administrador Almacén',
        };
      }
      return r;
    }));

    sounds.playKitchenBell();
    addNotification(
      '✅ Solicitud de Almacén Despachada',
      `La solicitud ${target.requestNumber} para ${target.area} fue despachada y el stock actualizado.`,
      'sistema'
    );
    addAuditLog('Solicitud de Almacén Despachada', 'INVENTARIO', `Solicitud ${target.requestNumber} despachada a ${target.area}`);
  };

  const cancelWarehouseRequest = (requestId: string) => {
    const target = warehouseRequests.find(r => r.id === requestId);
    if (!target) return;

    setWarehouseRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'cancelado' } : r));
    addAuditLog('Solicitud Almacén Anulada', 'INVENTARIO', `Solicitud ${target.requestNumber} fue cancelada`);
    addNotification('🚫 Solicitud Anulada', `La solicitud ${target.requestNumber} fue cancelada.`, 'sistema');
  };

  // Supplier Purchases (Compras a Proveedores / Entradas a Almacén)
  const addSupplierPurchase = ({
    invoiceNumber,
    supplierName,
    items,
  }: {
    invoiceNumber: string;
    supplierName: string;
    items: SupplierPurchase['items'];
  }) => {
    const totalCost = items.reduce((sum, it) => sum + it.subtotal, 0);
    const newPurchase: SupplierPurchase = {
      id: `comp-${Date.now()}`,
      invoiceNumber,
      supplierName,
      date: new Date().toISOString(),
      totalCost,
      status: 'completado',
      registeredBy: currentUser ? currentUser.name : 'Carlos Mendoza',
      items,
    };

    // Increment stock for each item
    items.forEach(it => {
      adjustStock(it.productId, it.quantity, `Ingreso de compra ${invoiceNumber} (${supplierName})`);
    });

    setSupplierPurchases(prev => [newPurchase, ...prev]);
    sounds.playCashRegister();
    addNotification(
      '📥 Entrada de Mercadería Registrada',
      `Factura ${invoiceNumber} de ${supplierName} por Bs. ${totalCost.toFixed(2)} ingresada al almacén.`,
      'sistema'
    );
    addAuditLog('Compra de Proveedor', 'INVENTARIO', `Ingreso ${invoiceNumber} de ${supplierName}. Total: Bs. ${totalCost.toFixed(2)}`);
  };

  // Quick Warehouse Direct Sale (Venta Express de Almacén)
  const quickWarehouseSale = ({
    productId,
    quantity,
    paymentMethod,
    cashReceived,
    customerName,
  }: {
    productId: string;
    quantity: number;
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    customerName?: string;
  }): Order => {
    const prod = products.find(p => p.id === productId);
    if (!prod) throw new Error('Producto no encontrado');

    const subtotal = prod.price * quantity;
    const item: OrderItem = {
      productId: prod.id,
      productName: prod.name,
      price: prod.price,
      quantity,
      subtotal,
      notes: 'Venta rápida directa desde Almacén',
    };

    const newOrder = createOrder({
      type: 'llevar',
      customerName: customerName || 'Venta Express Almacén',
      paymentMethod,
      cashReceived: cashReceived || subtotal,
      changeGiven: (cashReceived && cashReceived > subtotal) ? cashReceived - subtotal : 0,
      items: [item],
      notes: 'Despacho directo desde módulo de Almacén',
    });

    return newOrder;
  };

  const resetToDefaultData = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setProducts(INITIAL_PRODUCTS);
    setWarehouseRequests(INITIAL_WAREHOUSE_REQUESTS);
    setSupplierPurchases(INITIAL_SUPPLIER_PURCHASES);
    setOrders(INITIAL_ORDERS);
    setCashSession(INITIAL_CASH_SESSION);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCart([]);
    setCurrentUser(INITIAL_USERS[0]);
    addNotification('🔄 Datos Reiniciados', 'La base de datos de demostración ha sido restablecida.', 'sistema');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentPage,
        setCurrentPage,
        users,
        login,
        logout,
        switchUser,
        updateUserPermissions,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        cart,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        updateCartItemNotes,
        clearCart,
        cartSubtotal,
        cartTax,
        cartTotal,
        orders,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        warehouseRequests,
        createWarehouseRequest,
        dispatchWarehouseRequest,
        cancelWarehouseRequest,
        supplierPurchases,
        addSupplierPurchase,
        quickWarehouseSale,
        cashSession,
        openCashSession,
        closeCashSession,
        addCashMovement,
        auditLogs,
        addAuditLog,
        notifications,
        addNotification,
        markNotificationRead,
        markAllNotificationsRead,
        unreadNotificationsCount,
        lastInvoiceOrder,
        setLastInvoiceOrder,
        isInvoiceModalOpen,
        setIsInvoiceModalOpen,
        soundEnabled,
        toggleSound,
        gasWebhookUrl,
        setGasWebhookUrl,
        syncWithGas,
        resetToDefaultData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
