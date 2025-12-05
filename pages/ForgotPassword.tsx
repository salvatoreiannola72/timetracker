import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { Button } from '../components/Button';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

interface ForgotPasswordProps {
  onNavigate: (page: 'login' | 'register' | 'forgot-password') => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const { resetPassword } = useStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || 'Errore durante l\'invio dell\'email');
      }
    } catch (err) {
      setError('Errore durante l\'invio dell\'email. Riprova.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-8 sm:p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-blue-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Email inviata!</h2>
            <p className="text-slate-600 mb-6">
              Controlla la tua casella di posta per le istruzioni su come reimpostare la password.
              Se non ricevi l'email entro pochi minuti, controlla la cartella spam.
            </p>

            <Button onClick={() => onNavigate('login')} className="w-full">
              Torna al Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 sm:p-12">
          <div className="flex justify-center mb-8">
            <img src="/edgeworks.png" alt="Edgeworks" className="h-16 w-auto" />
          </div>
          
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Password dimenticata?</h2>
          <p className="text-slate-500 text-center mb-8">
            Inserisci il tuo indirizzo email e ti invieremo le istruzioni per reimpostare la password
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Indirizzo Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-400" />
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

            {error && <p className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-lg">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Invio in corso...' : 'Invia Email di Reset'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                disabled={loading}
              >
                <ArrowLeft size={16} className="mr-1" />
                Torna al Login
              </button>
            </div>
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
