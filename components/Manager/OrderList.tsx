
import React, { useState } from 'react';
import { Order, OrderStatus, Seller } from '../../types';
import { 
  Eye, 
  Clock, 
  Truck, 
  CheckCircle, 
  Package, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  UserCircle2, 
  ChevronRight,
  X,
  User,
  ShoppingBag,
  CreditCard,
  MapPin,
  Activity,
  Ban,
  UserCheck
} from 'lucide-react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

interface OrderListProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  sellers: Seller[];
}

const OrderList: React.FC<OrderListProps> = ({ orders, setOrders, sellers }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const updateStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      // O onSnapshot cuidará do estado global, mas atualizamos localmente se necessário para rapidez
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const updateSeller = async (id: string, sellerId: string) => {
    const selectedSeller = sellers.find(s => s.id === sellerId);
    if (!selectedSeller) return;

    try {
      await updateDoc(doc(db, 'orders', id), { 
        sellerId: selectedSeller.id,
        sellerName: selectedSeller.name 
      });
    } catch (error) {
      console.error("Erro ao reatribuir vendedora:", error);
      alert("Erro ao reatribuir vendedora.");
    }
  };

  const statusMap: Record<OrderStatus, { label: string, color: string, icon: any }> = {
    [OrderStatus.GENERATED]: { label: 'Novo Pedido', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Clock },
    [OrderStatus.IN_PROGRESS]: { label: 'Em Andamento', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Activity },
    [OrderStatus.INVOICED]: { label: 'Faturado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CreditCard },
    [OrderStatus.CANCELLED]: { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-100', icon: Ban },
    [OrderStatus.SENT]: { label: 'Enviado', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: Truck },
    [OrderStatus.FINISHED]: { label: 'Concluído', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: CheckCircle },
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40">
        <div className="p-6 sm:p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/30">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
              <FileText className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-widest leading-none">Gestão de Vendas</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Monitoramento de Fluxo em Tempo Real</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar pedido por ID ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all font-bold text-slate-700 text-xs shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">ID</th>
                <th className="px-8 py-6">Parceiro</th>
                <th className="px-8 py-6">Vendedora Responsável</th>
                <th className="px-8 py-6">Valor Total</th>
                <th className="px-8 py-6">Status Operacional</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map(order => {
                const status = statusMap[order.status] || statusMap[OrderStatus.GENERATED];
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6 font-black text-red-600 text-xs tracking-widest italic">#{order.id}</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs uppercase truncate max-w-[200px]">{order.clientName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="relative inline-block w-full max-w-[200px]">
                        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                        <select 
                          value={order.sellerId || ''}
                          onChange={(e) => updateSeller(order.id, e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 outline-none focus:border-red-200 appearance-none cursor-pointer"
                        >
                          <option value="">Não Atribuído</option>
                          {sellers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rotate-90 text-slate-200 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900 text-sm tracking-tighter">
                        <span className="text-[10px] text-slate-400 mr-1">R$</span>
                        {order.total.toFixed(2).replace('.', ',')}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="relative inline-block w-full max-w-[180px]">
                        <select 
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                          className={`w-full px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 outline-none cursor-pointer appearance-none transition-all pr-10 ${status.color}`}
                        >
                          {Object.values(OrderStatus).map(s => (
                            <option key={s} value={s} className="bg-white text-slate-800 uppercase font-bold">
                              {(statusMap[s] || {label: s}).label}
                            </option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 opacity-40 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-600 hover:border-red-100 transition-all"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">Pedido #{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-3 text-slate-300 hover:text-red-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-slate-100/50 rounded-3xl border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                  <p className="text-sm font-black text-slate-800 uppercase">{selectedOrder.clientName}</p>
                </div>
                <div className="p-6 bg-red-50/30 rounded-3xl border border-red-100">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Vendedora Atual</p>
                  <p className="text-sm font-black text-red-600 uppercase">{selectedOrder.sellerName || 'Nenhuma atribuída'}</p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b">
                    <tr>
                      <th className="px-6 py-4">Produto</th>
                      <th className="px-6 py-4 text-center">Qtd</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 text-xs font-black text-slate-800 uppercase">{item.description}</td>
                        <td className="px-6 py-4 text-center text-xs font-black">{item.quantity}</td>
                        <td className="px-6 py-4 text-right text-xs font-black text-slate-900">R$ {item.subtotal.toFixed(2).replace('.', ',')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
