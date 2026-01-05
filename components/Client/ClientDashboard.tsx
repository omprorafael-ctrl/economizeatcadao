
import React, { useState, useEffect } from 'react';
import { ClientData, Product, Order, CartItem, OrderStatus, Seller } from '../../types';
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
  Loader2 
} from 'lucide-react';
import Catalog from './Catalog';
import Cart from './Cart';
import OrderHistory from './OrderHistory';
import { auth, db } from '../../firebaseConfig';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

interface ClientDashboardProps {
  user: ClientData;
  products: Product[];
  orders: Order[];
  sellers: Seller[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onLogout: () => void;
}

type TabType = 'catalog' | 'cart' | 'history' | 'profile';

const ClientDashboard: React.FC<ClientDashboardProps> = ({ 
  user, products, orders, sellers, setOrders, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('catalog');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);

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

      if (isIosDevice) {
        setShowInstallBanner(true);
      }
    }
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
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
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const clientOrders = orders.filter(o => o.clientId === user.id);
  const promoItems = products.filter(p => p.onSale && p.active);

  const isImmersive = activeTab === 'catalog' || activeTab === 'cart';

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-slate-800 overflow-hidden">
      
      {/* Banner de Instalação PWA */}
      {showInstallBanner && (
        <div className="fixed top-0 inset-x-0 z-[60] animate-in slide-in-from-top duration-500">
           <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-red-600 shadow-xl">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-red-600 flex items-center justify-center rounded-none shrink-0">
                    <Download className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Aplicativo Atacadão</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                       {isIos ? "Toque em 'Compartilhar' > 'Adicionar à Tela de Início'" : "Instale para uma experiência mais rápida"}
                    </p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 {!isIos && (
                   <button 
                     onClick={handleInstallApp}
                     className="px-4 py-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-none"
                   >
                     Instalar
                   </button>
                 )}
                 <button onClick={() => setShowInstallBanner(false)} className="p-2 text-slate-500"><X className="w-4 h-4" /></button>
              </div>
           </div>
        </div>
      )}

