
import React from 'react';
import { Order, OrderStatus } from '../../types';
import { Clock, CheckCircle, Truck, Package, ChevronRight, Calendar } from 'lucide-react';

interface OrderHistoryProps {
  orders: Order[];
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.GENERATED: return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Aguardando' };
      case OrderStatus.SENT: return { icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Enviado' };
      case OrderStatus.FINISHED: return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Entregue' };
      default: return { icon: Package, color: 'text-slate-500', bg: 'bg-slate-50', label: 'Processando' };
    }
  };

  if (orders.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-full">
        <Package className="w-16 h-16 text-slate-200 mb-4" />
        <p className="text-slate-400 font-medium">Você ainda não fez nenhum pedido.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Meus Pedidos</h2>
      <div className="space-y-4">
        {orders.map(order => {
          const status = getStatusInfo(order.status);
          return (
            <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between group active:scale-95 transition-all">
              <div className="flex items-center gap-4">
                <div className={`${status.bg} ${status.color} p-3 rounded-xl`}>
                  <status.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{order.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 font-bold">R$ {order.total.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderHistory;
