
import React, { useMemo, useState } from 'react';
import { Order, OrderStatus, Seller, ClientData } from '../../types';
import { 
  CalendarDays, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  ChevronRight, 
  Trophy, 
  BarChart3, 
  ArrowLeft,
  Download,
  Wallet,
  Target
} from 'lucide-react';

interface MonthlyHistoryProps {
  orders: Order[];
  sellers: Seller[];
  clients: ClientData[];
}

interface MonthlyData {
  monthKey: string;
  label: string;
  total: number;
  orderCount: number;
  avgTicket: number;
  topSeller: string;
  topClient: string;
  statusCounts: Record<string, number>;
}

const MonthlyHistory: React.FC<MonthlyHistoryProps> = ({ orders, sellers, clients }) => {
  const [selectedMonth, setSelectedMonth] = useState<MonthlyData | null>(null);

  const monthlyStats = useMemo(() => {
    const stats: Record<string, MonthlyData> = {};

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthKey = `${date.getMonth()}-${date.getFullYear()}`;
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

      if (!stats[monthKey]) {
        stats[monthKey] = {
          monthKey,
          label,
          total: 0,
          orderCount: 0,
          avgTicket: 0,
          topSeller: '',
          topClient: '',
          statusCounts: {},
        };
      }

      if (order.status !== OrderStatus.CANCELLED) {
        stats[monthKey].total += order.total;
        stats[monthKey].orderCount += 1;
        
        // Track stats for details later
        stats[monthKey].statusCounts[order.status] = (stats[monthKey].statusCounts[order.status] || 0) + 1;
      }
    });

    // Encontrar Destaques para cada mês
    Object.keys(stats).forEach(key => {
      const monthOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        return `${d.getMonth()}-${d.getFullYear()}` === key && o.status !== OrderStatus.CANCELLED;
      });

      // Vendedor Destaque
      const sellerTotals: Record<string, number> = {};
      monthOrders.forEach(o => {
        if (o.sellerName) sellerTotals[o.sellerName] = (sellerTotals[o.sellerName] || 0) + o.total;
      });
      stats[key].topSeller = Object.entries(sellerTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '---';

      // Cliente Destaque
      const clientTotals: Record<string, number> = {};
      monthOrders.forEach(o => {
        clientTotals[o.clientName] = (clientTotals[o.clientName] || 0) + o.total;
      });
      stats[key].topClient = Object.entries(clientTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '---';

      stats[key].avgTicket = stats[key].total / (stats[key].orderCount || 1);
    });

    return Object.values(stats).sort((a, b) => {
      const [m1, y1] = a.monthKey.split('-').map(Number);
      const [m2, y2] = b.monthKey.split('-').map(Number);
      return y2 !== y1 ? y2 - y1 : m2 - m1;
    });
  }, [orders]);

  if (selectedMonth) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-500">
        <button 
          onClick={() => setSelectedMonth(null)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Histórico
        </button>

        <div className="bg-slate-900 rounded-[40px] p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-10"><CalendarDays className="w-48 h-48" /></div>
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase italic">{selectedMonth.label}</h2>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Faturamento</p>
                <p className="text-2xl font-black tracking-tighter">R$ {selectedMonth.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Pedidos</p>
                <p className="text-2xl font-black tracking-tighter">{selectedMonth.orderCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Ticket Médio</p>
                <p className="text-2xl font-black tracking-tighter">R$ {selectedMonth.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Performance</p>
                <p className="text-2xl font-black tracking-tighter text-emerald-400">ALTA</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600"><Trophy className="w-5 h-5" /></div>
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Destaques do Período</h3>
             </div>
             <div className="space-y-4">
               <DetailItem icon={Target} label="Vendedor(a) Campeã" value={selectedMonth.topSeller} />
               <DetailItem icon={Users} label="Maior Comprador" value={selectedMonth.topClient} />
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
             <div className="flex items-center gap-4 mb-8">
               <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><BarChart3 className="w-5 h-5" /></div>
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Status da Operação</h3>
             </div>
             <div className="space-y-3">
               {Object.entries(selectedMonth.statusCounts).map(([status, count]) => (
                 <div key={status} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                   <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{status}</span>
                   <span className="text-xs font-black text-slate-900">{count}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-end justify-between px-2 mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">Arquivo Mensal</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Histórico completo de performance</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
           <CalendarDays className="w-4 h-4 text-red-500" />
           <span className="text-[10px] font-black uppercase text-slate-600">{monthlyStats.length} Períodos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthlyStats.map(data => (
          <button 
            key={data.monthKey}
            onClick={() => setSelectedMonth(data)}
            className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm hover:shadow-2xl hover:border-red-100 hover:-translate-y-2 transition-all group flex flex-col text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity -rotate-12">
               <TrendingUp className="w-32 h-32" />
            </div>
            
            <div className="flex items-center justify-between mb-8">
              <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl uppercase tracking-widest group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                {data.monthKey.split('-')[1]}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-red-500 transition-colors" />
            </div>

            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">{data.label}</h3>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div>
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Vendas</p>
                <p className="text-sm font-black text-slate-800 tracking-tighter">R$ {data.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Volume</p>
                <p className="text-sm font-black text-slate-800 tracking-tighter">{data.orderCount} Pedidos</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 flex items-center gap-5">
    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-slate-100 shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-[180px]">{value}</p>
    </div>
  </div>
);

export default MonthlyHistory;
