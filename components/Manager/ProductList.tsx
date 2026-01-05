
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
  Sparkles,
  ChevronDown,
  Eye,
  EyeOff,
  Settings2
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
    imageUrl: '',
    active: true
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
      imageUrl: product.imageUrl || '',
      active: product.active
    });
  };

  const handleMagicImageSearch = async () => {
    if (!formData.description) {
      alert("Defina o nome do produto para buscar a foto.");
      return;
    }
    setSearchingImage(true);
    try {
      const foundUrl = await searchProductImage(formData.description);
      if (foundUrl) {
        setFormData(prev => ({ ...prev, imageUrl: foundUrl }));
      }
    } catch (err) {
      console.error(err);
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
        imageUrl: formData.imageUrl.trim(),
        active: formData.active,
        createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), productData);
      }
      resetForm();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ code: '', description: '', group: '', price: '', onSale: false, salePrice: '', imageUrl: '', active: true });
    setShowAddModal(false);
    setEditingProduct(null);
  };

  const toggleStatus = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'products', id), { active: !currentStatus });
    } catch (error) { console.error(error); }
  };

  const deleteProduct = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Excluir produto permanentemente?")) {
      try { await deleteDoc(doc(db, 'products', id)); } catch (error) { console.error(error); }
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm);
    const matchesCategory = selectedCategory === 'Todas' ? true : p.group === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex-1 flex flex-col md:flex-row gap-3 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou código..."
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 transition-all text-xs font-bold text-slate-700 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 appearance-none text-xs font-black uppercase tracking-widest text-slate-600 cursor-pointer shadow-sm"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowImportModal(true)} className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-all shadow-sm">
              <FileSearch className="w-4 h-4" /> Importar PDF
            </button>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 flex items-center gap-2 shadow-lg shadow-red-100 transition-all active:scale-95">
              <Plus className="w-4 h-4" /> Novo Produto
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">Produto</th>
                <th className="px-8 py-6">Categoria</th>
                <th className="px-8 py-6">Preço Base</th>
                <th className="px-8 py-6 text-center">No Catálogo</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length > 0 ? (
                filtered.map(product => (
                  <tr key={product.id} onClick={() => handleOpenEdit(product)} className="hover:bg-slate-50/50 transition-all group cursor-pointer">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shrink-0 shadow-sm relative">
                          {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" /> : <Tag className="w-6 h-6 m-auto text-slate-200" />}
                          {!product.active && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center"><EyeOff className="w-4 h-4 text-slate-400" /></div>}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-black text-xs uppercase truncate max-w-[300px] transition-colors ${product.active ? 'text-slate-800 group-hover:text-red-600' : 'text-slate-400'}`}>{product.description}</p>
                          <p className="text-[9px] font-black text-slate-400 mt-1 tracking-widest italic uppercase">Código: {product.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-colors ${product.active ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>{product.group}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className={`font-black text-sm tracking-tighter ${!product.active ? 'text-slate-300' : product.onSale ? 'text-red-600' : 'text-slate-900'}`}>
                          R$ {(product.onSale && product.salePrice ? product.salePrice : product.price).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => toggleStatus(product.id, product.active, e)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${product.active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${product.active ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(product)} className="p-2.5 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={(e) => deleteProduct(product.id, e)} className="p-2.5 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center justify-center opacity-20">
                       <Package className="w-20 h-20 mb-4" />
                       <p className="text-sm font-black uppercase tracking-widest text-slate-900">Nenhum resultado para os filtros atuais</p>
                       <button onClick={() => {setSearchTerm(''); setSelectedCategory('Todas');}} className="mt-6 text-red-600 text-[10px] font-black uppercase hover:underline">Resetar Visão de Estoque</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/10">
          <div className="absolute inset-0" onClick={() => !loading && resetForm()} />
          <div className="relative bg-white w-full max-w-md rounded-[48px] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-8 bg-slate-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-800 shadow-sm">
                  <Settings2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{editingProduct ? 'Configuração do Item' : 'Novo Cadastro'}</h3>
              </div>
              <button onClick={() => !loading && resetForm()} className="p-2 text-slate-300 hover:text-red-600"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-8 space-y-6">
              {/* Toggle de Visibilidade no Form */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="flex items-center gap-3">
                   {formData.active ? <Eye className="w-5 h-5 text-emerald-500" /> : <EyeOff className="w-5 h-5 text-slate-300" />}
                   <div>
                     <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Exibir no Catálogo</p>
                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{formData.active ? 'Visível para todos os clientes' : 'Oculto temporariamente'}</p>
                   </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Código do Produto</label>
                  <input type="text" required placeholder="Ex: 1001" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-xs text-slate-700" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria/Grupo</label>
                  <input type="text" required placeholder="Ex: Bebidas" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-xs text-slate-700" value={formData.group} onChange={(e) => setFormData({ ...formData, group: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Comercial</label>
                <textarea required rows={2} placeholder="Nome do produto como aparecerá na lista" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-xs text-slate-700 resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mídia do Produto</label>
                  <button type="button" onClick={handleMagicImageSearch} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-[9px] font-black text-white uppercase rounded-xl shadow-lg hover:bg-black transition-all">
                    {searchingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-red-500" />} Buscar Foto IA
                  </button>
                </div>
                <div className="aspect-video bg-slate-50 border border-slate-100 rounded-[32px] flex items-center justify-center overflow-hidden shadow-inner group relative">
                  {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-12 h-12 text-slate-200" />}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                     <p className="text-[8px] font-black text-white opacity-0 group-hover:opacity-100 uppercase tracking-[0.3em]">Preview de Imagem</p>
                  </div>
                </div>
                <input type="url" placeholder="Ou cole o link da imagem aqui..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs text-slate-500 italic" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço R$ (Venda)</label>
                  <input type="text" required placeholder="0,00" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-xs text-slate-800" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Promoção (Opcional)</label>
                  <input type="text" placeholder="Oferta" className="w-full px-5 py-3.5 bg-red-50/30 border border-red-100 rounded-2xl outline-none font-black text-xs text-red-600 placeholder:text-red-200" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: e.target.value, onSale: !!e.target.value })} />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => resetForm()} className="flex-1 py-4.5 bg-slate-100 text-slate-500 font-black rounded-3xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4.5 bg-red-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Salvar Alterações <Check className="w-4 h-4" /></>}
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
