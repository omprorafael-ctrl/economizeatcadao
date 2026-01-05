
import React, { useState } from 'react';
import { ClientData, Product, Order, CartItem, OrderStatus, Seller } from '../../types';
import { ShoppingCart, List, History, User, LogOut, PackageSearch, UserCircle, Bell, Zap } from 'lucide-react';
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
  const [showNotifications, setShowNotifications] = useState(false);

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
  const promoItems = products.filter(p => p.onSale && p.active);

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-lg mx-auto shadow-2xl shadow-slate-200 overflow-hidden relative font-sans text-slate-800 border-x border-slate-200">
      
      {/* Header Clean Profissional */}
      <header className="glass-header px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-sm">
              <PackageSearch className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">ATACADÃO</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Portal B2B</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all relative"
            >
              <Bell className="w-5 h-5" />
              {promoItems.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
              )}
            </button>
            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 uppercase">{user.cpfCnpj || 'CNPJ não informado'}</p>
            </div>
          </div>
          {promoItems.length > 0 && (
            <div className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-orange-100">
              <Zap className="w-3 h-3 fill-orange-500 text-orange-500" />
              {promoItems.length} Ofertas
            </div>
          )}
        </div>
      </header>

      {/* Dropdown Notificações Clean */}
      {showNotifications && (
        <div className="absolute top-20 right-4 w-64 bg-white border border-slate-100 rounded-xl shadow-xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-slate-50 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Novidades</p>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {promoItems.length > 0 ? (
              promoItems.map(p => (
                <button 
                  key={p.id}
                  onClick={() => { setActiveTab('catalog'); setShowNotifications(false); }}
                  className="w-full p-3 hover:bg-slate-50 rounded-lg text-left transition-all flex items-start gap-3 group"
                >
                  <div className="mt-0.5 w-6 h-6 bg-orange-50 text-orange-500 rounded flex items-center justify-center shrink-0">
                    <Zap className="w-3 h-3" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-slate-900">{p.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Preço reduzido disponível</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-slate-400">
                <p className="text-xs">Sem notificações</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Área de Conteúdo */}
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide bg-slate-50 relative z-10">
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
          <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center pb-6 border-b border-slate-200">
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm relative">
                <UserCircle className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Perfil da Conta</h2>
              <p className="text-slate-500 text-xs mt-1">Dados cadastrais da empresa</p>
            </div>
            
            <div className="space-y-3">
              <InfoCard label="Razão Social" value={user.name} />
              <InfoCard label="CNPJ / CPF" value={user.cpfCnpj} />
              <InfoCard label="E-mail" value={user.email} />
              <InfoCard label="Telefone" value={user.phone} />
              <InfoCard label="Endereço de Entrega" value={user.address} />
            </div>

            <button onClick={onLogout} className="w-full py-3 mt-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-bold uppercase tracking-wide transition-all border border-red-100">
              Sair da Conta
            </button>
          </div>
        )}
      </main>

      {/* Navegação Flutuante Clean */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] bg-white border border-slate-200/80 rounded-2xl flex items-center justify-around py-3 px-2 shadow-xl shadow-slate-200/50 z-50 backdrop-blur-md">
        <NavButton active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} icon={List} label="Catálogo" />
        <NavButton active={activeTab === 'cart'} onClick={() => setActiveTab('cart')} icon={ShoppingCart} label="Carrinho" count={cartCount} />
        <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Pedidos" />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="Perfil" />
      </div>
    </div>
  );
};

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</span>
    <span className="text-sm font-medium text-slate-800 break-words">{value || '-'}</span>
  </div>
);

const NavButton = ({ active, onClick, icon: Icon, label, count }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center p-2 rounded-xl transition-all relative min-w-[60px] ${active ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {count > 0 && (
      <span className="absolute -top-1 right-1 bg-red-600 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
        {count}
      </span>
    )}
    <Icon className={`w-5 h-5 mb-0.5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
    <span className="text-[9px] font-semibold">{label}</span>
  </button>
);

export default ClientDashboard;
