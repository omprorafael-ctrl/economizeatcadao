
import React, { useState } from 'react';
import { ClientData, Product, Order, CartItem, OrderStatus } from '../../types';
import { ShoppingCart, List, History, User, LogOut, PackageSearch, UserCircle } from 'lucide-react';
import Catalog from './Catalog';
import Cart from './Cart';
import OrderHistory from './OrderHistory';

interface ClientDashboardProps {
  user: ClientData;
  products: Product[];
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onLogout: () => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ 
  user, products, orders, setOrders, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'cart' | 'history' | 'profile'>('catalog');
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const clientOrders = orders.filter(o => o.clientId === user.id);

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-lg mx-auto shadow-[0_0_100px_rgba(0,0,0,0.1)] overflow-hidden relative font-sans">
      {/* Header - Glassmorphism */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 p-6 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center rotate-3 shadow-lg shadow-blue-200">
              <PackageSearch className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black italic tracking-tighter text-slate-900">ATACADÃO</h1>
          </div>
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-blue-600 shadow-inner border border-slate-200">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loja Autorizada</p>
            <p className="font-bold text-slate-800 truncate max-w-[200px]">{user.name}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-32">
        {activeTab === 'catalog' && (
          <Catalog products={products} onAddToCart={addToCart} />
        )}
        {activeTab === 'cart' && (
          <Cart 
            cart={cart} 
            user={user} 
            updateQuantity={updateQuantity} 
            removeFromCart={removeFromCart} 
            onOrderCreated={(newOrder) => {
              setCart([]);
              setActiveTab('history');
            }}
          />
        )}
        {activeTab === 'history' && (
          <OrderHistory orders={clientOrders} />
        )}
        {activeTab === 'profile' && (
          <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="w-24 h-24 bg-white border-8 border-slate-100 rounded-[40px] flex items-center justify-center mx-auto mb-4 shadow-xl">
                <UserCircle className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Meus Dados</h2>
              <p className="text-slate-400 text-sm font-medium">Informações da sua conta comercial</p>
            </div>
            
            <div className="space-y-4">
              <InfoCard label="CNPJ/CPF" value={user.cpfCnpj} />
              <InfoCard label="E-mail" value={user.email} />
              <InfoCard label="Telefone" value={user.phone} />
              <InfoCard label="Endereço de Entrega" value={user.address} />
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Nav */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[32px] flex items-center justify-around py-3 px-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50">
        <NavButton active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} icon={List} label="Catálogo" />
        <NavButton active={activeTab === 'cart'} onClick={() => setActiveTab('cart')} icon={ShoppingCart} label="Carrinho" count={cartCount} />
        <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Pedidos" />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="Perfil" />
      </div>
    </div>
  );
};

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
    <label className="text-[10px] font-black uppercase text-black tracking-[0.2em] mb-1 block">{label}</label>
    <p className="font-bold text-slate-700 leading-relaxed">{value}</p>
  </div>
);

const NavButton = ({ active, onClick, icon: Icon, label, count }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center p-2 rounded-2xl transition-all relative ${active ? 'text-blue-400' : 'text-slate-500'}`}
  >
    {count > 0 && (
      <span className="absolute -top-1 right-2 bg-blue-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-slate-900 animate-pulse">
        {count}
      </span>
    )}
    <Icon className={`w-6 h-6 mb-1 ${active ? 'scale-110' : 'scale-100 opacity-60'}`} />
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default ClientDashboard;
