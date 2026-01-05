
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
  ChevronRight,
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
  const [formData, setFormData] = useState({ name: '', email: '', password: '', cpfCnpj: '', phone: '', address: '' });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) return;
    setLoading(true);
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      const uid = userCredential.user.uid;
      const newClient: ClientData = { id: uid, name: formData.name, email: formData.email, role: UserRole.CLIENT, active: true, createdAt: new Date().toISOString(), cpfCnpj: formData.cpfCnpj, phone: formData.phone, address: formData.address };
      await setDoc(doc(db, 'users', uid), newClient);
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', cpfCnpj: '', phone: '', address: '' });
    } catch (error: any) {
      console.error(error);
      alert("Erro ao cadastrar.");
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Razão Social ou CNPJ..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all text-xs font-bold text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-md active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" /> Credenciar PDV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-md transition-all group flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div className="bg-slate-50 border border-slate-100 text-slate-700 w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-sm">
                {client.name.charAt(0)}
              </div>
              <div className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border ${client.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {client.active ? 'Autorizado' : 'Bloqueado'}
              </div>
            </div>
            
            <h4 className="font-bold text-slate-900 text-sm mb-1 uppercase truncate">{client.name}</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6">{client.cpfCnpj || 'DOCUMENTO PENDENTE'}</p>
            
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3 text-xs">
                <Mail className="w-3.5 h-3.5 text-slate-300" />
                <span className="truncate text-slate-600 font-medium italic">{client.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Phone className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-600 font-medium">{client.phone || 'N/A'}</span>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <MapPin className="w-3.5 h-3.5 text-slate-300 mt-0.5" />
                <span className="line-clamp-2 text-slate-500 font-medium">{client.address || 'Endereço não cadastrado'}</span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button className="text-red-600 text-[9px] font-bold uppercase tracking-widest hover:text-red-700 flex items-center gap-1 group/btn">
                Perfil Financeiro <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
              <button className="text-slate-200 hover:text-slate-400 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/10">
          <div className="absolute inset-0" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Cadastro de Parceiro B2B</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreateClient} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Razão Social</label>
                  <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">CNPJ / CPF</label>
                  <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" value={formData.cpfCnpj} onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">E-mail</label>
                  <input type="email" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Senha</label>
                  <input type="password" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest ml-1">Endereço de Entrega</label>
                <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="pt-6 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-500 font-bold rounded-xl text-[10px] uppercase hover:bg-slate-200 transition-all">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-[2] bg-red-600 text-white py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Cadastrar Parceiro <ArrowRight className="w-4 h-4" /></>}
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
