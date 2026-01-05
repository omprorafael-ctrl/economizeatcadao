
import { UserRole, Product, ClientData, Order, OrderStatus } from './types';

export const initialProducts: Product[] = [
  { id: '1', code: '1001', description: 'Arroz Integral 5kg', group: 'Grãos', price: 25.90, imageUrl: 'https://picsum.photos/200/200?random=1', active: true },
  { id: '2', code: '1002', description: 'Feijão Carioca 1kg', group: 'Grãos', price: 8.50, imageUrl: 'https://picsum.photos/200/200?random=2', active: true },
  { id: '3', code: '1003', description: 'Azeite de Oliva Extra Virgem', group: 'Mercearia', price: 32.00, imageUrl: 'https://picsum.photos/200/200?random=3', active: true },
  { id: '4', code: '1004', description: 'Detergente Líquido 500ml', group: 'Limpeza', price: 2.50, imageUrl: 'https://picsum.photos/200/200?random=4', active: true },
  { id: '5', code: '1005', description: 'Sabão em Pó 1kg', group: 'Limpeza', price: 12.90, imageUrl: 'https://picsum.photos/200/200?random=5', active: true },
];

export const initialClients: ClientData[] = [
  { 
    id: 'c1', 
    name: 'Mercado do João', 
    email: 'joao@mercado.com', 
    role: UserRole.CLIENT, 
    active: true, 
    createdAt: '2023-10-01',
    cpfCnpj: '12.345.678/0001-90',
    phone: '(11) 98888-7777',
    address: 'Rua das Flores, 123 - São Paulo'
  }
];

export const initialOrders: Order[] = [
  {
    id: 'ord1',
    clientId: 'c1',
    clientName: 'Mercado do João',
    total: 34.40,
    status: OrderStatus.GENERATED,
    createdAt: new Date().toISOString(),
    items: [
      { productId: '2', description: 'Feijão Carioca 1kg', quantity: 2, unitPrice: 8.50, subtotal: 17.00 },
      { productId: '4', description: 'Detergente Líquido 500ml', quantity: 7, unitPrice: 2.50, subtotal: 17.50 }
    ]
  }
];
