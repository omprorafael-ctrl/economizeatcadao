
import React from 'react';
import { Package, Users, ShoppingCart, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Product, ClientData, Order } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface StatsOverviewProps {
  products: Product[];
  clients: ClientData[];
  orders: Order[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ products, clients, orders }) => {
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  
  const stats = [
    { label: 'SKUs em Linha', value: products.length, icon: Package, color: 'from-red-600 to-red-800' },
    { label: 'Base Clientes', value: clients.length, icon: Users, color: 'from-slate-700 to-slate-900' },
    { label: 'Ordens Mês', value: orders.length, icon: ShoppingCart, color: 'from-red-900 to-black' },
    { label: 'Faturamento', value: `R$ ${totalSales.toLocaleString()}`, icon: TrendingUp, color: 'from-orange-600 to-red-600' },
  ];

  const chartData = [
    { name: 'Jan', vendas: 4000 },
    { name: 'Fev', vendas: 3000 },
    { name: 'Mar', vendas: 6000 },
    { name: 'Abr', vendas: 8500 },
    { name: 'Mai', vendas: 5200 },
    { name: 'Jun', vendas: orders.length * 1500 + 4000 },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 p-8 rounded-[35px] hover:border-red-500/40 transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -mr-12 -mt-12 group-hover:opacity-20 transition-opacity`} />
            <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white mb-6 shadow-xl`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-white tracking-tighter italic">{stat.value}</h3>
              <div className="flex items-center gap-1 mt-3 text-emerald-400 text-[10px] font-bold">
                <ArrowUpRight className="w-3 h-3" /> +12.5% vs mês ant.
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/5 border border-white/10 p-10 rounded-[45px] relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Performance de Volume</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Análise de saída de estoque trimestral</p>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-1.5 bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-black rounded-lg uppercase tracking-widest">Vendas</div>
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 800}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#111', borderRadius: '24px', border: '1px solid #ffffff10', padding: '15px'}}
                  itemStyle={{color: '#fff', fontWeight: 900}}
                />
                <Area type="monotone" dataKey="vendas" stroke="#dc2626" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-red-600 p-10 rounded-[45px] text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-red-900/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter leading-tight mb-2">Meta de <br/>Faturamento</h3>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Progresso do Semestre</p>
          </div>
          <div className="py-10">
            <p className="text-6xl font-black tracking-tighter italic">84<span className="text-2xl">%</span></p>
            <div className="w-full h-3 bg-white/20 rounded-full mt-4 overflow-hidden border border-white/10">
              <div className="w-[84%] h-full bg-white rounded-full shadow-[0_0_15px_white]" />
            </div>
          </div>
          <button className="w-full py-4 bg-black/20 hover:bg-black/40 border border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all">Ver Relatório Completo</button>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
