import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/Store';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Timesheet } from './pages/Timesheet';
import { Projects } from './pages/Projects';
import { Reports } from './pages/Reports';
import { testSupabaseConnection } from './test-supabase';
import { supabase } from './lib/supabase';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, loading } = useStore();
  const [page, setPage] = useState('dashboard');
  const [authPage, setAuthPage] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');

  // Test Supabase connection on mount
  useEffect(() => {
    testSupabaseConnection();
  }, []);

  // Check for password reset flow from email link
  useEffect(() => {
    const handleAuthStateChange = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (type === 'recovery' && accessToken) {
        // User clicked password reset link
        setAuthPage('reset-password');
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    handleAuthStateChange();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setAuthPage('reset-password');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <img src="/edgeworks.png" alt="Edgeworks" className="h-16 w-auto mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    switch (authPage) {
      case 'register':
        return <Register onNavigate={setAuthPage} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={setAuthPage} />;
      case 'reset-password':
        return <ResetPassword onNavigate={() => setAuthPage('login')} />;
      default:
        return <Login onNavigate={setAuthPage} />;
    }
  }

  const renderPage = () => {
    // Route guards: prevent collaborators from accessing admin-only pages
    if (user?.role === 'COLLABORATOR' && (page === 'projects' || page === 'reports')) {
      setPage('dashboard');
      return <Dashboard />;
    }

    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'timesheet': return <Timesheet />;
      case 'projects': return <Projects />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
};

export default App;