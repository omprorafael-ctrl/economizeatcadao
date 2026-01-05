
import React, { useState } from 'react';
import { Product } from '../../types';
import { 
  Search, 
  Plus, 
  Minus, 
  Package, 
  LayoutGrid, 
  LayoutList,
  Check
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
    
    // Efeito visual de confirmação
    setAddedItems(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm);
    const matchesGroup = selectedGroup === 'Todos' || p.group === selectedGroup;
    return matchesSearch && matchesGroup && p.active;
  });

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      {/* Search and Filters Header */}
      <div className="p-6 bg-white sticky top-0 z-20 space-y-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text"
              placeholder="O que você precisa hoje?"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none font-black text-black text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
            >
              <LayoutList className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {groups.map(group => (
            <button
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                selectedGroup === group 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-blue-100' 
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Product Display Area */}
      <div className={`p-6 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-5' : 'space-y-4'}`}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => {
            const qty = quantities[product.id] || 1;
            const isAdded = addedItems[product.id];

            if (viewMode === 'grid') {
              return (
                <div key={product.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100 flex flex-col group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="h-40 bg-slate-100 relative overflow-hidden p-4">
                    <img 
                      src={product.imageUrl} 
                      alt={product.description} 
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[9px] font-black text-slate-400 shadow-sm uppercase tracking-tighter">
                      REF {product.code}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-4">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">{product.group}</p>
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight h-10">{product.description}</h3>
                    </div>
                    
                    <p className="text-2xl font-black text-slate-900 mb-4 tracking-tighter">
                      <span className="text-xs font-bold text-slate-400 mr-1 italic">R$</span>
                      {product.price.toFixed(2).replace('.', ',')}
                    </p>

                    <div className="space-y-3 mt-auto">
                      <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        <button 
                          onClick={() => handleQtyChange(product.id, -1)}
                          className="w-10 h-10 rounded-xl bg-white text-slate-900 shadow-sm border border-slate-200 flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-black text-black text-lg">{qty}</span>
                        <button 
                          onClick={() => handleQtyChange(product.id, 1)}
                          className="w-10 h-10 rounded-xl bg-white text-slate-900 shadow-sm border border-slate-200 flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => handleAdd(product)}
                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                          isAdded ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-200'
                        }`}
                      >
                        {isAdded ? <Check className="w-4 h-4 animate-in zoom-in" /> : <Plus className="w-4 h-4" />}
                        {isAdded ? 'Adicionado' : 'Comprar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else {
              // LIST VIEW
              return (
                <div key={product.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex gap-4 hover:shadow-md transition-all">
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl p-2 flex-shrink-0">
                    <img src={product.imageUrl} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{product.description}</h3>
                        <span className="text-[10px] font-black text-slate-300 uppercase shrink-0">#{product.code}</span>
                      </div>
                      <p className="text-[11px] font-black text-slate-900 mt-1">
                        <span className="text-[9px] text-slate-400 mr-0.5 opacity-50 italic">R$</span>
                        {product.price.toFixed(2).replace('.', ',')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-2">
                      <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100 scale-90 origin-left">
                        <button onClick={() => handleQtyChange(product.id, -1)} className="p-1.5 text-black hover:text-blue-600"><Minus className="w-3 h-3" /></button>
                        <span className="w-8 text-center font-black text-black text-sm">{qty}</span>
                        <button onClick={() => handleQtyChange(product.id, 1)} className="p-1.5 text-black hover:text-blue-600"><Plus className="w-3 h-3" /></button>
                      </div>
                      
                      <button 
                        onClick={() => handleAdd(product)}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                          isAdded ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white shadow-md shadow-blue-100'
                        }`}
                      >
                        {isAdded ? <Check className="w-3 h-3" /> : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          })
        ) : (
          <div className="col-span-2 py-32 text-center flex flex-col items-center opacity-30">
            <Package className="w-20 h-20 mb-4" />
            <p className="text-xl font-black uppercase tracking-widest text-black">Nenhum produto</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;
