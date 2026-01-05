
import React, { useState } from 'react';
import { CartItem, ClientData, Order, OrderStatus, Seller } from '../../types';
import { Trash2, Plus, Minus, ShoppingBag, Tag, Download, Loader2, Sparkles, MessageSquare, ArrowRight, UserCheck, CheckCircle2, AlertTriangle, Share2 } from 'lucide-react';
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

  const getPDFDocument = (order: Order) => {
    const doc = new jsPDF();
    
    // Cabeçalho Vermelho Atacadão
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

    // Dados do Cliente
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

    // Tabela de Itens
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
    
    // Rodapé de Totais
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
      
      // 1. Inicia o Download Automático (Garante a cópia local)
      doc.save(fileName);

      // 2. Prepara o arquivo para Compartilhamento
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // 3. Executa o Compartilhamento Nativo se disponível
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Pedido Atacadão #${order.id}`,
          text: `Olá! Segue o PDF oficial do meu pedido #${order.id} gerado no Portal Atacadão.\n\nTotal: R$ ${order.total.toFixed(2).replace('.', ',')}`
        });
      } else {
        // Fallback apenas para dispositivos sem Web Share
        alert("Download concluído! Como seu navegador não suporta compartilhamento direto de arquivos, anexe o PDF baixado manualmente ao WhatsApp.");
      }
    } catch (err) {
      console.error("Erro ao processar PDF:", err);
      setPdfError("Erro ao processar arquivo. Verifique se o download foi concluído.");
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

      // Grava no banco
      await addDoc(collection(db, 'orders'), newOrder);
      
      setLastOrder(newOrder);
      
      // Tenta compartilhar e baixar imediatamente
      await handleShareAndDownloadPDF(newOrder);
      
    } catch (err: any) {
      console.error("Erro ao salvar pedido:", err);
      alert("Erro de conexão ao gerar pedido.");
    } finally {
      setIsGenerating(false);
    }
  };

  const openWhatsAppDirect = () => {
    if (!lastOrder || !selectedSeller) return;
    
    const message = encodeURIComponent(
      `*NOVO PEDIDO ATACADÃO*\n\n` +
      `Olá, *${selectedSeller.name}*!\n` +
      `Sou o cliente *${user.name}*.\n\n` +
      `Acabei de gerar o pedido *#${lastOrder.id}* no portal.\n` +
      `*Total:* R$ ${lastOrder.total.toFixed(2).replace('.', ',')}\n\n` +
      `_Já baixei o PDF e vou enviá-lo em anexo agora._`
    );
    
    window.open(`https://wa.me/${selectedSeller.phone}?text=${message}`, '_blank');
    onOrderCreated(lastOrder); 
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10 text-center bg-transparent">
        <div className="bg-red-600/5 p-10 rounded-full mb-8 border border-red-500/10 animate-pulse">
          <ShoppingBag className="w-20 h-20 text-red-900/40" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Cesta Vazia</h2>
        <p className="text-slate-500 mt-3 text-sm font-medium max-w-[280px] leading-relaxed uppercase tracking-widest text-[10px]">Aguardando seleção de produtos de alta qualidade do nosso catálogo.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="p-10 bg-black/40 backdrop-blur-3xl border-b border-white/5 sticky top-0 z-20 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Meu Pedido</h2>
          <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mt-2">{cart.length} Itens em conferência</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Montante Total</p>
          <p className="text-3xl font-black text-white tracking-tighter italic">R$ {total.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-4 pb-80 scrollbar-hide">
        {!lastOrder && (
          <div className="bg-white/5 p-8 rounded-[35px] border border-white/10 mb-8 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center text-red-500">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black text-white text-sm uppercase italic">Escolha sua Vendedora</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Para suporte e finalização via Whats</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sellers.filter(s => s.active).length > 0 ? (
                sellers.filter(s => s.active).map(seller => (
                  <button
                    key={seller.id}
                    onClick={() => setSelectedSeller(seller)}
                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
                      selectedSeller?.id === seller.id 
                      ? 'bg-red-600 border-red-500 shadow-xl shadow-red-900/40' 
                      : 'bg-black/20 border-white/5 hover:border-red-500/40 text-slate-400'
                    }`}
                  >
                    <p className={`font-black uppercase text-[10px] tracking-tight ${selectedSeller?.id === seller.id ? 'text-white' : 'text-slate-300'}`}>{seller.name}</p>
                    <p className={`text-[8px] font-bold mt-1 ${selectedSeller?.id === seller.id ? 'text-red-100' : 'text-slate-600'}`}>Online</p>
                    {selectedSeller?.id === seller.id && <Sparkles className="absolute -top-1 -right-1 w-8 h-8 opacity-20 text-white" />}
                  </button>
                ))
              ) : (
                <p className="col-span-2 text-[9px] text-red-500 uppercase font-black tracking-widest p-4 text-center bg-red-500/5 rounded-2xl border border-red-500/10">Nenhuma vendedora disponível no momento.</p>
              )}
            </div>
          </div>
        )}

        {pdfError && (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-center gap-4 text-red-400 mb-6">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <p className="text-xs font-bold uppercase tracking-tight">{pdfError}</p>
          </div>
        )}

        <div className="space-y-4">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-4">Produtos Selecionados</p>
           {cart.map(item => {
            const itemPrice = (item.onSale && item.salePrice) ? item.salePrice : item.price;
            return (
              <div key={item.id} className="bg-white/5 p-6 rounded-[35px] border border-white/5 flex gap-5 items-center transition-all hover:border-red-500/30">
                <div className="w-14 h-14 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600 flex-shrink-0 border border-red-500/20">
                  <Tag className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-white uppercase truncate pr-4 tracking-wide">{item.description}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-base font-black text-white italic">R$ {itemPrice.toFixed(2).replace('.', ',')}</p>
                    <div className="flex items-center bg-black/40 rounded-2xl p-1 border border-white/5">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-500"><Minus className="w-4 h-4" /></button>
                      <span className="w-10 text-center font-black text-sm text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-500"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
                {!lastOrder && (
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-600 hover:text-red-500 p-2"><Trash2 className="w-6 h-6" /></button>
                )}
              </div>
            );
           })}
        </div>
      </div>

      <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[92%] max-w-lg p-8 bg-black/90 backdrop-blur-3xl rounded-[45px] shadow-[0_25px_60px_rgba(220,38,38,0.25)] z-40 border border-red-500/20">
        {!lastOrder ? (
          <div className="space-y-4">
             <div className="flex justify-between items-center px-2">
              <div>
                <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.3em] mb-1">Total Confirmado</p>
                <p className="text-4xl font-black text-white tracking-tighter italic">R$ {total.toFixed(2).replace('.', ',')}</p>
              </div>
              <div className="bg-white/5 px-5 py-3 rounded-2xl border border-white/10 text-center backdrop-blur-md">
                <p className="text-[10px] font-black text-white uppercase tracking-widest">{cart.length} Vol.</p>
              </div>
            </div>
            <button 
              onClick={handleGenerateOrder}
              disabled={isGenerating || !selectedSeller}
              className={`w-full flex items-center justify-center gap-4 py-6 rounded-[30px] text-white font-black text-xs uppercase tracking-[0.4em] transition-all active:scale-[0.97] shadow-2xl ${
                isGenerating || !selectedSeller ? 'bg-slate-800 opacity-50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 shadow-red-900/50'
              }`}
            >
              {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Download className="w-5 h-5" />
                  Gerar e Baixar PDF
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in zoom-in-95 duration-500">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">Pedido #{lastOrder.id} Gerado!</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">O download iniciou. Envie o anexo para a vendedora:</p>
            </div>
            
            <button 
              onClick={() => handleShareAndDownloadPDF(lastOrder)}
              className="w-full flex items-center justify-center gap-4 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[30px] font-black text-xs uppercase tracking-[0.3em] shadow-[0_15px_30px_rgba(37,99,235,0.3)] transition-all active:scale-95"
            >
              <Share2 className="w-5 h-5" />
              Compartilhar PDF (Anexo)
            </button>

            <button 
              onClick={openWhatsAppDirect}
              className="w-full flex items-center justify-center gap-4 py-5 bg-emerald-600/10 border border-emerald-500/30 text-emerald-500 rounded-[25px] font-black text-xs uppercase tracking-[0.3em] transition-all active:scale-95"
            >
              <MessageSquare className="w-5 h-5" />
              Notificar via WhatsApp
            </button>
            
            <button 
              onClick={() => onOrderCreated(lastOrder)}
              className="w-full py-3 text-slate-500 text-[8px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors"
            >
              Concluir e Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
