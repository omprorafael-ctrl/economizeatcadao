
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
  ShieldCheck,
  Eye,
  EyeOff,
  ShoppingBag,
  User as UserIcon
} from 'lucide-react';

const Login: React.FC<{ onLogin: (user: User) => void }> = () => {
  const [loginInput, setLoginInput] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    let finalEmail = loginInput.trim();
    if (!finalEmail.includes('@')) {
      const cleanName = finalEmail.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      finalEmail = `${cleanName}@economize.com`;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, finalEmail, password);
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
        setError("Credenciais inválidas. Verifique seu nome e senha.");
      } else {
        setError("Erro de conexão com o servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!loginInput || !loginInput.includes('@')) {
      setError("Digite seu e-mail completo para recuperar a senha.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginInput);
      setSuccess("Link de recuperação enviado para seu e-mail.");
    } catch (err) {
      setError("Não foi possível enviar o e-mail.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1/2 bg-slate-100 -skew-y-6 transform origin-top-left z-0" />
      
      <div className="w-full max-w-[400px] relative z-10 bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="mb-6 inline-block">
            <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-red-200">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Economize Atacadão</h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-black mt-1">Portal de Logística</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-600 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-3 text-emerald-600 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase">Login (Nome ou E-mail)</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Ex: João"
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase">Senha</label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline"
              >
                Esqueceu?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Seu CPF (apenas números)"
                className="w-full pl-10 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-100 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Acessar Sistema <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
           <ShieldCheck className="w-4 h-4" />
           <span className="text-[10px] uppercase font-bold tracking-widest">Ambiente Seguro</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
