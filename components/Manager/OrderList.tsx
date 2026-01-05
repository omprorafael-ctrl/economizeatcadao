
import React from 'react';
import { Order, OrderStatus } from '../../types';
import { Eye, Clock, Truck, CheckCircle, Package, Search, Filter, Calendar, FileText } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const OrderList: React.FC<OrderListProps> = ({ orders, setOrders }) => {
  const updateStatus = (id: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const statusMap = {
    [OrderStatus.GENERATED]: { label: 'Em Análise', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
    [OrderStatus.SENT]: { label: 'Em Trânsito', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Truck },
    [OrderStatus.FINISHED]: { label: 'Finalizado', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white/5 backdrop-blur-3xl rounded-[45px] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-10 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-500/20">
              <FileText className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Gerenciamento de Demandas</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Total acumulado: {orders.length} pedidos</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-red-500" />
              <input 
                type="text" 
                placeholder="Filtrar pedido ou cliente..."
                className="pl-12 pr-6 py-4 bg-black/20 border border-white/5 rounded-2xl outline-none focus:bg-black/40 focus:border-red-500/40 transition-all font-bold text-white text-xs"
              />
            </div>
            <button className="p-4 bg-white/5 text-slate-400 hover:text-white rounded-2xl border border-white/10 transition-all"><Filter className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/5">
              <tr>
                <th className="px-10 py-6">ID Remessa</th>
                <th className="px-10 py-6">Canal / Cliente</th>
                <th className="px-10 py-6">Data Emissão</th>
                <th className="px-10 py-6">Faturamento</th>
                <th className="px-10 py-6">Status Logístico</th>
                <th className="px-10 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map(order => {
                const status = statusMap[order.status];
                return (
                  <tr key={order.id} className="hover:bg-white/5 transition-all group">
                    <td className="px-10 py-8 font-black text-red-500 text-sm tracking-widest italic">#{order.id}</td>
                    <td className="px-10 py-8">
                      <div className="font-black text-white text-sm uppercase group-hover:text-red-400 transition-colors">{order.clientName}</div>
                      <div className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter mt-1">UID: {order.clientId.slice(0, 8)}...</div>
                    </td>
                    <td className="px-10 py-8 text-xs font-bold text-slate-400 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 opacity-40" />
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-10 py-8">
                      <div className="font-black text-white text-base tracking-tighter italic">
                        <span className="text-[10px] text-red-500 mr-1 not-italic">R$</span>
                        {order.total.toFixed(2).replace('.', ',')}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <select 
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border outline-none cursor-pointer transition-all ${status.color}`}
                      >
                        {Object.values(OrderStatus).map(s => (
                          <option key={s} value={s} className="bg-[#0a0a0a] text-white uppercase">{statusMap[s].label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <button className="bg-white/5 hover:bg-red-600 hover:text-white text-slate-400 p-3 rounded-xl transition-all border border-white/5 group-hover:border-red-500/40">
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="py-40 flex flex-col items-center text-slate-600 opacity-20">
              <Package className="w-24 h-24 mb-6" />
              <p className="font-black uppercase tracking-[0.4em] text-xs">Nenhum pedido processado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;
