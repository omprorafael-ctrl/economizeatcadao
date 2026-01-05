
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
  Activity,
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
  UserPlus,
  MapPin,
  Mail,
  Building2,
  Lock,
  Key,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  ClipboardCheck,
  EyeOff,
  UserCircle,
  Filter,
  ChevronDown,
  Send
} from 'lucide-react';
import { db, firebaseConfig, auth } from '../../firebaseConfig';
import { doc, updateDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import { can, PermissionAction } from '../../utils/permissions';
import { isValidCpfCnpj } from '../../utils/validators';

interface SellerDashboardProps {
  user: Seller;
  orders: Order[];
  clients: ClientData[];
  onLogout: () => void;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user, orders, clients, onLogout }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'portfolio' | 'history' | 'clients' | 'profile'>('portfolio');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal de confirmação para ações críticas (Faturar/Cancelar)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'CANCEL' | 'INVOICE' | 'SEND' | null;
    orderId: string | null;
  }>({ isOpen: false, type: null, orderId: null });
  const [cancelReason, setCancelReason] = useState('');

  const [showClientModal, setShowClientModal] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: '', email: '', password: '', cpfCnpj: '', phone: '', address: ''
  });

  const myOrders = useMemo(() => orders.filter(o => o.sellerId === user.id), [orders, user.id]);

  const displayedOrders = useMemo(() => {
    let base = [];
    if (activeTab === 'portfolio') {
      base = myOrders.filter(o => 
        o.status !== OrderStatus.INVOICED && 
        o.status !== OrderStatus.CANCELLED && 
        o.status !== OrderStatus.FINISHED
      );
    } else {
      base = myOrders.filter(o => 
        o.status === OrderStatus.INVOICED || 
        o.status === OrderStatus.CANCELLED || 
        o.status === OrderStatus.FINISHED
      );
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

  // Função para abrir o modal de confirmação
  const handleRequestAction = (orderId: string, type: 'CANCEL' | 'INVOICE' | 'SEND') => {
    let permission: PermissionAction = 'order_status_invoiced';
    if (type === 'CANCEL') permission = 'order_status_cancelled';
    
    if (!can(user.role, permission)) {
      alert("Acesso Negado: Seu perfil não tem permissão para realizar esta ação.");
      return;
    }

    setCancelReason('');
    setActionModal({ isOpen: true, type, orderId });
  };

  // Função disparada pelo botão "Confirmar" dentro do Modal
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
    let requiredPermission: PermissionAction | null = null;
    
    switch (newStatus) {
      case OrderStatus.IN_PROGRESS: requiredPermission = 'order_status_in_progress'; break;
      case OrderStatus.INVOICED: requiredPermission = 'order_status_invoiced'; break;
      case OrderStatus.CANCELLED: requiredPermission = 'order_status_cancelled'; break;
      case OrderStatus.SENT: requiredPermission = 'order_status_invoiced'; break;
      default: break;
    }

    if (requiredPermission && !can(user.role, requiredPermission)) {
      alert(`Acesso Negado.`);
      return;
    }

    setUpdatingId(id);
    try {
      const orderRef = doc(db, 'orders', id);
      const now = new Date().toISOString();
      const updateData: any = { status: newStatus };
      
      if (reason) updateData.cancelReason = reason;

      // Lógica de SLA e Notificações
      if (newStatus === OrderStatus.IN_PROGRESS) {
        updateData.receivedAt = now; // Marco zero do atendimento
        await addDoc(collection(db, 'notifications'), {
          title: 'Atendimento Iniciado',
          message: `${user.name} lançou o pedido #${id}`,
          type: 'order_received',
          read: false,
          createdAt: now,
          orderId: id
        });
      } else if (newStatus === OrderStatus.SENT) {
        await addDoc(collection(db, 'notifications'), {
          title: 'Pedido Enviado',
          message: `O pedido #${id} foi despachado por ${user.name}`,
          type: 'info',
          read: false,
          createdAt: now,
          orderId: id
        });
      } else if (newStatus === OrderStatus.INVOICED) {
        updateData.invoicedAt = now; // Fim do SLA
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
      console.error("Erro ao atualizar status:", error);
      alert(`Erro no servidor.`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getClientInfo = (clientId: string) => clients.find(c => c.id === clientId);

  const statusMap = {
    [OrderStatus.GENERATED]: { label: 'Novo Pedido', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Clock },
    [OrderStatus.IN_PROGRESS]: { label: 'Recebido', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: ClipboardCheck },
    [OrderStatus.INVOICED]: { label: 'Faturado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
    [OrderStatus.CANCELLED]: { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-100', icon: XCircle },
    [OrderStatus.SENT]: { label: 'Enviado', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: Send },
    [OrderStatus.FINISHED]: { label: 'Concluído', color: 'bg-slate-50 text-slate-400', icon: CheckCircle2 },
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-10 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg" onClick={() => setActiveTab('portfolio')}>
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div className="hidden xs:block">
            <h1 className="text-lg font-black text-slate-900 uppercase leading-none tracking-tighter">Canal de Vendas</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Operador: {user.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
            <input 
              type="text" placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-red-300 transition-all shadow-inner"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setActiveTab('profile')} className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${activeTab === 'profile' ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>
            <User className="w-5 h-5" />
          </button>
          <button onClick={onLogout} className="p-3 text-slate-400 hover:text-red-600 rounded-2xl"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 px-6 sm:px-10 flex gap-8 shrink-0 overflow-x-auto scrollbar-hide">
        <TabBtn active={activeTab === 'portfolio'} onClick={() => setActiveTab('portfolio')} icon={Briefcase} label="Em Carteira" />
        <TabBtn active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={History} label="Histórico" />
        <TabBtn active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} icon={Users} label="Clientes" />
      </div>

      <main className="flex-1 overflow-auto p-4 sm:p-8 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {activeTab !== 'profile' && (
            <div className="flex justify-between items-center px-2">
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                {activeTab === 'portfolio' ? 'Pedidos Ativos' : activeTab === 'history' ? 'Finalizados' : 'Base de Clientes'}
              </h2>
              {activeTab === 'portfolio' || activeTab === 'history' ? (
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest outline-none">
                  <option value="all">Filtro Status</option>
                  {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                </select>
              ) : null}
            </div>
          )}

          {activeTab === 'clients' ? (
            <div className="grid grid-cols-1 gap-4">
              {displayedClients.map(client => (
                <div key={client.id} className="bg-white rounded-[32px] border border-slate-100 p-6 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-xl text-slate-400 uppercase border border-slate-100">{client.name.charAt(0)}</div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase">{client.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{client.cpfCnpj}</p>
                    </div>
                  </div>
                  <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100"><MessageCircle className="w-5 h-5" /></a>
                </div>
              ))}
            </div>
          ) : activeTab === 'profile' ? (
            <div className="p-8 bg-white rounded-[40px] border border-slate-100 text-center space-y-6">
               <UserCircle className="w-20 h-20 text-slate-200 mx-auto" />
               <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">{user.name}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">ID Operador: {user.id.slice(-6)}</p>
               </div>
               <button onClick={() => setShowPasswordModal(true)} className="px-8 py-3 bg-red-600 text-white font-black text-[10px] uppercase rounded-2xl">Trocar Senha</button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedOrders.map(order => {
                const status = statusMap[order.status] || statusMap[OrderStatus.GENERATED];
                const isUpdating = updatingId === order.id;
                return (
                  <div key={order.id} className="bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-xl transition-all">
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
                        <button onClick={() => setSelectedOrder(order)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl"><Eye className="w-5 h-5" /></button>
                        {activeTab === 'portfolio' && (
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

      {/* MODAL DE CONFIRMAÇÃO PARA FATURAR/CANCELAR */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-slate-100">
            <div className={`p-6 flex items-center gap-4 ${actionModal.type === 'CANCEL' ? 'bg-red-50' : actionModal.type === 'SEND' ? 'bg-purple-50' : 'bg-emerald-50'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${actionModal.type === 'CANCEL' ? 'bg-red-600 text-white' : actionModal.type === 'SEND' ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'}`}>
                {actionModal.type === 'CANCEL' ? <Ban className="w-6 h-6" /> : actionModal.type === 'SEND' ? <Send className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">
                  {actionModal.type === 'CANCEL' ? 'Confirmar Cancelamento' : actionModal.type === 'SEND' ? 'Confirmar Envio' : 'Confirmar Faturamento'}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Pedido #{actionModal.orderId}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {actionModal.type === 'CANCEL' ? (
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Motivo do Cancelamento</label>
                  <textarea 
                    autoFocus value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ex: Produto em falta no estoque..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-300 text-xs font-bold resize-none"
                    rows={3}
                  />
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-600 leading-relaxed">Você deseja confirmar o status deste pedido? Esta ação notificará o sistema e atualizará o fluxo financeiro.</p>
              )}
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => setActionModal({ isOpen: false, type: null, orderId: null })} className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200">Voltar</button>
                <button onClick={confirmAction} className={`flex-1 py-3.5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg ${actionModal.type === 'CANCEL' ? 'bg-red-600 shadow-red-200' : actionModal.type === 'SEND' ? 'bg-purple-600 shadow-purple-200' : 'bg-emerald-600 shadow-emerald-200'}`}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-slate-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase leading-none">Pedido #{selectedOrder.id}</h2>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Dossiê de Conferência</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-3 bg-white hover:bg-red-50 text-slate-300 rounded-2xl border border-slate-100"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="p-6 bg-slate-100/50 rounded-3xl border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Cliente</p>
                <p className="text-sm font-black text-slate-800 uppercase">{selectedOrder.clientName}</p>
                {getClientInfo(selectedOrder.clientId) && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <a href={`tel:${getClientInfo(selectedOrder.clientId)?.phone}`} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                      <div className="bg-red-50 p-2 rounded-lg text-red-500"><Phone className="w-4 h-4" /></div>
                      <div><p className="text-[10px] font-black text-slate-700">{getClientInfo(selectedOrder.clientId)?.phone}</p></div>
                    </a>
                    <a href={`https://wa.me/${getClientInfo(selectedOrder.clientId)?.phone?.replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <div className="bg-emerald-500 p-2 rounded-lg text-white"><MessageCircle className="w-4 h-4" /></div>
                      <div><p className="text-[10px] font-black text-emerald-800">WhatsApp</p></div>
                    </a>
                  </div>
                )}
              </div>

              <div className="border border-slate-100 rounded-[30px] overflow-hidden">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-5 border-b border-slate-50 last:border-0 flex justify-between items-center hover:bg-slate-50/50">
                    <div><p className="text-xs font-black text-slate-800 uppercase">{item.description}</p><p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{item.quantity} un • R$ {item.unitPrice.toFixed(2).replace('.', ',')}</p></div>
                    <p className="text-xs font-black text-slate-900">R$ {item.subtotal.toFixed(2).replace('.', ',')}</p>
                  </div>
                ))}
              </div>

              <div className="p-8 rounded-[40px] bg-slate-900 text-white flex justify-between items-center shadow-2xl">
                <div><p className="text-[10px] font-black uppercase text-red-500 mb-1.5 tracking-widest">Faturamento</p><p className="text-4xl font-black tracking-tighter">R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</p></div>
                <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-white/10 border border-white/20`}>{(statusMap[selectedOrder.status] || {label: selectedOrder.status}).label}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </div>
  );
};

// --- Helper Components ---

const ActionBtn = ({ 
  disabled, onClick, label, icon: Icon, color 
}: { 
  disabled: boolean, onClick: () => void, label: string, icon: any, color: string 
}) => (
  <button
    disabled={disabled}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 flex-1 min-w-[50px] ${
      color
    } border-transparent hover:brightness-95 disabled:opacity-50`}
  >
    <Icon className="w-4 h-4" />
    <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const TabBtn = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button onClick={onClick} className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${active ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>
    <div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5" /> {label}</div>
    {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />}
  </button>
);

const NoItems = ({ icon: Icon, text }: { icon: any, text: string }) => (
  <div className="py-20 text-center flex flex-col items-center justify-center opacity-20">
    <Icon className="w-16 h-16 mb-4" />
    <p className="text-sm font-black uppercase tracking-widest text-slate-900">{text}</p>
  </div>
);

const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Mínimo 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { setError("Senhas diferentes."); return; }
    setLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        alert("Sucesso!");
        onClose();
      }
    } catch (err: any) {
      setError("Erro. Saia e entre novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Nova Senha</h3>
        <form onSubmit={handleUpdate} className="space-y-4">
          <input type={showPass ? "text" : "password"} required className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border border-slate-200" placeholder="Senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <input type={showPass ? "text" : "password"} required className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border border-slate-200" placeholder="Confirmar" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <button type="submit" disabled={loading} className="w-full py-4 bg-red-600 text-white font-black text-[10px] uppercase rounded-2xl">Salvar</button>
          <button type="button" onClick={onClose} className="w-full text-[9px] font-black uppercase text-slate-400">Cancelar</button>
        </form>
      </div>
    </div>
  );
};

export default SellerDashboard;
