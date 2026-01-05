
import React, { useState } from 'react';
import { Seller } from '../../types';
import { 
  Contact, 
  Plus, 
  Trash2, 
  X, 
  Phone, 
  User, 
  CheckCircle2, 
  Loader2,
  Power,
  MessageCircle,
  AlertTriangle
} from 'lucide-react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface SellerListProps {
  sellers: Seller[];
  setSellers: React.Dispatch<React.SetStateAction<Seller[]>>;
}

const SellerList: React.FC<SellerListProps> = ({ sellers, setSellers }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica de telefone
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert("Por favor, insira um WhatsApp válido com DDD.");
      return;
    }

    setLoading(true);

    try {
      console.log("Iniciando gravação do vendedor no Firestore...");
      
      const sellerData = {
        name: formData.name.trim(),
        phone: cleanPhone,
        active: true,
        createdAt: new Date().toISOString()
      };

      // Gravação direta no Firestore
      const docRef = await addDoc(collection(db, 'sellers'), sellerData);
      
      console.log("Vendedor gravado com sucesso! ID:", docRef.id);
      
      // Feedback e limpeza
      setFormData({ name: '', phone: '' });
      setShowModal(false);
      alert("Vendedora cadastrada com sucesso!");
      
    } catch (error: any) {
      console.error("Erro fatal ao salvar vendedor:", error);
      alert(`Erro ao salvar: ${error.message || "Verifique sua conexão ou permissões do banco."}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteSeller = async (id: string) => {
    if (window.confirm("Deseja realmente remover esta vendedora? Isso impedirá que novos clientes enviem pedidos para ela.")) {
      try {
        await deleteDoc(doc(db, 'sellers', id));
      } catch (error) {
        console.error("Erro ao deletar:", error);
        alert("Não foi possível excluir o registro.");
      }
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'sellers', id), { active: !current });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white/5 p-10 rounded-[45px] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8 backdrop-blur-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-3xl rounded-full -mr-32 -mt-32" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-[0_0_20px_rgba(220,38,38,0.1)]">
            <Contact className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight">Canal de Vendas</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão de Vendedoras e Integração WhatsApp</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-red-600 hover:bg-red-500 text-white px-10 py-5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl shadow-red-900/40 transition-all active:scale-95 relative z-10"
        >
          <Plus className="w-5 h-5" /> Nova Vendedora
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellers.length > 0 ? (
          sellers.map(seller => (
            <div key={seller.id} className="bg-white/5 border border-white/5 rounded-[38px] p-8 hover:shadow-[0_20px_50px_rgba(220,38,38,0.1)] hover:border-red-500/30 transition-all group relative overflow-hidden flex flex-col">
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-red-500 border border-white/10 group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
                  <User className="w-7 h-7" />
                </div>
                <button 
                  onClick={() => toggleStatus(seller.id, seller.active)}
                  className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                    seller.active 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-500 border-red-500/20 opacity-50'
                  }`}
                >
                  {seller.active ? 'Em Operação' : 'Inativa'}
                </button>
              </div>
              
              <h4 className="font-black text-white text-xl mb-2 uppercase italic tracking-tight">{seller.name}</h4>
              
              <div className="flex items-center gap-3 text-emerald-500 font-bold mb-8 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                <MessageCircle className="w-5 h-5 fill-emerald-500/20" />
                <span className="text-sm tracking-widest">+{seller.phone}</span>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-all duration-300">
                 <button 
                  onClick={() => deleteSeller(seller.id)}
                  className="p-3 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-500/20"
                  title="Excluir Vendedora"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-[45px] flex flex-col items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-slate-700 mb-4" />
            <p className="font-black text-slate-500 uppercase tracking-widest text-xs">Nenhuma vendedora ativa no sistema</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-black/95" onClick={() => !loading && setShowModal(false)} />
          <div className="relative bg-[#0a0a0a] w-full max-w-md rounded-[50px] shadow-[0_0_100px_rgba(220,38,38,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 border border-white/5">
            <div className="p-10 border-b border-white/5 bg-gradient-to-r from-red-600 to-red-800 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black italic flex items-center gap-3 uppercase tracking-tighter">
                  <Contact className="w-8 h-8" /> Novo Acesso
                </h3>
                <button 
                  disabled={loading}
                  onClick={() => setShowModal(false)} 
                  className="p-3 bg-black/20 hover:bg-black/40 rounded-xl transition-all disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateSeller} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Nome Completo</label>
                <input
                  type="text"
                  required
                  autoFocus
                  className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-3xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white/10 focus:border-red-500/40 transition-all font-bold text-white text-sm"
                  placeholder="Nome da vendedora"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">WhatsApp (com DDD)</label>
                <div className="relative">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                  <input
                    type="text"
                    required
                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white/10 focus:border-red-500/40 transition-all font-bold text-white text-sm"
                    placeholder="11999999999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 mb-4">
                <p className="text-[9px] text-red-300/60 font-medium leading-relaxed uppercase tracking-widest text-center">
                  Os clientes poderão selecionar este contato para finalizar pedidos e suporte via chat.
                </p>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-5 border border-white/5 bg-white/5 text-slate-500 font-black rounded-3xl hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-8 py-5 bg-red-600 text-white font-black rounded-3xl hover:bg-red-500 shadow-2xl shadow-red-900/40 transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Gravando...
                    </>
                  ) : 'Ativar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerList;
