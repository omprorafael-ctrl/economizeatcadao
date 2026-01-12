import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  PieChart, 
  LogOut,
  UserCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout, currentUser } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Meus Gastos', path: '/expenses', icon: Wallet },
    { name: 'Relatórios', path: '/reports', icon: PieChart },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed h-full w-64 bg-slate-900 text-slate-300 flex-col top-0 left-0 z-20">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">
            $
          </div>
          <h1 className="text-xl font-bold text-white">MeuControle</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive(item.path) 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                  : 'hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 mb-4 px-2">
            <UserCircle size={32} className="text-slate-500" />
            <div className="overflow-hidden">
              <p className="text-xs text-slate-500">Logado como</p>
              <p className="text-sm text-slate-300 truncate" title={currentUser?.email || ''}>{currentUser?.email}</p>
            </div>
           </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      {/* Added mb-20 for mobile to account for bottom nav, and ml-64 for desktop sidebar offset */}
      <main className="flex-1 p-4 md:p-8 md:ml-64 mb-20 md:mb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 px-2 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-emerald-50' : 'bg-transparent'}`}>
                  <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}
          
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-red-500"
          >
            <div className="p-1.5 rounded-xl">
               <LogOut size={22} strokeWidth={2} />
            </div>
            <span className="text-[10px] font-medium">Sair</span>
          </button>
        </div>
      </nav>

    </div>
  );
};

export default Layout;