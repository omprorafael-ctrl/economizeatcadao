
import React, { useState } from 'react';
import { CartItem, ClientData, Order, OrderStatus } from '../../types';
import { Trash2, Plus, Minus, FileText, CheckCircle, ShoppingBag } from 'lucide-react';

interface CartProps {
  cart: CartItem[];
  user: ClientData;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  onOrderCreated: (order: Order) => void;
}

const Cart: React.FC<CartProps> = ({ cart, user, updateQuantity, removeFromCart, onOrderCreated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleGenerateOrder = () => {
    if (cart.length === 0) return;

    setIsGenerating(true);

    // Simulate PDF generation delay
    setTimeout(() => {
      const newOrder: Order = {
        id: 'ORD' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        clientId: user.id,
        clientName: user.name,
        total,
        status: OrderStatus.GENERATED,
        createdAt: new Date().toISOString(),
        items: cart.map(item => ({
          productId: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity
        }))
      };

      // In real app, we would use jsPDF here
      const dummyPdfContent = `PEDIDO ${newOrder.id}\nCliente: ${user.name}\nTotal: R$ ${total.toFixed(2)}`;
      console.log("PDF Generated Content:", dummyPdfContent);
      
      onOrderCreated(newOrder);
      setIsGenerating(false);
      alert(`Pedido ${newOrder.id} gerado com sucesso! O PDF foi simulado no console.`);
    }, 2000);
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
        <div className="bg-slate-50 p-8 rounded-full mb-6">
          <ShoppingBag className="w-20 h-20 text-slate-200" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Carrinho Vazio</h2>
        <p className="text-slate-500 mt-2 max-w-[250px]">Adicione produtos do catálogo para começar seu pedido.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 bg-white border-b sticky top-0 z-10">
        <h2 className="text-2xl font-bold text-slate-800">Meu Carrinho</h2>
        <p className="text-sm text-slate-500">{cart.length} itens selecionados</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
        {cart.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-center">
            <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover" alt={item.description} />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-slate-800 truncate">{item.description}</h3>
              <p className="text-xs text-slate-400 mb-2">Ref: {item.code}</p>
              <div className="flex items-center justify-between">
                <p className="text-blue-600 font-bold">R$ {item.price.toFixed(2)}</p>
                <div className="flex items-center bg-slate-100 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-500 hover:bg-white rounded transition-all">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-500 hover:bg-white rounded transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="absolute bottom-20 left-0 right-0 p-6 bg-white border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] rounded-t-[32px]">
        <div className="flex justify-between items-center mb-6">
          <p className="text-slate-500 font-medium">Total Geral</p>
          <p className="text-3xl font-extrabold text-blue-600">R$ {total.toFixed(2)}</p>
        </div>
        <button 
          onClick={handleGenerateOrder}
          disabled={isGenerating}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold text-lg shadow-xl transition-all active:scale-95 ${
            isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <FileText className="w-6 h-6" />
              Gerar Pedido em PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Cart;
