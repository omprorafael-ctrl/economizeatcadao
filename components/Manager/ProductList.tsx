
import React, { useState } from 'react';
import { Product } from '../../types';
import { 
  Edit2, 
  Trash2, 
  Search, 
  Plus, 
  Package, 
  FileSearch, 
  X, 
  Tag, 
  Loader2, 
  Zap, 
  Filter, 
  Check, 
  Image as ImageIcon, 
  Wand2,
  Sparkles,
  RefreshCw,
  SearchCode,
  ExternalLink
} from 'lucide-react';
import PdfImport from './PdfImport';
import { db } from '../../firebaseConfig';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { searchProductImage } from '../../services/geminiService';

interface ProductListProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductList: React.FC<ProductListProps> = ({ products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchingImage, setSearchingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    group: '',
    price: '',
    onSale: false,
    salePrice: '',
    imageUrl: ''
  });

  const categories = ['Todas', ...Array.from(new Set(products.map(p => p.group)))];

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      description: product.description,
      group: product.group,
      price: product.price.toString().replace('.', ','),
      onSale: !!product.onSale,
      salePrice: product.salePrice ? product.salePrice.toString().replace('.', ',') : '',
      imageUrl: product.imageUrl || ''
    });
  };

  const handleMagicImageSearch = async () => {
    if (!formData.description) {
      alert("Por favor, preencha a descrição do produto primeiro para que possamos buscar a foto correta.");
      return;
    }

    setSearchingImage(true);
    try {
      const foundUrl = await searchProductImage(formData.description);
      if (foundUrl) {
        setFormData(prev => ({ ...prev, imageUrl: foundUrl }));
      } else {
        alert("Não encontramos uma foto específica para este nome na internet. Tente uma descrição mais simples.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com a IA de busca.");
    } finally {
      setSearchingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        code: formData.code.trim(),
        description: formData.description.trim(),
        group: formData.group.trim(),
        price: parseFloat(formData.price.replace(',', '.')),
        onSale: formData.onSale,
        salePrice: formData.onSale && formData.salePrice ? parseFloat(formData.salePrice.replace(',', '.')) : null,
        imageUrl: formData.imageUrl.trim() || `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`,
        active: editingProduct ? editingProduct.active : true,
        createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }

      resetForm();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ code: '', description: '', group: '', price: '', onSale: false, salePrice: '', imageUrl: '' });
    setShowAddModal(false);
    setEditingProduct(null);
  };

  const toggleStatus = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o modal ao clicar no botão de status
    try {
      await updateDoc(doc(db, 'products', id), { active: !currentStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const deleteProduct = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o modal ao clicar no botão de excluir
    if (window.confirm("Deseja realmente excluir este produto permanentemente?")) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
      }
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm);
    const matchesCategory = selectedCategory === 'Todas' || p.group === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por SKU ou Nome..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all text-xs font-medium text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative min-w-[180px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all text-[11px] font-bold text-slate-600 uppercase tracking-widest appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
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
                <th className="px-6 py-4">Produto (Clique para Editar)</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Preço (Un)</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(product => (
                <tr 
                  key={product.id} 
                  onClick={() => handleOpenEdit(product)}
                  className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-100 group-hover:border-red-200 transition-all overflow-hidden relative">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                          <Tag className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs uppercase truncate max-w-[250px] group-hover:text-red-600 transition-colors">{product.description}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5 tracking-wider">SKU: {product.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-500 uppercase">{product.group}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      {product.onSale ? (
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-400 line-through">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                          <span className="font-black text-red-600 text-sm">R$ {product.salePrice?.toFixed(2).replace('.', ',')}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900 text-sm">R$ {product.price.toFixed(2).replace('.', ',')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={(e) => toggleStatus(product.id, product.active, e)}
                      className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider border transition-all hover:scale-105 ${
                        product.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                      }`}
                    >
                      {product.active ? 'Ativo' : 'Pausado'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <div className="p-2 text-slate-300 group-hover:text-slate-600 transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </div>
                      <button 
                        onClick={(e) => deleteProduct(product.id, e)} 
                        className="p-2 text-slate-200 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300">
               <Package className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-[10px] font-black uppercase tracking-widest">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/10">
          <div className="absolute inset-0" onClick={() => setShowImportModal(false)} />
          <div className="relative bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="absolute top-4 right-4 z-10">
              <button onClick={() => setShowImportModal(false)} className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-lg shadow-sm"><X className="w-5 h-5" /></button>
            </div>
            <PdfImport onClose={() => setShowImportModal(false)} />
          </div>
        </div>
      )}

      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/10">
          <div className="absolute inset-0" onClick={() => !loading && resetForm()} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-100">
                  {editingProduct ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">
                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1.5 tracking-widest">Gestão de Inventário</p>
                </div>
              </div>
              <button onClick={() => !loading && resetForm()} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU / Código</label>
                  <input
                    type="text" required disabled={loading}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs"
                    placeholder="Ex: 1002" value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  <input
                    type="text" required disabled={loading}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs"
                    placeholder="Grãos" value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Comercial</label>
                <textarea
                  required rows={2} disabled={loading}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs resize-none"
                  placeholder="Nome completo do produto..." value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* GESTÃO DE IMAGEM */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-col gap-3">
                   <div className="flex items-center justify-between">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Visualização da Imagem</label>
                      <button 
                        type="button"
                        onClick={handleMagicImageSearch}
                        disabled={searchingImage || loading || !formData.description}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-[9px] font-black text-white uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 group shadow-lg shadow-red-100"
                      >
                        {searchingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />}
                        Sugerir com IA
                      </button>
                   </div>
                   
                   <div 
                    onClick={() => !formData.imageUrl && !searchingImage && handleMagicImageSearch()}
                    className={`relative w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[30px] flex flex-col items-center justify-center overflow-hidden transition-all group cursor-pointer ${searchingImage ? 'animate-pulse bg-red-50/20 border-red-200' : 'hover:border-red-300'}`}
                   >
                     {formData.imageUrl ? (
                       <>
                         <img src={formData.imageUrl} alt="Produto" className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-3">
                            <button type="button" onClick={(e) => { e.stopPropagation(); setFormData({...formData, imageUrl: ''}); }} className="p-3 bg-white text-red-600 rounded-full shadow-xl hover:scale-110 transition-transform">
                               <RefreshCw className="w-5 h-5" />
                            </button>
                            <a href={formData.imageUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-3 bg-white text-slate-700 rounded-full shadow-xl hover:scale-110 transition-transform">
                               <ExternalLink className="w-5 h-5" />
                            </a>
                         </div>
                       </>
                     ) : (
                       <div className="flex flex-col items-center gap-2 text-slate-300 group-hover:text-red-400">
                         {searchingImage ? (
                           <Loader2 className="w-10 h-10 animate-spin" />
                         ) : (
                           <>
                             <ImageIcon className="w-10 h-10 mb-1" />
                             <p className="text-[10px] font-black uppercase tracking-widest">Sem Foto Definida</p>
                             <p className="text-[8px] font-bold uppercase text-slate-400">Clique para buscar automaticamente</p>
                           </>
                         )}
                       </div>
                     )}
                   </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">URL da Imagem (Para Banco de Dados)</label>
                  <div className="relative">
                    <SearchCode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                    <input
                      type="url" disabled={loading}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs"
                      placeholder="https://exemplo.com/produto.jpg" value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Base (R$)</label>
                  <input
                    type="text" required disabled={loading}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs"
                    placeholder="0,00" value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest ml-1">Oferta / Promo (R$)</label>
                  <input
                    type="text" disabled={loading}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-orange-300 transition-all font-bold text-slate-700 text-xs"
                    placeholder="Opcional" value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value, onSale: e.target.value !== '' })}
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => resetForm()} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 bg-red-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 flex items-center justify-center gap-2 transition-all active:scale-95">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
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
