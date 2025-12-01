import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { Button } from '../components/Button';
import { Lock, User } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useStore();
  const [email, setEmail] = useState('admin@chronoflow.com');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email)) {
      setError('');
    } else {
      setError('User not found. Try "admin@chronoflow.com" or "user@chronoflow.com"');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 sm:p-12">
          <div className="flex justify-center mb-8">
             <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <span className="text-white font-bold text-2xl">C</span>
             </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Welcome back</h2>
          <p className="text-slate-500 text-center mb-8">Sign in to manage your time and projects</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-700">
               <p className="font-semibold mb-1">Demo Credentials:</p>
               <p>Admin: admin@chronoflow.com</p>
               <p>User: user@chronoflow.com</p>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <Button type="submit" className="w-full" size="lg">
              Sign In
            </Button>
          </form>
        </div>
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            &copy; 2024 ChronoFlow Systems
          </p>
        </div>
      </div>
    </div>
  );
};