
import React, { useState } from 'react';
import { Seller, Order, OrderStatus } from '../../types';
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
  Ban
} from 'lucide-react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

interface SellerDashboardProps {
  user: Seller;
  orders: Order[];
  onLogout: () => void;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user, orders, onLogout }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtra pedidos atribuídos a esta vendedora e pela busca
  const myOrders = orders.filter(o => 
    o.sellerId === user.id && 
    (o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm.toUpperCase()))
  );

  const updateStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      if (selectedOrder?.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar o pedido. Tente novamente.");
    }
  };

  const statusMap = {
    [OrderStatus.GENERATED]: { label: 'Novo Pedido', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Clock },
    [OrderStatus.IN_PROGRESS]: { label: 'Em Andamento', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Activity },
    [OrderStatus.INVOICED]: { label: 'Faturado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
    [OrderStatus.CANCELLED]: { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-100', icon: XCircle },
    // Legado
    [OrderStatus.SENT]: { label: 'Enviado', color: 'bg-slate-50 text-slate-400', icon: Activity },
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
          <div>
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 scrollbar-hide">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Pedidos em Carteira ({myOrders.length})</h2>
          </div>

          <div className="space-y-4">
            {myOrders.length > 0 ? (
              myOrders.map(order => {
                const status = statusMap[order.status] || statusMap[OrderStatus.GENERATED];
                return (
                  <div 
                    key={order.id} 
                    className="bg-white rounded-3xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:shadow-xl hover:shadow-slate-200/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-colors ${status.color}`}>
                        {React.createElement(status.icon, { className: "w-6 h-6" })}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-red-600 tracking-widest uppercase italic">#{order.id}</span>
                           <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border ${status.color}`}>{status.label}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase truncate max-w-[180px] mt-1">{order.clientName}</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => setSelectedOrder(order)}
                         className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-100 transition-all shadow-sm"
                         title="Ver Detalhes"
                       >
                         <Eye className="w-5 h-5" />
                       </button>

                       <div className="h-8 w-px bg-slate-100 mx-1 hidden sm:block" />

                       <div className="flex items-center gap-1.5 bg-slate-50/50 p-1 rounded-2xl border border-slate-100">
                         <ActionBtn 
                           onClick={() => updateStatus(order.id, OrderStatus.IN_PROGRESS)} 
                           label="Andamento" 
                           icon={Activity} 
                           active={order.status === OrderStatus.IN_PROGRESS}
                           color="text-amber-600 bg-amber-50 border-amber-100" 
                         />
                         <ActionBtn 
                           onClick={() => updateStatus(order.id, OrderStatus.INVOICED)} 
                           label="Faturar" 
                           icon={Check} 
                           active={order.status === OrderStatus.INVOICED}
                           color="text-emerald-600 bg-emerald-50 border-emerald-100" 
                         />
                         <ActionBtn 
                           onClick={() => updateStatus(order.id, OrderStatus.CANCELLED)} 
                           label="Cancelar" 
                           icon={Ban} 
                           active={order.status === OrderStatus.CANCELLED}
                           color="text-red-600 bg-red-50 border-red-100" 
                         />
                       </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-40 flex flex-col items-center justify-center text-slate-300 bg-white rounded-[40px] border border-dashed border-slate-200">
                <ShoppingBag className="w-12 h-12 opacity-10 mb-4" />
                <p className="font-black uppercase tracking-[0.3em] text-[10px]">Nenhum pedido encontrado</p>
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
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Pedido #{selectedOrder.id}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Detalhes do Faturamento</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-3 bg-white hover:bg-red-50 text-slate-300 hover:text-red-600 border border-slate-100 rounded-2xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <div className="p-6 bg-slate-100/50 rounded-3xl border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Cliente / PDV
                </p>
                <p className="text-sm font-black text-slate-800 uppercase">{selectedOrder.clientName}</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase bg-white px-3 py-1.5 rounded-xl border border-emerald-100 w-fit">
                   <CreditCard className="w-3.5 h-3.5" /> Condição: Boleto Bancário
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Itens do Pedido</h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-4 border-b border-slate-50 last:border-0 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase leading-snug">{item.description}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{item.quantity} unidades • R$ {item.unitPrice.toFixed(2)}</p>
                      </div>
                      <p className="text-xs font-black text-slate-900">R$ {item.subtotal.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 rounded-[32px] bg-red-600 text-white flex justify-between items-center shadow-xl shadow-red-200">
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Total Geral</p>
                   <p className="text-4xl font-black tracking-tighter">R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/20 border border-white/30`}>
                   {selectedOrder.status.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="p-8 bg-white border-t border-slate-100 flex items-center justify-center gap-4">
               <button 
                 onClick={() => updateStatus(selectedOrder.id, OrderStatus.IN_PROGRESS)}
                 className="flex-1 py-4 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-amber-100 transition-all"
               >
                 Em Andamento
               </button>
               <button 
                 onClick={() => updateStatus(selectedOrder.id, OrderStatus.INVOICED)}
                 className="flex-1 py-4 bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all"
               >
                 Faturar Agora
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ActionBtn = ({ onClick, label, icon: Icon, active, color }: any) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
      active ? color : 'text-slate-400 bg-white border-slate-100 hover:bg-white hover:border-slate-300'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    <span className="hidden lg:inline">{label}</span>
  </button>
);

export default SellerDashboard;
