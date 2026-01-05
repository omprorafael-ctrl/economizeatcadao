
export enum UserRole {
  MANAGER = 'manager',
  CLIENT = 'client'
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

export interface Product {
  id: string;
  code: string;
  description: string;
  group: string;
  price: number;
  imageUrl: string;
  active: boolean;
}

export enum OrderStatus {
  GENERATED = 'gerado',
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
}

export interface CartItem extends Product {
  quantity: number;
}
