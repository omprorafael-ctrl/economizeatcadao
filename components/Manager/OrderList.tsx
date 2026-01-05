
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, Seller, OrderItem } from '../../types';
import { 
  Eye, 
  Clock, 
  Truck, 
  CheckCircle, 
  Search, 
  FileText, 
  ChevronRight,
  X,
  CreditCard,
  Ban,
  UserCheck,
  AlertTriangle,
  ClipboardCheck,
  Package,
  Filter,
  Calendar,
  User,
  ChevronDown,
  Timer,
  Send
} from 'lucide-react';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

interface OrderListProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  sellers: Seller[];
}

const OrderList: React.FC<OrderListProps> = ({ orders, sellers }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sellerFilter, setSellerFilter] = useState<string>('all');

  const updateSeller = async (id: string, sellerId: string) => {
    const selectedSeller = sellers.find(s => s.id === sellerId);
    if (!selectedSeller) return;

    try {
      await updateDoc(doc(db, 'orders', id), { 
        sellerId: selectedSeller.id,
        sellerName: selectedSeller.name 
      });
    } catch (error) {
      console.error("Erro ao reatribuir vendedora:", error);
      alert("Erro ao reatribuir vendedora.");
    }
  };

  const statusMap: Record<OrderStatus, { label: string, color: string, icon: any }> = {
    [OrderStatus.GENERATED]: { label: 'Aguardando Lançamento', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Clock },
    [OrderStatus.IN_PROGRESS]: { label: 'Em Lançamento', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: ClipboardCheck },
    [OrderStatus.INVOICED]: { label: 'Faturado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CreditCard },
    [OrderStatus.CANCELLED]: { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-100', icon: Ban },
    [OrderStatus.SENT]: { label: 'Enviado', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: Send },
    [OrderStatus.FINISHED]: { label: 'Concluído', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: CheckCircle },
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return 'Aguardando...';
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : new Date().getTime();
    const diff = Math.abs(e - s);
    
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const getSLAColor = (start?: string, end?: string) => {
    if (!start) return 'text-slate-300';
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : new Date().getTime();
    const diff = Math.abs(e - s);
    if (diff < 600000) return 'text-emerald-500'; // < 10min
    if (diff < 3600000) return 'text-amber-500'; // < 1h
    return 'text-red-500'; // > 1h
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           o.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesSeller = sellerFilter === 'all' || o.sellerId === sellerFilter;
      
      return matchesSearch && matchesStatus && matchesSeller;
    });
  }, [orders, searchTerm, statusFilter, sellerFilter]);

  const calculateTotalItems = (items: OrderItem[] = []) => {
    return items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSellerFilter('all');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40">
        <div className="p-6 sm:p-8 border-b border-slate-50 flex flex-col gap-6 bg-slate-50/30">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm">
              <FileText className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-widest leading-none">Gestão de Vendas</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">SLA Contabilizado a partir do lançamento</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-red-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Cliente ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 transition-all font-bold text-slate-700 text-xs shadow-sm"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 appearance-none text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer shadow-sm"
              >
                <option value="all">TODOS OS STATUS</option>
                {Object.values(OrderStatus).map(status => (
                  <option key={status} value={status}>{status.toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 w-4 h-4 pointer-events-none" />
            </div>

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
              <select 
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="w-full pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-100 appearance-none text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer shadow-sm"
              >
                <option value="all">TODAS VENDEDORAS</option>
                {sellers.map(seller => (
                  <option key={seller.id} value={seller.id}>{seller.name.toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 w-4 h-4 pointer-events-none" />
            </div>

            {(searchTerm || statusFilter !== 'all' || sellerFilter !== 'all') && (
              <button 
                onClick={resetFilters}
                className="px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-3 h-3" /> Limpar Filtros
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-6 py-6 w-16">#</th>
                <th className="px-8 py-6">Parceiro</th>
                <th className="px-8 py-6">Atendente</th>
                <th className="px-8 py-6">Valor Total</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Tempo Atend.</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => {
                  const status = statusMap[order.status] || statusMap[OrderStatus.GENERATED];
                  const totalItems = calculateTotalItems(order.items);
                  
                  // SLA: Começa do receivedAt (lançamento do vendedor)
                  const atendimento = formatDuration(order.receivedAt, order.invoicedAt);
                  const slaColor = getSLAColor(order.receivedAt, order.invoicedAt);
                  
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-6 py-6">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter italic">
                          {order.id.slice(-4)}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-xs uppercase truncate max-w-[200px]">{order.clientName}</span>
                          <span className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                            <Package className="w-2.5 h-2.5" />
                            {totalItems} itens
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="relative inline-block w-full max-w-[180px]">
                          <UserCheck className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${order.sellerId ? 'text-emerald-500' : 'text-slate-300'}`} />
                          <select 
                            value={order.sellerId || ''}
                            onChange={(e) => updateSeller(order.id, e.target.value)}
                            className={`w-full pl-9 pr-8 py-2 bg-white border rounded-xl text-[10px] font-bold uppercase tracking-widest outline-none focus:border-red-200 appearance-none cursor-pointer ${
                              order.sellerId ? 'border-emerald-200 text-emerald-700 bg-emerald-50/30' : 'border-slate-200 text-slate-600'
                            }`}
                          >
                            <option value="">Não Atribuído</option>
                            {sellers.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rotate-90 text-slate-200 pointer-events-none" />
                        </div>
                      </td>
                      <td className="px-8 py-6 font-black text-slate-900 text-sm tracking-tighter">
                        R$ {order.total.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${status.color}`}>
                          <status.icon className="w-3.5 h-3.5" />
                          {status.label}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <div className={`flex items-center gap-1.5 font-black text-xs ${slaColor}`}>
                             <Timer className="w-3 h-3" />
                             {atendimento}
                           </div>
                           <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">
                             {order.receivedAt ? 'Iniciado' : 'Pendente'}
                           </p>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-600 hover:border-red-100 transition-all"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-32 text-center text-slate-400 font-bold uppercase text-xs">Nenhum pedido encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">Dossiê do Pedido #{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-3 text-slate-300 hover:text-red-600 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-slate-100/50 rounded-3xl border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gerado pelo Cliente</p>
                  <p className="text-xs font-black text-slate-800 uppercase">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                </div>
                <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Lançado (Mestre Vendedor)</p>
                  <p className="text-xs font-black text-amber-800 uppercase">{selectedOrder.receivedAt ? new Date(selectedOrder.receivedAt).toLocaleString() : 'Pendente'}</p>
                </div>
                <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Finalizado/Faturado</p>
                  <p className="text-xs font-black text-emerald-800 uppercase">{selectedOrder.invoicedAt ? new Date(selectedOrder.invoicedAt).toLocaleString() : 'Em aberto'}</p>
                </div>
              </div>

              {selectedOrder.status === OrderStatus.CANCELLED && selectedOrder.cancelReason && (
                <div className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-start gap-4">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Justificativa de Cancelamento</p>
                    <p className="text-sm font-bold text-red-900 mt-1">{selectedOrder.cancelReason}</p>
                  </div>
                </div>
              )}

              <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b">
                    <tr>
                      <th className="px-6 py-5">Produto Selecionado</th>
                      <th className="px-6 py-5 text-center">Volume (Qtd)</th>
                      <th className="px-6 py-5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/30">
                          <td className="px-6 py-5">
                            <p className="text-xs font-black text-slate-800 uppercase">{item.description}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Preço Unitário: R$ {item.unitPrice.toFixed(2).replace('.', ',')}</p>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="inline-flex items-center justify-center bg-slate-100 px-3 py-1 rounded-lg text-xs font-black text-slate-900 border border-slate-200 min-w-[40px]">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right text-xs font-black text-slate-900">R$ {item.subtotal.toFixed(2).replace('.', ',')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-10 text-center text-slate-300 font-black uppercase text-[10px]">Nenhum item encontrado</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end p-2">
                 <div className="bg-slate-900 rounded-2xl px-6 py-4 text-white flex items-center gap-10 shadow-xl">
                    <div>
                       <p className="text-[8px] font-black uppercase tracking-widest text-red-500 mb-1">Faturamento Bruto</p>
                       <p className="text-xl font-black tracking-tighter">R$ {selectedOrder.total.toFixed(2).replace('.', ',')}</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList;
