
import React, { useState } from 'react';
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
  ClipboardCheck
} from 'lucide-react';
import { db, firebaseConfig } from '../../firebaseConfig';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { can, PermissionAction } from '../../utils/permissions';

interface SellerDashboardProps {
  user: Seller;
  orders: Order[];
  clients: ClientData[];
  onLogout: () => void;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user, orders, clients, onLogout }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'portfolio' | 'history' | 'clients'>('portfolio');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Estados para Modais de Ação
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'CANCEL' | 'INVOICE' | null;
    orderId: string | null;
  }>({ isOpen: false, type: null, orderId: null });
  const [cancelReason, setCancelReason] = useState('');

  // States para Cadastro de Cliente
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    password: '',
    cpfCnpj: '',
    phone: '',
    address: ''
  });

  // --- Lógica de Pedidos ---
  const myOrders = orders.filter(o => o.sellerId === user.id);

  const portfolioOrders = myOrders.filter(o => 
    o.status !== OrderStatus.INVOICED && 
    o.status !== OrderStatus.CANCELLED && 
    o.status !== OrderStatus.FINISHED
  );

  const historyOrders = myOrders.filter(o => 
    o.status === OrderStatus.INVOICED || 
    o.status === OrderStatus.CANCELLED || 
    o.status === OrderStatus.FINISHED
  );

  const displayedOrders = (activeTab === 'portfolio' ? portfolioOrders : historyOrders).filter(o => 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.id.includes(searchTerm.toUpperCase())
  );

  // Filtra clientes para exibição
  const displayedClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cpfCnpj && c.cpfCnpj.includes(searchTerm))
  );

  // Abre o modal de confirmação (Faturar ou Cancelar)
  const handleRequestAction = (orderId: string, type: 'CANCEL' | 'INVOICE') => {
    const permission = type === 'CANCEL' ? 'order_status_cancelled' : 'order_status_invoiced';
    if (!can(user.role, permission)) {
      alert("Acesso Negado: Seu perfil não tem permissão para realizar esta ação.");
      return;
    }

    setCancelReason('');
    setActionModal({ isOpen: true, type, orderId });
  };

  // Executa a ação confirmada pelo Modal
  const confirmAction = async () => {
    if (!actionModal.orderId || !actionModal.type) return;

    if (actionModal.type === 'CANCEL' && !cancelReason.trim()) {
      alert("Por favor, informe o motivo do cancelamento.");
      return;
    }

    const newStatus = actionModal.type === 'INVOICE' ? OrderStatus.INVOICED : OrderStatus.CANCELLED;
    
    // Chama a função centralizada de atualização
    await executeUpdate(actionModal.orderId, newStatus, cancelReason);
    
    // Fecha o modal após a tentativa
    setActionModal({ isOpen: false, type: null, orderId: null });
  };

  // Função CENTRALIZADA de atualização
  const executeUpdate = async (id: string, newStatus: OrderStatus, reason: string | null = null) => {
    console.log(`Iniciando atualização do pedido ${id} para status ${newStatus}`);
    
    let requiredPermission: PermissionAction | null = null;
    
    switch (newStatus) {
      case OrderStatus.IN_PROGRESS: requiredPermission = 'order_status_in_progress'; break;
      case OrderStatus.INVOICED: requiredPermission = 'order_status_invoiced'; break;
      case OrderStatus.CANCELLED: requiredPermission = 'order_status_cancelled'; break;
      default: break;
    }

    if (requiredPermission && !can(user.role, requiredPermission)) {
      alert(`Acesso Negado: Você não tem permissão para alterar o status.`);
      return;
    }

    setUpdatingId(id);
    try {
      const orderRef = doc(db, 'orders', id);
      const updateData: any = { status: newStatus };
      
      if (reason) {
        updateData.cancelReason = reason;
      }

      await updateDoc(orderRef, updateData);
      console.log(`Pedido ${id} atualizado com sucesso no Firestore.`);
      
      // Feedback visual se estiver em detalhes
      if (selectedOrder?.id === id) {
        if (newStatus === OrderStatus.INVOICED || newStatus === OrderStatus.CANCELLED) {
          setSelectedOrder(null);
        } else {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (error: any) {
      console.error("Erro fatal ao atualizar status:", error);
      // O erro 'No document to update' agora está mitigado pela mudança na ordem do spread no App.tsx
      alert(`Erro crítico ao salvar no servidor: ${error.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getClientInfo = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!can(user.role, 'create_client')) return;
    if (clientForm.password.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setClientLoading(true);
    let secondaryApp: any;
    try {
      secondaryApp = initializeApp(firebaseConfig, "ClientCreationBySeller");
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, clientForm.email, clientForm.password);
      const uid = userCredential.user.uid;
      
      const newClient: ClientData = { 
        id: uid, 
        name: clientForm.name.trim(), 
        email: clientForm.email.trim(), 
        role: UserRole.CLIENT, 
        active: true, 
        createdAt: new Date().toISOString(), 
        cpfCnpj: clientForm.cpfCnpj.trim(), 
        phone: clientForm.phone.trim(), 
        address: clientForm.address.trim() 
      };

      await setDoc(doc(db, 'users', uid), newClient);
      await signOut(secondaryAuth);
      alert("Cliente cadastrado com sucesso!");
      setClientForm({ name: '', email: '', password: '', cpfCnpj: '', phone: '', address: '' });
      setShowClientModal(false);
    } catch (error: any) {
      console.error("Erro ao criar cliente:", error);
      alert("Erro ao criar cliente: " + error.message);
    } finally {
      if (secondaryApp) try { await deleteApp(secondaryApp); } catch(e) {}
      setClientLoading(false);
    }
  };

  const statusMap = {
    [OrderStatus.GENERATED]: { label: 'Novo Pedido', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Clock },
    [OrderStatus.IN_PROGRESS]: { label: 'Recebido', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: ClipboardCheck },
    [OrderStatus.INVOICED]: { label: 'Faturado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
    [OrderStatus.CANCELLED]: { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-100', icon: XCircle },
    [OrderStatus.SENT]: { label: 'Enviado', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: Activity },
    [OrderStatus.FINISHED]: { label: 'Concluído', color: 'bg-slate-50 text-slate-400', icon: CheckCircle2 },
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-10 shrink-0 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-100">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div className="hidden xs:block">
            <h1 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">Canal de Vendas</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Operador: {user.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
            <input 
              type="text"
              placeholder={activeTab === 'clients' ? "Buscar cliente..." : "Buscar pedido..."}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-red-300 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={onLogout} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-slate-200 px-6 sm:px-10 flex gap-8 shrink-0 overflow-x-auto scrollbar-hide">
        <button onClick={() => setActiveTab('portfolio')} className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'portfolio' ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <div className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5" /> Em Carteira ({portfolioOrders.length})</div>
          {activeTab === 'portfolio' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('history')} className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'history' ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <div className="flex items-center gap-2"><History className="w-3.5 h-3.5" /> Histórico ({historyOrders.length})</div>
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />}
        </button>
        <button onClick={() => setActiveTab('clients')} className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'clients' ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'}`}>
          <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Meus Clientes ({clients.length})</div>
          {activeTab === 'clients' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />}
        </button>
      </div>

      <main className="flex-1 overflow-auto p-4 sm:p-8 scrollbar-hide pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
              {activeTab === 'portfolio' ? 'Pedidos Ativos' : activeTab === 'history' ? 'Finalizados' : 'Base de Clientes'}
            </h2>
            {activeTab === 'clients' && can(user.role, 'create_client') && (
              <button onClick={() => setShowClientModal(true)} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95">
                <UserPlus className="w-3.5 h-3.5" /> Novo Cliente
              </button>
            )}
          </div>

          <div className="space-y-4">
            {activeTab === 'clients' ? (
              displayedClients.length > 0 ? (
                displayedClients.map(client => (
                  <div key={client.id} className="bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 text-slate-500 font-bold text-xl uppercase">
                        {client.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-800 uppercase truncate">{client.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest flex items-center gap-2"><Building2 className="w-3 h-3" /> {client.cpfCnpj || 'Doc Pendente'}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {client.phone && (
                            <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-right">
                       <p className="text-[10px] text-slate-400 font-medium italic">{client.email}</p>
                       <div className="flex items-center gap-1 justify-end text-[10px] text-slate-500 font-bold"><MapPin className="w-3 h-3" /><span className="truncate max-w-[200px]">{client.address || 'Sem endereço'}</span></div>
                    </div>
                  </div>
                ))
              ) : <NoItems icon={Users} text="Nenhum cliente encontrado" />
            ) : (
              displayedOrders.length > 0 ? (
                displayedOrders.map(order => {
                  const status = statusMap[order.status] || statusMap[OrderStatus.GENERATED];
                  const client = getClientInfo(order.clientId);
                  const isUpdating = updatingId === order.id;

                  return (
                    <div key={order.id} className="bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-xl transition-all group">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-colors shrink-0 ${status.color}`}>
                          {isUpdating ? <Loader2 className="w-7 h-7 animate-spin" /> : React.createElement(status.icon, { className: "w-7 h-7" })}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                             <span className="text-[10px] font-black text-red-600 tracking-widest uppercase italic">#{order.id}</span>
                             <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${status.color}`}>{status.label}</span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-800 uppercase truncate mt-1">{order.clientName}</h3>
                          {client && (
                            <a href={`tel:${client.phone}`} className="text-[10px] text-slate-400 font-black mt-1.5 flex items-center gap-1.5 hover:text-emerald-600 transition-colors uppercase">
                              <Phone className="w-3 h-3" /> {client.phone}
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4">
                         <div className="text-center sm:text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Total Pedido</p>
                            <p className="font-black text-slate-900 text-lg tracking-tighter">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                         </div>
                         <div className="h-10 w-px bg-slate-100 mx-2 hidden lg:block" />
                         <div className="flex items-center gap-2 w-full sm:w-auto">
                           <button onClick={() => setSelectedOrder(order)} className="flex-1 sm:flex-none p-3.5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all flex items-center justify-center gap-2">
                             <Eye className="w-5 h-5" /><span className="text-[9px] font-black uppercase lg:hidden">Ver Detalhes</span>
                           </button>
                           {activeTab === 'portfolio' && (
                             <div className="flex items-center gap-1.5 bg-slate-50/50 p-1 rounded-2xl border border-slate-100 flex-1 sm:flex-none">
                               {can(user.role, 'order_status_in_progress') && (
                                 <ActionBtn disabled={isUpdating} onClick={() => executeUpdate(order.id, OrderStatus.IN_PROGRESS)} label="Receber" icon={ClipboardCheck} active={order.status === OrderStatus.IN_PROGRESS} color="text-amber-600 bg-amber-50 border-amber-100" />
                               )}
                               {can(user.role, 'order_status_invoiced') && (
                                 <ActionBtn disabled={isUpdating} onClick={() => handleRequestAction(order.id, 'INVOICE')} label="Faturar" icon={Check} active={order.status === OrderStatus.INVOICED} color="text-emerald-600 bg-emerald-50 border-emerald-100" />
                               )}
                               {can(user.role, 'order_status_cancelled') && (
                                 <ActionBtn disabled={isUpdating} onClick={() => handleRequestAction(order.id, 'CANCEL')} label="Cancelar" icon={Ban} active={order.status === OrderStatus.CANCELLED} color="text-red-600 bg-red-50 border-red-100" />
                               )}
                             </div>
                           )}
                         </div>
                      </div>
                    </div>
                  );
                })
              ) : <NoItems icon={ShoppingBag} text={`Nenhum pedido em ${activeTab === 'portfolio' ? 'carteira' : 'histórico'}`} />
            )}
          </div>
        </div>
      </main>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><FileText className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Pedido #{selectedOrder.id}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Dossiê Comercial do Item</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-3 bg-white hover:bg-red-50 text-slate-300 hover:text-red-600 border border-slate-100 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <div className="p-6 bg-slate-100/50 rounded-3xl border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2"><User className="w-3.5 h-3.5" /> Razão Social</p>
                     <p className="text-sm font-black text-slate-800 uppercase">{selectedOrder.clientName}</p>
                   </div>
                   <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm"><Briefcase className="w-4 h-4 text-slate-400" /></div>
                </div>
                {getClientInfo(selectedOrder.clientId) && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <a href={`tel:${getClientInfo(selectedOrder.clientId)?.phone}`} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 hover:border-red-300 transition-all group">
                      <div className="bg-red-50 p-2 rounded-lg text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all"><Phone className="w-4 h-4" /></div>
                      <div><p className="text-[8px] font-black text-slate-400 uppercase">Ligar Agora</p><p className="text-[10px] font-black text-slate-700">{getClientInfo(selectedOrder.clientId)?.phone}</p></div>
                    </a>
                    <a href={`https://wa.me/${getClientInfo(selectedOrder.clientId)?.phone?.replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-all group">
                      <div className="bg-emerald-500 p-2 rounded-lg text-white"><MessageCircle className="w-4 h-4" /></div>
                      <div><p className="text-[8px] font-black text-emerald-600 uppercase">WhatsApp</p><p className="text-[10px] font-black text-emerald-800">Enviar Msg</p></div>
                    </a>
                  </div>
                )}
              </div>

              {selectedOrder.status === OrderStatus.CANCELLED && selectedOrder.cancelReason && (
                <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 animate-in fade-in">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-1" />
                  <div><p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Motivo do Cancelamento</p><p className="text-sm font-bold text-red-900 mt-1">{selectedOrder.cancelReason}</p></div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1"><h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Listagem de Produtos</h4><span className="text-[9px] font-black text-slate-400 uppercase">{selectedOrder.items.length} itens</span></div>
                <div className="border border-slate-100 rounded-[30px] overflow-hidden shadow-sm">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-5 border-b border-slate-50 last:border-0 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                      <div><p className="text-xs font-black text-slate-800 uppercase leading-tight">{item.description}</p><p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">{item.quantity} un • R$ {item.unitPrice.toFixed(2).replace('.', ',')} / un</p></div>
                      <p className="text-xs font-black text-slate-900 tracking-tight">R$ {item.subtotal.toFixed(2).replace('.', ',')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-[40px] bg-slate-900 text-white flex justify-between items-center shadow-2xl">
                <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-1.5">Faturamento Total</p><p className="text-4xl font-black tracking-tighter">R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</p></div>
                <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-white/10 border border-white/20`}>{(statusMap[selectedOrder.status] || {label: selectedOrder.status}).label}</div>
              </div>
            </div>

            {selectedOrder.status !== OrderStatus.INVOICED && selectedOrder.status !== OrderStatus.CANCELLED && (
              <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-center gap-4">
                {can(user.role, 'order_status_in_progress') && selectedOrder.status !== OrderStatus.IN_PROGRESS && (
                  <button disabled={updatingId === selectedOrder.id} onClick={() => executeUpdate(selectedOrder.id, OrderStatus.IN_PROGRESS)} className="flex-1 py-4 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50">
                    {updatingId === selectedOrder.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmar Recebimento'}
                  </button>
                )}
                {can(user.role, 'order_status_invoiced') && (
                  <button disabled={updatingId === selectedOrder.id} onClick={() => handleRequestAction(selectedOrder.id, 'INVOICE')} className="flex-[2] py-4 bg-red-600 text-white hover:bg-red-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {updatingId === selectedOrder.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirmar Faturamento <ArrowUpRight className="w-4 h-4" /></>}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {actionModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
           <div className="absolute inset-0" onClick={() => setActionModal({ isOpen: false, type: null, orderId: null })} />
           <div className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto ${actionModal.type === 'CANCEL' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                {actionModal.type === 'CANCEL' ? <AlertCircle className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
              </div>
              <h3 className="text-center font-black text-slate-900 uppercase tracking-widest text-sm mb-1">{actionModal.type === 'CANCEL' ? 'Cancelar Pedido' : 'Faturar Pedido'}</h3>
              {actionModal.type === 'CANCEL' ? (
                <div className="mt-4 space-y-4">
                  <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Informe o motivo do cancelamento.</p>
                  <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Ex: Cliente desistiu..." className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:bg-white resize-none" autoFocus />
                </div>
              ) : <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 leading-relaxed px-4">Confirma o faturamento deste pedido?</p>}
              <div className="grid grid-cols-2 gap-3 mt-8">
                 <button onClick={() => setActionModal({ isOpen: false, type: null, orderId: null })} className="py-3 bg-slate-100 text-slate-500 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200">Voltar</button>
                 <button onClick={confirmAction} disabled={actionModal.type === 'CANCEL' && !cancelReason.trim()} className={`py-3 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${actionModal.type === 'CANCEL' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                   {updatingId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {showClientModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/20">
          <div className="absolute inset-0" onClick={() => !clientLoading && setShowClientModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
            <div className="p-8 bg-slate-50 border-b flex items-center justify-between">
              <div><h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Novo Credenciamento</h3><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Adicionar parceiro comercial</p></div>
              <button onClick={() => !clientLoading && setShowClientModal(false)} className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-xl border border-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveClient} className="p-8 space-y-6 overflow-y-auto max-h-[70vh] scrollbar-hide">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2"><Building2 className="w-4 h-4 text-red-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Dados Empresariais</span></div>
                <div className="space-y-3">
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Razão Social</label><input type="text" required disabled={clientLoading} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 text-xs" value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} /></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">CNPJ / CPF</label><input type="text" required disabled={clientLoading} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 text-xs" value={clientForm.cpfCnpj} onChange={(e) => setClientForm({ ...clientForm, cpfCnpj: e.target.value })} /></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2"><Lock className="w-4 h-4 text-red-500" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Acesso ao Sistema</span></div>
                <div className="space-y-3">
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">E-mail de Login</label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" /><input type="email" required disabled={clientLoading} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 text-xs" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} /></div></div>
                  <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Senha Inicial</label><div className="relative"><Key className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" /><input type="password" required disabled={clientLoading} placeholder="Mínimo 6 caracteres" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 text-xs" value={clientForm.password} onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })} /></div></div>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowClientModal(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200">Cancelar</button>
                <button type="submit" disabled={clientLoading} className="flex-[2] bg-red-600 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-3">{clientLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Cadastrar Cliente <Check className="w-4 h-4" /></>}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const NoItems = ({ icon: Icon, text }: any) => (
  <div className="py-40 flex flex-col items-center justify-center text-slate-300 bg-white rounded-[40px] border border-dashed border-slate-200">
    <Icon className="w-12 h-12 opacity-10 mb-4" /><p className="font-black uppercase tracking-[0.3em] text-[10px]">{text}</p>
  </div>
);

const ActionBtn = ({ onClick, label, icon: Icon, active, color, disabled }: any) => (
  <button 
    disabled={disabled}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${active ? color : 'text-slate-400 bg-white border-slate-100 hover:bg-white hover:border-slate-300'} disabled:opacity-30`}
    title={label}
  >
    <Icon className="w-3.5 h-3.5" /><span className="hidden xl:inline">{label}</span>
  </button>
);

export default SellerDashboard;
