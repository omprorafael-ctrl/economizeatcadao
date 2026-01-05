
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
  Zap,
  Info,
  X,
  ShoppingCart,
  ShieldCheck,
  Truck,
  Box
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
    if (desc.toLowerCase().includes('integral')) badges.push({ text: 'Saudável', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' });
    if (desc.toLowerCase().includes('extra')) badges.push({ text: 'Premium', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' });
    if (desc.toLowerCase().includes('limpeza')) badges.push({ text: 'Higiene', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' });
    
    const weightMatch = desc.match(/\d+(kg|g|ml|l)/i);
    if (weightMatch) badges.push({ text: weightMatch[0].toUpperCase(), color: 'text-slate-400 bg-white/5 border-white/10' });
    
    return badges;
  };

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
                placeholder="O que você procura hoje?"
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
            const smartBadges = getSmartBadges(product.description);

            if (viewMode === 'grid') {
              return (
                <div key={product.id} className="bg-white/5 rounded-[38px] overflow-hidden border border-white/5 flex flex-col group hover:shadow-[0_20px_50px_rgba(220,38,38,0.15)] hover:border-red-500/30 transition-all duration-500 relative">
                  <button 
                    onClick={() => setSelectedProduct(product)}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/5 rounded-full text-slate-500 hover:text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-red-600/10 text-red-500 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border border-red-500/20 flex items-center gap-1.5">
                          <Zap className="w-2.5 h-2.5 fill-red-500" /> {product.group}
                        </span>
                      </div>
                      
                      <h3 
                        onClick={() => setSelectedProduct(product)}
                        className="text-[12px] font-bold text-white line-clamp-3 leading-tight h-10 mb-3 uppercase tracking-wide group-hover:text-red-400 transition-colors cursor-pointer"
                      >
                        {product.description}
                      </h3>

                      <div className="flex flex-wrap gap-1 mb-4 h-6">
                        {smartBadges.slice(0, 2).map((b, i) => (
                          <span key={i} className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider border ${b.color}`}>
                            {b.text}
                          </span>
                        ))}
                      </div>

                      <div className="h-[2px] w-8 bg-red-600 mb-4 rounded-full" />
                      
                      <div className="flex items-baseline gap-1">
                        <span className="text-[9px] font-black text-red-500 uppercase">R$</span>
                        <p className="text-2xl font-black text-white tracking-tighter italic">
                          {product.price.toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 mt-auto pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between bg-black/40 p-1 rounded-2xl border border-white/5 shadow-inner">
                        <button 
                          onClick={() => handleQtyChange(product.id, -1)}
                          className="w-8 h-8 rounded-xl bg-white/5 text-white border border-white/10 flex items-center justify-center active:scale-90 transition-all hover:bg-red-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-white text-sm">{qty}</span>
                        <button 
                          onClick={() => handleQtyChange(product.id, 1)}
                          className="w-8 h-8 rounded-xl bg-white/5 text-white border border-white/10 flex items-center justify-center active:scale-90 transition-all hover:bg-red-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => handleAdd(product)}
                        className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-2 ${
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
                  <div className="flex-1 min-w-0" onClick={() => setSelectedProduct(product)}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-900/20">SKU {product.code}</span>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{product.group}</span>
                      {smartBadges.map((b, i) => (
                        <span key={i} className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase border ${b.color}`}>
                          {b.text}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug uppercase truncate tracking-wide group-hover:text-red-400 transition-colors cursor-pointer">{product.description}</h3>
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl animate-in fade-in zoom-in duration-300">
          <div className="absolute inset-0 bg-black/95" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-[#0a0a0a] w-full max-w-md rounded-[50px] shadow-[0_0_100px_rgba(220,38,38,0.2)] border border-white/5 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/30">
                  <Box className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">Detalhes do Item</h4>
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Atacadão Digital</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-500 hover:text-white transition-all border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-10 scrollbar-hide space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <span className="px-4 py-1.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">SKU {selectedProduct.code}</span>
                   <span className="px-4 py-1.5 bg-white/5 border border-white/10 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest">{selectedProduct.group}</span>
                </div>
                <h2 className="text-3xl font-black text-white leading-tight italic uppercase tracking-tighter">{selectedProduct.description}</h2>
                <div className="h-1.5 w-20 bg-red-600 rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-6 rounded-[35px] border border-white/5">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor Unitário</p>
                  <p className="text-3xl font-black text-white italic">
                    <span className="text-xs text-red-500 mr-1 not-italic">R$</span>
                    {selectedProduct.price.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="bg-white/5 p-6 rounded-[35px] border border-white/5 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Disponibilidade</p>
                  <div className="flex items-center gap-2 text-emerald-500 font-black text-sm uppercase italic">
                    <Check className="w-4 h-4" /> Em Estoque
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Especificações Técnicas</p>
                <div className="space-y-3">
                  <DetailItem icon={ShieldCheck} label="Qualidade" value="Garantia de Procedência Atacadão" />
                  <DetailItem icon={Truck} label="Logística" value="Pronta Entrega via Canal de Vendas" />
                  <DetailItem icon={Box} label="Categoria" value={selectedProduct.group} />
                </div>
              </div>

              <div className="bg-red-500/5 p-6 rounded-[35px] border border-red-500/10">
                <p className="text-xs text-red-200/60 font-medium leading-relaxed uppercase tracking-widest text-center italic">
                  "Produto selecionado criteriosamente para atender aos mais altos padrões de faturamento B2B."
                </p>
              </div>
            </div>

            {/* Modal Footer Action */}
            <div className="p-8 bg-black/40 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10">
                <button 
                  onClick={() => handleQtyChange(selectedProduct.id, -1)}
                  className="w-10 h-10 rounded-xl bg-white/5 text-white hover:bg-red-600 transition-all flex items-center justify-center"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="w-12 text-center font-black text-white text-lg">
                  {quantities[selectedProduct.id] || 1}
                </span>
                <button 
                  onClick={() => handleQtyChange(selectedProduct.id, 1)}
                  className="w-10 h-10 rounded-xl bg-white/5 text-white hover:bg-red-600 transition-all flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <button 
                onClick={() => {
                  handleAdd(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="px-10 py-5 bg-red-600 text-white rounded-[25px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-red-900/40 hover:bg-red-500 transition-all flex items-center gap-3"
              >
                <ShoppingCart className="w-5 h-5" /> Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-4 group">
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-red-500 group-hover:bg-red-500/10 transition-all border border-white/10">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-white tracking-wide">{value}</p>
    </div>
  </div>
);

export default Catalog;
