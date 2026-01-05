
import React, { useState } from 'react';
import { Product } from '../../types';
import { 
  Search, 
  Plus, 
  Minus, 
  Package, 
  LayoutGrid, 
  LayoutList,
  Check,
  Flame,
  Zap
} from 'lucide-react';

interface CatalogProps {
  products: Product[];
  onAddToCart: (p: Product, qty: number) => void;
}

const Catalog: React.FC<CatalogProps> = ({ products, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const groups = ['Todos', ...Array.from(new Set(products.map(p => p.group)))];

  const handleQtyChange = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleAdd = (product: Product) => {
    const qty = quantities[product.id] || 1;
    onAddToCart(product, qty);
    
    setAddedItems(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm);
    const matchesGroup = selectedGroup === 'Todos' || p.group === selectedGroup;
    return matchesSearch && matchesGroup && p.active;
  });

  return (
    <div className="flex flex-col animate-in fade-in duration-700 bg-transparent min-h-full">
      {/* Search Header Dark */}
      <div className="bg-black/40 backdrop-blur-3xl sticky top-0 z-20 shadow-sm pt-6 border-b border-white/5">
        <div className="px-8 pb-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-red-600 transition-colors" />
              <input 
                type="text"
                placeholder="Código ou nome do produto..."
                className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-[28px] focus:ring-4 focus:ring-red-500/10 focus:bg-white/10 focus:border-red-500/40 outline-none font-bold text-white text-sm transition-all placeholder:text-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-slate-500 hover:text-white'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-slate-500 hover:text-white'}`}
              >
                <LayoutList className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
            {groups.map(group => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all border ${
                  selectedGroup === group 
                  ? 'bg-red-600 text-white border-red-600 shadow-xl shadow-red-900/30' 
                  : 'bg-white/5 text-slate-500 border-white/5 hover:border-red-500/50 hover:text-white'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Produtos Premium Dark */}
      <div className={`p-8 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-5' : 'space-y-5'}`}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => {
            const qty = quantities[product.id] || 1;
            const isAdded = addedItems[product.id];

            if (viewMode === 'grid') {
              return (
                <div key={product.id} className="bg-white/5 rounded-[38px] overflow-hidden border border-white/5 flex flex-col group hover:shadow-[0_20px_50px_rgba(220,38,38,0.15)] hover:border-red-500/30 transition-all duration-500 relative">
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-red-600/10 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-red-500/20 flex items-center gap-1.5">
                          <Zap className="w-2.5 h-2.5 fill-red-500" /> {product.group}
                        </span>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">REF: {product.code}</span>
                      </div>
                      <h3 className="text-[13px] font-bold text-white line-clamp-3 leading-tight h-9 mb-4 uppercase tracking-wide group-hover:text-red-400 transition-colors">{product.description}</h3>
                      <div className="h-[2px] w-10 bg-red-600 mb-5 rounded-full" />
                      <p className="text-2xl font-black text-white tracking-tighter italic">
                        <span className="text-[10px] font-black text-red-500 mr-1.5 not-italic uppercase">R$</span>
                        {product.price.toFixed(2).replace('.', ',')}
                      </p>
                    </div>

                    <div className="space-y-3 mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                        <button 
                          onClick={() => handleQtyChange(product.id, -1)}
                          className="w-8 h-8 rounded-xl bg-white/5 text-white shadow-sm border border-white/10 flex items-center justify-center active:scale-90 transition-transform hover:bg-red-600"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-black text-white text-base">{qty}</span>
                        <button 
                          onClick={() => handleQtyChange(product.id, 1)}
                          className="w-8 h-8 rounded-xl bg-white/5 text-white shadow-sm border border-white/10 flex items-center justify-center active:scale-90 transition-transform hover:bg-red-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => handleAdd(product)}
                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 ${
                          isAdded ? 'bg-emerald-600 text-white shadow-emerald-900/40' : 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/50'
                        }`}
                      >
                        {isAdded ? <Check className="w-4 h-4" /> : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={product.id} className="bg-white/5 rounded-[32px] p-6 border border-white/5 flex flex-col sm:flex-row sm:items-center gap-6 hover:shadow-xl hover:border-red-500/30 transition-all group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-900/20">SKU {product.code}</span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{product.group}</span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug uppercase truncate tracking-wide">{product.description}</h3>
                    <p className="text-xl font-black text-red-500 mt-2 italic">
                      <span className="text-[10px] text-white/40 mr-1 not-italic">R$</span>
                      {product.price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                    <div className="flex items-center bg-black/40 p-1.5 rounded-2xl border border-white/5">
                      <button onClick={() => handleQtyChange(product.id, -1)} className="p-2 text-slate-500 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                      <span className="w-10 text-center font-black text-white text-lg">{qty}</span>
                      <button onClick={() => handleQtyChange(product.id, 1)} className="p-2 text-slate-500 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                    </div>
                    
                    <button 
                      onClick={() => handleAdd(product)}
                      className={`px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] transition-all shrink-0 min-w-[130px] flex items-center justify-center gap-2 ${
                        isAdded ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white shadow-xl shadow-red-900/30 hover:bg-red-500'
                      }`}
                    >
                      {isAdded ? <Check className="w-5 h-5" /> : 'Adicionar'}
                    </button>
                  </div>
                </div>
              );
            }
          })
        ) : (
          <div className="col-span-2 py-40 text-center flex flex-col items-center opacity-20">
            <Package className="w-24 h-24 mb-6 text-slate-500" />
            <p className="text-base font-black uppercase tracking-[0.4em] text-white">Estoque não encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;
