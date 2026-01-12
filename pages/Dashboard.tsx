import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CalendarClock,
  CalendarRange,
  ArrowRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions } from '../services/db';
import { Transaction } from '../types';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      if (!currentUser) return;
      const data = await getTransactions(currentUser.uid);
      setTransactions(data);
    } catch (error) {
      console.error("Error loading dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Date Helpers ---
  const todayObj = new Date();
  todayObj.setHours(0,0,0,0);

  // Helper to create date objects in local time from YYYY-MM-DD string
  // Kept safety check to prevent white screen on invalid data
  const getLocalDay = (dateStr?: string) => {
      if (!dateStr || typeof dateStr !== 'string') return new Date(); 
      try {
        const parts = dateStr.split('-');
        if (parts.length !== 3) return new Date();
        const [y, m, d] = parts.map(Number);
        return new Date(y, m-1, d);
      } catch (e) {
        return new Date();
      }
  };

  // --- Current Month Calculations ---
  const currentMonth = todayObj.getMonth();
  const currentYear = todayObj.getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const d = getLocalDay(t.dueDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const income = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const balance = income - expenses;

  const pendingExpensesTotal = monthlyTransactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // --- Next Month Projection ---
  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
  const nextMonthIndex = nextMonthDate.getMonth();
  const nextMonthYearVal = nextMonthDate.getFullYear();
  const nextMonthName = nextMonthDate.toLocaleString('pt-BR', { month: 'long' });

  const explicitNextMonthTransactions = transactions.filter(t => {
    const d = getLocalDay(t.dueDate);
    return d.getMonth() === nextMonthIndex && d.getFullYear() === nextMonthYearVal;
  });

  const indefiniteRecurring = transactions.filter(t => 
    t.isRecurring && 
    (!t.recurrence?.count) && 
    t.recurrence?.frequency === 'monthly'
  );

  const projectedIncome = 
    explicitNextMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) +
    indefiniteRecurring.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);

  const projectedExpenses = 
    explicitNextMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0) +
    indefiniteRecurring.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  const projectedBalance = projectedIncome - projectedExpenses;

  // --- Chart Data ---
  const categoryDataMap = new Map<string, number>();
  monthlyTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const current = categoryDataMap.get(t.category) || 0;
      categoryDataMap.set(t.category, current + t.amount);
    });

  const pieData = Array.from(categoryDataMap, ([name, value]) => ({ name, value }));
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

  if (loading) {
    return <div className="flex justify-center items-center h-full text-emerald-600">Carregando informações...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
          <p className="text-slate-500">Resumo financeiro de <span className="capitalize text-slate-700 font-semibold">{todayObj.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span></p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden col-span-2 md:col-span-1">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-sm font-medium text-slate-500">Saldo Atual</p>
              <h3 className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                R$ {balance.toFixed(2)}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${balance >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div className="order-2 md:order-1">
              <p className="text-xs md:text-sm font-medium text-slate-500">Receitas</p>
              <h3 className="text-lg md:text-2xl font-bold mt-1 text-slate-800">
                R$ {income.toFixed(2)}
              </h3>
            </div>
            <div className="order-1 md:order-2 p-1.5 md:p-2 mb-2 md:mb-0 rounded-lg bg-blue-100 text-blue-600">
              <TrendingUp size={16} className="md:w-5 md:h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div className="order-2 md:order-1">
              <p className="text-xs md:text-sm font-medium text-slate-500">Despesas</p>
              <h3 className="text-lg md:text-2xl font-bold mt-1 text-slate-800">
                R$ {expenses.toFixed(2)}
              </h3>
            </div>
            <div className="order-1 md:order-2 p-1.5 md:p-2 mb-2 md:mb-0 rounded-lg bg-orange-100 text-orange-600">
              <TrendingDown size={16} className="md:w-5 md:h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 col-span-2 md:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Contas a Pagar</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">
                R$ {pendingExpensesTotal.toFixed(2)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Pendentes este mês</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <CalendarClock size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Projection Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <CalendarRange size={120} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
               <CalendarRange size={24} className="text-emerald-400" />
             </div>
             <div>
               <h3 className="text-lg font-bold">Projeção para <span className="capitalize text-emerald-400">{nextMonthName}</span></h3>
               <p className="text-slate-400 text-sm">Baseado nos seus gastos fixos e lançamentos futuros</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
             <div className="flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start gap-1 border-b border-white/10 md:border-none pb-2 md:pb-0">
                <span className="text-sm text-slate-400">Receitas Previstas</span>
                <div className="text-right md:text-left">
                  <span className="text-xl md:text-2xl font-bold text-emerald-400 block">+ R$ {projectedIncome.toFixed(2)}</span>
                  <p className="text-xs text-slate-500">Salários e fixos</p>
                </div>
             </div>
             
             <div className="flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start gap-1 border-b border-white/10 md:border-none pb-2 md:pb-0">
                <span className="text-sm text-slate-400">Despesas Previstas</span>
                <div className="text-right md:text-left">
                  <span className="text-xl md:text-2xl font-bold text-red-400 block">- R$ {projectedExpenses.toFixed(2)}</span>
                  <p className="text-xs text-slate-500">Fixas e parcelas</p>
                </div>
             </div>

             <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/5">
                <span className="text-sm text-slate-300 block mb-1">Saldo Projetado</span>
                <div className="flex items-center gap-2">
                   <span className={`text-3xl font-bold ${projectedBalance >= 0 ? 'text-white' : 'text-red-300'}`}>
                     R$ {projectedBalance.toFixed(2)}
                   </span>
                   {projectedBalance >= 0 ? <TrendingUp size={20} className="text-emerald-400"/> : <TrendingDown size={20} className="text-red-400"/>}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                   {projectedBalance >= 0 ? "Você fechará o mês no azul! 👏" : "Atenção: Previsão de saldo negativo."}
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-700 mb-6">Gastos por Categoria (Mês Atual)</h3>
          <div className="h-64 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Nenhum gasto registrado este mês
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions List (Mini) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-700">Últimos Lançamentos</h3>
             <a href="#/expenses" className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1">
               Ver tudo <ArrowRight size={12} />
             </a>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 max-h-[250px]">
            {monthlyTransactions.length > 0 ? (
              <div className="space-y-3">
                {monthlyTransactions.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-10 rounded-full ${t.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <div>
                        <p className="font-medium text-slate-700">{t.description}</p>
                        <p className="text-xs text-slate-400">{t.category} • {new Date(t.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {t.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-10">
                Nenhum lançamento neste mês
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;