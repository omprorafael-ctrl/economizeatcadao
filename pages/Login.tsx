import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Wallet, ArrowRight, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Falha ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-emerald-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Wallet className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">MeuControle</h1>
          <p className="text-emerald-100 text-sm mt-2">Gerencie suas finanças com sabedoria</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">Acesse sua conta</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-slate-400 shadow-sm hover:border-emerald-300"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-slate-400 shadow-sm hover:border-emerald-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Entrando...' : (
                <>
                  Entrar <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Não tem uma conta?{' '}
              <Link to="/register" className="text-emerald-600 font-bold hover:underline hover:text-emerald-700">
                Crie agora
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;