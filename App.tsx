import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/Store';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Timesheet } from './pages/Timesheet';
import { Anagrafiche } from './pages/Anagrafiche';
import { Reports } from './pages/Reports';


const AppContent: React.FC = () => {
  const { user, isAuthenticated, loading } = useStore();
  const [page, setPage] = useState('dashboard');
  const [authPage, setAuthPage] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <img src="/timetracker.png" alt="Edgeworks" className="h-16 w-auto mx-auto mb-4 animate-pulse" />
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
    if (user?.role === 'COLLABORATOR' && (page === 'anagrafiche' || page === 'reports')) {
      setPage('dashboard');
      return <Dashboard />;
    }

    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'timesheet': return <Timesheet />;
      case 'anagrafiche': return <Anagrafiche />;
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