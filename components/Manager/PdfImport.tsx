
import React, { useState } from 'react';
import { 
  FileUp, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  PlusCircle, 
  DatabaseZap, 
  FileText,
  Trash2,
  ArrowRight,
  X,
  Search
} from 'lucide-react';
import { extractProductsFromPdf } from '../../services/geminiService';
import { db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

interface PdfImportProps {
  onClose: () => void;
}

type ImportStatus = 'idle' | 'reading' | 'ai_processing' | 'review' | 'saving' | 'done';

const PdfImport: React.FC<PdfImportProps> = ({ onClose }) => {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError("Por favor, selecione um arquivo no formato PDF.");
      return;
    }

    setFileName(file.name);
    setStatus('reading');
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        setStatus('ai_processing');
        const extracted = await extractProductsFromPdf(base64);
        setResults(extracted);
        setStatus('review');
      } catch (err) {
        setError("Não conseguimos processar este PDF.");
        setStatus('idle');
      }
    };
    reader.readAsDataURL(file);
  };

  const confirmImport = async () => {
    setStatus('saving');
    let savedCount = 0;
    
    try {
      for (const item of results) {
        const productData = {
          code: item.code || `IA-${Math.floor(Math.random() * 10000)}`,
          description: item.description,
          group: item.group || 'Geral',
          price: Number(item.price),
          imageUrl: `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`,
          active: true,
          createdAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, 'products'), productData);
        savedCount++;
        setProgress(Math.round((savedCount / results.length) * 100));
      }
      setStatus('done');
      setTimeout(onClose, 2000);
    } catch (err) {
      setError("Falha ao salvar no banco.");
      setStatus('review');
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-[#0a0a0a] text-white">
      {status === 'saving' && (
        <div className="absolute top-0 left-0 w-full h-2 bg-white/5 z-50">
          <div 
            className="h-full bg-red-600 shadow-[0_0_15px_red] transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-10 pb-8 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-red-900/40 border border-white/10">
            <DatabaseZap className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase">Deep Scan IA</h2>
            <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mt-1">Extração Inteligente Gemini</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
        {status === 'idle' && (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700">
            <label className="w-full max-w-xl border-2 border-dashed border-white/10 rounded-[50px] p-24 flex flex-col items-center justify-center gap-8 cursor-pointer hover:border-red-500/50 hover:bg-white/5 transition-all group relative">
              <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
              <div className="w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center group-hover:bg-red-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 border border-white/10">
                <FileUp className="w-12 h-12" />
              </div>
              <div className="text-center">
                <p className="font-black text-white uppercase tracking-[0.3em] text-sm mb-3">Mapear Arquivo PDF</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Tabelas de preços, inventários ou catálogos</p>
              </div>
            </label>
            
            {error && (
              <div className="mt-10 flex items-center gap-4 text-red-500 bg-red-500/10 px-8 py-4 rounded-3xl border border-red-500/20 animate-in shake duration-500">
                <AlertCircle className="w-6 h-6" />
                <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
              </div>
            )}
          </div>
        )}

        {(status === 'reading' || status === 'ai_processing' || status === 'saving') && (
          <div className="h-full flex flex-col items-center justify-center gap-10 animate-in fade-in duration-500">
            <div className="relative">
              <div className="w-40 h-40 border-8 border-white/5 border-t-red-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-14 h-14 text-red-600 animate-pulse drop-shadow-[0_0_10px_red]" />
              </div>
            </div>
            <div className="text-center space-y-4">
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                {status === 'reading' && 'Carregando Binários...'}
                {status === 'ai_processing' && 'Algoritmo em Execução...'}
                {status === 'saving' && 'Gravando Dados...'}
              </h3>
              <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] max-w-xs mx-auto">
                {status === 'reading' && `Escaneando ${fileName}`}
                {status === 'ai_processing' && 'O Gemini está decodificando as tabelas e preços.'}
                {status === 'saving' && `Sincronizando ${progress}% dos ativos encontrados.`}
              </p>
            </div>
          </div>
        )}

        {status === 'review' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700">
            <div className="flex items-center justify-between bg-emerald-600/10 p-10 rounded-[45px] border border-emerald-500/20 shadow-2xl shadow-emerald-900/10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-white font-black text-2xl italic tracking-tighter">Conclusão Analítica</p>
                  <p className="text-emerald-500/60 text-[10px] font-black uppercase tracking-[0.3em]">{results.length} Itens detectados com sucesso</p>
                </div>
              </div>
              <div className="bg-black/40 px-6 py-3 rounded-2xl border border-white/10 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fonte</p>
                <p className="text-xs font-bold text-white truncate max-w-[150px]">{fileName}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-[45px] overflow-hidden border border-white/5 shadow-inner">
              <table className="w-full text-left">
                <thead className="bg-black/40 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                  <tr>
                    <th className="px-10 py-6">SKU IA</th>
                    <th className="px-10 py-6">Descritivo Mercadoria</th>
                    <th className="px-10 py-6">Agrupamento</th>
                    <th className="px-10 py-6 text-right">Valor Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {results.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-all group">
                      <td className="px-10 py-6 text-[10px] font-black text-slate-500 tracking-widest">#{item.code}</td>
                      <td className="px-10 py-6 text-sm font-bold text-white uppercase group-hover:text-red-400 transition-colors">{item.description}</td>
                      <td className="px-10 py-6">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-slate-400 uppercase">{item.group}</span>
                      </td>
                      <td className="px-10 py-6 text-right font-black text-white italic text-base">
                        <span className="text-[10px] text-red-500 mr-2 not-italic">R$</span>
                        {Number(item.price).toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="h-full flex flex-col items-center justify-center gap-8 animate-in zoom-in duration-700">
            <div className="w-32 h-32 bg-emerald-600 rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-emerald-900/40 border-4 border-white/10 animate-float">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Estoque Atualizado</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Sincronização concluída com sucesso</p>
            </div>
          </div>
        )}
      </div>

      {status === 'review' && (
        <div className="p-12 bg-black/60 backdrop-blur-3xl border-t border-white/5 flex items-center justify-between">
          <button 
            onClick={() => { setResults([]); setStatus('idle'); }}
            className="flex items-center gap-4 px-10 py-5 bg-white/5 text-slate-500 font-black rounded-3xl border border-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all text-[10px] uppercase tracking-[0.2em]"
          >
            <Trash2 className="w-5 h-5" /> Abortar Operação
          </button>
          <button 
            onClick={confirmImport}
            className="flex items-center gap-5 px-14 py-6 bg-red-600 text-white font-black rounded-[30px] shadow-2xl shadow-red-900/50 hover:bg-red-500 active:scale-95 transition-all text-[10px] uppercase tracking-[0.3em]"
          >
            <PlusCircle className="w-6 h-6" /> Consolidar {results.length} Itens <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfImport;
