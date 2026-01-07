
import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { Clock, CheckCircle, Truck, Package, ChevronRight, Calendar, Activity, Ban, FileText, CheckCircle2 } from 'lucide-react';
import FiscalCoupon from '../Shared/FiscalCoupon';

interface OrderHistoryProps {
  orders: Order[];
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
  const [selectedCoupon, setSelectedCoupon] = useState<Order | null>(null);

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.GENERATED: 
        return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Recebido', step: 1 };
      case OrderStatus.IN_PROGRESS: 
        return { icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Em Separação', step: 2 };
      case OrderStatus.INVOICED: 
        return { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Faturado', step: 3 };
      case OrderStatus.SENT: 
        return { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Rota de Entrega', step: 4 };
      case OrderStatus.FINISHED: 
        return { icon: CheckCircle2, color: 'text-slate-600', bg: 'bg-slate-50', label: 'Finalizado', step: 5 };
      case OrderStatus.CANCELLED: 
        return { icon: Ban, color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelado', step: 0 };
      default: 
        return { icon: Package, color: 'text-slate-500', bg: 'bg-slate-50', label: 'Processando', step: 1 };
    }
  };

  const StatusStepper = ({ currentStep, isCancelled }: { currentStep: number, isCancelled: boolean }) => {
    if (isCancelled) return null;
    
    const steps = [
      { id: 1, label: 'Recebido' },
      { id: 2, label: 'Separação' },
      { id: 3, label: 'Faturado' },
      { id: 4, label: 'Rota' }
    ];

    return (
      <div className="mt-4 pt-4 border-t border-slate-50">
        <div className="flex items-center justify-between px-1">
          {steps.map((s, idx) => {
            const isActive = currentStep >= s.id;
            const isLast = idx === steps.length - 1;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5 relative z-10">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-300'
                  }`}>
                    {isActive ? <CheckCircle className="w-3 h-3" /> : <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />}
                  </div>
                  <span className={`text-[7px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-600' : 'text-slate-300'}`}>
                    {s.label}
                  </span>
                </div>
                {!isLast && (
                  <div className="flex-1 h-0.5 bg-slate-100 mx-2 -mt-4">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-700" 
                      style={{ width: currentStep > s.id ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
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
    <div className="p-4 space-y-4 animate-in fade-in duration-500 bg-slate-50 min-h-full relative">
      <div className="flex items-end justify-between px-2 mb-2">
        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Histórico de Compras</h2>
        <span className="text-[9px] font-black text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 uppercase tracking-widest">
          {orders.length} pedidos
        </span>
      </div>

      <div className="space-y-4">
        {orders.map(order => {
          const status = getStatusInfo(order.status);
          const canViewCoupon = order.status === OrderStatus.INVOICED || order.status === OrderStatus.SENT || order.status === OrderStatus.FINISHED;
          
          return (
            <div key={order.id} className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm flex flex-col transition-all hover:border-red-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`${status.bg} ${status.color} w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-100 shrink-0`}>
                    <status.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">Cod: #{order.id}</p>
                    <h3 className="font-black text-slate-900 text-xs uppercase group-hover:text-red-600 transition-colors">Pedido Realizado</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                   <p className="text-base font-black text-slate-900 tracking-tighter">R$ {order.total.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>

              <StatusStepper currentStep={status.step} isCancelled={order.status === OrderStatus.CANCELLED} />

              <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                    <Activity className="w-3 h-3 text-slate-300" />
                  </div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Status: <span className={status.color}>{status.label}</span>
                  </span>
                </div>
                
                {canViewCoupon && (
                  <button 
                    onClick={() => setSelectedCoupon(order)}
                    className="text-red-600 text-[9px] font-black uppercase tracking-widest hover:text-red-700 flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-xl transition-all"
                  >
                    Ver Cupom <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedCoupon && (
        <FiscalCoupon order={selectedCoupon} onClose={() => setSelectedCoupon(null)} />
      )}
    </div>
  );
};

export default OrderHistory;
