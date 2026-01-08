
import React, { useState, useMemo } from 'react';
import { Seller, Order, OrderStatus, ClientData, UserRole } from '../../types';
import { 
  LogOut, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  X, 
  User, 
  CreditCard, 
  FileText, 
  Search,
  Check,
  Ban,
  Phone, 
  ArrowUpRight,
  History,
  MessageCircle,
  Briefcase,
  Loader2,
  AlertTriangle,
  Users,
  MapPin,
  Key,
  ClipboardCheck,
  UserCircle,
  Send,
  ChevronRight,
  Info
} from 'lucide-react';
import { db, auth } from '../../firebaseConfig';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { can, PermissionAction } from '../../utils/permissions';
import FiscalCoupon from '../Shared/FiscalCoupon';
import AboutSection from '../Shared/AboutSection';

interface SellerDashboardProps {
  user: Seller;
  orders: Order[];
  clients: ClientData[];
  onLogout: () => void;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user, orders, clients, onLogout }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'portfolio' | 'history' | 'clients' | 'profile' | 'about'>('portfolio');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'CANCEL' | 'INVOICE' | 'SEND' | null;
    orderId: string | null;
  }>({ isOpen: false, type: null, orderId: null });
  const [cancelReason, setCancelReason] = useState('');

  const myOrders = useMemo(() => orders.filter(o => o.sellerId === user.id), [orders, user.id]);

  const displayedOrders = useMemo(() => {
    let base = [];
    if (activeTab === 'portfolio') {
      base = myOrders.filter(o => 
        o.status !== OrderStatus.INVOICED && 
        o.status !== OrderStatus.CANCELLED && 
        o.status !== OrderStatus.FINISHED
      );
    } else if (activeTab === 'history') {
      base = myOrders.filter(o => 
        o.status === OrderStatus.INVOICED || 
        o.status === OrderStatus.CANCELLED || 
        o.status === OrderStatus.FINISHED
      );
    } else {
      return [];
    }

    return base.filter(o => {
      const matchesSearch = o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           o.id.includes(searchTerm.toUpperCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [myOrders, activeTab, searchTerm, statusFilter]);

  const displayedClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cpfCnpj && c.cpfCnpj.includes(searchTerm))
    );
  }, [clients, searchTerm]);

  const handleRequestAction = (orderId: string, type: 'CANCEL' | 'INVOICE' | 'SEND') => {
    setCancelReason('');
    setActionModal({ isOpen: true, type, orderId });
  };

  const confirmAction = async () => {
    if (!actionModal.orderId || !actionModal.type) return;

    if (actionModal.type === 'CANCEL' && !cancelReason.trim()) {
      alert("Por favor, informe o motivo do cancelamento.");
      return;
    }

    let newStatus = OrderStatus.INVOICED;
    if (actionModal.type === 'CANCEL') newStatus = OrderStatus.CANCELLED;
    if (actionModal.type === 'SEND') newStatus = OrderStatus.SENT;

    await executeUpdate(actionModal.orderId, newStatus, cancelReason);
    setActionModal({ isOpen: false, type: null, orderId: null });
  };

  const executeUpdate = async (id: string, newStatus: OrderStatus, reason: string | null = null) => {
    setUpdatingId(id);
    try {
      const orderRef = doc(db, 'orders', id);
      const targetOrder = orders.find(o => o.id === id);
      if (!targetOrder) return;

      const now = new Date().toISOString();
      const updateData: any = { status: newStatus };
      
      if (reason) updateData.cancelReason = reason;

      if (newStatus === OrderStatus.IN_PROGRESS) {
        updateData.receivedAt = now;
        await addDoc(collection(db, 'notifications'), {
          title: 'Pedido Recebido',
          message: `O vendedor ${user.name} iniciou o processamento do seu pedido #${id}`,
          type: 'order_status',
          read: false,
          createdAt: now,
          orderId: id,
          recipientId: targetOrder.clientId
        });
      } else if (newStatus === OrderStatus.SENT) {
        await addDoc(collection(db, 'notifications'), {
          title: 'Rota de Entrega',
          message: `Excelente notícia! Seu pedido #${id} já saiu para entrega.`,
          type: 'order_status',
          read: false,
          createdAt: now,
          orderId: id,
          recipientId: targetOrder.clientId
        });
      } else if (newStatus === OrderStatus.INVOICED) {
        updateData.invoicedAt = now;
        await addDoc(collection(db, 'notifications'), {
          title: 'Pedido Faturado',
          message: `Seu pedido #${id} acaba de ser faturado. Preparando para o envio!`,
          type: 'order_status',
          read: false,
          createdAt: now,
          orderId: id,
          recipientId: targetOrder.clientId
        });
      } else if (newStatus === OrderStatus.CANCELLED) {
        await addDoc(collection(db, 'notifications'), {
          title: 'Pedido Cancelado',
          message: `O pedido #${id} foi cancelado. Motivo: ${reason}`,
          type: 'order_cancelled',
          read: false,
          createdAt: now,
          orderId: id,
          recipientId: targetOrder.clientId
        });
      }

      await updateDoc(orderRef, updateData);
      
      if (selectedOrder?.id === id) {
        if (newStatus === OrderStatus.INVOICED || newStatus === OrderStatus.CANCELLED) {
          setSelectedOrder(null);
        } else {
          setSelectedOrder(prev => prev ? { ...prev, ...updateData } : null);
        }
      }
    } catch (error: any) {
      console.error("Erro ao atualizar pedido:", error);
      alert("Falha ao salvar no banco de dados.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getClientInfo = (clientId: string) => clients.find(c => c.id === clientId);

  const statusMap = {
    [OrderStatus.GENERATED]: { label: 'Novo', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Clock },
    [OrderStatus.IN_PROGRESS]: { label: 'Lançado', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: ClipboardCheck },
    [OrderStatus.INVOICED]: { label: 'Faturado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
    [OrderStatus.CANCELLED]: { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-100', icon: XCircle },
    [OrderStatus.SENT]: { label: 'Enviado', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: Send },
    [OrderStatus.FINISHED]: { label: 'Concluído', color: 'bg-slate-50 text-slate-400', icon: CheckCircle2 },
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden relative">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-10 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer" onClick={() => setActiveTab('portfolio')}>
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div className="hidden xs:block">
            <h1 className="text-lg font-black text-slate-900 uppercase leading-none tracking-tighter">Economize Atacadão</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Vendedor: {user.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
            <input 
              type="text" placeholder="Pesquisar..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-red-300 transition-all shadow-inner"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setActiveTab('profile')} className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${activeTab === 'profile' ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>
            <User className="w-5 h-5" />
          </button>
          <button onClick={onLogout} className="p-3 text-slate-400 hover:text-red-600 transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 px-6 sm:px-10 flex gap-8 shrink-0 overflow-x-auto scrollbar-hide">
        <TabBtn active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')} icon={Briefcase} label="Em Carteira" />
        <TabBtn active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Histórico" />
        <TabBtn active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={Users} label="Clientes" />
        <TabBtn active={activeTab === 'about'} onClick={() => setActiveTab('about')} icon={Info} label="Sobre" />
      </div>

      <main className="flex-1 overflow-auto p-4 sm:p-8 pb-24 h-full">
        <div className="max-w-4xl mx-auto h-full">
          {activeTab === 'about' && <AboutSection />}

          {activeTab === 'clients' && (
            <div className="grid grid-cols-1 gap-4">
              {displayedClients.map(client => (
                <div key={client.id} className="bg-white rounded-[32px] border border-slate-100 p-6 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-xl text-slate-400 uppercase border border-slate-100">{client.name.charAt(0)}</div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase">{client.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{client.cpfCnpj}</p>
                    </div>
                  </div>
                  <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 transition-colors"><MessageCircle className="w-5 h-5" /></a>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-10 bg-white rounded-[40px] border border-slate-100 text-center space-y-6 shadow-md">
               <div className="w-24 h-24 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-100 shadow-inner">
                  <UserCircle className="w-12 h-12" />
               </div>
               <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{user.name}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest italic">{user.email}</p>
               </div>
               <div className="pt-4">
                  <button onClick={() => setShowPasswordModal(true)} className="px-10 py-3.5 bg-red-600 text-white font-black text-[10px] uppercase rounded-2xl hover:bg-red-700 transition-all shadow-xl">Configurar Senha</button>
               </div>
            </div>
          )}

          {(activeTab === 'portfolio' || activeTab === 'history') && (
            <div className="space-y-4">
              {displayedOrders.map(order => {
                const status = statusMap[order.status] || statusMap[OrderStatus.GENERATED];
                const isUpdating = updatingId === order.id;
                const canViewCoupon = order.status === OrderStatus.INVOICED || order.status === OrderStatus.SENT || order.status === OrderStatus.FINISHED;

                return (
                  <div key={order.id} className="bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-colors shrink-0 ${status.color}`}>
                        {isUpdating ? <Loader2 className="w-7 h-7 animate-spin" /> : React.createElement(status.icon, { className: "w-7 h-7" })}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black text-red-600 tracking-widest italic uppercase">#{order.id}</span>
                        <h3 className="text-sm font-bold text-slate-800 uppercase truncate mt-0.5">{order.clientName}</h3>
                        <div className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black uppercase mt-1.5 border ${status.color}`}>{status.label}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Total</p>
                        <p className="font-black text-slate-900 text-lg tracking-tighter">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedOrder(order)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl border border-slate-100"><Eye className="w-5 h-5" /></button>
                        {activeTab === 'portfolio' ? (
                          <div className="flex items-center gap-1.5 bg-slate-50/50 p-1 rounded-2xl border border-slate-100">
                             {order.status === OrderStatus.GENERATED && (
                               <ActionBtn disabled={isUpdating} onClick={() => executeUpdate(order.id, OrderStatus.IN_PROGRESS)} label="Lançar" icon={ClipboardCheck} color="text-amber-600 bg-amber-50" />
                             )}
                             {order.status === OrderStatus.IN_PROGRESS && (
                               <ActionBtn disabled={isUpdating} onClick={() => handleRequestAction(order.id, 'SEND')} label="Enviar" icon={Send} color="text-purple-600 bg-purple-50" />
                             )}
                             <ActionBtn disabled={isUpdating} onClick={() => handleRequestAction(order.id, 'INVOICE')} label="Faturar" icon={Check} color="text-emerald-600 bg-emerald-50" />
                             <ActionBtn disabled={isUpdating} onClick={() => handleRequestAction(order.id, 'CANCEL')} label="Cancelar" icon={Ban} color="text-red-600 bg-red-50" />
                          </div>
                        ) : (
                          canViewCoupon && (
                            <button 
                              onClick={() => setSelectedCoupon(order)}
                              className="text-red-600 text-[9px] font-black uppercase tracking-widest hover:text-red-700 flex items-center gap-1.5 px-4 py-2 bg-red-50 rounded-xl transition-all border border-red-100"
                            >
                              Ver Cupom <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Action Modal de Confirmação */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl border border-white/20">
            <div className={`p-8 flex flex-col items-center text-center gap-4 ${actionModal.type === 'CANCEL' ? 'bg-red-50' : 'bg-emerald-50'}`}>
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg ${actionModal.type === 'CANCEL' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                {actionModal.type === 'CANCEL' ? <Ban className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">
                  {actionModal.type === 'CANCEL' ? 'Confirmar Cancelamento' : 'Confirmar Faturamento'}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">PEDIDO #{actionModal.orderId}</p>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              {actionModal.type === 'CANCEL' ? (
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-3 block tracking-widest ml-1">Motivo do Cancelamento</label>
                  <textarea 
                    autoFocus value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Informe o motivo da exclusão..."
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none focus:bg-white focus:border-red-300 text-xs font-bold resize-none shadow-inner"
                    rows={3}
                  />
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-500 leading-relaxed text-center uppercase tracking-tight">Você confirma que este pedido foi faturado e enviado para a logística?</p>
              )}
              
              <div className="flex flex-col gap-3">
                <button onClick={confirmAction} className={`w-full py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-transform active:scale-95 ${actionModal.type === 'CANCEL' ? 'bg-red-600' : 'bg-emerald-600'}`}>Confirmar Ação</button>
                <button onClick={() => setActionModal({ isOpen: false, type: null, orderId: null })} className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-colors">Voltar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-slate-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><FileText className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase leading-none tracking-tighter">Pedido #{selectedOrder.id}</h2>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest italic">Conferência Operacional</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-3 bg-white hover:bg-red-50 text-slate-300 rounded-2xl border border-slate-100 shadow-sm transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <div className="p-6 bg-slate-100/50 rounded-3xl border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><UserCircle className="w-4 h-4 text-red-500" /> Cliente / Razão</p>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedOrder.clientName}</p>
              </div>

              <div className="space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Produtos Listados</p>
                 <div className="border border-slate-100 rounded-[32px] overflow-hidden shadow-sm bg-white">
                   {selectedOrder.items.map((item, idx) => (
                     <div key={idx} className="p-5 border-b border-slate-50 last:border-0 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                       <div><p className="text-xs font-black text-slate-800 uppercase leading-tight">{item.description}</p><p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">{item.quantity} unidades • R$ {item.unitPrice.toFixed(2).replace('.', ',')} / un</p></div>
                       <p className="text-xs font-black text-slate-900 tracking-tighter">R$ {item.subtotal.toFixed(2).replace('.', ',')}</p>
                     </div>
                   ))}
                 </div>
              </div>

              <div className="p-8 rounded-[40px] bg-slate-900 text-white flex justify-between items-center shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase text-red-500 mb-2 tracking-[0.2em]">Faturamento Total</p>
                  <p className="text-4xl font-black tracking-tighter">R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className={`relative z-10 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-white/10 border border-white/20`}>{(statusMap[selectedOrder.status] || {label: selectedOrder.status}).label}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCoupon && (
        <FiscalCoupon order={selectedCoupon} onClose={() => setSelectedCoupon(null)} />
      )}

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

const ActionBtn = ({ 
  disabled, onClick, label, icon: Icon, color 
}: { 
  disabled: boolean, onClick: () => void, label: string, icon: any, color: string 
}) => (
  <button
    disabled={disabled}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`p-2.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 flex-1 min-w-[60px] ${
      color
    } border-transparent hover:brightness-95 active:scale-90 disabled:opacity-50`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const TabBtn = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button onClick={onClick} className={`py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${active ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>
    <div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5" /> {label}</div>
    {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full shadow-lg" />}
  </button>
);

const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { alert("Mínimo 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { alert("Senhas diferentes."); return; }
    setLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        alert("Senha atualizada!");
        onClose();
      }
    } catch (err: any) {
      alert("Erro de segurança. Por favor, saia do sistema e entre novamente para trocar a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60">
      <div className="relative bg-white w-full max-sm rounded-[40px] shadow-2xl p-10 space-y-8 animate-in zoom-in-95">
        <div className="text-center">
           <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4"><Key className="w-7 h-7 text-slate-300" /></div>
           <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Novo Acesso</h3>
        </div>
        <form onSubmit={handleUpdate} className="space-y-4">
          <input type="password" required className="w-full p-5 bg-slate-50 rounded-[20px] text-xs font-bold border border-slate-100 outline-none focus:bg-white focus:border-red-200 transition-all shadow-inner" placeholder="Senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <input type="password" required className="w-full p-5 bg-slate-50 rounded-[20px] text-xs font-bold border border-slate-100 outline-none focus:bg-white focus:border-red-200 transition-all shadow-inner" placeholder="Confirmar" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full py-4.5 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl hover:bg-red-700 transition-all">Salvar</button>
          <button type="button" onClick={onClose} className="w-full text-[9px] font-black uppercase text-slate-400 tracking-widest pt-2">Voltar</button>
        </form>
      </div>
    </div>
  );
};

export default SellerDashboard;
