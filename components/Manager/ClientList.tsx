
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
  ArrowRight,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  Lock,
  AlertCircle
} from 'lucide-react';
import { db, firebaseConfig } from '../../firebaseConfig';
import { doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { isValidCpfCnpj } from '../../utils/validators';

interface ClientListProps {
  clients: ClientData[];
  setClients: React.Dispatch<React.SetStateAction<ClientData[]>>;
}

const ClientList: React.FC<ClientListProps> = ({ clients }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    cpfCnpj: '', 
    phone: '', 
    address: '' 
  });

  const isDocValid = formData.cpfCnpj ? isValidCpfCnpj(formData.cpfCnpj) : true;

  const handleOpenEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      cpfCnpj: client.cpfCnpj || '',
      phone: client.phone || '',
      address: client.address || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', cpfCnpj: '', phone: '', address: '' });
    setShowModal(false);
    setEditingClient(null);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidCpfCnpj(formData.cpfCnpj)) {
      alert("O CPF/CNPJ informado é inválido.");
      return;
    }

    setLoading(true);

    try {
      if (editingClient) {
        await updateDoc(doc(db, 'users', editingClient.id), {
          name: formData.name.trim(),
          cpfCnpj: formData.cpfCnpj.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim()
        });
        resetForm();
      } else {
        // Lógica de Geração Automática de Credenciais
        const firstName = formData.name.trim().split(' ')[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const generatedEmail = `${firstName}@economize.com`;
        const generatedPassword = formData.cpfCnpj.replace(/\D/g, ''); // Senha é o CPF limpo

        if (generatedPassword.length < 6) {
          alert("O CPF/CNPJ deve ter pelo menos 6 dígitos para servir como senha.");
          setLoading(false);
          return;
        }

        const secondaryApp = initializeApp(firebaseConfig, "ClientCreationApp");
        const secondaryAuth = getAuth(secondaryApp);
        
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, generatedEmail, generatedPassword);
        const uid = userCredential.user.uid;
        
        const newClient = { 
          id: uid, 
          name: formData.name.trim(), 
          email: generatedEmail, 
          role: UserRole.CLIENT, 
          active: true, 
          createdAt: new Date().toISOString(), 
          cpfCnpj: formData.cpfCnpj.trim(), 
          phone: formData.phone.trim(), 
          address: formData.address.trim() 
        };

        await setDoc(doc(db, 'users', uid), newClient);
        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);
        resetForm();
        alert(`Cliente criado!\nLogin: ${firstName}\nSenha: ${generatedPassword}`);
      }
    } catch (error: any) {
      console.error(error);
      alert("Falha na operação: " + (error.code === 'auth/email-already-in-use' ? "Já existe um usuário com este primeiro nome. Adicione um sobrenome." : error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm("⚠️ EXCLUSÃO PERMANENTE: Você tem certeza que deseja remover este cliente?")) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        console.error(error);
        alert("Erro ao remover registro.");
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', id), { active: !currentStatus });
    } catch (error) {
      console.error(error);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.cpfCnpj && c.cpfCnpj.includes(searchTerm))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Pesquisar por Razão Social ou CNPJ..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-300 transition-all text-xs font-bold text-slate-700 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-red-100 active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" /> Credenciar Parceiro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white border border-slate-200 rounded-[35px] p-8 hover:shadow-2xl hover:border-red-100 transition-all group flex flex-col relative overflow-hidden">
            <div className="flex items-start justify-between mb-8">
              <div className="bg-slate-50 border border-slate-100 text-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm uppercase">
                {client.name.charAt(0)}
              </div>
              <button 
                onClick={() => toggleStatus(client.id, client.active)}
                className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border-2 transition-all ${
                  client.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                }`}
              >
                {client.active ? 'ATIVO' : 'BLOQUEADO'}
              </button>
            </div>
            
            <h4 className="font-black text-slate-900 text-sm mb-1 uppercase truncate tracking-tight">{client.name}</h4>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-8">{client.cpfCnpj || 'DOC NÃO INFORMADO'}</p>
            
            <div className="space-y-5 flex-1">
              <div className="flex items-center gap-4 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg"><Mail className="w-3.5 h-3.5 text-slate-400" /></div>
                <span className="truncate text-slate-600 font-bold italic">{client.email}</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg"><Phone className="w-3.5 h-3.5 text-slate-400" /></div>
                <span className="text-slate-600 font-bold">{client.phone || '(00) 00000-0000'}</span>
              </div>
              <div className="flex items-start gap-4 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg shrink-0"><MapPin className="w-3.5 h-3.5 text-slate-400" /></div>
                <span className="line-clamp-2 text-slate-500 font-bold leading-relaxed">{client.address || 'Endereço pendente'}</span>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleOpenEdit(client)}
                  className="px-4 py-2 bg-white text-slate-400 hover:text-blue-600 border border-slate-100 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Editar</span>
                </button>
                <button 
                  onClick={() => handleDeleteClient(client.id)}
                  className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Excluir Definitivamente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/20">
          <div className="absolute inset-0" onClick={() => !loading && resetForm()} />
          <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  {editingClient ? 'Gestão de Cadastro' : 'Novo Credenciamento'}
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Login automático via Primeiro Nome | Senha via CPF
                </p>
              </div>
              <button onClick={() => !loading && resetForm()} className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-xl border border-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveClient} className="p-10 space-y-8">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                   <Building2 className="w-4 h-4 text-red-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Dados da Empresa</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Razão Social / Nome Fantasia</label>
                    <input type="text" required disabled={loading} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">CNPJ / CPF do Cliente</label>
                    <input 
                      type="text" 
                      required 
                      disabled={loading} 
                      className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl outline-none focus:bg-white transition-all font-bold text-slate-700 text-xs ${!isDocValid && formData.cpfCnpj ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-red-300'}`} 
                      value={formData.cpfCnpj} 
                      onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })} 
                    />
                    {!isDocValid && formData.cpfCnpj && (
                      <p className="text-[9px] text-red-600 font-black uppercase tracking-widest ml-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Documento Inválido
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                   <Phone className="w-4 h-4 text-red-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">Contato e Logística</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Fone / WhatsApp</label>
                    <input type="text" disabled={loading} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Endereço de Entrega</label>
                    <input required disabled={loading} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-red-300 transition-all font-bold text-slate-700 text-xs" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                </div>
              </div>

              {!editingClient && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 items-center">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-[9px] font-bold text-blue-800 uppercase tracking-widest">
                    As credenciais de acesso serão geradas automaticamente e enviadas ao cliente após salvar.
                  </p>
                </div>
              )}

              <div className="pt-8 flex gap-4">
                <button type="button" onClick={() => resetForm()} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Descartar</button>
                <button type="submit" disabled={loading || !isDocValid} className="flex-[2] bg-red-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      {editingClient ? 'Salvar Alterações' : 'Finalizar Cadastro'} 
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

export default ClientList;
