
import React, { useState } from 'react';
import { ClientData, Product, Order, CartItem, OrderStatus, Seller } from '../../types';
import { ShoppingCart, List, History, User, LogOut, PackageSearch, UserCircle, Bell } from 'lucide-react';
import Catalog from './Catalog';
import Cart from './Cart';
import OrderHistory from './OrderHistory';

interface ClientDashboardProps {
  user: ClientData;
  products: Product[];
  orders: Order[];
  sellers: Seller[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onLogout: () => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ 
  user, products, orders, sellers, setOrders, onLogout 
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
    <div className="flex flex-col h-screen bg-black max-w-lg mx-auto shadow-[0_0_100px_rgba(220,38,38,0.1)] overflow-hidden relative font-sans text-white border-x border-white/5">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-red-600/10 blur-[120px] pointer-events-none" />

      {/* Header Premium Dark */}
      <header className="bg-black/40 backdrop-blur-3xl border-b border-white/5 p-8 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center rotate-3 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              <PackageSearch className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">ATACADÃO</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-2xl border border-white/5 transition-all"><Bell className="w-5 h-5" /></button>
            <button onClick={onLogout} className="p-3 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl border border-red-500/20 transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-[22px] bg-gradient-to-tr from-red-600 to-red-400 p-0.5 shadow-xl shadow-red-900/20">
            <div className="w-full h-full rounded-[20px] bg-black flex items-center justify-center font-black text-white text-xl border border-white/10">
              {user.name.charAt(0)}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Cliente Gold</p>
            <p className="font-black text-white truncate uppercase text-lg tracking-tight italic">{user.name}</p>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto pb-40 scrollbar-hide relative z-10">
        {activeTab === 'catalog' && (
          <Catalog products={products} onAddToCart={addToCart} />
        )}
        {activeTab === 'cart' && (
          <Cart 
            cart={cart} 
            user={user} 
            sellers={sellers}
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
          <div className="p-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center pb-10 border-b border-white/5">
              <div className="w-28 h-28 bg-red-600/10 border-4 border-white/5 rounded-[45px] flex items-center justify-center mx-auto mb-6 shadow-2xl relative">
                <UserCircle className="w-14 h-14 text-red-500" />
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-black flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white italic tracking-tighter">Perfil Corporativo</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Configurações de Identidade</p>
            </div>
            
            <div className="space-y-4">
              <InfoCard label="Cadastro Nacional" value={user.cpfCnpj} />
              <InfoCard label="E-mail Administrativo" value={user.email} />
              <InfoCard label="Contato Direto" value={user.phone} />
              <InfoCard label="Logradouro de Entrega" value={user.address} />
            </div>

            <button className="w-full py-5 border border-white/5 bg-white/5 hover:bg-white/10 rounded-[28px] text-[10px] font-black uppercase tracking-[0.4em] transition-all">Editar Dados Cadastrais</button>
          </div>
        )}
      </main>

      {/* Dark Nav Floating Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[440px] bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[35px] flex items-center justify-around py-4 px-3 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50">
        <NavButton active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} icon={List} label="Ofertas" />
        <NavButton active={activeTab === 'cart'} onClick={() => setActiveTab('cart')} icon={ShoppingCart} label="Carrinho" count={cartCount} />
        <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Pedidos" />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="Conta" />
      </div>
    </div>
  );
};

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white/5 p-6 rounded-[30px] border border-white/5 shadow-inner transition-all hover:border-red-500/40 group">
    <label className="text-[10px] font-black uppercase text-red-600 tracking-[0.3em] mb-2 block group-hover:text-red-400 transition-colors">{label}</label>
    <p className="font-bold text-white leading-relaxed text-sm tracking-wide">{value}</p>
  </div>
);

const NavButton = ({ active, onClick, icon: Icon, label, count }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center p-3 rounded-2xl transition-all relative ${active ? 'text-red-500' : 'text-slate-500'}`}
  >
    {count > 0 && (
      <span className="absolute -top-1 right-2 bg-red-600 text-white text-[9px] font-black w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-black shadow-lg shadow-red-900/40">
        {count}
      </span>
    )}
    <Icon className={`w-6 h-6 mb-1 transition-transform ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]' : 'scale-100 opacity-40'}`} />
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    {active && <div className="absolute -bottom-1 w-1 h-1 bg-red-600 rounded-full" />}
  </button>
);

export default ClientDashboard;
