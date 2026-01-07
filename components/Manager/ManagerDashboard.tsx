
import React, { useState, useEffect } from 'react';
import { User, Product, ClientData, Order, Seller, AppNotification } from '../../types';
import { LayoutDashboard, Package, Users, ShoppingCart, LogOut, ShieldCheck, Settings, Contact, Menu, Bell, X, Trash2, CheckCircle, ShoppingBag } from 'lucide-react';
import ProductList from './ProductList';
import ClientList from './ClientList';
import OrderList from './OrderList';
import StatsOverview from './StatsOverview';
import AdminManager from './AdminManager';
import SellerList from './SellerList';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppNotification));
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Estoque', icon: Package },
    { id: 'clients', label: 'Parceiros', icon: Users },
    { id: 'sellers', label: 'Vendedoras', icon: Contact },
    { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
    { id: 'admins', label: 'Gestão', icon: ShieldCheck },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const clearNotifications = async () => {
    notifications.forEach(async (n) => {
      await deleteDoc(doc(db, 'notifications', n.id));
    });
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800 flex-col lg:flex-row">
      
      {/* Sidebar Desktop */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden lg:flex shadow-sm z-20">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tighter text-slate-900 leading-none">ECONOMIZE</h2>
              <p className="text-[8px] font-bold text-red-600 tracking-[0.2em] uppercase mt-1">ATACADÃO</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 mt-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                activeTab === item.id 
                ? 'bg-red-600 text-white shadow-lg shadow-red-100' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="font-black text-[10px] uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-3 mb-4 border border-slate-100 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-sm uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-slate-900 truncate uppercase">{user.name}</p>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Master Admin</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            Desconectar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3 lg:hidden">
             <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-md">
               <ShoppingBag className="w-4 h-4 text-white" />
             </div>
             <h1 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
               ECONOMIZE
             </h1>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Gerenciamento / {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute top-12 right-0 w-80 bg-white border border-slate-200 shadow-2xl rounded-3xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Alertas do Sistema</h4>
                      <button onClick={clearNotifications} className="text-[9px] font-black text-red-600 uppercase hover:underline">Limpar</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto scrollbar-hide">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => { markAsRead(n.id); setActiveTab('orders'); setShowNotifications(false); }}
                            className={`p-4 border-b border-slate-50 cursor-pointer transition-colors flex gap-4 ${n.read ? 'opacity-50' : 'bg-red-50/20'}`}
                          >
                            <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                              <ShoppingCart className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-800 uppercase leading-tight">{n.title}</p>
                              <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">{n.message}</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase mt-2">{new Date(n.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 text-center">
                          <CheckCircle className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-slate-400 uppercase">Tudo em ordem!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
             </div>

             <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[9px] font-bold uppercase tracking-widest">Servidor Online</span>
             </div>
             
             <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
               <Settings className="w-4 h-4" />
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-8 scrollbar-hide pb-32 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && <StatsOverview products={products} clients={clients} orders={orders} sellers={sellers} />}
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

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-[500px] bg-white border border-slate-100 rounded-[24px] flex items-center justify-around py-3 px-2 shadow-2xl z-50 backdrop-blur-md">
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
