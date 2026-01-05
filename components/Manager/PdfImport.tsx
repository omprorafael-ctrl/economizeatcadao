
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
  ArrowRight
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
        setError("Não conseguimos processar este PDF. Verifique se ele contém textos legíveis.");
        setStatus('idle');
      }
    };
    reader.onerror = () => {
      setError("Erro ao ler o arquivo físico.");
      setStatus('idle');
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
      setError("Falha ao salvar no banco de dados. Verifique sua conexão.");
      setStatus('review');
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-white rounded-[40px] overflow-hidden">
      {/* Barra de Progresso Superior */}
      {status === 'saving' && (
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 z-50">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Header */}
      <div className="p-10 pb-6 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200">
            <DatabaseZap className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Importador Inteligente</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Processamento de PDF via Gemini IA</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
        {/* State: IDLE */}
        {status === 'idle' && (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
            <label className="w-full max-w-lg border-2 border-dashed border-slate-200 rounded-[40px] p-20 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all group relative">
              <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
              <div className="w-24 h-24 bg-slate-100 rounded-[32px] flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500">
                <FileUp className="w-10 h-10" />
              </div>
              <div className="text-center">
                <p className="font-black text-slate-800 uppercase tracking-widest text-sm mb-2">Clique ou arraste o PDF</p>
                <p className="text-sm text-slate-400 font-medium">Suporta catálogos, planilhas e notas fiscais</p>
              </div>
            </label>
            
            {error && (
              <div className="mt-8 flex items-center gap-3 text-red-500 bg-red-50 px-6 py-3 rounded-2xl border border-red-100 animate-in shake duration-500">
                <AlertCircle className="w-5 h-5" />
                <p className="text-xs font-bold uppercase">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* States: READING / AI_PROCESSING / SAVING */}
        {(status === 'reading' || status === 'ai_processing' || status === 'saving') && (
          <div className="h-full flex flex-col items-center justify-center gap-8 animate-in fade-in duration-500">
            <div className="relative">
              <div className="w-32 h-32 border-8 border-blue-50 border-t-blue-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-blue-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                {status === 'reading' && 'Lendo PDF...'}
                {status === 'ai_processing' && 'IA Analisando Tabelas...'}
                {status === 'saving' && 'Gravando no Estoque...'}
              </h3>
              <p className="text-slate-400 font-medium max-w-xs mx-auto">
                {status === 'reading' && `Carregando ${fileName}`}
                {status === 'ai_processing' && 'O Gemini está extraindo códigos e preços de cada página.'}
                {status === 'saving' && `Processando ${progress}% dos itens encontrados.`}
              </p>
            </div>
          </div>
        )}

        {/* State: REVIEW */}
        {status === 'review' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between bg-emerald-50 p-8 rounded-[32px] border border-emerald-100">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-emerald-900 font-black text-xl">Leitura Concluída!</p>
                  <p className="text-emerald-600/60 text-xs font-bold uppercase tracking-[0.2em]">{results.length} Itens identificados no PDF</p>
                </div>
              </div>
              <div className="bg-white/50 px-6 py-3 rounded-2xl border border-emerald-100 text-center">
                <p className="text-xs font-black text-emerald-400 uppercase mb-1">Arquivo</p>
                <p className="text-sm font-bold text-emerald-900 truncate max-w-[150px]">{fileName}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-[35px] overflow-hidden border border-slate-100 shadow-inner">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-8 py-5">Cód</th>
                    <th className="px-8 py-5">Descrição do Produto</th>
                    <th className="px-8 py-5">Grupo</th>
                    <th className="px-8 py-5 text-right">Preço Unit.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white transition-all group">
                      <td className="px-8 py-5 text-xs font-black text-slate-400">#{item.code}</td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-700">{item.description}</td>
                      <td className="px-8 py-5">
                        <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase">{item.group}</span>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-blue-600">
                        <span className="text-[10px] mr-1 opacity-40">R$</span>
                        {Number(item.price).toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* State: DONE */}
        {status === 'done' && (
          <div className="h-full flex flex-col items-center justify-center gap-6 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-200 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900 uppercase">Estoque Atualizado!</h3>
              <p className="text-slate-400 font-medium">Os produtos já estão disponíveis para os clientes.</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {status === 'review' && (
        <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={() => { setResults([]); setStatus('idle'); }}
            className="flex items-center gap-3 px-8 py-4 bg-white text-slate-500 font-black rounded-2xl border border-slate-200 hover:text-red-500 hover:border-red-200 transition-all text-xs uppercase tracking-widest"
          >
            <Trash2 className="w-4 h-4" /> Descartar e Voltar
          </button>
          <button 
            onClick={confirmImport}
            className="flex items-center gap-4 px-12 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
          >
            <PlusCircle className="w-5 h-5" /> Importar {results.length} Itens <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfImport;
