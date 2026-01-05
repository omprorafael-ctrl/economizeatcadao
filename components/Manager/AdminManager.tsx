
import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { ShieldCheck, Plus, Trash2, Mail, UserPlus, X, Key, Power, ArrowRight, Loader2 } from 'lucide-react';
import { db, firebaseConfig } from '../../firebaseConfig';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

interface AdminManagerProps {
  managers: User[];
  setManagers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
}

const AdminManager: React.FC<AdminManagerProps> = ({ managers, setManagers, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setLoading(true);
    const secondaryApp = initializeApp(firebaseConfig, "AdminCreationApp");
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      const uid = userCredential.user.uid;
      const newAdmin: User = { id: uid, name: formData.name, email: formData.email, role: UserRole.MANAGER, active: true, createdAt: new Date().toISOString() };
      await setDoc(doc(db, 'users', uid), newAdmin);
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      setFormData({ name: '', email: '', password: '' });
      setShowModal(false);
    } catch (error: any) {
      console.error(error);
      alert(`Erro: ${error.message}`);
      try { await deleteApp(secondaryApp); } catch(e) {}
    } finally {
      setLoading(false);
    }
  };

  const deleteManager = async (id: string) => {
    if (id === currentUser.id) return;
    if (window.confirm("Deseja revogar o acesso permanentemente?")) {
      try { await deleteDoc(doc(db, 'users', id)); } catch (error) { console.error(error); }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (id === currentUser.id) return;
    try { await updateDoc(doc(db, 'users', id), { active: !currentStatus }); } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
            <ShieldCheck className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Painel Administrativo</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de acessos internos</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-md transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" /> Adicionar Gestor
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
            <tr>
              <th className="px-8 py-4">Identidade</th>
              <th className="px-8 py-4">Credencial</th>
              <th className="px-8 py-4">Cadastro</th>
              <th className="px-8 py-4 text-center">Status</th>
              <th className="px-8 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {managers.map(manager => (
              <tr key={manager.id} className={`hover:bg-slate-50/50 transition-all ${manager.id === currentUser.id ? 'bg-red-50/20' : ''}`}>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${manager.id === currentUser.id ? 'bg-red-600 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}>
                      {manager.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-xs uppercase flex items-center gap-2">
                        {manager.name}
                        {manager.id === currentUser.id && <span className="text-[7px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded tracking-tighter">MEU PERFIL</span>}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-slate-500 text-xs font-medium italic">{manager.email}</td>
                <td className="px-8 py-5 text-[10px] font-bold text-slate-400">{new Date(manager.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-8 py-5 text-center">
                  <button 
                    disabled={manager.id === currentUser.id}
                    onClick={() => toggleStatus(manager.id, manager.active)}
                    className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-wider border transition-all ${
                      manager.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100 opacity-50'
                    } ${manager.id === currentUser.id ? 'cursor-not-allowed opacity-30' : 'hover:scale-105'}`}
                  >
                    {manager.active ? 'Ativo' : 'Bloqueado'}
                  </button>
                </td>
                <td className="px-8 py-5 text-right">
                  <button disabled={manager.id === currentUser.id} onClick={() => deleteManager(manager.id)} className={`p-2 transition-all ${manager.id === currentUser.id ? 'text-slate-100' : 'text-slate-300 hover:text-red-500'}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/10">
          <div className="absolute inset-0" onClick={() => !loading && setShowModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Criar Acesso Gestor</h3>
              <button onClick={() => !loading && setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input type="text" required disabled={loading} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" placeholder="Ex: Gestor Comercial" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                <input type="email" required disabled={loading} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" placeholder="gestao@atacadao.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                  <input type="password" required disabled={loading} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
              </div>
              <div className="pt-6 flex gap-3">
                <button type="button" disabled={loading} onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-500 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-md flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManager;
