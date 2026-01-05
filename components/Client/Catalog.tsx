
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
  Truck,
  Box,
  Filter
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

  const groups = ['Todos', 'Promoções', ...Array.from(new Set(products.map(p => p.group)))];

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
    const matchesGroup = 
      selectedGroup === 'Todos' ? true : 
      selectedGroup === 'Promoções' ? p.onSale : 
      p.group === selectedGroup;
    return matchesSearch && matchesGroup && p.active;
  });

  return (
    <div className="flex flex-col animate-in fade-in duration-500 bg-slate-50 min-h-full pb-20">
      
      {/* Barra de Pesquisa e Filtros */}
      <div className="bg-white sticky top-0 z-20 shadow-sm border-b border-slate-100">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-red-500 transition-colors" />
              <input 
                type="text"
                placeholder="Buscar produtos..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-500/10 outline-none text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
                <LayoutList className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {groups.map(group => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedGroup === group 
                  ? 'bg-red-600 text-white border-red-600' 
                  : group === 'Promoções' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {group === 'Promoções' && <Zap className="w-3 h-3 inline mr-1" />}
                {group}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de Produtos */}
      <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => {
            const qty = quantities[product.id] || 1;
            const isAdded = addedItems[product.id];
            const displayPrice = product.onSale && product.salePrice ? product.salePrice : product.price;

            if (viewMode === 'grid') {
              return (
                <div key={product.id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative group">
                   {product.onSale && (
                     <div className="absolute top-0 left-0 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg z-10">
                       OFERTA
                     </div>
                   )}
                  
                  <div className="p-3 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
                        SKU {product.code}
                      </span>
                      <button onClick={() => setSelectedProduct(product)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Info className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 onClick={() => setSelectedProduct(product)} className="text-xs font-semibold text-slate-800 leading-snug line-clamp-3 mb-2 min-h-[42px] cursor-pointer">
                      {product.description}
                    </h3>
                    
                    <div className="mt-auto">
                      <div className="mb-3">
                        {product.onSale && <p className="text-[10px] text-slate-400 line-through">R$ {product.price.toFixed(2).replace('.', ',')}</p>}
                        <div className="flex items-baseline gap-0.5">
                          <span className={`text-[10px] font-bold ${product.onSale ? 'text-orange-600' : 'text-slate-500'}`}>R$</span>
                          <span className={`text-lg font-bold tracking-tight ${product.onSale ? 'text-orange-600' : 'text-slate-900'}`}>
                            {displayPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                         <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 h-8">
                            <button onClick={() => handleQtyChange(product.id, -1)} className="px-2 h-full text-slate-500 hover:text-red-600"><Minus className="w-3 h-3" /></button>
                            <span className="text-xs font-bold text-slate-800 min-w-[16px] text-center">{qty}</span>
                            <button onClick={() => handleQtyChange(product.id, 1)} className="px-2 h-full text-slate-500 hover:text-red-600"><Plus className="w-3 h-3" /></button>
                         </div>
                         <button 
                          onClick={() => handleAdd(product)}
                          className={`flex-1 rounded-lg h-8 flex items-center justify-center transition-all ${
                            isAdded ? 'bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          {isAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            } else {
              // List View
              return (
                <div key={product.id} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm flex gap-3">
                  <div className="flex-1 min-w-0" onClick={() => setSelectedProduct(product)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">SKU {product.code}</span>
                      {product.onSale && <span className="text-[8px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">PROMO</span>}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 leading-tight mb-2 truncate">{product.description}</h3>
                    <div>
                        {product.onSale && <p className="text-[10px] text-slate-400 line-through leading-none">R$ {product.price.toFixed(2).replace('.', ',')}</p>}
                        <p className={`text-base font-bold ${product.onSale ? 'text-orange-600' : 'text-slate-900'}`}>
                          <span className="text-xs mr-0.5">R$</span>{displayPrice.toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 justify-center">
                    <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 h-8">
                      <button onClick={() => handleQtyChange(product.id, -1)} className="px-2 h-full text-slate-500 hover:text-red-600"><Minus className="w-3 h-3" /></button>
                      <span className="text-xs font-bold text-slate-800 min-w-[16px] text-center">{qty}</span>
                      <button onClick={() => handleQtyChange(product.id, 1)} className="px-2 h-full text-slate-500 hover:text-red-600"><Plus className="w-3 h-3" /></button>
                    </div>
                    
                    <button 
                      onClick={() => handleAdd(product)}
                      className={`w-full h-8 rounded-lg flex items-center justify-center transition-all text-xs font-bold ${
                        isAdded ? 'bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {isAdded ? 'OK' : 'Comprar'}
                    </button>
                  </div>
                </div>
              );
            }
          })
        ) : (
          <div className="col-span-2 py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <Package className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium text-sm">Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes (Sheet) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center animate-in slide-in-from-bottom-full duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-2 shrink-0" />

            <div className="px-6 pb-2 flex items-center justify-between shrink-0 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Detalhes do Item</h4>
              <button onClick={() => setSelectedProduct(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide space-y-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                   <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">SKU {selectedProduct.code}</span>
                   <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">{selectedProduct.group}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{selectedProduct.description}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Preço Unitário</p>
                  <div className="flex flex-col">
                    {selectedProduct.onSale && <span className="text-xs text-slate-400 line-through">R$ {selectedProduct.price.toFixed(2).replace('.', ',')}</span>}
                    <p className={`text-2xl font-bold tracking-tight ${selectedProduct.onSale ? 'text-orange-600' : 'text-slate-900'}`}>
                      <span className="text-xs mr-1">R$</span>
                      {(selectedProduct.onSale && selectedProduct.salePrice ? selectedProduct.salePrice : selectedProduct.price).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center items-start">
                   <div className="flex items-center gap-2 mb-1">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-700">Disponível</span>
                   </div>
                   <p className="text-[10px] text-slate-400 leading-tight">Pronta entrega para seu CNPJ.</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                 <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                    <Box className="w-5 h-5 text-slate-400" />
                    <div>
                       <p className="text-[10px] font-bold text-slate-500 uppercase">Grupo</p>
                       <p className="text-xs font-semibold text-slate-900">{selectedProduct.group}</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-4 shrink-0 mb-4">
              <div className="flex items-center bg-white rounded-lg border border-slate-200 h-10 shadow-sm">
                <button onClick={() => handleQtyChange(selectedProduct.id, -1)} className="px-3 h-full text-slate-400 hover:text-red-600"><Minus className="w-4 h-4" /></button>
                <span className="w-8 text-center font-bold text-slate-900">{quantities[selectedProduct.id] || 1}</span>
                <button onClick={() => handleQtyChange(selectedProduct.id, 1)} className="px-3 h-full text-slate-400 hover:text-red-600"><Plus className="w-4 h-4" /></button>
              </div>
              <button 
                onClick={() => { handleAdd(selectedProduct); setSelectedProduct(null); }}
                className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <ShoppingCart className="w-4 h-4" /> Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
