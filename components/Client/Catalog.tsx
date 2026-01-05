
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
  Zap,
  Info,
  X,
  ShoppingCart,
  ShieldCheck,
  Truck,
  Box,
  ChevronDown
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const getSmartBadges = (desc: string) => {
    const badges = [];
    if (desc.toLowerCase().includes('integral')) badges.push({ text: 'Saudável', color: 'text-emerald-500 bg-emerald-500/10' });
    if (desc.toLowerCase().includes('extra')) badges.push({ text: 'Premium', color: 'text-amber-500 bg-amber-500/10' });
    
    const weightMatch = desc.match(/\d+(kg|g|ml|l)/i);
    if (weightMatch) badges.push({ text: weightMatch[0].toUpperCase(), color: 'text-slate-400 bg-white/5' });
    
    return badges;
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-700 bg-transparent min-h-full pb-20">
      <div className="bg-black/40 backdrop-blur-3xl sticky top-0 z-20 shadow-sm border-b border-white/5">
        <div className="px-5 pt-5 pb-3 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input 
                type="text"
                placeholder="Pesquise produtos..."
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 rounded-2xl focus:bg-white/10 outline-none font-bold text-white text-[12px] transition-all placeholder:text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 shrink-0">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-slate-600'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-slate-600'}`}>
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {groups.map(group => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                  selectedGroup === group 
                  ? 'bg-red-600 text-white border-red-600' 
                  : 'bg-white/5 text-slate-500 border-white/5'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={`p-3 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => {
            const qty = quantities[product.id] || 1;
            const isAdded = addedItems[product.id];
            const smartBadges = getSmartBadges(product.description);

            if (viewMode === 'grid') {
              return (
                <div key={product.id} className="bg-white/5 rounded-[28px] border border-white/5 flex flex-col group active:bg-white/10 transition-all duration-300 relative">
                  <button 
                    onClick={() => setSelectedProduct(product)}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-black/40 rounded-full text-slate-600"
                  >
                    <Info className="w-3 h-3" />
                  </button>
                  
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="mb-2">
                      <span className="inline-block px-2 py-0.5 bg-red-600/10 text-red-500 rounded-md text-[7px] font-black uppercase tracking-tighter border border-red-500/10 mb-1.5">
                        {product.group}
                      </span>
                      
                      <h3 
                        onClick={() => setSelectedProduct(product)}
                        className="text-[10px] font-bold text-slate-100 line-clamp-4 leading-[1.3] h-[52px] uppercase tracking-tighter cursor-pointer overflow-hidden"
                      >
                        {product.description}
                      </h3>

                      <div className="flex flex-wrap gap-1 mt-1.5 h-4 overflow-hidden">
                        {smartBadges.map((b, i) => (
                          <span key={i} className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase border border-white/5 ${b.color}`}>
                            {b.text}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-[8px] font-black text-red-500">R$</span>
                        <p className="text-xl font-black text-white tracking-tighter italic leading-none">
                          {product.price.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-auto">
                      <div className="flex items-center justify-between bg-black/40 p-1 rounded-xl border border-white/5">
                        <button onClick={() => handleQtyChange(product.id, -1)} className="w-7 h-7 flex items-center justify-center text-slate-500"><Minus className="w-3 h-3" /></button>
                        <span className="font-black text-white text-[11px]">{qty}</span>
                        <button onClick={() => handleQtyChange(product.id, 1)} className="w-7 h-7 flex items-center justify-center text-slate-500"><Plus className="w-3 h-3" /></button>
                      </div>
                      
                      <button 
                        onClick={() => handleAdd(product)}
                        className={`w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          isAdded ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                        }`}
                      >
                        {isAdded ? <Check className="w-3.5 h-3.5 mx-auto" /> : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={product.id} className="bg-white/5 rounded-[22px] p-3 border border-white/5 flex gap-3 group active:bg-white/10 transition-all">
                  <div className="flex-1 min-w-0" onClick={() => setSelectedProduct(product)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 bg-red-600 text-white rounded-md text-[7px] font-black uppercase">SKU {product.code}</span>
                      <span className="text-[8px] font-black text-slate-600 uppercase truncate">{product.group}</span>
                    </div>
                    <h3 className="text-[11px] font-bold text-white leading-tight uppercase line-clamp-2 tracking-tighter mb-1.5">{product.description}</h3>
                    <div className="flex items-center gap-3">
                      <p className="text-base font-black text-white italic">
                        <span className="text-[9px] text-red-500 mr-1 not-italic">R$</span>
                        {product.price.toFixed(2).replace('.', ',')}
                      </p>
                      {smartBadges.slice(0, 1).map((b, i) => (
                        <span key={i} className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${b.color}`}>
                          {b.text}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
                      <button onClick={() => handleQtyChange(product.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-500"><Minus className="w-3 h-3" /></button>
                      <span className="w-6 text-center font-black text-white text-[10px]">{qty}</span>
                      <button onClick={() => handleQtyChange(product.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-500"><Plus className="w-3 h-3" /></button>
                    </div>
                    
                    <button 
                      onClick={() => handleAdd(product)}
                      className={`w-full py-2.5 px-4 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                        isAdded ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      {isAdded ? <Check className="w-3 h-3 mx-auto" /> : 'Add'}
                    </button>
                  </div>
                </div>
              );
            }
          })
        ) : (
          <div className="col-span-2 py-40 text-center opacity-20">
            <Package className="w-16 h-16 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sem estoque</p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in slide-in-from-bottom-full duration-500">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-[#0a0a0a] w-full max-w-lg rounded-t-[45px] shadow-[0_-10px_50px_rgba(220,38,38,0.2)] border-t border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2 shrink-0" />

            <div className="px-8 pb-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                  <Box className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">Ficha do Produto</h4>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-3 bg-white/5 rounded-2xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-10 scrollbar-hide space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                   <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">SKU {selectedProduct.code}</span>
                   <span className="px-3 py-1 bg-white/5 border border-white/5 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">{selectedProduct.group}</span>
                </div>
                <h2 className="text-2xl font-black text-white leading-[1.1] italic uppercase tracking-tighter">{selectedProduct.description}</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-5 rounded-[28px] border border-white/5">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Preço Atual</p>
                  <p className="text-2xl font-black text-white italic">
                    <span className="text-[10px] text-red-500 mr-1 not-italic">R$</span>
                    {selectedProduct.price.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="bg-white/5 p-5 rounded-[28px] border border-white/5 flex flex-col justify-center">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Logística</p>
                  <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] uppercase italic">
                    <Truck className="w-3 h-3" /> Disponível
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Especificações</p>
                <div className="grid grid-cols-1 gap-4">
                  <DetailItem icon={ShieldCheck} label="Qualidade" value="Procedência Atacadão" />
                  <DetailItem icon={Box} label="Categoria" value={selectedProduct.group} />
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-[30px] border border-white/5">
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase tracking-tight italic">
                  As descrições detalhadas ajudam na conferência de pedidos em massa. Certifique-se do SKU correto antes de finalizar.
                </p>
              </div>
            </div>

            <div className="p-6 bg-black/60 border-t border-white/5 flex items-center justify-between shrink-0 mb-4">
              <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/5">
                <button onClick={() => handleQtyChange(selectedProduct.id, -1)} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400"><Minus className="w-4 h-4" /></button>
                <span className="w-10 text-center font-black text-white text-base">{quantities[selectedProduct.id] || 1}</span>
                <button onClick={() => handleQtyChange(selectedProduct.id, 1)} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400"><Plus className="w-4 h-4" /></button>
              </div>
              <button 
                onClick={() => { handleAdd(selectedProduct); setSelectedProduct(null); }}
                className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3"
              >
                <ShoppingCart className="w-4 h-4" /> Add ao Carrinho
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 border border-white/5">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
      <p className="text-[11px] font-bold text-white tracking-tight uppercase leading-none mt-0.5">{value}</p>
    </div>
  </div>
);

export default Catalog;
