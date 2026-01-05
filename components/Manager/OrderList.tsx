
import React from 'react';
import { Order, OrderStatus } from '../../types';
import { Eye, Clock, Truck, CheckCircle, Package, Search, Filter, Calendar, FileText, UserCircle2 } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const OrderList: React.FC<OrderListProps> = ({ orders, setOrders }) => {
  const updateStatus = (id: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const statusMap = {
    [OrderStatus.GENERATED]: { label: 'Análise', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
    [OrderStatus.SENT]: { label: 'Em Trânsito', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Truck },
    [OrderStatus.FINISHED]: { label: 'Concluído', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Fila de Pedidos</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Total: {orders.length} ordens</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input 
                type="text" 
                placeholder="Filtrar pedidos..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-[10px] w-48"
              />
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all"><Filter className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Vendedor</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Visualizar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(order => {
                const status = statusMap[order.status];
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4 font-bold text-red-600 text-[11px] tracking-wider italic">#{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-xs uppercase truncate max-w-[150px]">{order.clientName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="w-3.5 h-3.5 text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{order.sellerName || 'Sistema'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900 text-xs">
                        R$ {order.total.toFixed(2).replace('.', ',')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                        className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border outline-none cursor-pointer transition-all ${status.color}`}
                      >
                        {Object.values(OrderStatus).map(s => (
                          <option key={s} value={s} className="bg-white text-slate-800 uppercase">{statusMap[s].label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-300 hover:text-red-500 p-2 transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="py-32 flex flex-col items-center text-slate-300">
              <Package className="w-16 h-16 mb-4 opacity-30" />
              <p className="font-bold uppercase tracking-widest text-[10px]">Nenhum pedido na fila</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;
