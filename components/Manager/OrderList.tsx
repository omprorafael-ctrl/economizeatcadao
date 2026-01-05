
import React from 'react';
import { Order, OrderStatus } from '../../types';
import { Eye, Clock, Truck, CheckCircle, Package } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const OrderList: React.FC<OrderListProps> = ({ orders, setOrders }) => {
  const updateStatus = (id: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
  };

  const statusMap = {
    [OrderStatus.GENERATED]: { label: 'Gerado', color: 'bg-amber-100 text-amber-700', icon: Clock },
    [OrderStatus.SENT]: { label: 'Enviado', color: 'bg-blue-100 text-blue-700', icon: Truck },
    [OrderStatus.FINISHED]: { label: 'Finalizado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100">
      <div className="p-6 border-b">
        <h3 className="text-lg font-bold text-slate-800">Pedidos Recebidos</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 text-sm font-semibold border-b">
            <tr>
              <th className="px-6 py-4">ID Pedido</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Valor Total</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(order => {
              const status = statusMap[order.status];
              return (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">#{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{order.clientName}</div>
                    <div className="text-xs text-slate-400">ID: {order.clientId}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-600">R$ {order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border-none outline-none cursor-pointer ${status.color}`}
                    >
                      {Object.values(OrderStatus).map(s => (
                        <option key={s} value={s}>{statusMap[s].label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition-all" title="Ver Detalhes">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="py-20 flex flex-col items-center text-slate-400">
            <Package className="w-12 h-12 mb-4" />
            <p>Nenhum pedido encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;
