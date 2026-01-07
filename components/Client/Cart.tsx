
import React, { useState } from 'react';
import { CartItem, ClientData, Order, OrderStatus, Seller } from '../../types';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Loader2, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle, 
  Share2, 
  FileText, 
  User, 
  Edit3,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

interface CartProps {
  cart: CartItem[];
  user: ClientData;
  sellers: Seller[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  onOrderCreated: (order: Order) => void;
  onUpdatePrice?: (id: string, newPrice: number) => void;
}

const Cart: React.FC<CartProps> = ({ 
  cart, user, sellers, updateQuantity, removeFromCart, onOrderCreated, onUpdatePrice 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getPDFDocument = (order: Order) => {
    const doc = new jsPDF();
    doc.setFillColor(220, 38, 38); 
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.text('ATACADÃO', 20, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('PORTAL DE LOGÍSTICA B2B', 20, 35);
    doc.text(`PEDIDO: ${order.id}`, 140, 20);
    doc.text(`DATA: ${new Date().toLocaleString('pt-BR')}`, 140, 28);
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO FATURAMENTO', 20, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Razão Social: ${user.name}`, 20, 68);
    doc.text(`CNPJ/CPF: ${user.cpfCnpj || 'Não Informado'}`, 20, 74);
    doc.text(`Telefone: ${user.phone || 'Não Informado'}`, 20, 80);
    doc.text(`Endereço: ${user.address || 'Não Informado'}`, 20, 86);
    
    const tableData = order.items.map(item => [
      `#${item.productId.slice(0, 5)}`,
      item.description.toUpperCase(),
      item.quantity.toString(),
      `R$ ${item.unitPrice.toFixed(2).replace('.', ',')}`,
      `R$ ${item.subtotal.toFixed(2).replace('.', ',')}`
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['CÓDIGO', 'DESCRIÇÃO DO PRODUTO', 'QTD', 'VALOR UN.', 'SUBTOTAL']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], fontSize: 10, halign: 'center' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFillColor(248, 250, 252);
    doc.rect(130, finalY - 8, 60, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38);
    doc.text(`VALOR TOTAL:`, 135, finalY);
    doc.text(`R$ ${order.total.toFixed(2).replace('.', ',')}`, 135, finalY + 10);
    return doc;
  };

  const handleShareAndDownloadPDF = async (order: Order) => {
    setPdfError(null);
    const doc = getPDFDocument(order);
    const fileName = `Pedido_${order.id}_Atacadao.pdf`;
    doc.save(fileName);
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Pedido Atacadão #${order.id}`,
          text: `Pedido #${order.id} gerado via Portal Atacadão.`
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Erro no compartilhamento:", err);
          setPdfError("O PDF foi baixado. Compartilhe-o manualmente.");
        }
      }
    } else {
      setPdfError("O PDF foi baixado. Compartilhe-o manualmente.");
    }
  };

  const handleGenerateOrder = async () => {
    if (cart.length === 0) return;
    if (!selectedSeller) {
      alert("Selecione uma vendedora primeiro.");
      return;
    }
    setIsGenerating(true);
    try {
      const orderId = 'AT' + Math.random().toString(36).substr(2, 6).toUpperCase();
      const newOrder: Order = {
        id: orderId,
        clientId: user.id,
        clientName: user.name,
        total,
        status: OrderStatus.GENERATED,
        createdAt: new Date().toISOString(),
        sellerId: selectedSeller.id,
        sellerName: selectedSeller.name,
        items: cart.map(item => ({
          productId: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity
        }))
      };
      
      await setDoc(doc(db, 'orders', orderId), newOrder);
      
      setLastOrder(newOrder);
      await handleShareAndDownloadPDF(newOrder);
    } catch (err: any) {
      console.error("Erro ao gerar pedido:", err);
      alert("Erro ao salvar pedido: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const openWhatsAppWithDetails = () => {
    if (!lastOrder || !selectedSeller) return;
    const itemsList = lastOrder.items.map(item => 
      `• ${item.quantity}x ${item.description.toUpperCase()}\n   _R$ ${item.unitPrice.toFixed(2)} / un_`
    ).join('\n\n');
    const message = encodeURIComponent(
      `*🛒 NOVO PEDIDO - PORTAL ATACADÃO*\n\n` +
      `Olá, *${selectedSeller.name}*!\n` +
      `Cliente: *${user.name}*\n` +
      `Pedido: *#${lastOrder.id}*\n\n` +
      `*DETALHAMENTO:*\n${itemsList}\n\n` +
      `*💰 TOTAL: R$ ${lastOrder.total.toFixed(2).replace('.', ',')}*\n\n` +
      `_O PDF detalhado foi enviado em anexo._`
    );
    window.open(`https://wa.me/${selectedSeller.phone}?text=${message}`, '_blank');
    onOrderCreated(lastOrder); 
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center bg-white animate-in fade-in">
        <div className="bg-slate-50 p-8 rounded-none mb-6 text-slate-200 border border-slate-100 shadow-inner">
          <ShoppingBag className="w-16 h-16" />
        </div>
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Cesta Vazia</h2>
        <p className="text-slate-400 mt-3 text-[10px] font-bold uppercase tracking-widest max-w-[220px]">Adicione itens do catálogo para iniciar seu pedido.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-50 relative">
      
      <div className="bg-white px-6 py-5 sticky top-0 z-30 flex justify-between items-center border-b border-slate-200 shadow-sm transition-shadow">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Conferência</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{cart.length} itens ativos</p>
        </div>
        <div className="text-right">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Subtotal</p>
           <p className="text-xl font-black text-slate-900 tracking-tighter">R$ {total.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      <div className="p-3 space-y-1.5 pb-32">
        {!lastOrder && (
          <div className="mb-2 animate-in fade-in duration-500">
            <div className="bg-white p-4 rounded-none border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3 px-1">
                <User className="w-3.5 h-3.5 text-red-500" />
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Escolha sua Vendedora</p>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {sellers.filter(s => s.active).map(seller => (
                  <button
                    key={seller.id}
                    onClick={() => setSelectedSeller(seller)}
                    className={`px-4 py-2.5 rounded-none border-2 whitespace-nowrap transition-all ${
                      selectedSeller?.id === seller.id 
                      ? 'bg-red-50 border-red-500 text-red-700 ring-2 ring-red-100' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white'
                    }`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-widest">{seller.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {pdfError && (
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-none flex items-center gap-3 text-orange-600 mb-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">{pdfError}</p>
          </div>
        )}

        <div className="space-y-1.5">
          {cart.map(item => {
            const isEditing = editingPriceId === item.id;
            return (
              <div key={item.id} className="bg-white px-4 py-2.5 rounded-none border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                     <h3 className="font-black text-[11px] text-slate-800 uppercase leading-snug truncate pr-4">{item.description}</h3>
                     {!lastOrder && (
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-200 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                     )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-3">
                      {isEditing ? (
                        <div className="flex items-center bg-red-50 border border-red-100 rounded-none px-2 py-0.5">
                          <input 
                            autoFocus
                            type="text"
                            className="w-14 bg-transparent outline-none text-[11px] font-black text-red-700"
                            defaultValue={item.price.toFixed(2).replace('.', ',')}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value.replace(',', '.'));
                              if (!isNaN(val) && onUpdatePrice) onUpdatePrice(item.id, val);
                              setEditingPriceId(null);
                            }}
                          />
                        </div>
                      ) : (
                        <button 
                          onClick={() => !lastOrder && setEditingPriceId(item.id)}
                          className="text-[10px] font-black text-slate-400 hover:text-red-500 flex items-center gap-1"
                        >
                          R$ {item.price.toFixed(2).replace('.', ',')}
                          <Edit3 className="w-2.5 h-2.5 opacity-30" />
                        </button>
                      )}
                      <span className="text-[10px] font-black text-slate-900 tracking-tight">
                        Sub: R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="flex items-center bg-slate-50 rounded-none border border-slate-100 h-7 px-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-full text-slate-400 hover:text-red-600 flex items-center justify-center"><Minus className="w-2.5 h-2.5" /></button>
                      <span className="text-[10px] font-black text-slate-800 min-w-[18px] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-full text-slate-400 hover:text-red-600 flex items-center justify-center"><Plus className="w-2.5 h-2.5" /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 mb-20">
          {!lastOrder ? (
            <div className="bg-white border-t-4 border-red-600 p-6 rounded-none shadow-2xl animate-in slide-in-from-bottom-5">
               <div className="flex items-end justify-between mb-6 px-1">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Resumo Final</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">R$ {total.toFixed(2).replace('.', ',')}</p>
                  </div>
                  {selectedSeller && (
                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-none border border-emerald-100">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{selectedSeller.name.split(' ')[0]}</span>
                    </div>
                  )}
               </div>

               <button 
                  onClick={handleGenerateOrder}
                  disabled={isGenerating || !selectedSeller}
                  className={`w-full py-5 rounded-none font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all relative overflow-hidden group ${
                    isGenerating || !selectedSeller 
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200' 
                    : 'bg-slate-900 text-white hover:bg-black shadow-2xl shadow-slate-200 active:scale-[0.98]'
                  }`}
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform text-red-500" />
                      Gerar Pedido Agora
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                  {!selectedSeller && !isGenerating && (
                     <span className="absolute inset-0 flex items-center justify-center bg-slate-50/50 text-[9px] font-black uppercase tracking-widest text-slate-500">Selecione uma vendedora</span>
                  )}
                </button>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-none border border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-none flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest text-center">Pedido Enviado com Sucesso!</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-widest text-center px-4 leading-relaxed">
                  Em breve seu pedido será faturado por nossa equipe de logística.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl text-blue-600">
                  <Info className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">ID: #{lastOrder.id}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={() => handleShareAndDownloadPDF(lastOrder)}
                   className="py-4 bg-slate-900 text-white rounded-none font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                 >
                   <Share2 className="w-4 h-4" /> PDF
                 </button>
                 <button 
                   onClick={openWhatsAppWithDetails}
                   className="py-4 bg-emerald-600 text-white rounded-none font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                 >
                   <MessageSquare className="w-4 h-4" /> WhatsApp
                 </button>
              </div>
              
              <button 
                onClick={() => onOrderCreated(lastOrder)}
                className="w-full text-slate-400 hover:text-red-500 pt-6 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Voltar ao Catálogo
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Cart;