      {/* Header Minimalista com Cesta Superior */}
      <header className={`bg-white border-b border-slate-50 sticky top-0 z-40 transition-all duration-300 ${isImmersive ? 'py-3' : 'py-4'}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSideMenu(true)}
                className="p-2 -ml-2 text-slate-400 hover:text-red-600 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('catalog')}>
                <div className="w-8 h-8 bg-red-600 rounded-none flex items-center justify-center shadow-lg shadow-red-100">
                  <PackageSearch className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-base font-black text-slate-900 tracking-tighter leading-none hidden xs:block uppercase">ATACADÃO</h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-red-500 relative"
              >
                <Bell className="w-5 h-5" />
                {promoItems.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full border-2 border-white" />}
              </button>

              {/* Ícone da Cesta no Topo */}
              <button 
                onClick={() => setActiveTab('cart')}
                className={`p-2 transition-colors relative ${activeTab === 'cart' ? 'text-red-600' : 'text-slate-400 hover:text-red-600'}`}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
              
              <div className="w-9 h-9 rounded-none bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-black text-xs cursor-pointer hover:border-red-200 transition-colors ml-1" onClick={() => setActiveTab('profile')}>
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Side Menu Drawer */}
      {showSideMenu && (
        <div className="fixed inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowSideMenu(false)} />
          <div className="relative bg-white w-72 h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col rounded-none">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600 rounded-none flex items-center justify-center text-white">
                    <UserCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Olá, Parceiro</p>
                    <p className="text-xs font-black text-slate-800 truncate max-w-[120px] uppercase">{user.name.split(' ')[0]}</p>
                  </div>
               </div>
               <button onClick={() => setShowSideMenu(false)} className="p-2 text-slate-300 hover:text-red-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 p-4 space-y-2">
               <SideMenuButton active={activeTab === 'catalog'} onClick={() => { setActiveTab('catalog'); setShowSideMenu(false); }} icon={List} label="Catálogo de Produtos" />
               <SideMenuButton active={activeTab === 'cart'} onClick={() => { setActiveTab('cart'); setShowSideMenu(false); }} icon={ShoppingCart} label="Minha Cesta de Itens" count={cartCount} />
               <SideMenuButton active={activeTab === 'history'} onClick={() => { setActiveTab('history'); setShowSideMenu(false); }} icon={History} label="Histórico de Pedidos" />
               <SideMenuButton active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setShowSideMenu(false); }} icon={User} label="Meus Dados Cadastrais" />
            </div>

            <div className="p-6 border-t border-slate-50 space-y-4">
              <div className="bg-slate-50 p-4 rounded-none border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">CNPJ do Cliente</p>
                <p className="text-[11px] font-bold text-slate-600">{user.cpfCnpj}</p>
              </div>
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-none transition-all">
                <LogOut className="w-4 h-4" /> Sair do Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto scrollbar-hide">
          {activeTab === 'catalog' && <Catalog products={products} onAddToCart={addToCart} />}
          {activeTab === 'cart' && (
            <div className="h-full">
              <Cart cart={cart} user={user} sellers={sellers} updateQuantity={updateQuantity} removeFromCart={removeFromCart} onUpdatePrice={updateItemPrice} onOrderCreated={() => { setCart([]); setActiveTab('history'); }} />
            </div>
          )}
          {activeTab === 'history' && (
            <div className="max-w-4xl mx-auto h-full px-4 sm:px-0">
              <OrderHistory orders={clientOrders} />
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto p-8 space-y-8 animate-in fade-in duration-500 h-full">
              <div className="text-center pb-8 border-b border-slate-50">
                <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-none flex items-center justify-center mx-auto mb-4 shadow-sm"><UserCircle className="w-10 h-10 text-slate-300" /></div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Meus Dados</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoCard label="Razão Social" value={user.name} />
                <InfoCard label="CNPJ / CPF" value={user.cpfCnpj} />
                <InfoCard label="E-mail" value={user.email} />
                <InfoCard label="Telefone" value={user.phone} />
                <div className="sm:col-span-2"><InfoCard label="Endereço" value={user.address} /></div>
              </div>

              <div className="bg-white p-6 rounded-none border border-slate-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-none flex items-center justify-center">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Segurança da Conta</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gerencie sua senha de acesso</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="px-6 py-2.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-none hover:bg-black transition-all"
                >
                  Alterar Senha
                </button>
              </div>

              <button onClick={onLogout} className="w-full py-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-none text-[11px] font-black uppercase tracking-widest border border-red-100">Sair do Sistema</button>
            </div>
          )}
        </div>
      </main>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

/* --- Componentes Auxiliares --- */

const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        // Também atualizar no Firestore para histórico (opcional/conforme regra de negócio)
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { password: newPassword });
        alert("Senha atualizada com sucesso!");
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError("Por segurança, saia do aplicativo e entre novamente para trocar a senha.");
      } else {
        setError("Erro ao atualizar senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
      <div className="absolute inset-0" onClick={() => !loading && onClose()} />
      <div className="relative bg-white w-full max-w-sm rounded-none shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Nova Senha</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          {error && <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest bg-red-50 p-2 border border-red-100">{error}</p>}
          
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type={showPass ? "text" : "password"} 
                required 
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-none outline-none font-bold text-xs" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type={showPass ? "text" : "password"} 
                required 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-none outline-none font-bold text-xs" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Alteração"}
          </button>
        </form>
      </div>
    </div>
  );
};

interface SideMenuButtonProps {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  count?: number;
}

const SideMenuButton: React.FC<SideMenuButtonProps> = ({ active, onClick, icon: Icon, label, count }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-5 py-4 rounded-none transition-all ${active ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
  >
    <div className="relative">
      <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
      {count !== undefined && count > 0 && (
        <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 text-white text-[8px] font-black rounded-none flex items-center justify-center border border-white shadow-sm">
          {count}
        </span>
      )}
    </div>
    <span className="text-xs font-black uppercase tracking-widest flex-1 text-left">{label}</span>
    <ChevronRight className={`w-4 h-4 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`} />
  </button>
);

const InfoCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-slate-50 p-5 rounded-none border border-slate-100 flex flex-col group transition-all hover:bg-white hover:border-red-100 shadow-sm">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 group-hover:text-red-400 transition-colors">{label}</span>
    <span className="text-xs font-bold text-slate-800 break-words">{value || '---'}</span>
  </div>
);

export default ClientDashboard;
