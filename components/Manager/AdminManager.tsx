
import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { ShieldCheck, Plus, Trash2, Mail, UserPlus, X, Key, Power } from 'lucide-react';

interface AdminManagerProps {
  managers: User[];
  setManagers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
}

const AdminManager: React.FC<AdminManagerProps> = ({ managers, setManagers, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      email: formData.email,
      role: UserRole.MANAGER,
      active: true,
      createdAt: new Date().toISOString()
    };
    setManagers(prev => [...prev, newUser]);
    setFormData({ name: '', email: '', password: '' });
    setShowModal(false);
  };

  const deleteManager = (id: string) => {
    if (id === currentUser.id) {
      alert("Você não pode excluir sua própria conta.");
      return;
    }
    if (window.confirm("Deseja realmente remover este acesso administrativo?")) {
      setManagers(prev => prev.filter(m => m.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    if (id === currentUser.id) return;
    setManagers(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Equipe de Gerenciamento</h3>
          <p className="text-sm text-slate-500">Gerencie quem tem acesso administrativo ao painel do Atacadão.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" /> Novo Gerente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 text-sm font-semibold border-b">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">E-mail</th>
              <th className="px-6 py-4">Criado em</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {managers.map(manager => (
              <tr key={manager.id} className={`hover:bg-slate-50 transition-colors ${manager.id === currentUser.id ? 'bg-blue-50/30' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                      {manager.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">{manager.name}</span>
                      {manager.id === currentUser.id && (
                        <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded uppercase">Você</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail className="w-4 h-4" />
                    {manager.email}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {new Date(manager.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    disabled={manager.id === currentUser.id}
                    onClick={() => toggleStatus(manager.id)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                      manager.active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                    } ${manager.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  >
                    <Power className="w-3 h-3 mr-1" />
                    {manager.active ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    disabled={manager.id === currentUser.id}
                    onClick={() => deleteManager(manager.id)}
                    className={`p-2 rounded-lg transition-all ${
                      manager.id === currentUser.id 
                      ? 'text-slate-200' 
                      : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-blue-600 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <UserPlus className="w-6 h-6" /> Novo Administrador
              </h3>
              <button onClick={() => setShowModal(false)} className="hover:bg-blue-500 p-1 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-black text-black mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-black"
                  placeholder="Ex: João da Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-black text-black mb-1">E-mail de Acesso</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-black"
                  placeholder="gerente@atcadao.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-black text-black mb-1">Senha Inicial</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black text-black"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-2 italic">* O usuário poderá alterar a senha no primeiro acesso.</p>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-black font-black rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95"
                >
                  Criar Conta
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
