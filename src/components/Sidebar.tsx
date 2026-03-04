import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  Settings, 
  FileDown, 
  ChevronDown, 
  ChevronRight, 
  Menu, 
  X, 
  LogOut,
  Building2,
  Briefcase,
  Users2,
  LogIn
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from '../types';
import { useGAS, isValidGasUrl } from '../services/api';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isMobileOpen, setIsMobileOpen, isOpen, setIsOpen }) => {
  const location = useLocation();
  const [isLembagaOpen, setIsLembagaOpen] = useState(location.pathname.startsWith('/lembaga'));
  const navigate = useNavigate();

  useEffect(() => {
    // Close mobile sidebar on route change
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith('/lembaga')) {
      setIsLembagaOpen(true);
    }
  }, [location.pathname]);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', permission: 'menu_dashboard' },
    { name: 'Data Penduduk', icon: Users, path: '/penduduk', permission: 'menu_penduduk' },
    { name: 'Data Perangkat', icon: Briefcase, path: '/perangkat', permission: 'menu_perangkat' },
    { name: 'Ekspor & Laporan', icon: FileDown, path: '/laporan', permission: 'menu_laporan' },
    { name: 'Pengaturan', icon: Settings, path: '/pengaturan', permission: 'menu_pengaturan' },
    { name: 'User', icon: UserCircle, path: '/users', permission: 'menu_users' },
  ];

  const lembagaItems = [
    { name: 'BPD', path: '/lembaga/BPD' },
    { name: 'RT', path: '/lembaga/RT' },
    { name: 'RW', path: '/lembaga/RW' },
    { name: 'PKK', path: '/lembaga/PKK' },
    { name: 'Karang Taruna', path: '/lembaga/Karang Taruna' },
    { name: 'LPMD', path: '/lembaga/LPMD' },
    { name: 'Posyandu', path: '/lembaga/Posyandu' },
  ];

  const hasPermission = (permission: string) => {
    // Dashboard is always visible
    if (permission === 'menu_dashboard') return true;
    
    if (!user) return false;
    
    // Administrator always has all permissions
    if (user.roles?.includes('Administrator')) return true;
    
    return user.permissions?.includes(permission);
  };

  let filteredMenu = menuItems.filter(item => hasPermission(item.permission));

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Administrator': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'Admin': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'User': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div className={`
        fixed left-0 top-0 h-full bg-primary text-white transition-all duration-300 z-[60] flex flex-col
        ${isOpen ? 'w-64' : 'w-20'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-white/10 h-20 shrink-0">
          <div className={`flex items-center gap-3 ${!isOpen && 'hidden'}`}>
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-accent/20">D</div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight leading-none">Sidapen Desa</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Purwarahayu</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white hidden md:block">
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button onClick={() => setIsMobileOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white md:hidden">
            <X size={20} />
          </button>
        </div>

      {/* User Profile Section */}
      <div className={`p-4 border-b border-white/10 shrink-0 ${!isOpen && 'flex justify-center'}`}>
        {user ? (
          isOpen ? (
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden">
                  {user.foto_profil ? (
                    <img src={user.foto_profil} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user.nama_lengkap?.charAt(0) || 'U'
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm truncate">{user.nama_lengkap}</span>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {user.roles?.map(role => (
                      <span key={role} className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${getRoleBadge(role)}`}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center text-white font-bold cursor-pointer hover:bg-slate-600 transition-colors overflow-hidden">
              {user.foto_profil ? (
                <img src={user.foto_profil} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.nama_lengkap?.charAt(0) || 'U'
              )}
            </div>
          )
        ) : (
          isOpen ? (
            <Link to="/login" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 hover:bg-emerald-500/20 transition-all group">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <LogIn size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Masuk Sistem</span>
                <span className="text-[10px] text-emerald-500/60 uppercase font-bold">Login Required</span>
              </div>
            </Link>
          ) : (
            <Link to="/login" className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 hover:scale-110 transition-all">
              <LogIn size={20} />
            </Link>
          )
        )}
      </div>

      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
        <div className={`px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest ${!isOpen && 'hidden'}`}>
          Main Menu
        </div>
        {filteredMenu.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative ${
              location.pathname === item.path ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <item.icon size={22} className={location.pathname === item.path ? 'text-white' : 'group-hover:text-white transition-colors'} />
            <span className={`font-medium text-sm ${!isOpen && 'hidden'}`}>{item.name}</span>
            {!isOpen && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                {item.name}
              </div>
            )}
          </Link>
        ))}

        {/* Lembaga Dropdown */}
        {hasPermission('menu_lembaga') && (
          <div className="space-y-1 pt-2">
            <div className={`px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest ${!isOpen && 'hidden'}`}>
              Organization
            </div>
            <button
              onClick={() => setIsLembagaOpen(!isLembagaOpen)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group relative ${
                location.pathname.startsWith('/lembaga') ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <Building2 size={22} className={location.pathname.startsWith('/lembaga') ? 'text-white' : 'group-hover:text-white transition-colors'} />
                <span className={`font-medium text-sm ${!isOpen && 'hidden'}`}>Data Lembaga</span>
              </div>
              {isOpen && (
                <div className={`transition-transform duration-200 ${isLembagaOpen ? 'rotate-180' : ''}`}>
                  <ChevronDown size={16} />
                </div>
              )}
              {!isOpen && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                  Data Lembaga
                </div>
              )}
            </button>
            
            {isLembagaOpen && isOpen && (
              <div className="ml-10 space-y-1 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {lembagaItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`block p-2 text-sm rounded-lg transition-all ${
                      location.pathname === item.path ? 'text-accent font-bold bg-accent/5' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-4">
          <div className={`px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest ${!isOpen && 'hidden'}`}>
            Support
          </div>
          <a
            href="#"
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all duration-200 group relative"
          >
            <div className="w-5.5 h-5.5 flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <span className={`font-medium text-sm ${!isOpen && 'hidden'}`}>Pusat Bantuan</span>
          </a>
        </div>

        {/* Backend Status */}
        <div className="pt-4 mt-auto border-t border-white/5">
          <div className={`px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest ${!isOpen && 'hidden'}`}>
            Backend Status
          </div>
          <div className={`flex items-center gap-4 p-3 rounded-xl bg-white/5 ${!isOpen && 'justify-center'}`}>
            <div className={`w-2 h-2 rounded-full ${useGAS() ? (isValidGasUrl ? 'bg-blue-500' : 'bg-yellow-500') : 'bg-emerald-500'} animate-pulse`} />
            <div className={`flex flex-col min-w-0 ${!isOpen && 'hidden'}`}>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {useGAS() ? 'Google Apps Script' : 'Local Server'}
              </span>
              <span className="text-[9px] text-slate-400 truncate">
                {useGAS() ? (isValidGasUrl ? 'Copyright by : Ilham Cahya Nugraha' : 'GAS Environment') : 'Express Backend'}
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
