
import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';
import { 
  Search, 
  Plus, 
  Minus, 
  Package, 
  Check,
  Zap,
  X,
  ShoppingCart,
  Truck,
  Edit3,
  CheckCircle2,
  Filter,
  Heart,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';

interface CatalogProps {
  products: Product[];
  onAddToCart: (p: Product, qty: number, customPrice?: number) => void;
}

const Catalog: React.FC<CatalogProps> = ({ products, onAddToCart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Todos');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('atacadao_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('atacadao_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  // CATEGORIAS DINAMICAS EXTRAIDAS DOS PRODUTOS
  const productGroups = Array.from(new Set(products.filter(p => p.active).map(p => p.group))).sort();
  const groups = ['Todos', 'Favoritos', 'Promoções', ...productGroups];

  const handleQtyChange = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handlePriceChange = (id: string, value: string) => {
    const price = parseFloat(value.replace(',', '.'));
    if (!isNaN(price)) {
      setCustomPrices(prev => ({ ...prev, [id]: price }));
    }
  };

  const handleAdd = (product: Product) => {
    const qty = quantities[product.id] || 1;
    const price = customPrices[product.id] || (product.onSale && product.salePrice ? product.salePrice : product.price);
    onAddToCart({ ...product, price: price }, qty);
    
    setAddedItems(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [product.id]: false }));
    }, 1200);
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // LOGICA DE FILTRO COMPLETA E ATIVADA
  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm);
    
    let matchesGroup = true;
    if (selectedGroup === 'Promoções') {
      matchesGroup = !!p.onSale;
    } else if (selectedGroup === 'Favoritos') {
      matchesGroup = favorites.includes(p.id);
    } else if (selectedGroup !== 'Todos') {
      matchesGroup = p.group === selectedGroup;
    }
    
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="flex flex-col bg-white min-h-full">
      
      {/* Header do Catálogo com Filtros Otimizados */}
      <div className="bg-white sticky top-0 md:top-0 z-30 border-b border-slate-100 shadow-sm">
        <div className="px-4 py-3 sm:px-6 flex flex-col gap-3">
          {/* Barra de Pesquisa Compacta */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text"
              placeholder="Pesquisar produtos..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-red-100 outline-none text-xs font-bold text-slate-700 transition-all placeholder:text-slate-400 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Navegação de Categorias */}
          <div className="relative flex items-center group/nav">
            <button 
              onClick={() => scrollCategories('left')}
              className="absolute left-0 z-20 p-1.5 bg-white/90 backdrop-blur-sm text-red-600 border border-slate-100 shadow-md rounded-full hover:bg-red-50 transition-all opacity-0 group-hover/nav:opacity-100 hidden md:block -translate-x-1/2"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div 
              ref={scrollContainerRef}
              className="flex gap-1.5 overflow-x-auto flex-nowrap scrollbar-hide pb-1 w-full"
            >
              {groups.map(group => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`px-4 py-2 rounded-full text-[9px] font-black whitespace-nowrap uppercase tracking-widest transition-all border flex items-center gap-1.5 shrink-0 ${
                    selectedGroup === group 
                    ? 'bg-red-600 text-white border-red-600 shadow-md' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-red-200'
                  }`}
                >
                  {group === 'Promoções' && <Zap className="w-3 h-3 fill-orange-500 stroke-orange-500" />}
                  {group === 'Favoritos' && <Heart className={`w-3 h-3 ${selectedGroup === 'Favoritos' ? 'fill-white' : 'fill-pink-500'}`} />}
                  {group}
                </button>
              ))}
              <div className="w-8 shrink-0" />
            </div>

            <button 
              onClick={() => scrollCategories('right')}
              className="absolute right-0 z-20 p-1.5 bg-white/90 backdrop-blur-sm text-red-600 border border-slate-100 shadow-md rounded-full hover:bg-red-50 transition-all opacity-0 group-hover/nav:opacity-100 hidden md:block translate-x-1/2"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Responsivo Compacto (Alta Densidade) */}
      <div className="p-3 sm:p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 animate-in fade-in duration-700">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => {
            const qty = quantities[product.id] || 1;
            const isAdded = addedItems[product.id];
            const isEditing = editingPriceId === product.id;
            const currentPrice = customPrices[product.id] || (product.onSale && product.salePrice ? product.salePrice : product.price);
            const isFavorite = favorites.includes(product.id);

            return (
              <div key={product.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
                 {product.onSale && !isEditing && (
                   <div className="absolute top-2 left-2 bg-red-600 text-white text-[7px] font-black px-2 py-1 rounded-full z-10 shadow-md flex items-center gap-1">
                     <Zap className="w-2.5 h-2.5 fill-white" /> PROMO
                   </div>
                 )}

                 <button 
                  onClick={(e) => toggleFavorite(product.id, e)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm z-10 hover:bg-white transition-all border border-slate-50 opacity-100 md:opacity-0 group-hover:opacity-100"
                 >
                   <Heart className={`w-3.5 h-3.5 transition-all ${isFavorite ? 'text-pink-500 fill-pink-500' : 'text-slate-200'}`} />
                 </button>

                 <div 
                  onClick={() => setSelectedProduct(product)}
                  className="aspect-square w-full bg-slate-50 border-b border-slate-50 relative overflow-hidden cursor-pointer"
                 >
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.description} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-100">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                 </div>
                
                <div className="p-3 flex-1 flex flex-col">
                  <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest mb-1 truncate">{product.group}</span>
                  <h3 
                    onClick={() => setSelectedProduct(product)} 
                    className="text-[10px] font-bold text-slate-800 leading-tight mb-2 line-clamp-2 min-h-[24px] cursor-pointer group-hover:text-red-600 transition-colors uppercase tracking-tight"
                  >
                    {product.description}
                  </h3>
                  
                  <div className="mt-auto space-y-3">
                    <div className="relative">
                      {product.onSale && !isEditing && (
                        <p className="text-[8px] text-slate-300 line-through font-bold">R$ {product.price.toFixed(2)}</p>
                      )}
                      
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <div className="flex items-center bg-red-50 border border-red-100 rounded-lg px-2 py-1 w-full">
                            <input 
                              autoFocus
                              type="text"
                              className="w-full bg-transparent outline-none text-xs font-black text-red-700"
                              defaultValue={currentPrice.toFixed(2).replace('.', ',')}
                              onBlur={(e) => {
                                handlePriceChange(product.id, e.target.value);
                                setEditingPriceId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handlePriceChange(product.id, (e.target as HTMLInputElement).value);
                                  setEditingPriceId(null);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-0.5 cursor-pointer" onClick={() => setEditingPriceId(product.id)}>
                            <span className={`text-[9px] font-bold ${product.onSale ? 'text-red-600' : 'text-slate-400'}`}>R$</span>
                            <span className={`text-lg font-black tracking-tighter ${product.onSale ? 'text-red-600' : 'text-slate-900'}`}>
                              {currentPrice.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                       <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100 h-8 px-1 flex-1 shadow-inner">
                          <button onClick={() => handleQtyChange(product.id, -1)} className="w-6 h-full text-slate-300 hover:text-red-600 transition-colors flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                          <span className="text-[10px] font-black text-slate-700 min-w-[16px] text-center">{qty}</span>
                          <button onClick={() => handleQtyChange(product.id, 1)} className="w-6 h-full text-slate-300 hover:text-red-600 transition-colors flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                       </div>
                       
                       <button 
                        onClick={() => handleAdd(product)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-90 ${
                          isAdded ? 'bg-emerald-500 text-white shadow-emerald-50' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-50'
                        }`}
                      >
                        {isAdded ? <Check className="w-4 h-4 animate-in zoom-in" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center">
            <Package className="w-12 h-12 text-slate-100 mb-4" />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Nenhum item encontrado</p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes - Mantido confortável para leitura */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-t-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col sm:max-h-[90vh] border border-slate-100 animate-in slide-in-from-bottom-20 duration-500">
            
            <div className="flex absolute top-4 right-4 z-10 gap-2">
              <button 
                onClick={(e) => toggleFavorite(selectedProduct.id, e)}
                className={`p-3 bg-white/95 backdrop-blur-sm rounded-xl transition-all shadow-lg border border-slate-100 ${favorites.includes(selectedProduct.id) ? 'text-pink-500' : 'text-slate-300'}`}
              >
                <Heart className={`w-5 h-5 ${favorites.includes(selectedProduct.id) ? 'fill-pink-500' : ''}`} />
              </button>
              <button onClick={() => setSelectedProduct(null)} className="p-3 bg-white/95 backdrop-blur-sm hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all shadow-lg border border-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto scrollbar-hide">
              <div className="aspect-video w-full bg-slate-50 relative overflow-hidden shrink-0 border-b border-slate-100">
                 {selectedProduct.imageUrl ? (
                   <img src={selectedProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-slate-100">
                      <ImageIcon className="w-16 h-16 mb-4" />
                   </div>
                 )}
                 <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/40 to-transparent" />
              </div>

              <div className="px-6 pb-10 space-y-8 relative -mt-10">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-white text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">Ref: {selectedProduct.code}</span>
                    <span className="px-3 py-1 bg-red-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest">{selectedProduct.group}</span>
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black text-slate-900 leading-tight uppercase tracking-tighter">{selectedProduct.description}</h2>
                </div>

                <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-inner">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor de Venda</p>
                    <p className="text-5xl font-black tracking-tighter text-slate-900">
                      <span className="text-xl mr-1 font-bold text-slate-300">R$</span>
                      {(customPrices[selectedProduct.id] || (selectedProduct.onSale && selectedProduct.salePrice ? selectedProduct.salePrice : selectedProduct.price)).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl border border-emerald-50 shadow-sm">
                        <Truck className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Entrega Atacadão</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center bg-white rounded-2xl border border-slate-200 h-16 shadow-lg px-3 w-full sm:w-auto">
                    <button onClick={() => handleQtyChange(selectedProduct.id, -1)} className="w-12 h-full text-slate-300 hover:text-red-600 transition-colors flex items-center justify-center"><Minus className="w-6 h-6" /></button>
                    <span className="w-12 text-center font-black text-slate-900 text-xl tracking-tighter">{quantities[selectedProduct.id] || 1}</span>
                    <button onClick={() => handleQtyChange(selectedProduct.id, 1)} className="w-12 h-full text-slate-300 hover:text-red-600 transition-colors flex items-center justify-center"><Plus className="w-6 h-6" /></button>
                  </div>
                  <button 
                    onClick={() => { handleAdd(selectedProduct); setSelectedProduct(null); }}
                    className="flex-1 w-full h-16 bg-red-600 hover:bg-red-700 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl shadow-red-100 transition-all active:scale-95"
                  >
                    <ShoppingCart className="w-5 h-5" /> Adicionar na Cesta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
