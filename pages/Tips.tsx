import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { useAuth } from '../contexts/AuthContext';
import { getTransactions } from '../services/db';
import { Transaction } from '../types';
import { 
  Sparkles, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Loader2, 
  RefreshCw,
  Info
} from 'lucide-react';

interface Tip {
  title: string;
  description: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  category: string;
}

const Tips: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<Tip[]>([]);
  const [analyzedData, setAnalyzedData] = useState<{income: number, expense: number} | null>(null);

  useEffect(() => {
    // Try to load tips from local storage to save API calls
    const cached = localStorage.getItem('financial_tips');
    const cachedDate = localStorage.getItem('financial_tips_date');
    
    // Cache invalidation after 24 hours
    const isCacheValid = cachedDate && (Date.now() - parseInt(cachedDate) < 24 * 60 * 60 * 1000);

    if (cached && isCacheValid) {
      setTips(JSON.parse(cached));
    }
  }, []);

  const generateTips = async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      // 1. Fetch Data
      const transactions = await getTransactions(currentUser.uid);
      
      // 2. Process Data for Prompt (last 60 days to get recent trends)
      const now = new Date();
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(now.getMonth() - 2);

      const recentTransactions = transactions.filter(t => new Date(t.dueDate) >= twoMonthsAgo);

      if (recentTransactions.length === 0) {
        alert("Você precisa adicionar transações recentes para gerar dicas.");
        setLoading(false);
        return;
      }

      const totalIncome = recentTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

      const totalExpense = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

      setAnalyzedData({ income: totalIncome, expense: totalExpense });

      // Group expenses by category
      const expensesByCategory = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

      // Get top 10 expenses for context
      const topExpenses = recentTransactions
        .filter(t => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
        .map(t => `${t.description} (${t.category}): R$ ${t.amount.toFixed(2)}`);

      // 3. Prepare AI Prompt
      const summaryData = {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        expensesByCategory,
        topExpenses
      };

      const prompt = `
        Atue como um consultor financeiro pessoal experiente. Analise os seguintes dados financeiros de um usuário brasileiro (Moeda BRL) dos últimos 60 dias:
        ${JSON.stringify(summaryData)}

        Gere 4 dicas de economia personalizadas, práticas e acionáveis.
        Foque em onde o usuário está gastando mais e como ele pode otimizar.
        Se o saldo for negativo, foque em cortes de emergência. Se for positivo, foque em investimentos ou reserva.
      `;

      // 4. Call Gemini API
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tips: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Título curto e impactante da dica" },
                    description: { type: Type.STRING, description: "Explicação detalhada e prática de como economizar" },
                    priority: { type: Type.STRING, enum: ["Alta", "Média", "Baixa"], description: "Nível de importância/urgência" },
                    category: { type: Type.STRING, description: "Categoria relacionada (ex: Alimentação, Fixos, Investimento)" }
                  }
                }
              }
            }
          }
        }
      });

      // 5. Handle Response
      if (response.text) {
        const result = JSON.parse(response.text);
        setTips(result.tips);
        
        // Save to cache
        localStorage.setItem('financial_tips', JSON.stringify(result.tips));
        localStorage.setItem('financial_tips_date', Date.now().toString());
      }

    } catch (error) {
      console.error("Error generating tips:", error);
      alert("Erro ao gerar dicas. Verifique sua conexão ou tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Alta': return 'bg-red-100 text-red-700 border-red-200';
      case 'Média': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Baixa': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-6 sm:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-10 -translate-y-10">
          <Sparkles size={180} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
               <Lightbulb size={28} className="text-yellow-300" />
             </div>
             <span className="text-indigo-200 font-medium tracking-wide text-sm uppercase">Assistente Inteligente</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold mb-4">Dicas Personalizadas</h1>
          <p className="text-indigo-100 max-w-xl text-lg mb-8 leading-relaxed">
            Utilize nossa inteligência artificial para analisar seus gastos recentes e descobrir oportunidades de economia invisíveis.
          </p>
          
          <button 
            onClick={generateTips}
            disabled={loading}
            className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Analisando Finanças...
              </>
            ) : (
              <>
                <Sparkles size={20} /> Gerar Novas Dicas
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {tips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {tips.map((tip, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${getPriorityColor(tip.priority)}`}>
                  Prioridade {tip.priority}
                </span>
                <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded-lg">
                  {tip.category}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-2">{tip.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed flex-1">
                {tip.description}
              </p>
              
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-indigo-600 text-sm font-medium cursor-pointer hover:underline">
                <Target size={16} /> Definir meta relacionada
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center flex flex-col items-center gap-4">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <Info size={32} />
           </div>
           <div>
             <h3 className="text-lg font-bold text-slate-700">Nenhuma dica gerada ainda</h3>
             <p className="text-slate-500 max-w-sm mx-auto mt-1">
               Clique no botão acima para que a IA analise suas transações e gere um plano de economia.
             </p>
           </div>
        </div>
      )}
      
      <div className="text-center text-xs text-slate-400 mt-8">
        <p>As dicas são geradas por Inteligência Artificial (Gemini) com base no seu histórico.</p>
      </div>
    </div>
  );
};

export default Tips;