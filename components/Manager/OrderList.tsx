
import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';
import { 
  Eye, 
  Clock, 
  Truck, 
  CheckCircle, 
  Package, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  UserCircle2, 
  ChevronRight,
  X,
  User,
  ShoppingBag,
  CreditCard,
  MapPin
} from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const OrderList: React.FC<OrderListProps> = ({ orders, setOrders }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const updateStatus = (id: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === id) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const statusMap = {
    [OrderStatus.GENERATED]: { label: 'Análise', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
    [OrderStatus.SENT]: { label: 'Em Trânsito', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Truck },
    [OrderStatus.FINISHED]: { label: 'Concluído', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle },
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40">
        <div className="p-6 sm:p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/30">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
              <FileText className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-widest leading-none">Gestão de Vendas</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Monitoramento de Fluxo em Tempo Real</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar pedido por ID ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all font-bold text-slate-700 text-xs shadow-sm"
              />
            </div>
            <button className="px-4 py-3 bg-white text-slate-500 hover:text-red-600 rounded-2xl border border-slate-200 transition-all flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest shadow-sm">
              <Filter className="w-4 h-4" /> Filtrar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">Ordem ID</th>
                <th className="px-8 py-6">Parceiro Comercial</th>
                <th className="px-8 py-6">Gestor Responsável</th>
                <th className="px-8 py-6">Data Cadastro</th>
                <th className="px-8 py-6">Valor Total</th>
                <th className="px-8 py-6">Status Operacional</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map(order => {
                const status = statusMap[order.status];
                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6 font-black text-red-600 text-xs tracking-widest italic">#{order.id}</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs uppercase truncate max-w-[200px]">{order.clientName}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">ID: {order.clientId.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200">
                          <UserCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{order.sellerName || 'Sistema Auto'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[11px] font-bold text-slate-500">
                      {new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900 text-sm tracking-tighter">
                        <span className="text-[10px] text-slate-400 mr-1">R$</span>
                        {order.total.toFixed(2).replace('.', ',')}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="relative inline-block w-full">
                        <select 
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                          className={`w-full px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 outline-none cursor-pointer appearance-none transition-all pr-10 ${status.color}`}
                        >
                          {Object.values(OrderStatus).map(s => (
                            <option key={s} value={s} className="bg-white text-slate-800 uppercase font-bold">{statusMap[s].label}</option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90 opacity-40 pointer-events-none" />
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-600 hover:border-red-100 hover:shadow-lg hover:shadow-red-50 transition-all group-hover:bg-red-50 group-hover:text-red-600"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="py-40 flex flex-col items-center justify-center text-slate-300">
              <Package className="w-20 h-20 mb-6 opacity-10" />
              <p className="font-black uppercase tracking-[0.4em] text-[10px]">Fila de Espera Vazia</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes do Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setSelectedOrder(null)} />
          
          <div className="relative bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-300">
            {/* Header do Modal */}
            <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-100">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">Pedido #{selectedOrder.id}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">
                    Registrado em {new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-3 bg-white hover:bg-red-50 text-slate-300 hover:text-red-600 border border-slate-100 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scrollbar-hide">
              {/* Grid de Informações Topo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <User className="w-3.5 h-3.5" /> Cliente / PDV
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedOrder.clientName}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">ID: {selectedOrder.clientId}</p>
                  </div>
                </div>
                
                <div className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <UserCircle2 className="w-3.5 h-3.5" /> Canal de Atendimento
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedOrder.sellerName || 'Sistema Automático'}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-widest">Código Vendedor: {selectedOrder.sellerId || 'B2B-AUTO'}</p>
                  </div>
                </div>
              </div>

              {/* Tabela de Itens */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Itens Solicitados</h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{selectedOrder.items.length} produtos</span>
                </div>
                
                <div className="border border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[9px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Produto</th>
                        <th className="px-6 py-4 text-center">Qtd</th>
                        <th className="px-6 py-4 text-right">Unitário</th>
                        <th className="px-6 py-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-xs font-black text-slate-800 uppercase leading-snug">{item.description}</p>
                            <p className="text-[9px] text-slate-400 font-bold tracking-widest mt-0.5">#{item.productId.slice(0, 8)}</p>
                          </td>
                          <td className="px-6 py-4 text-center text-xs font-black text-slate-700">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-bold text-slate-500">
                            R$ {item.unitPrice.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-black text-slate-900">
                            R$ {item.subtotal.toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status e Totalização */}
              <div className="flex flex-col md:flex-row gap-4 items-stretch">
                 <div className="flex-1 p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Status Operacional</p>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 ${statusMap[selectedOrder.status].color}`}>
                        {React.createElement(statusMap[selectedOrder.status].icon, { className: "w-4 h-4" })}
                        {statusMap[selectedOrder.status].label}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <select 
                        value={selectedOrder.status}
                        onChange={(e) => updateStatus(selectedOrder.id, e.target.value as OrderStatus)}
                        className="flex-1 h-12 px-4 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all cursor-pointer"
                      >
                         {Object.values(OrderStatus).map(s => (
                           <option key={s} value={s}>{statusMap[s].label.toUpperCase()}</option>
                         ))}
                      </select>
                    </div>
                 </div>

                 <div className="w-full md:w-64 p-6 rounded-3xl bg-red-600 text-white flex flex-col justify-center items-center gap-2 shadow-xl shadow-red-100">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Valor do Faturamento</p>
                    <p className="text-4xl font-black tracking-tighter">
                      <span className="text-sm font-bold mr-1">R$</span>
                      {selectedOrder.total.toFixed(2).replace('.', ',')}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                       <CreditCard className="w-3.5 h-3.5" /> Condição: Boleto 28 DD
                    </div>
                 </div>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
               <button 
                 onClick={() => setSelectedOrder(null)}
                 className="px-6 py-3 text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest transition-colors"
               >
                 Fechar Detalhes
               </button>
               <div className="flex items-center gap-3">
                  <button className="hidden sm:flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-100 transition-all">
                    <FileText className="w-4 h-4" /> Exportar XML
                  </button>
                  <button className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 transition-all">
                    Aprovar Pedido
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
