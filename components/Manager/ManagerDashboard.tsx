
import React, { useState } from 'react';
import { User, Product, ClientData, Order, Seller } from '../../types';
import { LayoutDashboard, Package, Users, ShoppingCart, LogOut, ShieldCheck, Settings, Contact, Menu } from 'lucide-react';
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
    { id: 'dashboard', label: 'Início', icon: LayoutDashboard },
    { id: 'products', label: 'Itens', icon: Package },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'sellers', label: 'Vendas', icon: Contact },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'admins', label: 'Config', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800 flex-col lg:flex-row">
      
      {/* Sidebar Desktop */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden lg:flex shadow-sm z-20">
        <div className="p-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xs">A</span>
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tighter text-slate-900">ATACADÃO</h2>
              <p className="text-[8px] font-bold text-red-500 tracking-[0.2em] uppercase">Manager Hub</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 mt-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                ? 'bg-red-50 text-red-600' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="font-bold text-xs tracking-tight">{item.label}</span>
              {activeTab === item.id && <div className="ml-auto w-1.5 h-1.5 bg-red-600 rounded-full" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3 mb-4 border border-slate-100 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 truncate">{user.name}</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Administrador</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            Sair do Portal
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-30 shrink-0">
          <div>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[9px] font-bold uppercase tracking-widest">Sistema Ativo</span>
             </div>
             <button onClick={onLogout} className="lg:hidden p-2 text-slate-400 hover:text-red-600">
                <LogOut className="w-5 h-5" />
             </button>
             <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
               <Settings className="w-4 h-4" />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-8 scrollbar-hide pb-32 lg:pb-8">
          <div className="max-w-6xl mx-auto">
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
              <OrderList orders={orders} setOrders={setOrders} sellers={sellers} />
            )}
            {activeTab === 'admins' && (
              <AdminManager managers={managers} setManagers={setManagers} currentUser={user} />
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar (Visible on < lg) */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-[500px] bg-white border border-slate-100 rounded-2xl flex items-center justify-around py-2.5 px-2 shadow-2xl shadow-slate-300/40 z-50 backdrop-blur-md">
          {menuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center p-2 rounded-xl transition-all min-w-[50px] ${activeTab === item.id ? 'text-red-600 bg-red-50/50' : 'text-slate-300'}`}
            >
              <item.icon className={`w-5 h-5 mb-1 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;
