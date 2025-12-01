import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/Store';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Timesheet } from './pages/Timesheet';
import { Projects } from './pages/Projects';
import { Reports } from './pages/Reports';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useStore();
  const [page, setPage] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderPage = () => {
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