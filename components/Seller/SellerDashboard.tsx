
import React, { useState } from 'react';
import { Seller, Order, OrderStatus, ClientData } from '../../types';
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
  AlertTriangle
} from 'lucide-react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

interface SellerDashboardProps {
  user: Seller;
  orders: Order[];
  clients: ClientData[];
  onLogout: () => void;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user, orders, clients, onLogout }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'portfolio' | 'history'>('portfolio');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Filtra pedidos atribuídos a esta vendedora
  const myOrders = orders.filter(o => o.sellerId === user.id);

  // Divide entre o que está em andamento (carteira) e finalizado (histórico)
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

  const updateStatus = async (id: string, newStatus: OrderStatus) => {
    let cancelReason = '';

    // Validação de Faturamento
    if (newStatus === OrderStatus.INVOICED) {
      const confirmed = window.confirm("O cliente formalizou a compra? Deseja finalizar e faturar este pedido agora?");
      if (!confirmed) return;
    }

    // Validação de Cancelamento com Motivo
    if (newStatus === OrderStatus.CANCELLED) {
      const reason = window.prompt("⚠️ ATENÇÃO: Informe o motivo do cancelamento para prosseguir:");
      if (!reason || reason.trim() === '') {
        alert("O cancelamento exige a descrição de um motivo.");
        return;
      }
      cancelReason = reason.trim();
    }

    setUpdatingId(id);
    try {
      const orderRef = doc(db, 'orders', id);
      const updateData: any = { status: newStatus };
      
      if (newStatus === OrderStatus.CANCELLED) {
        updateData.cancelReason = cancelReason;
      }

      await updateDoc(orderRef, updateData);
      
      // Se o modal estiver aberto para este pedido, fecha ele para atualizar a visão
      if (selectedOrder?.id === id) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar o pedido. Verifique sua conexão.");
    } finally {
      setUpdatingId(null);
    }
  };

  const getClientInfo = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const statusMap = {
    [OrderStatus.GENERATED]: { label: 'Novo Pedido', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Clock },
    [OrderStatus.IN_PROGRESS]: { label: 'Em Andamento', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Activity },
    [OrderStatus.INVOICED]: { label: 'Faturado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
    [OrderStatus.CANCELLED]: { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-100', icon: XCircle },
    [OrderStatus.SENT]: { label: 'Enviado', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: Activity },
    [OrderStatus.FINISHED]: { label: 'Concluído', color: 'bg-slate-50 text-slate-400', icon: CheckCircle2 },
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header Seller Profissional */}
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
              placeholder="Buscar pedido..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-red-300 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={onLogout}
            className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Abas de Navegação */}
      <div className="bg-white border-b border-slate-200 px-6 sm:px-10 flex gap-8 shrink-0">
        <button 
          onClick={() => setActiveTab('portfolio')}
          className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
            activeTab === 'portfolio' ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5" />
            Em Carteira ({portfolioOrders.length})
          </div>
          {activeTab === 'portfolio' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
            activeTab === 'history' ? 'text-red-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5" />
            Histórico ({historyOrders.length})
          </div>
          {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600 rounded-t-full" />}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 scrollbar-hide pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
              {activeTab === 'portfolio' ? 'Pedidos Ativos' : 'Finalizados'}
            </h2>
          </div>

          <div className="space-y-4">
            {displayedOrders.length > 0 ? (
              displayedOrders.map(order => {
                const status = statusMap[order.status] || statusMap[OrderStatus.GENERATED];
                const client = getClientInfo(order.clientId);
                const isUpdating = updatingId === order.id;

                return (
                  <div 
                    key={order.id} 
                    className="bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-xl hover:shadow-slate-200/30 transition-all group"
                  >
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
                          <a 
                            href={`tel:${client.phone}`}
                            className="text-[10px] text-slate-400 font-black mt-1.5 flex items-center gap-1.5 hover:text-emerald-600 transition-colors uppercase"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                         <button 
                           onClick={() => setSelectedOrder(order)}
                           className="flex-1 sm:flex-none p-3.5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all shadow-sm flex items-center justify-center gap-2"
                         >
                           <Eye className="w-5 h-5" />
                           <span className="text-[9px] font-black uppercase lg:hidden">Ver Detalhes</span>
                         </button>

                         {activeTab === 'portfolio' && (
                           <div className="flex items-center gap-1.5 bg-slate-50/50 p-1 rounded-2xl border border-slate-100 flex-1 sm:flex-none">
                             <ActionBtn 
                               disabled={isUpdating}
                               onClick={() => updateStatus(order.id, OrderStatus.IN_PROGRESS)} 
                               label="Andamento" 
                               icon={Activity} 
                               active={order.status === OrderStatus.IN_PROGRESS}
                               color="text-amber-600 bg-amber-50 border-amber-100" 
                             />
                             <ActionBtn 
                               disabled={isUpdating}
                               onClick={() => updateStatus(order.id, OrderStatus.INVOICED)} 
                               label="Faturar" 
                               icon={Check} 
                               active={order.status === OrderStatus.INVOICED}
                               color="text-emerald-600 bg-emerald-50 border-emerald-100" 
                             />
                             <ActionBtn 
                               disabled={isUpdating}
                               onClick={() => updateStatus(order.id, OrderStatus.CANCELLED)} 
                               label="Cancelar" 
                               icon={Ban} 
                               active={order.status === OrderStatus.CANCELLED}
                               color="text-red-600 bg-red-50 border-red-100" 
                             />
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-40 flex flex-col items-center justify-center text-slate-300 bg-white rounded-[40px] border border-dashed border-slate-200">
                <ShoppingBag className="w-12 h-12 opacity-10 mb-4" />
                <p className="font-black uppercase tracking-[0.3em] text-[10px]">Nenhum pedido em {activeTab === 'portfolio' ? 'carteira' : 'histórico'}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Detalhes Completo */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-300">
            
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none">Pedido #{selectedOrder.id}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Dossiê Comercial do Item</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-3 bg-white hover:bg-red-50 text-slate-300 hover:text-red-600 border border-slate-100 rounded-2xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              {/* Card de Dados do Cliente Ampliado */}
              <div className="p-6 bg-slate-100/50 rounded-3xl border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                       <User className="w-3.5 h-3.5" /> Razão Social
                     </p>
                     <p className="text-sm font-black text-slate-800 uppercase">{selectedOrder.clientName}</p>
                   </div>
                   <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                   </div>
                </div>

                {getClientInfo(selectedOrder.clientId) && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <a 
                      href={`tel:${getClientInfo(selectedOrder.clientId)?.phone}`}
                      className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 hover:border-red-300 transition-all group"
                    >
                      <div className="bg-red-50 p-2 rounded-lg text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all"><Phone className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Ligar Agora</p>
                        <p className="text-[10px] font-black text-slate-700">{getClientInfo(selectedOrder.clientId)?.phone}</p>
                      </div>
                    </a>
                    <a 
                      href={`https://wa.me/${getClientInfo(selectedOrder.clientId)?.phone?.replace(/\D/g, '')}`}
                      target="_blank"
                      className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-all group"
                    >
                      <div className="bg-emerald-500 p-2 rounded-lg text-white"><MessageCircle className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[8px] font-black text-emerald-600 uppercase">WhatsApp</p>
                        <p className="text-[10px] font-black text-emerald-800">Enviar Msg</p>
                      </div>
                    </a>
                  </div>
                )}
              </div>

              {/* Alerta de Cancelamento */}
              {selectedOrder.status === OrderStatus.CANCELLED && selectedOrder.cancelReason && (
                <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4 animate-in fade-in">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-1" />
                  <div>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Motivo do Cancelamento</p>
                    <p className="text-sm font-bold text-red-900 mt-1">{selectedOrder.cancelReason}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Listagem de Produtos</h4>
                  <span className="text-[9px] font-black text-slate-400 uppercase">{selectedOrder.items.length} itens</span>
                </div>
                <div className="border border-slate-100 rounded-[30px] overflow-hidden shadow-sm">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-5 border-b border-slate-50 last:border-0 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase leading-tight">{item.description}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-widest">
                          {item.quantity} un • R$ {item.unitPrice.toFixed(2).replace('.', ',')} / un
                        </p>
                      </div>
                      <p className="text-xs font-black text-slate-900 tracking-tight">R$ {item.subtotal.toFixed(2).replace('.', ',')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-[40px] bg-slate-900 text-white flex justify-between items-center shadow-2xl">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-1.5">Faturamento Total</p>
                   <p className="text-4xl font-black tracking-tighter">R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest bg-white/10 border border-white/20`}>
                   {(statusMap[selectedOrder.status] || {label: selectedOrder.status}).label}
                </div>
              </div>
            </div>

            {selectedOrder.status !== OrderStatus.INVOICED && selectedOrder.status !== OrderStatus.CANCELLED && (
              <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-center gap-4">
                <button 
                  disabled={updatingId === selectedOrder.id}
                  onClick={() => updateStatus(selectedOrder.id, OrderStatus.IN_PROGRESS)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {updatingId === selectedOrder.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Andamento'}
                </button>
                <button 
                  disabled={updatingId === selectedOrder.id}
                  onClick={() => updateStatus(selectedOrder.id, OrderStatus.INVOICED)}
                  className="flex-[2] py-4 bg-red-600 text-white hover:bg-red-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updatingId === selectedOrder.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Confirmar Faturamento <ArrowUpRight className="w-4 h-4" /></>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ActionBtn = ({ onClick, label, icon: Icon, active, color, disabled }: any) => (
  <button 
    disabled={disabled}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
      active ? color : 'text-slate-400 bg-white border-slate-100 hover:bg-white hover:border-slate-300'
    } disabled:opacity-30 disabled:cursor-not-allowed`}
    title={label}
  >
    <Icon className="w-3.5 h-3.5" />
    <span className="hidden xl:inline">{label}</span>
  </button>
);

export default SellerDashboard;
