
import React, { useState, useEffect } from 'react';
import { UserRole, User } from '../../types';
import { auth, db } from '../../firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { 
  LogIn, 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

const Login: React.FC<{ onLogin: (user: User) => void }> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        await auth.signOut();
        setError("Seu acesso ainda não foi autorizado por um administrador.");
        return;
      }

      const userData = userDoc.data() as User;
      if (!userData.active) {
        await auth.signOut();
        setError("Sua conta está inativa. Entre em contato com o suporte.");
        return;
      }
      
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("E-mail ou senha incorretos.");
      } else {
        setError("Ocorreu um erro ao acessar o portal.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Digite seu e-mail para receber o link de recuperação.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("E-mail de recuperação enviado com sucesso!");
    } catch (err) {
      setError("Erro ao enviar e-mail de recuperação.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-600/10 rounded-full blur-[160px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[140px]" />

      <div className="w-full max-w-[440px] relative z-10">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-red-700 to-orange-500 rounded-3xl shadow-2xl shadow-red-500/20 mb-6 rotate-6 transition-transform hover:rotate-0">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white italic mb-2">
            ATACADÃO
          </h1>
          <p className="text-red-400 font-bold uppercase tracking-[0.3em] text-[10px]">Portal de Vendas & Logística</p>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl p-8 lg:p-10 rounded-[40px] shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/10 animate-in zoom-in-95 duration-500">
          
          <div className="flex items-center gap-3 mb-8 p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <p className="text-[10px] font-bold text-red-300 uppercase tracking-widest leading-tight">Identifique-se para gerenciar seus pedidos</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="font-medium leading-tight">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-emerald-400 text-sm animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="font-medium leading-tight">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Usuário / E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="email"
                  placeholder="acesso@atcadao.com"
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/30 focus:bg-white/20 transition-all font-bold text-white placeholder:text-slate-600"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Senha</label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
                >
                  RECUPERAR ACESSO
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/30 focus:bg-white/20 transition-all font-bold text-white placeholder:text-slate-600"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-5 rounded-2xl font-black text-sm tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl shadow-red-900/40 active:scale-[0.98] transition-all disabled:opacity-50 group"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  ENTRAR NO SISTEMA
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
