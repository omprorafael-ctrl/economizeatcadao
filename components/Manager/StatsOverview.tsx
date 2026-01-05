
import React from 'react';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Wallet,
  AlertCircle
} from 'lucide-react';
import { Product, ClientData, Order, OrderStatus } from '../../types';
import { 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface StatsOverviewProps {
  products: Product[];
  clients: ClientData[];
  orders: Order[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ products, clients, orders }) => {
  // Cálculos de métricas
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status !== OrderStatus.FINISHED).length;
  const finishedOrders = orders.filter(o => o.status === OrderStatus.FINISHED).length;
  
  const stats = [
    { 
      label: 'Total Venda', 
      value: `R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: Wallet, 
      color: 'from-emerald-500 to-emerald-700',
      description: 'Faturamento bruto acumulado'
    },
    { 
      label: 'Pedidos Realizados', 
      value: orders.length, 
      icon: ShoppingCart, 
      color: 'from-blue-600 to-blue-800',
      description: 'Total de ordens processadas'
    },
    { 
      label: 'Pedidos Pendentes', 
      value: pendingOrders, 
      icon: Clock, 
      color: 'from-amber-500 to-orange-600',
      description: 'Aguardando faturamento/envio'
    },
    { 
      label: 'Pedidos Finalizados', 
      value: finishedOrders, 
      icon: CheckCircle2, 
      color: 'from-red-600 to-red-800',
      description: 'Pedidos concluídos com sucesso'
    },
    { 
      label: 'Clientes', 
      value: clients.length, 
      icon: Users, 
      color: 'from-slate-700 to-slate-900',
      description: 'PDVs ativos na plataforma'
    },
  ];

  // Dados fictícios para o gráfico baseados nos pedidos reais (últimos 6 meses)
  const chartData = [
    { name: 'Jan', vendas: 4000 },
    { name: 'Fev', vendas: 3000 },
    { name: 'Mar', vendas: 6000 },
    { name: 'Abr', vendas: 8500 },
    { name: 'Mai', vendas: 5200 },
    { name: 'Jun', vendas: totalSales > 0 ? totalSales : 4000 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-[35px] hover:border-red-500/40 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[180px]">
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-5 rounded-full -mr-10 -mt-10 group-hover:opacity-15 transition-opacity duration-500`} />
            
            <div>
              <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${stat.color} text-white mb-4 shadow-lg`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-xl font-black text-white tracking-tighter italic truncate">{stat.value}</h3>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider leading-tight">
                {stat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Performance */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 p-10 rounded-[45px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Fluxo de Faturamento</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Análise comparativa de receita mensal</p>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-1.5 bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-black rounded-lg uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Tendência
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} 
                />
                <Tooltip 
                  contentStyle={{backgroundColor: '#111', borderRadius: '24px', border: '1px solid #ffffff10', padding: '15px'}}
                  itemStyle={{color: '#fff', fontWeight: 900}}
                />
                <Area 
                  type="monotone" 
                  dataKey="vendas" 
                  stroke="#dc2626" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card Informativo de Meta */}
        <div className="flex flex-col gap-6">
          <div className="bg-red-600 p-10 rounded-[45px] text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-red-900/50 flex-1">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter leading-tight mb-2">Meta de <br/>Expansão</h3>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Ativação de Novos PDVs</p>
            </div>
            <div className="py-10">
              <p className="text-6xl font-black tracking-tighter italic">
                {Math.min(100, (clients.length / 50) * 100).toFixed(0)}<span className="text-2xl">%</span>
              </p>
              <div className="w-full h-3 bg-white/20 rounded-full mt-4 overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-white rounded-full shadow-[0_0_15px_white] transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (clients.length / 50) * 100)}%` }}
                />
              </div>
            </div>
            <button className="w-full py-4 bg-black/20 hover:bg-black/40 border border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all">
              Configurar Metas
            </button>
          </div>

          <div className="bg-white/5 border border-white/5 p-8 rounded-[40px] flex items-center gap-6">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <AlertCircle className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <p className="text-white font-black italic uppercase tracking-tight text-sm">Status do Sistema</p>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Sincronizado via Firebase</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
