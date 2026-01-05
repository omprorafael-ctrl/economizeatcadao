
import React, { useState } from 'react';
import { Product } from '../../types';
import { Edit2, Trash2, Search, Plus, Package, FileSearch, X, Tag, Loader2, DollarSign, Layers, AlignLeft, Zap } from 'lucide-react';
import PdfImport from './PdfImport';
import { db } from '../../firebaseConfig';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

interface ProductListProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    group: '',
    price: '',
    onSale: false,
    salePrice: ''
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        code: formData.code.trim(),
        description: formData.description.trim(),
        group: formData.group.trim(),
        price: parseFloat(formData.price.replace(',', '.')),
        onSale: formData.onSale,
        salePrice: formData.onSale ? parseFloat(formData.salePrice.replace(',', '.')) : null,
        imageUrl: `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`,
        active: true,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'products'), productData);
      setFormData({ code: '', description: '', group: '', price: '', onSale: false, salePrice: '' });
      setShowAddModal(false);
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), { active: !currentStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const toggleSale = async (id: string, currentOnSale: boolean, currentPrice: number) => {
    try {
      await updateDoc(doc(db, 'products', id), { 
        onSale: !currentOnSale,
        salePrice: !currentOnSale ? currentPrice * 0.9 : null
      });
    } catch (error) {
      console.error("Erro ao alternar promoção:", error);
    }
  };

  const deleteProduct = async (id: string) => {
    if (window.confirm("Deseja realmente excluir este produto permanentemente?")) {
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por SKU ou Nome..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all text-xs font-medium text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowImportModal(true)}
              className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2"
            >
              <FileSearch className="w-3.5 h-3.5" /> Importar PDF
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Novo Produto
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Preço</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 group-hover:border-red-200 transition-colors">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs uppercase truncate max-w-xs">{product.description}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 tracking-wider">SKU: {product.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-500 uppercase">{product.group}</span>
                  </td>
                  <td className="px-6 py-4">
                    {product.onSale ? (
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 line-through">R$ {product.price.toFixed(2)}</span>
                        <span className="font-black text-red-600 text-sm">R$ {product.salePrice?.toFixed(2)}</span>
                      </div>
                    ) : (
                      <span className="font-bold text-slate-900 text-sm">R$ {product.price.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5 items-center">
                      <button 
                        onClick={() => toggleStatus(product.id, product.active)}
                        className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${
                          product.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                        }`}
                      >
                        {product.active ? 'Ativo' : 'Pausado'}
                      </button>
                      <button 
                        onClick={() => toggleSale(product.id, !!product.onSale, product.price)}
                        className={`text-[8px] font-bold uppercase flex items-center gap-1 transition-colors ${
                          product.onSale ? 'text-orange-500' : 'text-slate-300 hover:text-orange-400'
                        }`}
                      >
                        <Zap className="w-2.5 h-2.5" /> Promo
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button className="p-2 text-slate-300 hover:text-slate-600 transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteProduct(product.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/10">
          <div className="absolute inset-0" onClick={() => setShowImportModal(false)} />
          <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="absolute top-4 right-4 z-10">
              <button onClick={() => setShowImportModal(false)} className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-lg shadow-sm"><X className="w-5 h-5" /></button>
            </div>
            <PdfImport onClose={() => setShowImportModal(false)} />
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/10">
          <div className="absolute inset-0" onClick={() => !loading && setShowAddModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Novo Item no Catálogo</h3>
              <button onClick={() => !loading && setShowAddModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">SKU / Código</label>
                  <input
                    type="text" required disabled={loading}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs"
                    placeholder="Ex: 1002" value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  <input
                    type="text" required disabled={loading}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs"
                    placeholder="Grãos" value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                <textarea
                  required rows={3} disabled={loading}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs resize-none"
                  placeholder="Nome completo do produto..." value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Preço (R$)</label>
                  <input
                    type="text" required disabled={loading}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs"
                    placeholder="0,00" value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Promoção (R$)</label>
                  <input
                    type="text" disabled={loading}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-orange-300 transition-all font-bold text-slate-700 text-xs"
                    placeholder="Opcional" value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value, onSale: e.target.value !== '' })}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 bg-slate-100 text-slate-500 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-2 bg-red-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-md flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
