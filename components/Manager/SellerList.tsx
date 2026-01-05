
import React, { useState } from 'react';
import { Seller, UserRole } from '../../types';
import { Contact, Plus, Trash2, X, Phone, User, Loader2, MessageCircle, AlertTriangle, Mail, Key, ArrowRight, Edit2, Check } from 'lucide-react';
import { db, firebaseConfig } from '../../firebaseConfig';
import { collection, addDoc, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

interface SellerListProps {
  sellers: Seller[];
  setSellers: React.Dispatch<React.SetStateAction<Seller[]>>;
}

const SellerList: React.FC<SellerListProps> = ({ sellers, setSellers }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });

  const handleOpenEdit = (seller: Seller) => {
    setEditingSeller(seller);
    setFormData({
      name: seller.name,
      email: seller.email,
      password: '', // Senha não é recuperável
      phone: seller.phone
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '' });
    setShowModal(false);
    setEditingSeller(null);
  };

  const handleSaveSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert("WhatsApp inválido.");
      return;
    }
    
    setLoading(true);

    try {
      if (editingSeller) {
        // Modo Edição (Apenas Nome e Telefone no Firestore)
        await updateDoc(doc(db, 'users', editingSeller.id), {
          name: formData.name.trim(),
          phone: cleanPhone
        });
        resetForm();
      } else {
        // Modo Cadastro Novo
        if (formData.password.length < 6) {
          alert("Senha muito curta.");
          setLoading(false);
          return;
        }

        const secondaryApp = initializeApp(firebaseConfig, "SellerCreationApp");
        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
        const uid = userCredential.user.uid;
        
        const sellerData = { 
          id: uid,
          name: formData.name.trim(), 
          email: formData.email.trim(),
          role: UserRole.SELLER,
          phone: cleanPhone, 
          active: true, 
          createdAt: new Date().toISOString() 
        };

        await setDoc(doc(db, 'users', uid), sellerData);
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);
        
        resetForm();
      }
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao salvar acesso da vendedora.`);
      if (!editingSeller) {
        try { 
          // @ts-ignore
          await deleteApp(getApp("SellerCreationApp")); 
        } catch(e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteSeller = async (id: string) => {
    if (window.confirm("Deseja remover o acesso desta vendedora permanentemente?")) {
      try { await deleteDoc(doc(db, 'users', id)); } catch (error) { console.error(error); }
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    try { await updateDoc(doc(db, 'users', id), { active: !current }); } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
            <Contact className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Equipe de Vendas</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de canais de faturamento</p>
          </div>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Credenciar Vendedora
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sellers && sellers.length > 0 ? (
          sellers.map(seller => (
            <div key={seller.id} className="bg-white border border-slate-200 rounded-[30px] p-6 hover:border-emerald-200 transition-all group flex flex-col shadow-sm relative overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleStatus(seller.id, seller.active)}
                    className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase border transition-all ${
                      seller.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100 opacity-50'
                    }`}
                  >
                    {seller.active ? 'Ativa' : 'Inativa'}
                  </button>
                </div>
              </div>
              
              <h4 className="font-bold text-slate-900 text-base uppercase truncate leading-tight mb-2">{seller.name}</h4>
              <p className="text-[10px] text-slate-400 font-medium mb-4 italic truncate">{seller.email}</p>
              
              <div className="flex items-center gap-3 text-emerald-600 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100 mb-6">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs tracking-widest">+{seller.phone}</span>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                 <button 
                  onClick={() => handleOpenEdit(seller)}
                  className="p-2 text-slate-400 hover:text-blue-600 transition-all flex items-center gap-2"
                 >
                   <Edit2 className="w-4 h-4" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Editar</span>
                 </button>
                 <button 
                  onClick={() => deleteSeller(seller.id)} 
                  className="p-2 text-slate-200 hover:text-red-500 transition-all"
                  title="Excluir Permanentemente"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[30px] flex flex-col items-center justify-center bg-slate-50/50">
            <AlertTriangle className="w-10 h-10 text-slate-200 mb-4" />
            <p className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Sem vendedoras cadastradas</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/10">
          <div className="absolute inset-0" onClick={() => !loading && resetForm()} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                {editingSeller ? 'Atualizar Vendedora' : 'Credenciar Vendedora'}
              </h3>
              <button onClick={() => !loading && resetForm()} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveSeller} className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input type="text" required autoFocus disabled={loading} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" placeholder="Ex: Maria Souza" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>

              {!editingSeller && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                      <input type="email" required disabled={loading} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" placeholder="maria@atacadao.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha Temporária</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                      <input type="password" required disabled={loading} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" placeholder="Mínimo 6 caracteres" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Contato</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                  <input type="text" required disabled={loading} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" placeholder="11999999999" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              {editingSeller && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-[9px] text-blue-600 font-bold uppercase leading-relaxed tracking-wider">
                    E-mail e senha não podem ser alterados pelo portal por questões de segurança.
                  </p>
                </div>
              )}

              <div className="pt-6 flex gap-3">
                <button type="button" disabled={loading} onClick={() => resetForm()} className="flex-1 py-2.5 bg-slate-100 text-slate-500 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-md flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                    <>
                      {editingSeller ? 'Salvar Alterações' : 'Cadastrar Vendedora'}
                      <Check className="w-4 h-4" />
                    </>
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

export default SellerList;
