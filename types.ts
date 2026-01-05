
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
  items: OrderItem[];
  sellerId?: string;
  sellerName?: string;
  cancelReason?: string;
}

export interface CartItem extends Product {
  quantity: number;
}
