import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions, addTransaction, deleteTransaction, updateTransaction, deleteAllTransactions } from '../services/db';
import { 
  Transaction, 
  EXPENSE_CATEGORIES, 
  INCOME_CATEGORIES, 
  TransactionType, 
  RecurrenceFrequency,
  PAYMENT_METHODS_LIST,
  PaymentMethod
} from '../types';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowLeft,
  Trash
} from 'lucide-react';

const Expenses: React.FC = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('');
  
  // Single Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null}>({
    isOpen: false,
    id: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Delete Modal State
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Date Navigation State
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Recurrence Mode State
  const [recurrenceType, setRecurrenceType] = useState<'indefinite' | 'fixed'>('indefinite');

  // Form State
  const initialFormState = {
    description: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: EXPENSE_CATEGORIES[0],
    dueDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'credit_card' as PaymentMethod,
    status: 'pending',
    isRecurring: false,
    recurrenceFrequency: 'monthly' as RecurrenceFrequency,
    recurrenceCount: '' as string | number, // Empty for indefinite, number for fixed
    observation: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) fetchTransactions();
  }, [currentUser]);

  const fetchTransactions = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getTransactions(currentUser.uid);
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const handleOpenNewModal = () => {
    resetForm();
    // Set default date to the currently viewed month
    const today = new Date();
    // If selected month is different from today's month, set to 1st of selected month, otherwise today
    let defaultDateStr = '';
    
    if (selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear()) {
       defaultDateStr = today.toISOString().split('T')[0];
    } else {
       // Set to the 1st day of the selected view
       const viewDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
       // Handle timezone offset for correct ISO string
       const offset = viewDate.getTimezoneOffset();
       const d = new Date(viewDate.getTime() - (offset * 60 * 1000));
       defaultDateStr = d.toISOString().split('T')[0];
    }

    setFormData(prev => ({ ...prev, dueDate: defaultDateStr }));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);

    try {
      const formattedAmount = formData.amount.toString().replace(',', '.');
      const amountValue = parseFloat(formattedAmount);

      if (isNaN(amountValue) || amountValue <= 0) {
        alert("Por favor, insira um valor válido (ex: 10,50).");
        setIsSubmitting(false);
        return;
      }

      // Logic to handle defaults when fields are hidden (Income)
      const isIncome = formData.type === 'income';

      // Build object conditionally to avoid 'undefined' values which Firebase rejects
      const transactionData: Record<string, any> = {
        userId: currentUser.uid,
        description: formData.description,
        amount: amountValue,
        type: formData.type,
        category: formData.category,
        dueDate: formData.dueDate,
        // If Income, force status to 'paid' (Received)
        status: isIncome ? 'paid' : formData.status,
        isRecurring: formData.isRecurring,
        observation: isIncome ? '' : formData.observation,
        createdAt: Date.now()
      };

      // Only add paymentMethod for expenses
      if (!isIncome) {
        transactionData.paymentMethod = formData.paymentMethod;
      }

      // Only add recurrence data if recurring is checked
      if (formData.isRecurring) {
        const recurrence: Record<string, any> = {
          frequency: formData.recurrenceFrequency
        };
        // Only add count if it has a value (fixed recurrence)
        if (recurrenceType === 'fixed' && formData.recurrenceCount) {
          recurrence.count = Number(formData.recurrenceCount);
        }
        transactionData.recurrence = recurrence;
      }

      const payload = transactionData as Omit<Transaction, 'id'>;

      if (editingId) {
        await updateTransaction(editingId, payload);
      } else {
        await addTransaction(payload);
      }

      setIsModalOpen(false);
      resetForm();
      fetchTransactions();
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao salvar transação: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Opens the modal instead of window.confirm
  const handleOpenDeleteModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setDeleteModal({ isOpen: true, id });
  };

  // Executes the actual deletion
  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    
    setIsDeleting(true);
    try {
      await deleteTransaction(deleteModal.id);
      fetchTransactions();
      setDeleteModal({ isOpen: false, id: null });
    } catch (error) {
      alert("Erro ao excluir lançamento.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Bulk Delete
  const handleBulkDelete = async () => {
    if (!currentUser) return;
    setIsBulkDeleting(true);
    try {
      await deleteAllTransactions(currentUser.uid);
      fetchTransactions();
      setBulkDeleteModalOpen(false);
    } catch (error) {
      alert("Erro ao apagar todos os registros.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    const isFixed = t.recurrence?.count && t.recurrence.count > 0;
    setRecurrenceType(isFixed ? 'fixed' : 'indefinite');

    setFormData({
      description: t.description,
      amount: t.amount.toString().replace('.', ','),
      type: t.type,
      category: t.category,
      dueDate: t.dueDate,
      paymentMethod: t.paymentMethod || 'credit_card',
      status: t.status as any,
      isRecurring: t.isRecurring,
      recurrenceFrequency: t.recurrence?.frequency || 'monthly',
      recurrenceCount: t.recurrence?.count || '',
      observation: t.observation || ''
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (t: Transaction) => {
    try {
      const newStatus = t.status === 'paid' ? 'pending' : 'paid';
      await updateTransaction(t.id, { status: newStatus });
      fetchTransactions();
    } catch (error) {
      console.error("Failed to toggle status", error);
      alert("Erro ao atualizar status");
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setRecurrenceType('indefinite');
    setEditingId(null);
  };

  // Filter Logic
  const filteredTransactions = transactions.filter(t => {
    const [tYear, tMonth] = t.dueDate.split('-').map(Number);
    const isSameMonth = tYear === selectedDate.getFullYear() && (tMonth - 1) === selectedDate.getMonth();

    if (!isSameMonth) return false;

    return t.description.toLowerCase().includes(filter.toLowerCase()) ||
           t.category.toLowerCase().includes(filter.toLowerCase());
  });

  const monthlyIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyBalance = monthlyIncome - monthlyExpense;
  const monthName = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-20">
      
      {/* Month Navigation Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-4">
           <button 
             onClick={handlePrevMonth}
             className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
           >
             <ChevronLeft size={24} />
           </button>
           
           <div className="flex flex-col items-center">
             <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm font-medium uppercase tracking-wide">
                <Calendar size={12} />
                Mês de Referência
             </div>
             <h2 className="text-lg sm:text-xl font-bold text-slate-800 capitalize">{monthName}</h2>
           </div>

           <button 
             onClick={handleNextMonth}
             className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
           >
             <ChevronRight size={24} />
           </button>
        </div>

        {/* Mini Summary */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 border-t border-slate-50">
           <div className="text-center">
             <span className="text-[10px] sm:text-xs text-slate-400 block mb-1">Receitas</span>
             <span className="text-xs sm:text-base font-bold text-emerald-600 break-words">+ R$ {monthlyIncome.toFixed(2)}</span>
           </div>
           <div className="text-center border-l border-r border-slate-50">
             <span className="text-[10px] sm:text-xs text-slate-400 block mb-1">Despesas</span>
             <span className="text-xs sm:text-base font-bold text-red-600 break-words">- R$ {monthlyExpense.toFixed(2)}</span>
           </div>
           <div className="text-center">
             <span className="text-[10px] sm:text-xs text-slate-400 block mb-1">Saldo</span>
             <span className={`text-xs sm:text-base font-bold break-words ${monthlyBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
               R$ {monthlyBalance.toFixed(2)}
             </span>
           </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Search & Actions */}
        <div className="flex w-full sm:max-w-md gap-2">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400 transition-all shadow-sm text-sm"
            />
          </div>
          
          <button
            onClick={() => setBulkDeleteModalOpen(true)}
            className="px-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors flex items-center justify-center border border-red-200"
            title="Apagar TODOS os lançamentos"
          >
            <Trash size={18} />
          </button>
        </div>

        <button 
          onClick={handleOpenNewModal}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-5 py-3 sm:py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm w-full sm:w-auto justify-center font-medium touch-manipulation"
        >
          <Plus size={20} /> Novo Lançamento
        </button>
      </div>

      {/* List / Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Calendar size={48} className="text-slate-200" />
            <p>Nenhum lançamento neste mês.</p>
          </div>
        ) : (
          <>
            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dia</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((t) => {
                    const isIncome = t.type === 'income';
                    return (
                      <tr key={t.id} className={`group hover:bg-slate-50 transition-all border-b border-slate-100 last:border-none ${isIncome ? 'hover:shadow-[inset_4px_0_0_0_#10b981]' : 'hover:shadow-[inset_4px_0_0_0_#ef4444]'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                              {isIncome ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                {t.isRecurring && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded border border-indigo-200 flex items-center gap-1" title="Recorrente"><RefreshCw size={8} /> R</span>}
                                <span className="font-semibold text-slate-700">{t.description}</span>
                              </div>
                              {t.observation && <span className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{t.observation}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {t.dueDate.split('-')[2]}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200">{t.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-base font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isIncome ? '+ ' : '- '} R$ {t.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                              t.status === 'paid' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            }`}>
                              {t.status === 'paid' ? (isIncome ? 'Recebido' : 'Pago') : 'Pendente'}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleStatus(t); }}
                              className={`p-1.5 rounded-full transition-colors ${
                                t.status === 'paid' 
                                ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' 
                                : 'text-emerald-500 hover:bg-emerald-50'
                              }`}
                              title="Alterar Status"
                            >
                              {t.status === 'paid' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(t)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={(e) => handleOpenDeleteModal(t.id, e)} 
                              className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" 
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredTransactions.map((t) => {
                const isIncome = t.type === 'income';
                return (
                  <div 
                    key={t.id} 
                    onClick={() => handleEdit(t)}
                    className="p-4 active:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                              {isIncome ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                          </div>
                          <div>
                             <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 text-sm line-clamp-1">{t.description}</span>
                                {t.isRecurring && <RefreshCw size={10} className="text-indigo-500" />}
                             </div>
                             <span className="text-xs text-slate-500">{t.category}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className={`block font-bold text-base ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                             {isIncome ? '+' : '-'} {t.amount.toFixed(2)}
                          </span>
                       </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3 pl-[3.25rem]">
                       <div className="text-xs text-slate-400">
                          Venc. {new Date(t.dueDate).toLocaleDateString()}
                       </div>
                       
                       <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(t); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                              t.status === 'paid' 
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : 'bg-white text-slate-500 border-slate-200'
                            }`}
                          >
                             {t.status === 'paid' ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300"></div>}
                             {t.status === 'paid' ? (isIncome ? 'Recebido' : 'Pago') : 'Pendente'}
                          </button>

                          <button 
                              onClick={(e) => handleOpenDeleteModal(t.id, e)} 
                              className="p-1.5 text-slate-300 hover:text-red-500 transition-colors" 
                          >
                              <Trash2 size={18} />
                          </button>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Deletion Modal (Single Item) */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform scale-100 transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir Lançamento?</h3>
              <p className="text-slate-500 text-sm mb-6">
                Tem certeza que deseja remover este item? Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteModal({isOpen: false, id: null})}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium active:bg-slate-50 transition-colors touch-manipulation"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium active:bg-red-700 transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal (Delete ALL) */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform scale-100 transition-all border-2 border-red-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 animate-pulse">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-red-600 mb-2">Apagar TUDO?</h3>
              <p className="text-slate-600 text-sm mb-2 font-medium">
                Você está prestes a excluir <span className="underline decoration-red-400 decoration-2">TODAS</span> as suas receitas e despesas.
              </p>
              <p className="text-slate-500 text-xs mb-6">
                Essa ação é irreversível e limpará completamente o seu histórico.
              </p>
              
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="w-full px-4 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 active:bg-red-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                >
                  {isBulkDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Sim, Apagar Tudo'}
                </button>
                <button 
                  onClick={() => setBulkDeleteModalOpen(false)}
                  className="w-full px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-white md:bg-black/50 z-50 flex items-center justify-center md:p-4">
          <div className="bg-white w-full h-full md:h-auto md:rounded-2xl md:shadow-xl md:max-w-lg md:max-h-[90vh] overflow-y-auto flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10 shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsModalOpen(false)} className="md:hidden text-slate-500 p-1">
                   <ArrowLeft size={24} />
                </button>
                <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hidden md:block text-slate-400 hover:text-slate-600">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5 flex-1 overflow-y-auto">
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="type" 
                    className="hidden peer"
                    checked={formData.type === 'expense'} 
                    onChange={() => setFormData({...formData, type: 'expense', category: EXPENSE_CATEGORIES[0]})} 
                  />
                  <div className="border-2 border-slate-100 rounded-xl p-3 text-center peer-checked:bg-red-50 peer-checked:border-red-200 peer-checked:text-red-700 transition-all font-medium text-slate-600 hover:border-slate-200 group-hover:bg-slate-50 flex flex-col items-center gap-2">
                    <TrendingDown size={24} />
                    <span>Despesa</span>
                  </div>
                </label>
                <label className="flex-1 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="type" 
                    className="hidden peer"
                    checked={formData.type === 'income'} 
                    onChange={() => setFormData({...formData, type: 'income', category: INCOME_CATEGORIES[0]})} 
                  />
                  <div className="border-2 border-slate-100 rounded-xl p-3 text-center peer-checked:bg-emerald-50 peer-checked:border-emerald-200 peer-checked:text-emerald-700 transition-all font-medium text-slate-600 hover:border-slate-200 group-hover:bg-slate-50 flex flex-col items-center gap-2">
                    <TrendingUp size={24} />
                    <span>Receita</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição</label>
                <input
                  required
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400 transition-all shadow-sm hover:border-emerald-300"
                  placeholder="Ex: Aluguel, Supermercado"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Valor (R$)</label>
                  <input
                    required
                    type="text"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400 transition-all shadow-sm hover:border-emerald-300"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Vencimento</label>
                  <input
                    required
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400 transition-all shadow-sm hover:border-emerald-300"
                  />
                </div>
              </div>

              <div className={formData.type === 'expense' ? "grid grid-cols-2 gap-4" : "space-y-4"}>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Categoria</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm hover:border-emerald-300 cursor-pointer appearance-none"
                    >
                      {(formData.type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                </div>
                {formData.type === 'expense' && (
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pagamento</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={e => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}
                      className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm hover:border-emerald-300 cursor-pointer appearance-none"
                    >
                      {PAYMENT_METHODS_LIST.map(method => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                </div>
                )}
              </div>

              {formData.type === 'expense' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Observação <span className="text-slate-400 font-normal text-xs">(Opcional)</span></label>
                <textarea
                  rows={2}
                  value={formData.observation}
                  onChange={e => setFormData({...formData, observation: e.target.value})}
                  className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-slate-400 transition-all shadow-sm resize-none hover:border-emerald-300"
                  placeholder="Detalhes adicionais..."
                />
              </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.isRecurring}
                  onChange={e => setFormData({...formData, isRecurring: e.target.checked})}
                  className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-slate-700 cursor-pointer select-none">Repetir conta (Recorrência)</label>
              </div>

              {formData.isRecurring && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <label className={`cursor-pointer border rounded-lg p-2 text-center transition-all ${recurrenceType === 'indefinite' ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-white'}`}>
                      <input type="radio" className="hidden" name="recType" checked={recurrenceType === 'indefinite'} onChange={() => setRecurrenceType('indefinite')} />
                      Fixo / Assinatura
                    </label>
                    <label className={`cursor-pointer border rounded-lg p-2 text-center transition-all ${recurrenceType === 'fixed' ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-white'}`}>
                      <input type="radio" className="hidden" name="recType" checked={recurrenceType === 'fixed'} onChange={() => setRecurrenceType('fixed')} />
                      Parcelado (Vezes)
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Frequência</label>
                        <select
                          value={formData.recurrenceFrequency}
                          onChange={e => setFormData({...formData, recurrenceFrequency: e.target.value as any})}
                          className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="monthly">Mensal</option>
                          <option value="weekly">Semanal</option>
                          <option value="yearly">Anual</option>
                        </select>
                     </div>
                     
                     {recurrenceType === 'fixed' && (
                       <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Qtd. Parcelas</label>
                          <input 
                            type="number"
                            min="2"
                            max="60"
                            value={formData.recurrenceCount}
                            onChange={(e) => setFormData({...formData, recurrenceCount: e.target.value})}
                            className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Ex: 12"
                          />
                       </div>
                     )}
                  </div>
                </div>
              )}

              {formData.type === 'expense' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status Inicial</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm hover:border-emerald-300 cursor-pointer appearance-none"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago (Apenas 1ª parcela se parcelado)</option>
                </select>
              </div>
              )}
              
              <div className="pt-4 pb- safe-area-pb">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-4 md:py-3.5 rounded-xl shadow-lg shadow-emerald-900/10 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} /> Salvando...
                      </>
                    ) : (
                      editingId ? 'Salvar Alterações' : 'Cadastrar Lançamento'
                    )}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;