
import React from 'react';
import { Package, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { Product, ClientData, Order } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatsOverviewProps {
  products: Product[];
  clients: ClientData[];
  orders: Order[];
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ products, clients, orders }) => {
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  
  const stats = [
    { label: 'Total Produtos', value: products.length, icon: Package, color: 'bg-blue-500' },
    { label: 'Clientes Ativos', value: clients.length, icon: Users, color: 'bg-green-500' },
    { label: 'Pedidos Realizados', value: orders.length, icon: ShoppingCart, color: 'bg-purple-500' },
    { label: 'Faturamento Total', value: `R$ ${totalSales.toFixed(2)}`, icon: TrendingUp, color: 'bg-amber-500' },
  ];

  const chartData = [
    { name: 'Jan', vendas: 400 },
    { name: 'Fev', vendas: 300 },
    { name: 'Mar', vendas: 600 },
    { name: 'Abr', vendas: 800 },
    { name: 'Mai', vendas: 500 },
    { name: 'Jun', vendas: orders.length * 100 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`${stat.color} p-3 rounded-lg text-white`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold mb-6 text-slate-800">Desempenho de Vendas (Simulado)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="vendas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
