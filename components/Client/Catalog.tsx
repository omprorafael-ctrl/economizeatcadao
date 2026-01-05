
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
        <div className="px-5 py-4 sm:px-8 flex flex-col gap-4">
          {/* Barra de Pesquisa */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text"
              placeholder="O que você procura hoje?"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-red-100 outline-none text-sm font-bold text-slate-700 transition-all placeholder:text-slate-400 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Navegação de Categorias Ativada */}
          <div className="relative flex items-center group/nav">
            <button 
              onClick={() => scrollCategories('left')}
              className="absolute left-0 z-20 p-2 bg-white/90 backdrop-blur-sm text-red-600 border border-slate-100 shadow-md rounded-full hover:bg-red-50 transition-all opacity-0 group-hover/nav:opacity-100 hidden md:block -translate-x-1/2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div 
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto flex-nowrap scrollbar-hide pb-2 w-full mask-fade-right"
            >
              {groups.map(group => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`px-5 py-2.5 rounded-full text-[10px] font-black whitespace-nowrap uppercase tracking-widest transition-all border flex items-center gap-2 shrink-0 shadow-sm ${
                    selectedGroup === group 
                    ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-100 scale-105 z-10' 
                    : group === 'Promoções' 
                      ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' 
                      : group === 'Favoritos'
                        ? 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-pink-100'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-red-200 hover:text-red-500 hover:bg-slate-50'
                  }`}
                >
                  {group === 'Promoções' && <Zap className="w-3.5 h-3.5 fill-orange-500 stroke-orange-500" />}
                  {group === 'Favoritos' && <Heart className={`w-3.5 h-3.5 ${selectedGroup === 'Favoritos' ? 'fill-white' : 'fill-pink-500'}`} />}
                  {group}
                </button>
              ))}
              <div className="w-12 shrink-0" />
            </div>

            <button 
              onClick={() => scrollCategories('right')}
              className="absolute right-0 z-20 p-2 bg-white/90 backdrop-blur-sm text-red-600 border border-slate-100 shadow-md rounded-full hover:bg-red-50 transition-all opacity-0 group-hover/nav:opacity-100 hidden md:block translate-x-1/2"
            >
              <ChevronRight className="w-4 h-4" />
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
              <div key={product.id} className="group bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col overflow-hidden relative">
                 {product.onSale && !isEditing && (
                   <div className="absolute top-4 left-4 bg-red-600 text-white text-[9px] font-black px-3 py-1.5 rounded-full z-10 shadow-lg flex items-center gap-1.5 animate-pulse">
                     <Zap className="w-3 h-3 fill-white" /> PROMOÇÃO
                   </div>
                 )}

                 <button 
                  onClick={(e) => toggleFavorite(product.id, e)}
                  className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md z-10 hover:bg-white transition-all border border-slate-100 group-hover:opacity-100 opacity-80 md:opacity-0 scale-90 group-hover:scale-100"
                 >
                   <Heart className={`w-4 h-4 transition-all ${isFavorite ? 'text-pink-500 fill-pink-500' : 'text-slate-300'}`} />
                 </button>

                 <div 
                  onClick={() => setSelectedProduct(product)}
                  className="aspect-square w-full bg-slate-50 border-b border-slate-50 relative overflow-hidden cursor-pointer"
                 >
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.description} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                        <Package className="w-12 h-12 mb-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Sem Foto</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                 </div>
                
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1.5">{product.group}</span>
                  <h3 
                    onClick={() => setSelectedProduct(product)} 
                    className="text-[12px] font-bold text-slate-800 leading-snug mb-5 line-clamp-2 min-h-[36px] cursor-pointer group-hover:text-red-600 transition-colors uppercase tracking-tight"
                  >
                    {product.description}
                  </h3>
                  
                  <div className="mt-auto space-y-5">
                    <div className="relative">
                      {product.onSale && !isEditing && (
                        <p className="text-[10px] text-slate-300 line-through font-bold">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                      )}
                      
                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <div className="flex items-center bg-red-50 border border-red-100 rounded-2xl px-4 py-2 w-full animate-in zoom-in-95">
                            <span className="text-xs font-bold text-red-500 mr-1">R$</span>
                            <input 
                              autoFocus
                              type="text"
                              className="w-full bg-transparent outline-none text-lg font-black text-red-700"
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
                          <div className="flex items-baseline gap-1 cursor-pointer" onClick={() => setEditingPriceId(product.id)}>
                            <span className={`text-[11px] font-bold ${product.onSale ? 'text-red-600' : 'text-slate-400'}`}>R$</span>
                            <span className={`text-2xl font-black tracking-tighter ${product.onSale ? 'text-red-600' : 'text-slate-900'}`}>
                              {currentPrice.toFixed(2).split('.')[0]}
                              <span className="text-sm font-bold">,{currentPrice.toFixed(2).split('.')[1]}</span>
                            </span>
                            <Edit3 className="w-2.5 h-2.5 text-slate-200 ml-1 opacity-0 group-hover:opacity-100" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <div className="flex items-center bg-slate-100 rounded-2xl border border-slate-200 h-10 px-1.5 transition-all group-hover:bg-white group-hover:border-slate-300 shadow-inner">
                          <button onClick={() => handleQtyChange(product.id, -1)} className="w-8 h-full text-slate-400 hover:text-red-600 transition-colors flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                          <span className="text-xs font-black text-slate-800 min-w-[24px] text-center">{qty}</span>
                          <button onClick={() => handleQtyChange(product.id, 1)} className="w-8 h-full text-slate-400 hover:text-red-600 transition-colors flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                       </div>
                       
                       <button 
                        onClick={() => handleAdd(product)}
                        className={`flex-1 rounded-2xl h-10 flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                          isAdded ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-100'
                        }`}
                      >
                        {isAdded ? <Check className="w-5 h-5 animate-in zoom-in" /> : <ShoppingCart className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-32 text-center flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4">
            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8 border border-slate-100 shadow-inner">
               <Package className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-slate-900 font-black text-base uppercase tracking-tight">Nada por aqui no momento</p>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Tente mudar a categoria ou o termo de busca.</p>
            <button 
              onClick={() => {setSearchTerm(''); setSelectedGroup('Todos');}} 
              className="mt-8 px-8 py-3 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border border-red-100 rounded-full hover:bg-red-100 transition-all"
            >
              Limpar Todos os Filtros
            </button>
          </div>
        )}
      </div>

      {/* Modal de Detalhes com Foto Ampliada */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-t-[40px] sm:rounded-[48px] shadow-2xl overflow-hidden flex flex-col sm:max-h-[90vh] border border-slate-100 animate-in slide-in-from-bottom-20 duration-500">
            
            <div className="flex absolute top-6 right-6 z-10 gap-3">
              <button 
                onClick={(e) => toggleFavorite(selectedProduct.id, e)}
                className={`p-3.5 bg-white/95 backdrop-blur-sm rounded-2xl transition-all shadow-lg border border-slate-100 ${favorites.includes(selectedProduct.id) ? 'text-pink-500' : 'text-slate-300 hover:text-pink-500'}`}
              >
                <Heart className={`w-6 h-6 ${favorites.includes(selectedProduct.id) ? 'fill-pink-500' : ''}`} />
              </button>
              <button onClick={() => setSelectedProduct(null)} className="p-3.5 bg-white/95 backdrop-blur-sm hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-2xl transition-all shadow-lg border border-slate-100">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto scrollbar-hide">
              {/* FOTO AMPLIADA NO MODAL */}
              <div className="aspect-video w-full bg-slate-50 relative overflow-hidden shrink-0 border-b border-slate-100">
                 {selectedProduct.imageUrl ? (
                   <img src={selectedProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                      <ImageIcon className="w-20 h-20 mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Imagem Indisponível</p>
                   </div>
                 )}
                 <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/40 to-transparent" />
              </div>

              <div className="px-8 pb-12 space-y-10 relative -mt-12">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-4 py-1.5 bg-white text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">SKU {selectedProduct.code}</span>
                    <span className="px-4 py-1.5 bg-red-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-red-600 shadow-xl shadow-red-100">{selectedProduct.group}</span>
                    {favorites.includes(selectedProduct.id) && (
                      <span className="px-4 py-1.5 bg-pink-50 text-pink-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-pink-100 flex items-center gap-2">
                        <Heart className="w-3.5 h-3.5 fill-pink-500" /> Favorito
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight uppercase tracking-tighter">{selectedProduct.description}</h2>
                </div>

                <div className="p-10 rounded-[40px] bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-8 shadow-inner">
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Oportunidade de Compra</p>
                    <div className="flex flex-col">
                      <p className="text-6xl font-black tracking-tighter text-slate-900">
                        <span className="text-2xl mr-2 font-bold text-slate-400">R$</span>
                        {(customPrices[selectedProduct.id] || (selectedProduct.onSale && selectedProduct.salePrice ? selectedProduct.salePrice : selectedProduct.price)).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-4">
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-white text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm">
                        <Truck className="w-6 h-6" />
                        <span className="text-xs font-black uppercase tracking-widest">Entrega Prioritária</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest sm:text-right leading-relaxed">Estoque limitado para esta unidade organizacional.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="flex items-center bg-white rounded-3xl border border-slate-200 h-20 shadow-xl px-4 w-full sm:w-auto">
                    <button onClick={() => handleQtyChange(selectedProduct.id, -1)} className="w-14 h-full text-slate-300 hover:text-red-600 transition-colors flex items-center justify-center"><Minus className="w-7 h-7" /></button>
                    <span className="w-14 text-center font-black text-slate-900 text-2xl tracking-tighter">{quantities[selectedProduct.id] || 1}</span>
                    <button onClick={() => handleQtyChange(selectedProduct.id, 1)} className="w-14 h-full text-slate-300 hover:text-red-600 transition-colors flex items-center justify-center"><Plus className="w-7 h-7" /></button>
                  </div>
                  <button 
                    onClick={() => { handleAdd(selectedProduct); setSelectedProduct(null); }}
                    className="flex-1 w-full h-20 bg-red-600 hover:bg-red-700 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-5 shadow-2xl shadow-red-200 transition-all active:scale-95"
                  >
                    <ShoppingCart className="w-6 h-6" /> Confirmar na Cesta
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
