
import React, { useState } from 'react';
import { 
  FileUp, 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  DatabaseZap, 
  Trash2,
  ArrowRight,
  X,
  Image as ImageIcon,
  Wand2
} from 'lucide-react';
import { extractProductsFromPdf, searchProductImage } from '../../services/geminiService';
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
  const [isAutoSearching, setIsAutoSearching] = useState(false);
  const [searchingIds, setSearchingIds] = useState<Set<number>>(new Set());

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
        // Inicializa com placeholder, mas permite busca posterior
        const processed = extracted.map((item: any, idx: number) => ({
          ...item,
          tempId: idx,
          imageUrl: `https://picsum.photos/400/400?random=${idx + 1000}`
        }));
        setResults(processed);
        setStatus('review');
      } catch (err) {
        setError("Erro ao processar PDF via Inteligência Artificial.");
        setStatus('idle');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBatchImageSearch = async () => {
    setIsAutoSearching(true);
    const updatedResults = [...results];

    for (let i = 0; i < updatedResults.length; i++) {
      const item = updatedResults[i];
      setSearchingIds(prev => new Set(prev).add(item.tempId));
      
      try {
        const foundUrl = await searchProductImage(item.description);
        if (foundUrl) {
          updatedResults[i].imageUrl = foundUrl;
          setResults([...updatedResults]);
        }
      } catch (err) {
        console.error("Erro na busca individual:", err);
      } finally {
        setSearchingIds(prev => {
          const next = new Set(prev);
          next.delete(item.tempId);
          return next;
        });
      }
    }
    setIsAutoSearching(false);
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
          imageUrl: item.imageUrl,
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
    <div className="flex flex-col h-[85vh] bg-white text-slate-800">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <DatabaseZap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 tracking-tight uppercase leading-none">Extração e Fotos IA</h2>
            <p className="text-[8px] font-bold text-red-500 uppercase tracking-widest mt-1">Inteligência Gemini com Google Search</p>
          </div>
        </div>
        {status === 'review' && (
          <button 
            onClick={handleBatchImageSearch}
            disabled={isAutoSearching}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 shadow-md"
          >
            {isAutoSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
            Auto-completar Fotos
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {status === 'idle' && (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-700">
            <label className="w-full max-w-lg border-2 border-dashed border-slate-200 rounded-[40px] p-16 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-red-300 hover:bg-red-50/20 transition-all group">
              <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                <FileUp className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-2">Importar Tabela PDF</p>
                <p className="text-[9px] text-slate-400 font-medium max-w-[180px] leading-relaxed">Selecione o arquivo para extrair produtos e buscar fotos automaticamente.</p>
              </div>
            </label>
            {error && <div className="mt-8 text-red-500 bg-red-50 px-6 py-3 rounded-xl border border-red-100 text-[10px] font-bold uppercase">{error}</div>}
          </div>
        )}

        {(status === 'reading' || status === 'ai_processing' || status === 'saving') && (
          <div className="h-full flex flex-col items-center justify-center gap-6 animate-in fade-in">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-red-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                {status === 'reading' && 'Lendo PDF...'}
                {status === 'ai_processing' && 'IA Analisando Produtos e Catálogo...'}
                {status === 'saving' && `Sincronizando Banco (${progress}%)...`}
              </h3>
            </div>
          </div>
        )}

        {status === 'review' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((item) => {
                const isSearching = searchingIds.has(item.tempId);
                return (
                  <div key={item.tempId} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-4 items-center group relative overflow-hidden">
                    <div className={`w-14 h-14 bg-white rounded-xl border border-slate-200 overflow-hidden shrink-0 relative ${isSearching ? 'animate-pulse' : ''}`}>
                      {isSearching ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                           <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                        </div>
                      ) : (
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-800 uppercase truncate pr-4">{item.description}</p>
                      <div className="flex items-center justify-between mt-2">
                         <span className="text-[8px] font-black text-slate-400 uppercase">R$ {Number(item.price).toFixed(2)}</span>
                         <span className="text-[8px] font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 uppercase">{item.group}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="h-full flex flex-col items-center justify-center gap-4 animate-in zoom-in">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Estoque Atualizado</h3>
              <p className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.2em] mt-2">Produtos e fotos sincronizados.</p>
            </div>
          </div>
        )}
      </div>

      {status === 'review' && (
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button 
            onClick={() => { setResults([]); setStatus('idle'); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-400 font-bold rounded-xl border border-slate-200 hover:text-red-600 transition-all text-[9px] uppercase tracking-widest"
          >
            <Trash2 className="w-3.5 h-3.5" /> Descartar
          </button>
          <button 
            onClick={confirmImport}
            disabled={isAutoSearching}
            className="flex items-center gap-3 px-8 py-2.5 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all text-[9px] uppercase tracking-widest disabled:opacity-50"
          >
            Importar {results.length} Itens <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfImport;
