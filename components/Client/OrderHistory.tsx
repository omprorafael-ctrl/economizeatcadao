
import React from 'react';
import { Order, OrderStatus } from '../../types';
import { Clock, CheckCircle, Truck, Package, ChevronRight, Calendar, ArrowRight } from 'lucide-react';

interface OrderHistoryProps {
  orders: Order[];
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.GENERATED: return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Em Análise' };
      case OrderStatus.SENT: return { icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Em Rota' };
      case OrderStatus.FINISHED: return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Finalizado' };
      default: return { icon: Package, color: 'text-slate-500', bg: 'bg-white/5', label: 'Processando' };
    }
  };

  if (orders.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center h-full bg-transparent">
        <div className="w-24 h-24 bg-red-600/5 rounded-full flex items-center justify-center mb-6 border border-red-500/10">
          <Package className="w-12 h-12 text-red-900/40" />
        </div>
        <p className="text-white font-black italic tracking-tighter text-xl uppercase">Nenhum Registro</p>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Você ainda não processou pedidos no sistema</p>
        <button className="mt-8 px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] flex items-center gap-3">
          Explorar Ofertas <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-end justify-between px-2">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Histórico</h2>
          <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mt-1">Timeline de suprimentos</p>
        </div>
        <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{orders.length} Pedidos</p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map(order => {
          const status = getStatusInfo(order.status);
          return (
            <div key={order.id} className="bg-white/5 rounded-[35px] p-6 border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-red-500/30">
              <div className="flex items-center gap-5">
                <div className={`${status.bg} ${status.color} w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-110 transition-transform`}>
                  <status.icon className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-black text-white italic tracking-widest text-base">#{order.id}</span>
                    <span className={`text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border border-white/5 ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-black text-white italic tracking-tighter">
                      <span className="text-[9px] text-red-500 mr-1 not-italic">R$</span>
                      {order.total.toFixed(2).replace('.', ',')}
                    </p>
                    <div className="h-4 w-px bg-white/10" />
                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-tighter">
                      <Calendar className="w-3.5 h-3.5 opacity-40" />
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-600 group-hover:text-red-500 transition-colors">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderHistory;
