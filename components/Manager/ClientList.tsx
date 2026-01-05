
import React, { useState } from 'react';
import { ClientData, UserRole } from '../../types';
import { 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  MoreHorizontal, 
  UserPlus, 
  X, 
  Building2, 
  Search,
  Loader2,
  Key,
  ShieldCheck,
  ChevronRight,
  // Added ArrowRight to fix the "Cannot find name 'ArrowRight'" error
  ArrowRight
} from 'lucide-react';
import { db, firebaseConfig } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

interface ClientListProps {
  clients: ClientData[];
  setClients: React.Dispatch<React.SetStateAction<ClientData[]>>;
}

const ClientList: React.FC<ClientListProps> = ({ clients }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    cpfCnpj: '',
    phone: '',
    address: ''
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    
    setLoading(true);
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        formData.email, 
        formData.password
      );
      
      const uid = userCredential.user.uid;
      const newClient: ClientData = {
        id: uid,
        name: formData.name,
        email: formData.email,
        role: UserRole.CLIENT,
        active: true,
        createdAt: new Date().toISOString(),
        cpfCnpj: formData.cpfCnpj,
        phone: formData.phone,
        address: formData.address
      };

      await setDoc(doc(db, 'users', uid), newClient);
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      setShowModal(false);
      setFormData({ name: '', email: '', password: '', cpfCnpj: '', phone: '', address: '' });
    } catch (error: any) {
      console.error(error);
      alert("Erro ao realizar cadastro.");
      try { await deleteApp(secondaryApp); } catch(e) {}
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cpfCnpj && c.cpfCnpj.includes(searchTerm))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-8 backdrop-blur-2xl">
        <div className="relative flex-1 max-w-2xl group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por Razão Social, CNPJ ou E-mail..."
            className="w-full pl-14 pr-6 py-5 bg-black/30 border border-white/5 rounded-[28px] outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-black/50 focus:border-red-500/40 transition-all font-bold text-white placeholder:text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-red-600 hover:bg-red-500 text-white px-10 py-5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-2xl shadow-red-900/40 transition-all active:scale-95 shrink-0"
        >
          <UserPlus className="w-5 h-5" /> Cadastrar Novo PDV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white/5 border border-white/5 rounded-[38px] p-8 hover:shadow-[0_20px_50px_rgba(220,38,38,0.1)] hover:border-red-500/30 transition-all group relative overflow-hidden flex flex-col h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -mr-16 -mt-16 group-hover:bg-red-600/10 transition-colors" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-8">
                <div className="bg-gradient-to-tr from-red-700 to-red-500 text-white w-16 h-16 rounded-[22px] flex items-center justify-center font-black text-2xl shadow-xl shadow-red-900/20 group-hover:scale-110 transition-transform">
                  {client.name.charAt(0)}
                </div>
                <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${client.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                  {client.active ? 'Autorizado' : 'Bloqueado'}
                </div>
              </div>
              
              <h4 className="font-black text-white text-xl mb-1 truncate italic tracking-tight">{client.name}</h4>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">{client.cpfCnpj || 'DOCUMENTO NÃO CADASTRADO'}</p>
              
              <div className="space-y-5 flex-1">
                <div className="flex items-center gap-4 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-red-500 border border-white/5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="truncate text-slate-300 font-bold">{client.email}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-red-500 border border-white/5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-slate-300 font-bold">{client.phone || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-4 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-red-500 border border-white/5 mt-0.5 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="line-clamp-2 leading-relaxed text-slate-300 font-bold">{client.address || 'Endereço pendente'}</span>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                <button className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em] hover:text-red-400 transition-colors flex items-center gap-2 group/btn">
                  Análise de Crédito <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <button className="p-3 bg-white/5 text-slate-500 hover:text-white rounded-xl border border-white/10"><MoreHorizontal className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#0a0a0a] w-full max-w-3xl rounded-[55px] shadow-[0_0_100px_rgba(220,38,38,0.2)] overflow-hidden animate-in zoom-in-95 duration-500 border border-white/5">
            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-red-600 to-red-800 text-white">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/10 rounded-[22px] flex items-center justify-center backdrop-blur-md border border-white/10">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tighter italic text-white uppercase">Novo Parceiro B2B</h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">Cadastro de Acesso e Faturamento</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-4 bg-black/20 hover:bg-black/40 rounded-2xl transition-all">
                <X className="w-7 h-7 text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-12 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Razão Social / Nome</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Comercial Atacado Silva"
                    className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-3xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white/10 focus:border-red-500/40 transition-all font-bold text-white text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">CNPJ / CPF</label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0000-00"
                    className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-3xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white/10 focus:border-red-500/40 transition-all font-bold text-white text-sm"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">E-mail de Login</label>
                  <input
                    type="email"
                    required
                    placeholder="comercial@parceiro.com"
                    className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-3xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white/10 focus:border-red-500/40 transition-all font-bold text-white text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Senha de Acesso</label>
                  <div className="relative">
                    <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 dígitos"
                      className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white/10 focus:border-red-500/40 transition-all font-bold text-white text-sm"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-2">Endereço Completo</label>
                <input
                  required
                  placeholder="Rua, Número, Complemento, CEP..."
                  className="w-full px-6 py-5 bg-white/5 border border-white/5 rounded-3xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white/10 focus:border-red-500/40 transition-all font-bold text-white text-sm"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="pt-10 flex gap-6">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-5 bg-white/5 text-slate-400 font-black rounded-3xl border border-white/5 hover:bg-white/10 transition-all text-[10px] uppercase tracking-[0.2em]"
                >
                  Cancelar Cadastro
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-red-600 text-white py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-red-900/40 hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      EFETIVAR PARCERIA <ArrowRight className="w-5 h-5" />
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

export default ClientList;