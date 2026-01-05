
import React, { useState } from 'react';
import { CartItem, ClientData, Order, OrderStatus, Seller } from '../../types';
import { Trash2, Plus, Minus, ShoppingBag, Download, Loader2, Sparkles, MessageSquare, CheckCircle2, AlertTriangle, Share2, FileText, User } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

interface CartProps {
  cart: CartItem[];
  user: ClientData;
  sellers: Seller[];
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  onOrderCreated: (order: Order) => void;
}

const Cart: React.FC<CartProps> = ({ cart, user, sellers, updateQuantity, removeFromCart, onOrderCreated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  
  const total = cart.reduce((sum, item) => sum + (((item.onSale && item.salePrice) ? item.salePrice : item.price) * item.quantity), 0);

  // ... (Lógica do PDF mantida idêntica, apenas visual muda)
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
    try {
      setPdfError(null);
      const doc = getPDFDocument(order);
      const fileName = `Pedido_${order.id}_Atacadao.pdf`;
      doc.save(fileName);
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Pedido Atacadão #${order.id}`,
          text: `Segue em anexo o PDF oficial do meu pedido #${order.id} gerado agora no Portal.`
        });
      } else {
        alert("Download efetuado! Agora anexe o arquivo manualmente no WhatsApp.");
      }
    } catch (err) {
      console.error("Erro PDF Share:", err);
      setPdfError("Falha ao abrir seletor de compartilhamento. O arquivo foi baixado.");
    }
  };

  const handleGenerateOrder = async () => {
    if (cart.length === 0) return;
    if (!selectedSeller) {
      alert("Por favor, selecione uma vendedora para prosseguir.");
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
          unitPrice: (item.onSale && item.salePrice) ? item.salePrice : item.price,
          subtotal: ((item.onSale && item.salePrice) ? item.salePrice : item.price) * item.quantity
        }))
      };
      await addDoc(collection(db, 'orders'), newOrder);
      setLastOrder(newOrder);
      await handleShareAndDownloadPDF(newOrder);
    } catch (err: any) {
      console.error("Erro Order:", err);
      alert("Erro ao processar pedido no servidor.");
    } finally {
      setIsGenerating(false);
    }
  };

  const openWhatsAppWithDetails = () => {
    if (!lastOrder || !selectedSeller) return;
    const itemsList = lastOrder.items.map(item => 
      `• ${item.quantity}x ${item.description.toUpperCase()}\n   _Un: R$ ${item.unitPrice.toFixed(2).replace('.', ',')} | Sub: R$ ${item.subtotal.toFixed(2).replace('.', ',')}_`
    ).join('\n\n');
    const message = encodeURIComponent(
      `*🛒 NOVO PEDIDO - PORTAL ATACADÃO*\n\n` +
      `Olá, *${selectedSeller.name}*!\n` +
      `Sou o cliente: *${user.name}*\n` +
      `Pedido: *#${lastOrder.id}*\n\n` +
      `*DETALHAMENTO DO PEDIDO:*\n${itemsList}\n\n` +
      `*💰 TOTAL GERAL: R$ ${lastOrder.total.toFixed(2).replace('.', ',')}*\n\n` +
      `_O PDF detalhado já foi baixado e estou enviando em anexo._`
    );
    window.open(`https://wa.me/${selectedSeller.phone}?text=${message}`, '_blank');
    onOrderCreated(lastOrder); 
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center bg-slate-50">
        <div className="bg-slate-100 p-8 rounded-full mb-6 text-slate-300">
          <ShoppingBag className="w-16 h-16" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Cesta Vazia</h2>
        <p className="text-slate-500 mt-2 text-sm max-w-[250px]">Adicione itens do catálogo para iniciar o pedido.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="glass-header px-6 py-4 sticky top-0 z-20 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Conferência</h2>
          <p className="text-xs text-slate-500 font-medium">{cart.length} itens listados</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Subtotal</p>
          <p className="text-xl font-bold text-slate-900">R$ {total.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-48 scrollbar-hide">
        {!lastOrder && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                <User className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-slate-800 uppercase">Selecione o Vendedor</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sellers.filter(s => s.active).map(seller => (
                <button
                  key={seller.id}
                  onClick={() => setSelectedSeller(seller)}
                  className={`px-3 py-2.5 rounded-lg border text-left transition-all ${
                    selectedSeller?.id === seller.id 
                    ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200' 
                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold truncate">{seller.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <p className="text-[9px] font-medium opacity-80">Online</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {pdfError && (
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-center gap-3 text-orange-600">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-medium">{pdfError}</p>
          </div>
        )}

        <div className="space-y-3">
           {cart.map(item => {
            const itemPrice = (item.onSale && item.salePrice) ? item.salePrice : item.price;
            return (
              <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4 items-center">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xs text-slate-800 uppercase leading-snug mb-1">{item.description}</h3>
                  <p className="text-[10px] text-slate-400 font-medium mb-2">Unit: R$ {itemPrice.toFixed(2).replace('.', ',')}</p>
                  <div className="flex items-center justify-between">
                     <p className="text-sm font-bold text-slate-900">R$ {(itemPrice * item.quantity).toFixed(2).replace('.', ',')}</p>
                     
                     <div className="flex items-center bg-slate-50 rounded-lg border border-slate-100 h-7">
                        <button onClick={() => updateQuantity(item.id, -1)} className="px-2 h-full text-slate-400 hover:text-red-600"><Minus className="w-3 h-3" /></button>
                        <span className="text-xs font-bold text-slate-800 min-w-[20px] text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="px-2 h-full text-slate-400 hover:text-red-600"><Plus className="w-3 h-3" /></button>
                     </div>
                  </div>
                </div>
                {!lastOrder && (
                  <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
           })}
        </div>
      </div>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] p-5 bg-white border border-slate-200 rounded-2xl shadow-xl z-40">
        {!lastOrder ? (
          <div className="space-y-3">
             <div className="flex justify-between items-end pb-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Final</p>
                <p className="text-2xl font-bold text-slate-900">R$ {total.toFixed(2).replace('.', ',')}</p>
            </div>
            <button 
              onClick={handleGenerateOrder}
              disabled={isGenerating || !selectedSeller}
              className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
                isGenerating || !selectedSeller ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200'
              }`}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <FileText className="w-4 h-4" /> Finalizar Pedido
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-in zoom-in-95 duration-300">
            <div className="text-center pb-2">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase">Pedido Gerado!</h3>
              <p className="text-xs text-slate-500">Envie o comprovante para o vendedor.</p>
            </div>
            
            <button 
              onClick={() => handleShareAndDownloadPDF(lastOrder)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm"
            >
              <Share2 className="w-4 h-4" /> Compartilhar PDF
            </button>

            <button 
              onClick={openWhatsAppWithDetails}
              className="w-full py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Enviar no WhatsApp
            </button>
            
            <button 
              onClick={() => onOrderCreated(lastOrder)}
              className="w-full py-2 text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
