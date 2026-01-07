
import React from 'react';
import { Order, OrderStatus } from '../../types';
import { X, Printer, Download } from 'lucide-react';

interface FiscalCouponProps {
  order: Order;
  onClose: () => void;
}

const FiscalCoupon: React.FC<FiscalCouponProps> = ({ order, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-[380px] flex flex-col animate-in zoom-in-95 duration-300">
        {/* Botões de Ação Superiores */}
        <div className="flex justify-between mb-4 relative z-10">
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button className="p-2 bg-white text-slate-900 rounded-full shadow-lg" onClick={() => window.print()}>
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* O Cupom */}
        <div className="bg-white shadow-2xl overflow-hidden flex flex-col font-mono text-slate-800 p-6 relative">
          {/* Efeito Serrilhado Superior */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="flex-1 h-full bg-slate-100" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
            ))}
          </div>

          {/* Cabeçalho Atualizado com informações reais */}
          <div className="text-center space-y-1 mb-4 pt-2">
            <h2 className="font-black text-sm tracking-tight uppercase">ECONOMIZE ATACADAO LTDA</h2>
            <p className="text-[9px]">CNPJ: 20.190.835/0001-69</p>
            <p className="text-[9px]">I.E.: 15.448.283-8</p>
            <p className="text-[8px] leading-tight px-2">RUA BELEM - JARDIM EUROPA, CANAA DOS CARAJAS - PA</p>
            <p className="text-[9px] font-bold">TELEFONE: (94) 9285-8625</p>
          </div>

          <div className="border-t border-dashed border-slate-300 my-3" />

          {/* Dados do Pedido */}
          <div className="text-[10px] space-y-1">
            <p>PEDIDO: #{order.id}</p>
            <p>DATA: {new Date(order.createdAt).toLocaleString('pt-BR')}</p>
            <p>STATUS: {order.status.toUpperCase()}</p>
            <p className="truncate">CLIENTE: {order.clientName.toUpperCase()}</p>
            {order.sellerName && <p>VEND: {order.sellerName.toUpperCase()}</p>}
          </div>

          <div className="border-t border-dashed border-slate-300 my-3" />

          {/* Tabela de Itens */}
          <div className="text-[10px] mb-4">
            <div className="flex justify-between font-bold mb-2">
              <span className="w-8">QTD</span>
              <span className="flex-1 px-2">DESCRIÇÃO</span>
              <span className="w-16 text-right">TOTAL</span>
            </div>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="flex justify-between">
                    <span className="w-8">{item.quantity}</span>
                    <span className="flex-1 px-2 truncate">{item.description.toUpperCase()}</span>
                    <span className="w-16 text-right">{(item.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end text-[8px] text-slate-400">
                    <span>{item.quantity} UN X {item.unitPrice.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-3" />

          {/* Totais */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span>TOTAL DO PEDIDO</span>
              <span>R$ {order.total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-300 my-4" />

          {/* Rodapé */}
          <div className="text-center space-y-2 pb-2">
            <p className="text-[9px] font-bold">*** DOCUMENTO NÃO FISCAL ***</p>
            <p className="text-[8px] leading-tight px-1">
              O faturamento eletrônico (NF-e) será enviado para o e-mail cadastrado após a conferência de saída.
            </p>
            <p className="text-[10px] mt-4 font-black">OBRIGADO PELA PREFERÊNCIA!</p>
          </div>

          {/* Efeito Serrilhado Inferior */}
          <div className="absolute bottom-0 left-0 right-0 h-1 flex">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="flex-1 h-full bg-slate-50" style={{ clipPath: 'polygon(50% 0, 0 100%, 100% 100%)' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiscalCoupon;
