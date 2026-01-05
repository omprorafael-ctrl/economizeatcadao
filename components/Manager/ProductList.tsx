
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
  ExternalLink,
  ChevronDown
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
      console.error(error);
      alert("Erro ao salvar.");
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
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'products', id), { active: !currentStatus });
    } catch (error) { console.error(error); }
  };

  const deleteProduct = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Excluir produto?")) {
      try { await deleteDoc(doc(db, 'products', id)); } catch (error) { console.error(error); }
    }
  };

  // LOGICA DE FILTRO ATIVADA: Busca + Categoria
  const filtered = products.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm);
    const matchesCategory = selectedCategory === 'Todas' ? true : p.group === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex-1 flex flex-col md:flex-row gap-3 max-w-4xl">
            {/* Barra de Pesquisa */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar SKU ou Nome..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 transition-all text-xs font-bold text-slate-700 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Seletor de Categoria Ativado */}
            <div className="relative min-w-[180px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-100 appearance-none text-xs font-black uppercase tracking-widest text-slate-600 cursor-pointer shadow-sm"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowImportModal(true)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-all shadow-sm">
              <FileSearch className="w-3.5 h-3.5" /> Importar PDF
            </button>
            <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 flex items-center gap-2 shadow-lg shadow-red-100 transition-all active:scale-95">
              <Plus className="w-3.5 h-3.5" /> Novo Produto
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Produto (Clique para Editar)</th>
                <th className="px-8 py-5">Categoria</th>
                <th className="px-8 py-5">Preço (Un)</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length > 0 ? (
                filtered.map(product => (
                  <tr key={product.id} onClick={() => handleOpenEdit(product)} className="hover:bg-slate-50/50 transition-all group cursor-pointer">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shrink-0 shadow-sm">
                          {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" /> : <Tag className="w-6 h-6 m-auto text-slate-200" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 text-xs uppercase truncate max-w-[300px] group-hover:text-red-600 transition-colors">{product.description}</p>
                          <p className="text-[9px] font-black text-slate-400 mt-1 tracking-widest italic">SKU: {product.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200">{product.group}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        {product.onSale && (
                          <span className="text-[9px] text-slate-300 line-through font-bold">R$ {product.price.toFixed(2)}</span>
                        )}
                        <span className={`font-black text-sm tracking-tighter ${product.onSale ? 'text-red-600' : 'text-slate-900'}`}>
                          R$ {(product.onSale && product.salePrice ? product.salePrice : product.price).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button onClick={(e) => toggleStatus(product.id, product.active, e)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${product.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-50' : 'bg-red-50 text-red-600 border-red-100 opacity-60'}`}>
                        {product.active ? 'Ativo' : 'Pausado'}
                      </button>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={(e) => deleteProduct(product.id, e)} className="p-2.5 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30">
                       <Package className="w-16 h-16 mb-4" />
                       <p className="text-xs font-black uppercase tracking-widest">Nenhum item nesta categoria</p>
                       <button onClick={() => {setSearchTerm(''); setSelectedCategory('Todas');}} className="mt-4 text-red-600 text-[10px] font-black uppercase hover:underline">Limpar Filtros</button>
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
          <div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-8 bg-slate-50 border-b flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => !loading && resetForm()} className="p-2 text-slate-300 hover:text-red-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" required placeholder="SKU" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold text-xs" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
                <input type="text" required placeholder="Categoria" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold text-xs" value={formData.group} onChange={(e) => setFormData({ ...formData, group: e.target.value })} />
              </div>
              <textarea required rows={2} placeholder="Descrição Completa" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold text-xs resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Imagem do Produto</label>
                  <button type="button" onClick={handleMagicImageSearch} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-[9px] font-black text-white uppercase rounded-xl shadow-lg">
                    {searchingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} IA Buscar
                  </button>
                </div>
                <div className="aspect-video bg-slate-50 border-2 border-dashed rounded-[30px] flex items-center justify-center overflow-hidden">
                  {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-10 h-10 text-slate-200" />}
                </div>
                <input type="url" placeholder="URL da Imagem (Manual)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-xs" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="text" required placeholder="Preço R$" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold text-xs" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                <input type="text" placeholder="Promoção R$" className="w-full px-4 py-3 bg-slate-50 border rounded-2xl outline-none font-bold text-xs" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: e.target.value, onSale: !!e.target.value })} />
              </div>

              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => resetForm()} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-[2] py-4 bg-red-600 text-white font-black rounded-2xl text-[10px] uppercase shadow-xl">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar no Banco'}
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
