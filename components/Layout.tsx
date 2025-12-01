import React from 'react';
import { useStore } from '../context/Store';
import { Role } from '../types';
import { 
  LayoutDashboard, 
  Calendar, 
  PieChart, 
  Briefcase, 
  LogOut, 
  User as UserIcon,
  Menu
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { user, logout } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  if (!user) return <>{children}</>;

  const NavItem = ({ page, icon: Icon, label }: { page: string; icon: any; label: string }) => (
    <button
      onClick={() => {
        onNavigate(page);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium
        ${currentPage === page 
          ? 'bg-blue-50 text-blue-700' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 fixed h-full z-10">
        <div className="p-6 flex items-center space-x-2 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">ChronoFlow</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem page="timesheet" icon={Calendar} label="Timesheet" />
          {user.role === Role.ADMIN && (
             <NavItem page="projects" icon={Briefcase} label="Projects" />
          )}
          <NavItem page="reports" icon={PieChart} label="Reports" />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 px-2 py-3 mb-2">
            <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full bg-slate-200" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20">
         <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="font-bold text-slate-900">ChronoFlow</span>
         </div>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
            <Menu size={24} />
         </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-30 pt-20 px-4 md:hidden">
          <nav className="space-y-2">
             <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
             <NavItem page="timesheet" icon={Calendar} label="Timesheet" />
             {user.role === Role.ADMIN && (
                 <NavItem page="projects" icon={Briefcase} label="Projects" />
             )}
             <NavItem page="reports" icon={PieChart} label="Reports" />
             <button onClick={logout} className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 font-medium">
               <LogOut size={20} />
               <span>Sign Out</span>
             </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 transition-all duration-200 ease-in-out">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};