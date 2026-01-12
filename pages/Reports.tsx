import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions } from '../services/db';
import { Transaction } from '../types';
import { Printer, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Reports: React.FC = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  useEffect(() => {
    if (currentUser) {
      getTransactions(currentUser.uid).then(setTransactions);
    }
  }, [currentUser]);

  const handlePrint = () => {
    window.print();
  };

  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const monthName = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Filter transactions by selected month/year
  const filteredTransactions = transactions.filter(t => {
    const [tYear, tMonth] = t.dueDate.split('-').map(Number);
    // Note: tMonth from split is 1-12, getMonth() is 0-11
    return tYear === selectedDate.getFullYear() && (tMonth - 1) === selectedDate.getMonth();
  });

  // Group by Category (using filtered data)
  const categoryData = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, [] as {name: string, value: number}[]);

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 print:p-0 print:pb-0 print:max-w-none">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Relatórios Financeiros</h2>
           <p className="text-slate-500">Análise detalhada de seus gastos</p>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Printer size={18} /> Imprimir / PDF
        </button>
      </div>

      {/* Date Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 print:hidden">
        <div className="flex items-center justify-between">
           <button 
             onClick={handlePrevMonth}
             className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
           >
             <ChevronLeft size={24} />
           </button>
           
           <div className="flex flex-col items-center">
             <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
                <Calendar size={14} />
                Período
             </div>
             <h2 className="text-xl font-bold text-slate-800 capitalize">{monthName}</h2>
           </div>

           <button 
             onClick={handleNextMonth}
             className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
           >
             <ChevronRight size={24} />
           </button>
        </div>
      </div>

      <div className="print:block" id="printable-area">
        <div className="hidden print:block mb-6 border-b pb-4">
           <h1 className="text-3xl font-bold text-slate-900">MeuControle - Relatório Mensal</h1>
           <p className="text-slate-500 capitalize">{monthName}</p>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 print:border-gray-300">
             <h4 className="text-emerald-800 font-medium">Total Receitas</h4>
             <p className="text-2xl font-bold text-emerald-600">R$ {totalIncome.toFixed(2)}</p>
           </div>
           <div className="bg-red-50 p-6 rounded-xl border border-red-100 print:border-gray-300">
             <h4 className="text-red-800 font-medium">Total Despesas</h4>
             <p className="text-2xl font-bold text-red-600">R$ {totalExpense.toFixed(2)}</p>
           </div>
           <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 print:border-gray-300">
             <h4 className="text-blue-800 font-medium">Balanço do Mês</h4>
             <p className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
               R$ {(totalIncome - totalExpense).toFixed(2)}
             </p>
           </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8 break-inside-avoid">
          <h3 className="font-bold text-slate-700 mb-4">Despesas por Categoria</h3>
          <div className="h-80 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" fill="#ef4444" name="Gasto" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                Nenhuma despesa registrada neste período.
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden break-inside-avoid">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-700">Detalhamento de Lançamentos</h3>
          </div>
          {filteredTransactions.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Descrição</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map(t => (
                  <tr key={t.id}>
                    <td className="px-4 py-3">{t.dueDate.split('-')[2]}/{t.dueDate.split('-')[1]}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span>{t.description}</span>
                        {t.observation && <span className="text-xs text-slate-400">{t.observation}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">{t.category}</td>
                    <td className={`px-4 py-3 text-right font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400">
              Nenhum lançamento encontrado para este mês.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;