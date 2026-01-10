
import React, { useMemo, useState } from 'react';
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
  CalendarDays,
  Trophy,
  History,
  ArrowUpRight,
  Trash2,
  X,
  Lock,
  Loader2,
  ShieldAlert,
  ChevronRight
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
import { auth, db } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

interface StatsOverviewProps {
  products: Product[];
  clients: ClientData[];
  orders: Order[];
  sellers?: Seller[];
  onNavigate: (tab: 'dashboard' | 'products' | 'clients' | 'orders' | 'admins' | 'sellers' | 'monthly') => void;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ products, clients, orders, sellers = [], onNavigate }) => {
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalSales = useMemo(() => orders.reduce((sum, o) => sum + (o.status !== OrderStatus.CANCELLED ? o.total : 0), 0), [orders]);
  const pendingOrders = orders.filter(o => o.status !== OrderStatus.FINISHED && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.INVOICED).length;
  const finishedOrders = orders.filter(o => o.status === OrderStatus.FINISHED || o.status === OrderStatus.INVOICED).length;

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
      .slice(0, 5);
  }, [orders, currentMonth, currentYear]);

  const clientRanking = useMemo(() => {
    const ranking: Record<string, { total: number, orders: number }> = {};
    orders.forEach(order => {
      if (order.status !== OrderStatus.CANCELLED) {
        if (!ranking[order.clientName]) {
          ranking[order.clientName] = { total: 0, orders: 0 };
        }
        ranking[order.clientName].total += order.total;
        ranking[order.clientName].orders += 1;
      }
    });
    return Object.entries(ranking)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [orders]);

  const handleClearHistory = async () => {
    if (!auth.currentUser?.email) return;
    setIsDeleting(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, auth.currentUser.email, confirmPassword);
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(db, 'orders', document.id)));
      await Promise.all(deletePromises);
      setShowClearModal(false);
      setConfirmPassword('');
      alert("Histórico de pedidos limpo com sucesso!");
    } catch (err: any) {
      console.error(err);
      setError("Senha incorreta ou erro de permissão.");
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = [
    { label: 'Faturamento Bruto', value: `R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', targetTab: 'orders' as const },
    { label: 'Pedidos Totais', value: orders.length, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600 border-blue-100', targetTab: 'orders' as const },
    { label: 'Pendentes Hoje', value: pendingOrders, icon: Clock, color: 'bg-orange-50 text-orange-600 border-orange-100', targetTab: 'orders' as const },
    { label: 'Faturados', value: finishedOrders, icon: CheckCircle2, color: 'bg-red-50 text-red-600 border-red-100', targetTab: 'orders' as const },
    { label: 'Clientes Base', value: clients.length, icon: Users, color: 'bg-slate-50 text-slate-600 border-slate-200', targetTab: 'clients' as const },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <button key={idx} onClick={() => onNavigate(stat.targetTab)} className="bg-white border border-slate-200 p-5 rounded-[24px] shadow-sm flex flex-col items-start gap-4 transition-all hover:border-red-400 hover:shadow-xl hover:-translate-y-1 group text-left w-full cursor-pointer">
            <div className={`p-2.5 rounded-xl ${stat.color} border shrink-0 transition-transform group-hover:scale-110`}><stat.icon className="w-4 h-4" /></div>
            <div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-base font-black text-slate-900 tracking-tighter mt-1">{stat.value}</h3>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100"><TrendingUp className="w-5 h-5 text-red-600" /></div>
               <div>
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Evolução Mensal</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Performance financeira semestral</p>
               </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}} tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                <Tooltip cursor={{stroke: '#fee2e2', strokeWidth: 2}} />
                <Area type="monotone" dataKey="vendas" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-[32px] shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Award className="w-5 h-5" /></div>
               <div>
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Top Vendedoras</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ranking do Mês Atual</p>
               </div>
            </div>
          </div>
          <div className="h-72">
            {sellerPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sellerPerformanceData} layout="vertical" margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide /><YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 9, fontWeight: '900'}} width={80} />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]} barSize={24}>
                    {sellerPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#f87171' : '#fca5a5'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 border border-dashed border-slate-100 rounded-3xl">
                <BarChart3 className="w-8 h-8 opacity-20" /><p className="text-[9px] font-black uppercase tracking-widest">Sem vendas este mês</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100 text-amber-600"><Trophy className="w-5 h-5" /></div>
              <div><h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Ranking de Clientes</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Maiores volumes de compra</p></div>
            </div>
          </div>
          <div className="space-y-4">
            {clientRanking.map((client, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-amber-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-slate-600' : 'bg-orange-200 text-orange-700'}`}>{idx + 1}º</div>
                  <div><p className="text-xs font-black text-slate-800 uppercase truncate max-w-[150px]">{client.name}</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{client.orders} Pedidos</p></div>
                </div>
                <div className="text-right"><p className="text-xs font-black text-slate-900 tracking-tighter">R$ {client.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 text-white"><History className="w-5 h-5" /></div>
              <div><h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Venda Mensal</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Faturamento acumulado</p></div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => onNavigate('monthly')}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200 hover:bg-white transition-all"
              >
                Relatórios <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setShowClearModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-red-100 hover:bg-red-600 hover:text-white transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Limpar
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {salesChartData.slice().reverse().map((data, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{data.name}</span></div>
                <span className="text-xs font-black text-slate-900 tracking-tighter">R$ {data.vendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100">
             <div className="bg-emerald-50 rounded-2xl p-4 flex items-center justify-between border border-emerald-100">
                <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Total Geral</span></div>
                <span className="text-sm font-black text-emerald-800 tracking-tighter">R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
             </div>
          </div>
        </div>
      </div>

      {showClearModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
          <div className="absolute inset-0" onClick={() => !isDeleting && setShowClearModal(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl border border-slate-200 animate-in zoom-in-95 overflow-hidden">
            <div className="p-8 bg-red-600 text-white flex flex-col items-center gap-4 text-center">
               <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center"><ShieldAlert className="w-8 h-8" /></div>
               <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em]">Confirmação de Segurança</h3>
                  <p className="text-[10px] font-bold uppercase opacity-70 mt-2">Você está prestes a excluir TODO o histórico de pedidos permanentemente.</p>
               </div>
               <button onClick={() => setShowClearModal(false)} className="absolute top-6 right-6 p-2 text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-10 space-y-6">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha de Administrador</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                    <input 
                      type="password" 
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs shadow-inner" 
                      placeholder="Sua senha pessoal"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-[8px] text-red-600 font-black uppercase tracking-widest ml-1">{error}</p>}
               </div>
               
               <button 
                 onClick={handleClearHistory}
                 disabled={isDeleting || !confirmPassword}
                 className="w-full py-4 bg-red-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
               >
                 {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Executar Limpeza Crítica <Trash2 className="w-3.5 h-3.5" /></>}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsOverview;
