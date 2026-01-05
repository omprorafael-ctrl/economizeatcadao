
import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { ShieldCheck, Plus, Trash2, Mail, UserPlus, X, Key, Power, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
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
    // Inicializa app secundário para criar usuário sem deslogar o gerente atual
    const secondaryApp = initializeApp(firebaseConfig, "AdminCreationApp");
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        formData.email, 
        formData.password
      );
      
      const uid = userCredential.user.uid;
      const newAdmin: User = {
        id: uid,
        name: formData.name,
        email: formData.email,
        role: UserRole.MANAGER,
        active: true,
        createdAt: new Date().toISOString()
      };

      // Salva no Firestore
      await setDoc(doc(db, 'users', uid), newAdmin);
      
      // Limpa app secundário
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      setFormData({ name: '', email: '', password: '' });
      setShowModal(false);
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao criar administrador: ${error.message}`);
      try { await deleteApp(secondaryApp); } catch(e) {}
    } finally {
      setLoading(false);
    }
  };

  const deleteManager = async (id: string) => {
    if (id === currentUser.id) return;
    if (window.confirm("Deseja revogar o acesso deste administrador permanentemente?")) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        console.error("Erro ao excluir:", error);
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (id === currentUser.id) return;
    try {
      await updateDoc(doc(db, 'users', id), { active: !currentStatus });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white/5 p-10 rounded-[45px] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8 backdrop-blur-2xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-500/20">
            <ShieldCheck className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-tight">Comitê Gestor</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Apenas gerentes podem visualizar e gerenciar este módulo</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-red-600 hover:bg-red-500 text-white px-10 py-5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl shadow-red-900/40 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" /> Adicionar Administrador
        </button>
      </div>

      <div className="bg-white/5 rounded-[45px] border border-white/5 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-black/40 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] border-b border-white/5">
            <tr>
              <th className="px-10 py-6">Identidade do Gestor</th>
              <th className="px-10 py-6">Credencial de Login</th>
              <th className="px-10 py-6">Data de Cadastro</th>
              <th className="px-10 py-6 text-center">Status Operacional</th>
              <th className="px-10 py-6 text-right">Controle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {managers.map(manager => (
              <tr key={manager.id} className={`hover:bg-white/5 transition-all group ${manager.id === currentUser.id ? 'bg-red-600/5' : ''}`}>
                <td className="px-10 py-8">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-xl ${manager.id === currentUser.id ? 'bg-red-600' : 'bg-white/5 border border-white/10'}`}>
                      {manager.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-black text-white text-sm uppercase tracking-wide flex items-center gap-2">
                        {manager.name}
                        {manager.id === currentUser.id && (
                          <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded uppercase italic tracking-widest shadow-lg shadow-red-900/20">MEU PERFIL</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <div className="flex items-center gap-3 text-slate-400 text-sm font-bold">
                    <Mail className="w-4 h-4 text-red-500 opacity-50" />
                    {manager.email}
                  </div>
                </td>
                <td className="px-10 py-8 text-xs font-bold text-slate-500">
                  {new Date(manager.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-10 py-8 text-center">
                  <button 
                    disabled={manager.id === currentUser.id}
                    onClick={() => toggleStatus(manager.id, manager.active)}
                    className={`inline-flex items-center px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                      manager.active 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    } ${manager.id === currentUser.id ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                  >
                    <Power className="w-3.5 h-3.5 mr-2" />
                    {manager.active ? 'Ativo' : 'Bloqueado'}
                  </button>
                </td>
                <td className="px-10 py-8 text-right">
                  <button 
                    disabled={manager.id === currentUser.id}
                    onClick={() => deleteManager(manager.id)}
                    className={`p-3 rounded-xl transition-all ${
                      manager.id === currentUser.id 
                      ? 'text-slate-800' 
                      : 'text-slate-600 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/30'
                    }`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-black/90" onClick={() => !loading && setShowModal(false)} />
          <div className="relative bg-[#0a0a0a] w-full max-w-md rounded-[50px] shadow-[0_0_100px_rgba(220,38,38,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 border border-white/5">
            <div className="p-10 border-b border-white/5 bg-gradient-to-r from-red-600 to-red-800 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black italic flex items-center gap-3 uppercase tracking-tighter">
                  <UserPlus className="w-8 h-8" /> Novo Gestor
                </h3>
                <button onClick={() => !loading && setShowModal(false)} className="p-3 bg-black/20 hover:bg-black/40 rounded-xl transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreate} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Nome Completo</label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-3xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white/10 focus:border-red-500/40 transition-all font-bold text-white text-sm"
                  placeholder="Nome do administrador"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">E-mail Corporativo</label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-3xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white/10 focus:border-red-500/40 transition-all font-bold text-white text-sm"
                  placeholder="acesso@atcadao.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Senha de Controle</label>
                <div className="relative">
                  <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                  <input
                    type="password"
                    required
                    disabled={loading}
                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white/10 focus:border-red-500/40 transition-all font-bold text-white text-sm"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-5 border border-white/5 bg-white/5 text-slate-500 font-black rounded-3xl hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-8 py-5 bg-red-600 text-white font-black rounded-3xl hover:bg-red-500 shadow-2xl shadow-red-900/40 transition-all active:scale-95 text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar Acesso'}
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
