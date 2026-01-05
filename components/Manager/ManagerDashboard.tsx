
import React, { useState } from 'react';
import { User, Product, ClientData, Order, OrderStatus } from '../../types';
import { LayoutDashboard, Package, Users, ShoppingCart, LogOut, ShieldCheck, FileUp } from 'lucide-react';
import ProductList from './ProductList';
import ClientList from './ClientList';
import OrderList from './OrderList';
import StatsOverview from './StatsOverview';
import AdminManager from './AdminManager';

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
  onLogout: () => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ 
  user, products, setProducts, clients, setClients, orders, setOrders, managers, setManagers, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'clients' | 'orders' | 'admins'>('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Estoque', icon: Package },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'orders', label: 'Vendas', icon: ShoppingCart },
    { id: 'admins', label: 'Gerentes', icon: ShieldCheck },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Professional Navy Look */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col hidden lg:flex">
        <div className="p-10">
          <h2 className="text-2xl font-black italic tracking-tighter text-blue-400">ATACADÃO</h2>
          <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] mt-1">MANAGER CONSOLE</p>
        </div>
        
        <nav className="flex-1 px-6 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'scale-110' : ''}`} />
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-slate-800">
          <div className="bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center font-black text-white">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gerente Admin</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full bg-slate-50">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atacadão &bull; Controle Geral</p>
          </div>
          <div className="lg:hidden">
            <button onClick={onLogout} className="p-3 text-red-600 bg-red-50 rounded-xl"><LogOut className="w-6 h-6" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 lg:p-12 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-10">
            {activeTab === 'dashboard' && <StatsOverview products={products} clients={clients} orders={orders} />}
            {activeTab === 'products' && (
              <ProductList products={products} setProducts={setProducts} />
            )}
            {activeTab === 'clients' && (
              <ClientList clients={clients} setClients={setClients} />
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
