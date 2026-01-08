
import React, { useState, useEffect } from 'react';
import { ClientData, Product, Order, CartItem, OrderStatus, Seller, AppNotification } from '../../types';
import { 
  ShoppingCart, 
  List, 
  History, 
  User, 
  LogOut, 
  PackageSearch, 
  UserCircle, 
  Bell, 
  Zap, 
  Menu, 
  X, 
  ChevronRight, 
  ArrowRight, 
  Download, 
  Share, 
  Key, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Loader2,
  ShoppingBag,
  CheckCircle2,
  Info
} from 'lucide-react';
import Catalog from './Catalog';
import Cart from './Cart';
import OrderHistory from './OrderHistory';
import AboutSection from '../Shared/AboutSection';
import { auth, db } from '../../firebaseConfig';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, orderBy, onSnapshot, limit, deleteDoc } from 'firebase/firestore';

interface ClientDashboardProps {
  user: ClientData;
  products: Product[];
  orders: Order[];
  sellers: Seller[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onLogout: () => void;
}

type TabType = 'catalog' | 'cart' | 'history' | 'profile' | 'about';

const ClientDashboard: React.FC<ClientDashboardProps> = ({ 
  user, products, orders, sellers, setOrders, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('catalog');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'), 
      where('recipientId', '==', user.id),
      orderBy('createdAt', 'desc'), 
      limit(20)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppNotification));
      setNotifications(notifs);
    }, (err) => console.error("Erro Notificações Cliente:", err));

    return () => unsubscribe();
  }, [user.id]);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    if (!isStandalone) {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallBanner(true);
      });
      if (isIosDevice) setShowInstallBanner(true);
    }
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowInstallBanner(false);
      setDeferredPrompt(null);
    }
  };

  const markNotifRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const clearNotifs = async () => {
    notifications.forEach(async (n) => {
      await deleteDoc(doc(db, 'notifications', n.id));
    });
  };

  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity, price: product.price } 
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

  const updateItemPrice = (productId: string, newPrice: number) => {
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, price: newPrice } : item
    ));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const clientOrders = orders.filter(o => o.clientId === user.id);

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-800 overflow-hidden relative">
      
      {showInstallBanner && (
        <div className="fixed top-0 inset-x-0 z-[60] animate-in slide-in-from-top duration-500">
           <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-red-600 shadow-xl">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                   <ShoppingBag className="w-5 h-5 text-white" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">ECONOMIZE ATACADÃO</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                       {isIos ? "Adicione à Tela de Início via Compartilhar" : "Instale para acesso instantâneo"}
                    </p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 {!isIos && <button onClick={handleInstallApp} className="px-4 py-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest">Instalar</button>}
                 <button onClick={() => setShowInstallBanner(false)} className="p-2 text-slate-500"><X className="w-4 h-4" /></button>
              </div>
           </div>
        </div>
      )}

      <header className={`bg-white border-b border-slate-50 sticky top-0 z-40 transition-all duration-300 ${activeTab === 'catalog' || activeTab === 'cart' ? 'py-2' : 'py-3'}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowSideMenu(true)} className="p-2 -ml-2 text-slate-400 hover:text-red-600 transition-colors"><Menu className="w-6 h-6" /></button>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('catalog')}>
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-sm font-black text-slate-900 tracking-tighter leading-none hidden xs:block uppercase">ECONOMIZE ATACADÃO</h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className={`p-2 transition-all relative ${showNotifications ? 'text-red-600' : 'text-slate-400 hover:text-red-500'}`}>
                  <Bell className="w-5 h-5" />
                  {unreadNotifCount > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-full border-2 border-white flex items-center justify-center animate-bounce shadow-sm">{unreadNotifCount}</span>}
                </button>

                {showNotifications && (
                  <div className="absolute top-12 right-0 w-80 bg-white border border-slate-200 shadow-2xl rounded-3xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Meus Alertas</h4>
                      <button onClick={clearNotifs} className="text-[9px] font-black text-red-600 uppercase hover:underline">Limpar</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto scrollbar-hide">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => { markNotifRead(n.id); setActiveTab('history'); setShowNotifications(false); }}
                            className={`p-4 border-b border-slate-50 cursor-pointer transition-colors flex gap-4 ${n.read ? 'opacity-50' : 'bg-red-50/20'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'order_cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                              <Bell className="w-4 h-4" />
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
                          <CheckCircle2 className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                          <p className="text-[10px] font-black text-slate-400 uppercase">Tudo em ordem!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => setActiveTab('cart')} className={`p-2 transition-colors relative ${activeTab === 'cart' ? 'text-red-600' : 'text-slate-400 hover:text-red-600'}`}>
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
              
              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-black text-xs cursor-pointer hover:border-red-200 transition-colors ml-1 uppercase" onClick={() => setActiveTab('profile')}>
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {showSideMenu && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowSideMenu(false)} />
          <div className="relative bg-white w-80 h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="p-10 border-b border-slate-50 flex flex-col items-center gap-4 text-center">
               <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mb-2 shadow-xl shadow-red-100">
                 <ShoppingBag className="w-10 h-10 text-white" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acesso do Cliente</p>
                  <p className="text-xs font-black text-slate-800 truncate max-w-[200px] uppercase mt-1">{user.name}</p>
               </div>
               <button onClick={() => setShowSideMenu(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
               <SideMenuButton active={activeTab === 'catalog'} onClick={() => { setActiveTab('catalog'); setShowSideMenu(false); }} icon={List} label="Fazer Pedido" />
               <SideMenuButton active={activeTab === 'cart'} onClick={() => { setActiveTab('cart'); setShowSideMenu(false); }} icon={ShoppingCart} label="Cesta de Itens" count={cartCount} />
               <SideMenuButton active={activeTab === 'history'} onClick={() => { setActiveTab('history'); setShowSideMenu(false); }} icon={History} label="Meus Pedidos" />
               <SideMenuButton active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setShowSideMenu(false); }} icon={User} label="Meu Cadastro" />
               <SideMenuButton active={activeTab === 'about'} onClick={() => { setActiveTab('about'); setShowSideMenu(false); }} icon={Info} label="Sobre o Sistema" />
            </div>

            <div className="p-8 border-t border-slate-50">
              <button onClick={onLogout} className="w-full flex items-center justify-center gap-3 py-4 text-red-600 font-black text-[10px] uppercase tracking-[0.2em] bg-red-50 hover:bg-red-100 rounded-2xl transition-all">
                <LogOut className="w-4 h-4" /> Finalizar Sessão
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto scrollbar-hide">
          {activeTab === 'catalog' && <Catalog products={products} onAddToCart={addToCart} />}
          {activeTab === 'cart' && <Cart cart={cart} user={user} sellers={sellers} updateQuantity={updateQuantity} removeFromCart={removeFromCart} onUpdatePrice={updateItemPrice} onOrderCreated={() => { setCart([]); setActiveTab('history'); }} />}
          {activeTab === 'history' && <div className="max-w-4xl mx-auto h-full"><OrderHistory orders={clientOrders} /></div>}
          {activeTab === 'about' && <AboutSection />}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto p-10 space-y-8 animate-in fade-in duration-500 h-full">
              <div className="text-center pb-8 border-b border-slate-50">
                <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm shadow-slate-100"><UserCircle className="w-12 h-12 text-slate-300" /></div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Meus Dados Operacionais</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest italic">{user.email}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoCard label="Razão Social" value={user.name} />
                <InfoCard label="Documento de Cadastro" value={user.cpfCnpj} />
                <InfoCard label="Fone / WhatsApp" value={user.phone} />
                <InfoCard label="Endereço de Entrega" value={user.address} />
              </div>
              <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl flex items-center justify-between text-white relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:rotate-12 transition-transform"><ShieldCheck className="w-32 h-32" /></div>
                <div className="relative z-10">
                  <h4 className="text-xs font-black uppercase tracking-widest">Segurança de Acesso</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gerencie seu código secreto</p>
                </div>
                <button onClick={() => setShowPasswordModal(true)} className="relative z-10 px-8 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-600/20">Trocar Senha</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {cartCount > 0 && activeTab !== 'cart' && (
        <button
          onClick={() => setActiveTab('cart')}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center animate-in zoom-in slide-in-from-bottom-10 duration-300 hover:scale-110 active:scale-95 transition-transform group"
        >
          <ShoppingCart className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] font-black min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-bounce" key={cartCount}>
            {cartCount}
          </span>
        </button>
      )}

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { alert("Mínimo 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { alert("Divergência nas senhas."); return; }
    setLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        alert("Senha atualizada com sucesso!");
        onClose();
      }
    } catch (err: any) {
      alert("Por segurança, saia do sistema e entre novamente para concluir esta alteração.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
      <div className="absolute inset-0" onClick={() => !loading && onClose()} />
      <div className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <div className="p-8 bg-slate-50 border-b flex items-center justify-between text-center">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest w-full">Segurança de Primeiro Acesso</h3>
          <button onClick={onClose} className="absolute right-6 top-7 text-slate-400 hover:text-red-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleUpdate} className="p-10 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha Alfanumérica</label>
            <input type="password" required className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-bold text-xs shadow-inner" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar nova Senha</label>
            <input type="password" required className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[20px] outline-none font-bold text-xs shadow-inner" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full py-5 bg-red-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-red-100 rounded-2xl active:scale-95 transition-all">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirmar Mudança"}
          </button>
        </form>
      </div>
    </div>
  );
};

const SideMenuButton: React.FC<{ active: boolean; onClick: () => void; icon: any; label: string; count?: number; }> = ({ active, onClick, icon: Icon, label, count }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${active ? 'bg-red-600 text-white shadow-xl shadow-red-100' : 'text-slate-500 hover:bg-slate-50'}`}>
    <div className="relative">
      <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
      {count !== undefined && count > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-red-600 text-[8px] font-black rounded-full flex items-center justify-center border border-red-100 shadow-sm">{count}</span>}
    </div>
    <span className="text-[11px] font-black uppercase tracking-widest flex-1 text-left">{label}</span>
    <ChevronRight className={`w-4 h-4 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
  </button>
);

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col group transition-all hover:bg-white hover:border-red-100 shadow-sm">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 transition-colors group-hover:text-red-500">{label}</span>
    <span className="text-xs font-bold text-slate-800 break-words uppercase">{value || 'Não cadastrado'}</span>
  </div>
);

export default ClientDashboard;
