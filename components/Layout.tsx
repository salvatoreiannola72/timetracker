import React, { useState } from 'react';
import { useStore } from '../context/Store';
import { Role } from '../types';
import { 
  LayoutDashboard, 
  Calendar, 
  PieChart, 
  Briefcase, 
  LogOut, 
  User as UserIcon,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { user, logout } = useStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  // Desktop NavLink - unchanged
  const NavLink = ({ page, icon: Icon, label }: { page: string; icon: any; label: string }) => (
    <button
      onClick={() => {
        onNavigate(page);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
        ${currentPage === page 
          ? 'bg-blue-500 text-white shadow-md shadow-blue-200' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  // Mobile Bottom Nav Item
  const MobileNavItem = ({ page, icon: Icon, label }: { page: string; icon: any; label: string }) => {
    const isActive = currentPage === page;
    return (
      <button
        onClick={() => onNavigate(page)}
        className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 flex-1
          ${isActive 
            ? 'text-blue-600' 
            : 'text-slate-500'
          }`}
      >
        <div className={`p-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-50' : ''}`}>
          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop & Mobile Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <button 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <img src="/edgeworks.png" alt="Edgeworks" className="h-8 w-auto" />
              <span className="font-semibold text-slate-800">Edgeworks</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink page="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavLink page="timesheet" icon={Calendar} label="Timesheet" />
              {user.is_staff && (
                <>
                  <NavLink page="projects" icon={Briefcase} label="Progetti" />
                  <NavLink page="reports" icon={PieChart} label="Report" />
                </>
              )}
            </div>

            {/* User Menu (Desktop & Mobile) */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500 bg-blue-100 flex items-center justify-center">
                    <span className="text-xs font-semibold text-blue-600">
                      {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.is_staff ? 'Admin' : 'Collaboratore'}</p>
                  </div>
                  <ChevronDown size={16} className="text-slate-400 hidden md:block" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Esci</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50">
        <div className="flex items-center justify-around px-2 py-1 safe-bottom">
          <MobileNavItem page="dashboard" icon={LayoutDashboard} label="Home" />
          <MobileNavItem page="timesheet" icon={Calendar} label="Timesheet" />
          {user.is_staff && (
            <>
              <MobileNavItem page="projects" icon={Briefcase} label="Progetti" />
              <MobileNavItem page="reports" icon={PieChart} label="Report" />
            </>
          )}
        </div>
      </nav>
    </div>
  );
};