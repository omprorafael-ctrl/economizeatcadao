
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
  Lock,
  Search,
  CheckCircle2,
  Loader2,
  Key
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

    // Criar uma instância secundária do Firebase para não deslogar o gerente atual
    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // 1. Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        formData.email, 
        formData.password
      );
      
      const uid = userCredential.user.uid;

      // 2. Criar documento no Firestore com o mesmo UID
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
      
      // 3. Deslogar da instância secundária para limpar memória/sessão
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      alert(`Cliente ${formData.name} cadastrado com sucesso! Ele já pode acessar o sistema.`);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', cpfCnpj: '', phone: '', address: '' });
    } catch (error: any) {
      console.error("Erro ao criar cliente:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("Este e-mail já está em uso por outro usuário.");
      } else {
        alert("Erro ao realizar cadastro. Verifique os dados e tente novamente.");
      }
      // Limpar app secundário em caso de erro também
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
    <div className="space-y-6">
      {/* Header & Busca */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou CNPJ..."
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-black text-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-200 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" /> Novo Cliente
        </button>
      </div>

      {/* Grid de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white border border-slate-100 rounded-[32px] p-6 hover:shadow-xl hover:border-blue-200 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors" />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200">
                  {client.name.charAt(0)}
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${client.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {client.active ? 'Ativo' : 'Bloqueado'}
                </div>
              </div>
              
              <h4 className="font-black text-slate-900 text-lg mb-1 truncate">{client.name}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">{client.cpfCnpj || 'SEM DOCUMENTO'}</p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="truncate text-black font-bold">{client.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-black font-bold">{client.phone || 'Não informado'}</span>
                </div>
                <div className="flex items-start gap-3 text-sm font-medium text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="line-clamp-2 leading-relaxed text-black font-bold">{client.address || 'Endereço não cadastrado'}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">Ver Pedidos</button>
                <button className="p-2 text-slate-300 hover:text-slate-600"><MoreHorizontal className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Cadastro de Cliente */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-blue-600 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white">Criar Acesso de Cliente</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Cadastro de Login e Perfil</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-black tracking-widest ml-1">Nome Fantasia</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Mercado Central"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-black text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-black tracking-widest ml-1">CNPJ ou CPF</label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-black text-sm"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-black tracking-widest ml-1">E-mail de Acesso (Login)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="comercial@cliente.com"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-black text-sm"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-black tracking-widest ml-1">Senha de Acesso</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-black text-sm"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-black tracking-widest ml-1">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="(00) 00000-0000"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-black text-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-black uppercase text-black tracking-widest ml-1">Endereço de Entrega</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      required
                      placeholder="Rua, Número, Bairro, Cidade"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none font-black text-black text-sm"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-4 bg-white text-black font-black rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white" /> Confirmar e Criar Acesso
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
