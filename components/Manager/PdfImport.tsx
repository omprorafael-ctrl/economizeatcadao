
import React, { useState } from 'react';
import { 
  FileUp, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  PlusCircle, 
  DatabaseZap, 
  Trash2,
  ArrowRight,
  X
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
      setError("Formato inválido. Use apenas arquivos PDF.");
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
        setError("Erro ao processar PDF via Inteligência Artificial.");
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
          group: item.group || 'Diversos',
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
      setTimeout(onClose, 1500);
    } catch (err) {
      setError("Erro ao persistir dados.");
      setStatus('review');
    }
  };

  return (
    <div className="flex flex-col h-[80vh] bg-white text-slate-800">
      <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <DatabaseZap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">Extração Inteligente</h2>
            <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-0.5">Tecnologia Gemini Deep Scan</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
        {status === 'idle' && (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-700">
            <label className="w-full max-w-lg border-2 border-dashed border-slate-200 rounded-[40px] p-20 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-red-300 hover:bg-red-50/20 transition-all group">
              <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                <FileUp className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800 uppercase tracking-widest text-xs mb-2">Importar Tabela PDF</p>
                <p className="text-[10px] text-slate-400 font-medium max-w-[200px] leading-relaxed">Arraste ou clique para selecionar o arquivo do catálogo.</p>
              </div>
            </label>
            {error && <div className="mt-8 text-red-500 bg-red-50 px-6 py-3 rounded-xl border border-red-100 text-[10px] font-bold uppercase">{error}</div>}
          </div>
        )}

        {(status === 'reading' || status === 'ai_processing' || status === 'saving') && (
          <div className="h-full flex flex-col items-center justify-center gap-6 animate-in fade-in">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-red-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-widest">
                {status === 'reading' && 'Lendo PDF...'}
                {status === 'ai_processing' && 'IA Analisando Produtos...'}
                {status === 'saving' && `Sincronizando Banco (${progress}%)...`}
              </h3>
            </div>
          </div>
        )}

        {status === 'review' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-slate-900 font-bold text-sm uppercase">Extração Concluída</p>
                  <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest">{results.length} itens encontrados</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Arquivo</p>
                <p className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{fileName}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4">Grupo</th>
                    <th className="px-6 py-4 text-right">Preço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-400">#{item.code}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700 uppercase">{item.description}</td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{item.group}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 text-xs">R$ {Number(item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="h-full flex flex-col items-center justify-center gap-4 animate-in zoom-in">
            <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-emerald-100">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-widest">Estoque Sincronizado</h3>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mt-2">Dados processados com sucesso.</p>
            </div>
          </div>
        )}
      </div>

      {status === 'review' && (
        <div className="p-8 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button 
            onClick={() => { setResults([]); setStatus('idle'); }}
            className="flex items-center gap-2 px-6 py-3 bg-white text-slate-400 font-bold rounded-xl border border-slate-200 hover:text-red-600 transition-all text-[10px] uppercase"
          >
            <Trash2 className="w-4 h-4" /> Descartar
          </button>
          <button 
            onClick={confirmImport}
            className="flex items-center gap-3 px-10 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all text-[10px] uppercase tracking-widest"
          >
            Salvar {results.length} Produtos <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfImport;
