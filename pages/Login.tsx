import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { Button } from '../components/Button';
import { Lock, User } from 'lucide-react';

interface LoginProps {
  onNavigate?: (page: 'login' | 'register' | 'forgot-password') => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useStore();
  const [email, setEmail] = useState('admin@edgeworks.it');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Email o password non corrette');
      }
    } catch (err) {
      setError('Errore durante il login. Riprova.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 sm:p-12">
          <div className="flex justify-center mb-8">
             <img src="/edgeworks.png" alt="Edgeworks" className="h-16 w-auto" />
          </div>
          
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Bentornato</h2>
          <p className="text-slate-500 text-center mb-8">Accedi per gestire il tuo tempo e i tuoi progetti</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Indirizzo Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="tu@azienda.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {onNavigate && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Password dimenticata?
                </button>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-700">
               <p className="font-semibold mb-1">Credenziali Demo:</p>
               <p>Email: admin@edgeworks.it o user@edgeworks.it</p>
               <p>Password: (quella che hai impostato in Supabase)</p>
            </div>

            {error && <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>

            {onNavigate && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Non hai un account? <span className="text-blue-600 hover:text-blue-700 font-medium">Registrati</span>
                </button>
              </div>
            )}
          </form>
        </div>
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            &copy; 2025 Edgeworks
          </p>
        </div>
      </div>
    </div>
  );
};