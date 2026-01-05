
import React from 'react';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
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
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.status !== OrderStatus.FINISHED).length;
  const finishedOrders = orders.filter(o => o.status === OrderStatus.FINISHED).length;
  
  const stats = [
    { 
      label: 'Faturamento', 
      value: `R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
      icon: Wallet, 
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    { 
      label: 'Pedidos', 
      value: orders.length, 
      icon: ShoppingCart, 
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    { 
      label: 'Pendentes', 
      value: pendingOrders, 
      icon: Clock, 
      color: 'bg-orange-50 text-orange-600 border-orange-100',
    },
    { 
      label: 'Concluídos', 
      value: finishedOrders, 
      icon: CheckCircle2, 
      color: 'bg-red-50 text-red-600 border-red-100',
    },
    { 
      label: 'Parceiros', 
      value: clients.length, 
      icon: Users, 
      color: 'bg-slate-50 text-slate-600 border-slate-200',
    },
  ];

  const chartData = [
    { name: 'Jan', vendas: 4000 },
    { name: 'Fev', vendas: 3000 },
    { name: 'Mar', vendas: 6000 },
    { name: 'Abr', vendas: 8500 },
    { name: 'Mai', vendas: 5200 },
    { name: 'Jun', vendas: totalSales > 0 ? totalSales : 4000 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={`bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col items-start gap-4 transition-all hover:border-red-200 group`}>
            <div className={`p-2 rounded-lg ${stat.color} border shrink-0 transition-transform group-hover:scale-110`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-base font-black text-slate-900 tracking-tight mt-0.5">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Performance de Vendas</h3>
              <p className="text-[10px] text-slate-400 font-medium">Histórico mensal consolidado</p>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-red-50 text-red-600 text-[9px] font-bold rounded-lg border border-red-100 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" /> Tendência Positiva
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}
                  itemStyle={{color: '#1e293b', fontSize: '12px', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="vendas" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">Status de Expansão</h3>
              <p className="text-[10px] text-slate-400 font-medium mb-8">Meta de ativação de PDVs</p>
              
              <div className="text-center py-6">
                <span className="text-5xl font-black text-slate-900 tracking-tighter">
                  {Math.min(100, (clients.length / 50) * 100).toFixed(0)}%
                </span>
                <div className="w-full h-2 bg-slate-100 rounded-full mt-6 overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-red-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (clients.length / 50) * 100)}%` }}
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 tracking-widest">{clients.length} de 50 Clientes</p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-[9px] font-bold text-slate-600 uppercase leading-relaxed">O sistema está operando em regime de sincronização em tempo real.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
