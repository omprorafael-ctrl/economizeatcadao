
import React, { useState } from 'react';
import { Product } from '../../types';
import { Edit2, Trash2, Search, Plus, Power, Package, FileSearch, X } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Pesquisar no inventário..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-black text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowImportModal(true)}
              className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-black active:scale-95 transition-all text-sm"
            >
              <FileSearch className="w-5 h-5" /> Importar IA
            </button>
            <button className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all text-sm">
              <Plus className="w-5 h-5" /> Novo Produto
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
              <tr>
                <th className="px-8 py-5">Item / Código</th>
                <th className="px-8 py-5">Grupo</th>
                <th className="px-8 py-5">Preço Unitário</th>
                <th className="px-8 py-5 text-center">Disponibilidade</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl overflow-hidden p-2 group-hover:scale-105 transition-transform">
                        <img src={product.imageUrl} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm leading-tight">{product.description}</p>
                        <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">SKU: {product.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">{product.group}</span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900">
                    <span className="text-[10px] text-slate-400 mr-1 italic">R$</span>
                    {product.price.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => toggleStatus(product.id, product.active)}
                      className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        product.active 
                        ? 'bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100' 
                        : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {product.active ? 'Em Linha' : 'Fora de Linha'}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
            <div className="py-32 flex flex-col items-center text-slate-300">
              <Package className="w-20 h-20 mb-4 opacity-20" />
              <p className="font-black uppercase tracking-widest text-xs">Nenhum registro encontrado</p>
            </div>
          )}
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
          <div className="relative bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
            <div className="absolute top-6 right-6 z-10">
              <button 
                onClick={() => setShowImportModal(false)}
                className="p-3 bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
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
