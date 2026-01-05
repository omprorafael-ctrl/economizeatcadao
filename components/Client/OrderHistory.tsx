
import React from 'react';
import { Order, OrderStatus } from '../../types';
import { Clock, CheckCircle, Truck, Package, ChevronRight, Calendar, Activity, Ban, FileText } from 'lucide-react';

interface OrderHistoryProps {
  orders: Order[];
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.GENERATED: 
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Enviado' };
      case OrderStatus.IN_PROGRESS: 
        return { icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Em Andamento' };
      case OrderStatus.INVOICED: 
        return { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Faturado' };
      case OrderStatus.CANCELLED: 
        return { icon: Ban, color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelado' };
      default: 
        return { icon: Package, color: 'text-slate-500', bg: 'bg-slate-50', label: 'Processando' };
    }
  };

  if (orders.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center h-full bg-slate-50">
        <div className="w-20 h-20 bg-slate-100 rounded-none flex items-center justify-center mb-4 text-slate-300">
          <Package className="w-10 h-10" />
        </div>
        <p className="text-slate-800 font-bold text-sm uppercase">Sem histórico</p>
        <p className="text-slate-400 text-xs mt-1">Seus pedidos aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-500 bg-slate-50 min-h-full">
      <div className="flex items-end justify-between px-2 mb-2">
        <h2 className="text-lg font-bold text-slate-800">Meus Pedidos</h2>
        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-none border border-slate-200">{orders.length} total</span>
      </div>

      <div className="space-y-3">
        {orders.map(order => {
          const status = getStatusInfo(order.status);
          return (
            <div key={order.id} className="bg-white rounded-none p-4 border border-slate-200 shadow-sm flex flex-col transition-all hover:border-slate-300">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`${status.bg} ${status.color} w-10 h-10 rounded-none flex items-center justify-center border border-slate-100`}>
                    <status.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Pedido #{order.id}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-none uppercase ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-sm font-bold text-slate-900">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="text-[10px] font-medium uppercase truncate max-w-[150px]">
                    Atendente: {order.sellerName || 'Sistema'}
                  </span>
                </div>
                <button className="text-red-600 text-[10px] font-bold uppercase hover:text-red-700 flex items-center gap-1">
                  Ver Detalhes <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderHistory;
