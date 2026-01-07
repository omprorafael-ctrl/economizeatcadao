
export enum UserRole {
  MANAGER = 'manager',
  CLIENT = 'client',
  SELLER = 'seller'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface ClientData extends User {
  cpfCnpj: string;
  phone: string;
  address: string;
}

export interface Seller extends User {
  phone: string;
  cpf?: string;
}

export interface Product {
  id: string;
  code: string;
  description: string;
  group: string;
  price: number;
  imageUrl: string;
  active: boolean;
  onSale?: boolean;
  salePrice?: number;
  createdAt: string;
}

export enum OrderStatus {
  GENERATED = 'gerado',
  IN_PROGRESS = 'em andamento',
  INVOICED = 'faturado',
  CANCELLED = 'cancelado',
  SENT = 'enviado',
  FINISHED = 'finalizado'
}

export interface OrderItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  receivedAt?: string; // Data em que o vendedor recebeu
  invoicedAt?: string; // Data em que foi faturado
  items: OrderItem[];
  sellerId?: string;
  sellerName?: string;
  cancelReason?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order_received' | 'order_cancelled' | 'info' | 'order_status';
  read: boolean;
  createdAt: string;
  orderId?: string;
  recipientId?: string; // ID do usuário que deve receber a notificação
}

export interface CartItem extends Product {
  quantity: number;
}
