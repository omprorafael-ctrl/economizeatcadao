
import React, { useState } from 'react';
import { Product } from '../../types';
import { Edit2, Trash2, Search, Plus, Power, Package, FileSearch, X, Tag, Flame } from 'lucide-react';
import PdfImport from './PdfImport';
import { db } from '../../firebaseConfig';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';

interface ProductListProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), { active: !currentStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const deleteProduct = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este produto?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
      }
    }
  };

  const filtered = products.filter(p => 
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white/5 backdrop-blur-3xl rounded-[45px] shadow-2xl border border-white/5 overflow-hidden">
        <div className="p-10 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="relative flex-1 max-w-2xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar por SKU ou Nome..."
              className="w-full pl-14 pr-6 py-5 bg-black/20 border border-white/5 rounded-[28px] outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-black/40 focus:border-red-500/40 transition-all font-bold text-white placeholder:text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowImportModal(true)}
              className="bg-white/5 border border-white/10 text-white px-8 py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95 shadow-xl"
            >
              <FileSearch className="w-5 h-5 text-red-500" /> Importar PDF IA
            </button>
            <button className="bg-red-600 text-white px-8 py-5 rounded-[28px] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-2xl shadow-red-900/50 hover:bg-red-500 active:scale-95 transition-all">
              <Plus className="w-5 h-5" /> Novo Registro
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead className="bg-black/40 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/5">
              <tr>
                <th className="px-10 py-6">Especificação Item</th>
                <th className="px-10 py-6">Família</th>
                <th className="px-10 py-6">Valor Unit.</th>
                <th className="px-10 py-6 text-center">Status Venda</th>
                <th className="px-10 py-6 text-right">Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-white/5 transition-all group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white/5 rounded-[22px] flex items-center justify-center text-slate-600 border border-white/10 group-hover:bg-red-600/10 group-hover:text-red-500 transition-all">
                        <Tag className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-white text-sm leading-tight uppercase tracking-wide group-hover:text-red-400 transition-colors">{product.description}</p>
                        <p className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-[0.2em]">SKU: {product.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className="px-4 py-1.5 bg-red-600/10 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-500/20">{product.group}</span>
                  </td>
                  <td className="px-10 py-8 font-black text-white text-base italic">
                    <span className="text-[10px] text-red-500 mr-2 not-italic">R$</span>
                    {product.price.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-10 py-8 text-center">
                    <button 
                      onClick={() => toggleStatus(product.id, product.active)}
                      className={`inline-flex items-center px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                        product.active 
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/30'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mr-2 ${product.active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      {product.active ? 'Disponível' : 'Bloqueado'}
                    </button>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all border border-white/10">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="p-3 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl transition-all border border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-40 flex flex-col items-center text-slate-600 animate-in zoom-in duration-1000">
              <Package className="w-24 h-24 mb-6 opacity-20" />
              <p className="font-black uppercase tracking-[0.4em] text-xs">Registro inexistente no banco</p>
            </div>
          )}
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowImportModal(false)} />
          <div className="relative bg-[#0a0a0a] w-full max-w-4xl rounded-[55px] shadow-[0_0_100px_rgba(220,38,38,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 border border-white/5">
            <div className="absolute top-8 right-8 z-10">
              <button 
                onClick={() => setShowImportModal(false)}
                className="p-4 bg-white/5 text-slate-500 hover:text-white hover:bg-red-600 rounded-[24px] transition-all border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <PdfImport onClose={() => setShowImportModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
