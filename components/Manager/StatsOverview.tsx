
import React, { useMemo } from 'react';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Wallet,
  AlertCircle,
  BarChart3,
  Award,
  CalendarDays
} from 'lucide-react';
import { Product, ClientData, Order, OrderStatus, Seller } from '../../types';
import { 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface StatsOverviewProps {
  products: Product[];
  clients: ClientData[];
  orders: Order[];
  sellers?: Seller[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ products, clients, orders, sellers = [] }) => {
  // Data Atual para filtros mensais
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Cálculo de estatísticas básicas
  const totalSales = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders]);
  const pendingOrders = orders.filter(o => o.status !== OrderStatus.FINISHED && o.status !== OrderStatus.CANCELLED).length;
  const finishedOrders = orders.filter(o => o.status === OrderStatus.FINISHED || o.status === OrderStatus.INVOICED).length;

  // Processamento de dados para o Gráfico de Vendas (Últimos 6 Meses)
  const salesChartData = useMemo(() => {
    const lastMonths = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        key: `${d.getMonth()}-${d.getFullYear()}`,
        label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()
      };
    }).reverse();

    const dataMap: Record<string, number> = {};
    lastMonths.forEach(m => dataMap[m.key] = 0);

    orders.forEach(order => {
      const d = new Date(order.createdAt);
      const key = `${d.getMonth()}-${d.getFullYear()}`;
      if (dataMap[key] !== undefined && order.status !== OrderStatus.CANCELLED) {
        dataMap[key] += order.total;
      }
    });

    return lastMonths.map(m => ({ name: m.label, vendas: dataMap[m.key] }));
  }, [orders]);

  // Processamento de dados para Performance de Vendedoras (APENAS MÊS ATUAL)
  const sellerPerformanceData = useMemo(() => {
    const perf: Record<string, number> = {};
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const isThisMonth = orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;

      if (isThisMonth && order.sellerName && order.status !== OrderStatus.CANCELLED) {
        perf[order.sellerName] = (perf[order.sellerName] || 0) + order.total;
      }
    });

    return Object.entries(perf)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Top 5 do mês
  }, [orders, currentMonth, currentYear]);

  const stats = [
    { 
      label: 'Faturamento Total', 
      value: `R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: Wallet, 
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    { 
      label: 'Pedidos Realizados', 
      value: orders.length, 
      icon: ShoppingCart, 
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    { 
      label: 'Fila de Pendentes', 
      value: pendingOrders, 
      icon: Clock, 
      color: 'bg-orange-50 text-orange-600 border-orange-100',
    },
    { 
      label: 'Total Faturados', 
      value: finishedOrders, 
      icon: CheckCircle2, 
      color: 'bg-red-50 text-red-600 border-red-100',
    },
    { 
      label: 'Parceiros Ativos', 
      value: clients.length, 
      icon: Users, 
      color: 'bg-slate-50 text-slate-600 border-slate-200',
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-sm font-black text-slate-900">
            R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={`bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm flex flex-col items-start gap-4 transition-all hover:border-red-200 hover:shadow-md group`}>
            <div className={`p-2.5 rounded-xl ${stat.color} border shrink-0 transition-transform group-hover:scale-110`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-base font-black text-slate-900 tracking-tighter mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sales Chart - MENSAL */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                 <TrendingUp className="w-5 h-5 text-red-600" />
               </div>
               <div>
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Evolução Mensal</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Faturamento dos últimos 6 meses</p>
               </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 text-[9px] font-black rounded-lg border border-slate-200 uppercase tracking-widest">
              Visão Semestral
            </div>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}} 
                  tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{stroke: '#fee2e2', strokeWidth: 2}} />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#ef4444" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  activeDot={{ r: 6, stroke: '#fff', strokeWidth: 3, fill: '#ef4444' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seller Performance Chart - MÊS ATUAL */}
        <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                 <Award className="w-5 h-5 text-emerald-600" />
               </div>
               <div>
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Top Vendedoras</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ranking do Mês Atual</p>
               </div>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
               <CalendarDays className="w-4 h-4" />
            </div>
          </div>

          <div className="h-72">
            {sellerPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sellerPerformanceData} layout="vertical" margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 9, fontWeight: '900'}}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={24}>
                    {sellerPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#f87171' : '#fca5a5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 border border-dashed border-slate-100 rounded-3xl">
                <BarChart3 className="w-8 h-8 opacity-20" />
                <p className="text-[9px] font-black uppercase tracking-widest">Sem vendas este mês</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Os dados resetam todo dia 01</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Card Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Expansão de Carteira</h3>
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-red-50 transition-colors">
                  <Users className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                </div>
              </div>
              
              <div className="flex items-end gap-3 mb-4">
                <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
                  {Math.min(100, (clients.length / 50) * 100).toFixed(0)}%
                </span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Meta Alcançada</p>
              </div>

              <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                <div 
                  className="h-full bg-red-600 rounded-full transition-all duration-1000 shadow-sm" 
                  style={{ width: `${Math.min(100, (clients.length / 50) * 100)}%` }}
                />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase mt-4 tracking-[0.2em]">{clients.length} de 50 Parceiros Credenciados</p>
            </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[32px] shadow-xl relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Package className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2 italic">Performance Operacional</h3>
              <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-xs">
                Seu ecossistema conta com <span className="text-red-500">{products.length}</span> itens ativos e <span className="text-red-500">{sellers.length}</span> vendedoras gerindo o fluxo de caixa.
              </p>
              <div className="mt-8 flex gap-4">
                 <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Ticket Médio</p>
                    <p className="text-sm font-black text-white">R$ {(totalSales / (orders.length || 1)).toFixed(2).replace('.', ',')}</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-0.5">Taxa Conversão</p>
                    <p className="text-sm font-black text-white">{((finishedOrders / (orders.length || 1)) * 100).toFixed(1)}%</p>
                 </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
