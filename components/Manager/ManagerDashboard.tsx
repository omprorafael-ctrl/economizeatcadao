
import React, { useState } from 'react';
import { User, Product, ClientData, Order, Seller } from '../../types';
import { LayoutDashboard, Package, Users, ShoppingCart, LogOut, ShieldCheck, Settings, Contact } from 'lucide-react';
import ProductList from './ProductList';
import ClientList from './ClientList';
import OrderList from './OrderList';
import StatsOverview from './StatsOverview';
import AdminManager from './AdminManager';
import SellerList from './SellerList';

interface ManagerDashboardProps {
  user: User;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  clients: ClientData[];
  setClients: React.Dispatch<React.SetStateAction<ClientData[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  managers: User[];
  setManagers: React.Dispatch<React.SetStateAction<User[]>>;
  sellers: Seller[];
  setSellers: React.Dispatch<React.SetStateAction<Seller[]>>;
  onLogout: () => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  user, products, setProducts, clients, setClients, orders, setOrders, managers, setManagers, sellers, setSellers, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'clients' | 'orders' | 'admins' | 'sellers'>('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'sellers', label: 'Vendedores', icon: Contact },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'admins', label: 'Equipe Adm', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden">
      {/* Sidebar - Dark Red Style */}
      <aside className="w-80 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col hidden lg:flex">
        <div className="p-10">
          <h2 className="text-3xl font-black italic tracking-tighter text-white">ATACADÃO</h2>
          <p className="text-[10px] font-black text-red-600 tracking-[0.4em] mt-1 uppercase">Manager Console</p>
        </div>
        
        <nav className="flex-1 px-8 space-y-3 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 relative group ${
                activeTab === item.id 
                ? 'bg-red-600 text-white shadow-2xl shadow-red-900/40' 
                : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'}`} />
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
              {activeTab === item.id && <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full" />}
            </button>
          ))}
        </nav>

        <div className="p-10 border-t border-white/5">
          <div className="bg-white/5 p-4 rounded-3xl flex items-center gap-4 mb-6 border border-white/5 hover:border-red-500/30 transition-colors group cursor-default">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-red-400 flex items-center justify-center font-black text-white shadow-lg group-hover:rotate-6 transition-transform">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-white truncate">{user.name}</p>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Acesso Root</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-5 py-4 text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-2xl transition-all font-bold text-sm uppercase tracking-widest"
          >
            <LogOut className="w-5 h-5" />
            Sair do Portal
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[150px] -mr-64 -mt-64 pointer-events-none" />
        
        <header className="h-24 bg-black/20 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-30">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase italic">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_5px_red]" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monitoramento em Tempo Real</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"><Settings className="w-5 h-5" /></button>
            <div className="lg:hidden">
              <button onClick={onLogout} className="p-3 text-red-500 bg-red-500/10 rounded-xl"><LogOut className="w-6 h-6" /></button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10 scrollbar-hide relative z-10">
          <div className="max-w-7xl mx-auto space-y-10">
            {activeTab === 'dashboard' && <StatsOverview products={products} clients={clients} orders={orders} />}
            {activeTab === 'products' && (
              <ProductList products={products} setProducts={setProducts} />
            )}
            {activeTab === 'clients' && (
              <ClientList clients={clients} setClients={setClients} />
            )}
            {activeTab === 'sellers' && (
              <SellerList sellers={sellers} setSellers={setSellers} />
            )}
            {activeTab === 'orders' && (
              <OrderList orders={orders} setOrders={setOrders} />
            )}
            {activeTab === 'admins' && (
              <AdminManager managers={managers} setManagers={setManagers} currentUser={user} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
