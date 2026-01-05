
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
  ChevronRight
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

  const groups = ['Todos', 'Favoritos', 'Promoções', ...Array.from(new Set(products.map(p => p.group)))];

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

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.description.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm);
    const matchesGroup = 
      selectedGroup === 'Todos' ? true : 
      selectedGroup === 'Promoções' ? p.onSale : 
      selectedGroup === 'Favoritos' ? favorites.includes(p.id) :
      p.group === selectedGroup;
    return matchesSearch && matchesGroup && p.active;
  });

  return (
    <div className="flex flex-col bg-white min-h-full">
      
      {/* Header do Catálogo com Filtros Otimizados */}
      <div className="bg-white sticky top-0 md:top-0 z-30 border-b border-slate-100">
        <div className="px-5 py-4 sm:px-8 flex flex-col gap-4">
          {/* Barra de Pesquisa */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text"
              placeholder="Pesquisar por nome ou código..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent rounded-none focus:bg-white focus:border-red-100 outline-none text-sm font-medium text-slate-700 transition-all placeholder:text-slate-400 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Navegação de Categorias com Setas Laterais */}
          <div className="relative flex items-center group/nav">
            {/* Seta Esquerda */}
            <button 
              onClick={() => scrollCategories('left')}
              className="absolute left-0 z-20 p-1.5 bg-white/90 backdrop-blur-sm text-red-600 border border-slate-100 shadow-sm rounded-none hover:bg-red-50 transition-all opacity-0 group-hover/nav:opacity-100 hidden md:block"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div 
              ref={scrollContainerRef}
              className="flex gap-1.5 overflow-x-auto flex-nowrap scrollbar-hide pb-1 w-full mask-fade-right"
            >
              {groups.map(group => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`px-4 py-2 rounded-none text-[10px] font-black whitespace-nowrap uppercase tracking-widest transition-all border flex items-center gap-2 shrink-0 ${
                    selectedGroup === group 
                    ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-100 scale-[1.02] z-10' 
                    : group === 'Promoções' 
                      ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' 
                      : group === 'Favoritos'
                        ? 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-red-200 hover:text-red-500'
                  }`}
                >
                  {group === 'Promoções' && <Zap className="w-3 h-3 fill-orange-500" />}
                  {group === 'Favoritos' && <Heart className={`w-3 h-3 ${selectedGroup === 'Favoritos' ? 'fill-white' : 'fill-pink-500'}`} />}
                  {group}
                </button>
              ))}
              {/* Espaçador final para garantir que o último item não seja cortado pelo fade */}
              <div className="w-8 shrink-0" />
            </div>

            {/* Seta Direita */}
            <button 
              onClick={() => scrollCategories('right')}
              className="absolute right-0 z-20 p-1.5 bg-white/90 backdrop-blur-sm text-red-600 border border-slate-100 shadow-sm rounded-none hover:bg-red-50 transition-all opacity-0 group-hover/nav:opacity-100 hidden md:block"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Responsivo Inteligente */}
      <div className="p-5 sm:p-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 animate-in fade-in duration-700">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => {
            const qty = quantities[product.id] || 1;
            const isAdded = addedItems[product.id];
            const isEditing = editingPriceId === product.id;
            const currentPrice = customPrices[product.id] || (product.onSale && product.salePrice ? product.salePrice : product.price);
            const isFavorite = favorites.includes(product.id);

            return (
              <div key={product.id} className="group bg-white rounded-none border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden relative border-b-4 border-b-transparent hover:border-b-red-500">
                 {product.onSale && !isEditing && (
                   <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black px-2.5 py-1 rounded-none z-10 shadow-lg">
                     PROMO
                   </div>
                 )}

                 <button 
                  onClick={(e) => toggleFavorite(product.id, e)}
                  className="absolute top-3 right-3 p-2 rounded-none bg-white/80 backdrop-blur-sm shadow-sm z-10 hover:bg-white transition-colors border border-slate-100 group-hover:opacity-100 opacity-80 md:opacity-0"
                 >
                   <Heart className={`w-4 h-4 transition-all ${isFavorite ? 'text-pink-500 fill-pink-500' : 'text-slate-300'}`} />
                 </button>
                
                <div className="p-4 sm:p-5 flex-1 flex flex-col">
                  <h3 
                    onClick={() => setSelectedProduct(product)} 
                    className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug mb-4 line-clamp-3 min-h-[48px] cursor-pointer group-hover:text-red-600 transition-colors uppercase tracking-tight"
                  >
                    {product.description}
                  </h3>
                  
                  <div className="mt-auto space-y-4">
                    <div className="relative">
                      {product.onSale && !isEditing && (
                        <p className="text-[10px] text-slate-300 line-through">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                      )}
                      
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <div className="flex items-center bg-red-50 border border-red-100 rounded-none px-3 py-1 w-full animate-in zoom-in-95">
                            <span className="text-xs font-bold text-red-500 mr-1">R$</span>
                            <input 
                              autoFocus
                              type="text"
                              className="w-full bg-transparent outline-none text-base font-black text-red-700"
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
                          <div className="flex items-center gap-2 cursor-pointer group/price" onClick={() => setEditingPriceId(product.id)}>
                            <div className="flex items-baseline gap-1">
                              <span className={`text-[11px] font-bold ${product.onSale ? 'text-red-600' : 'text-slate-400'}`}>R$</span>
                              <span className={`text-xl font-black tracking-tighter ${product.onSale ? 'text-red-600' : 'text-slate-900'}`}>
                                {currentPrice.toFixed(2).split('.')[0]}
                                <span className="text-sm font-bold">,{currentPrice.toFixed(2).split('.')[1]}</span>
                              </span>
                            </div>
                            <Edit3 className="w-3.5 h-3.5 text-slate-200 group-hover/price:text-red-400 transition-all scale-0 group-hover/price:scale-100" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                       <div className="flex items-center bg-slate-50 rounded-none border border-slate-100 h-9 px-1 transition-all group-hover:bg-white group-hover:border-slate-200 shadow-inner">
                          <button onClick={() => handleQtyChange(product.id, -1)} className="w-8 h-full text-slate-400 hover:text-red-600 transition-colors flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="text-xs font-black text-slate-800 min-w-[20px] text-center">{qty}</span>
                          <button onClick={() => handleQtyChange(product.id, 1)} className="w-8 h-full text-slate-400 hover:text-red-600 transition-colors flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                       </div>
                       
                       <button 
                        onClick={() => handleAdd(product)}
                        className={`flex-1 rounded-none h-9 flex items-center justify-center transition-all shadow-md active:scale-95 ${
                          isAdded ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'
                        }`}
                      >
                        {isAdded ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-32 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-slate-50 rounded-none flex items-center justify-center mb-6 border border-slate-100">
               <Package className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.2em]">
              {selectedGroup === 'Favoritos' ? 'Sua lista de favoritos está vazia' : 'Nenhum produto por aqui'}
            </p>
            <button onClick={() => {setSearchTerm(''); setSelectedGroup('Todos');}} className="mt-4 text-red-600 text-xs font-black uppercase hover:underline">Limpar filtros</button>
          </div>
        )}
      </div>

      {/* Sheet de Detalhes Adaptável */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-none shadow-2xl overflow-hidden flex flex-col sm:max-h-[90vh] border border-slate-100 animate-in slide-in-from-bottom-20 duration-500">
            
            <div className="hidden sm:flex absolute top-6 right-6 z-10 flex gap-2">
              <button 
                onClick={(e) => toggleFavorite(selectedProduct.id, e)}
                className={`p-3 bg-slate-100 rounded-none transition-all shadow-sm ${favorites.includes(selectedProduct.id) ? 'text-pink-500' : 'text-slate-400 hover:text-pink-500'}`}
              >
                <Heart className={`w-6 h-6 ${favorites.includes(selectedProduct.id) ? 'fill-pink-500' : ''}`} />
              </button>
              <button onClick={() => setSelectedProduct(null)} className="p-3 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-none transition-all shadow-sm"><X className="w-6 h-6" /></button>
            </div>

            <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mt-4 mb-2 shrink-0 sm:hidden" />

            <div className="px-8 py-10 overflow-y-auto scrollbar-hide space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-none text-[10px] font-black uppercase tracking-widest border border-slate-200">SKU {selectedProduct.code}</span>
                   <span className="px-3 py-1 bg-red-50 text-red-600 rounded-none text-[10px] font-black uppercase tracking-widest border border-red-100">{selectedProduct.group}</span>
                   {favorites.includes(selectedProduct.id) && (
                     <span className="px-3 py-1 bg-pink-50 text-pink-600 rounded-none text-[10px] font-black uppercase tracking-widest border border-pink-100 flex items-center gap-1.5">
                       <Heart className="w-3 h-3 fill-pink-500" /> Favorito
                     </span>
                   )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight uppercase tracking-tighter">{selectedProduct.description}</h2>
              </div>

              <div className="p-8 rounded-none bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Valor de Negociação</p>
                  <div className="flex flex-col">
                    <p className="text-5xl font-black tracking-tighter text-slate-900">
                      <span className="text-xl mr-2">R$</span>
                      {(customPrices[selectedProduct.id] || (selectedProduct.onSale && selectedProduct.salePrice ? selectedProduct.salePrice : selectedProduct.price)).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-3">
                   <div className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-none border border-emerald-100 shadow-sm">
                      <Truck className="w-5 h-5" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Entrega Imediata</span>
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest sm:text-right">Sujeito a conferência de estoque físico no momento do faturamento.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center bg-white rounded-none border border-slate-200 h-16 shadow-md px-3 w-full sm:w-auto">
                  <button onClick={() => handleQtyChange(selectedProduct.id, -1)} className="w-12 h-full text-slate-400 hover:text-red-600 transition-colors flex items-center justify-center"><Minus className="w-6 h-6" /></button>
                  <span className="w-12 text-center font-black text-slate-900 text-xl">{quantities[selectedProduct.id] || 1}</span>
                  <button onClick={() => handleQtyChange(selectedProduct.id, 1)} className="w-12 h-full text-slate-400 hover:text-red-600 transition-colors flex items-center justify-center"><Plus className="w-6 h-6" /></button>
                </div>
                <button 
                  onClick={() => { handleAdd(selectedProduct); setSelectedProduct(null); }}
                  className="flex-1 w-full h-16 bg-red-600 hover:bg-red-700 text-white rounded-none font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-xl shadow-red-100 transition-all active:scale-95"
                >
                  <ShoppingCart className="w-5 h-5" /> Adicionar à Cesta
                </button>
              </div>
            </div>
            
            <div className="h-10 bg-white sm:hidden" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
