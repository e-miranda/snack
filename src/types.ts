export type UserRole = 'administrador' | 'caja' | 'cocina';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatar: string;
  active: boolean;
  pin?: string;
  permissions: {
    canSell: boolean;
    canManageCash: boolean;
    canManageInventory: boolean;
    canViewReports: boolean;
    canKitchen: boolean;
    canManageUsers: boolean;
    canViewAudit: boolean;
  };
}

export type ProductCategory = 'hamburguesas' | 'jugos' | 'calientes' | 'snacks' | 'refrescos' | 'tortas' | 'empanadas' | 'combos';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  image: string;
  description: string;
  isAvailable: boolean;
  sku: string;
  unit: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  notes?: string;
  subtotal: number;
}

export type OrderType = 'mesa' | 'llevar' | 'online';
export type OrderStatus = 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'qr' | 'transferencia';
export type PaymentStatus = 'pagado' | 'pendiente';

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  tableNumber?: string;
  customerName: string;
  customerDoc?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  cashReceived?: number;
  changeGiven?: number;
  cashierId: string;
  cashierName: string;
  createdAt: string; // ISO date string
  preparationStartedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  invoiceNumber: string;
  notes?: string;
}

export interface CashMovement {
  id: string;
  type: 'ingreso' | 'retiro';
  amount: number;
  reason: string;
  timestamp: string;
  registeredBy: string;
}

export interface CashRegisterSession {
  id: string;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
  closedBy?: string;
  initialCash: number;
  actualCash?: number;
  expectedCash?: number;
  difference?: number;
  status: 'abierta' | 'cerrada';
  notes?: string;
  movements: CashMovement[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: 'VENTAS' | 'CAJA' | 'COCINA' | 'INVENTARIO' | 'USUARIOS' | 'SISTEMA';
  details: string;
  ipAddress?: string;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'nueva_orden' | 'orden_lista' | 'stock_bajo' | 'caja' | 'sistema';
  timestamp: string;
  read: boolean;
  orderId?: string;
}

export interface WarehouseRequestItem {
  productId: string;
  productName: string;
  quantityRequested: number;
  unit: string;
  notes?: string;
}

export interface WarehouseRequest {
  id: string;
  requestNumber: string;
  area: 'Cocina' | 'Barra' | 'Mostrador' | 'Delivery';
  requestedBy: string;
  createdAt: string;
  status: 'pendiente' | 'despachado' | 'cancelado';
  items: WarehouseRequestItem[];
  dispatchDate?: string;
  dispatchedBy?: string;
  notes?: string;
}

export interface SupplierPurchase {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  date: string;
  totalCost: number;
  status: 'completado' | 'pendiente';
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
  }[];
  registeredBy: string;
}

export type ViewPage = 'public' | 'pos' | 'cashier' | 'kitchen' | 'warehouse' | 'admin' | 'php_export';
