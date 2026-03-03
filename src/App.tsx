import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LogIn, LogOut, CheckCircle2, UserCircle, Menu as MenuIcon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Penduduk from './components/Penduduk';
import Perangkat from './components/Perangkat';
import Lembaga from './components/Lembaga';
import Laporan from './components/Laporan';
import Pengaturan from './components/Pengaturan';
import UserManagement from './components/UserManagement';
import { User, Role } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    console.log("App mounted, checking user...");
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      console.log("Found saved user:", savedUser);
      const parsedUser = JSON.parse(savedUser);
      
      // Migration: Convert old 'role' string to 'roles' array if necessary
      if (parsedUser.role && !parsedUser.roles) {
        parsedUser.roles = [parsedUser.role];
        delete parsedUser.role;
        localStorage.setItem('user', JSON.stringify(parsedUser));
      }
      
      // Ensure roles is always an array
      if (!Array.isArray(parsedUser.roles)) {
        parsedUser.roles = parsedUser.roles ? [parsedUser.roles] : ['User'];
      }
      
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setMessage({ text: 'Berhasil masuk ke sistem!', type: 'success' });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setMessage({ text: 'Anda telah keluar dari sistem.', type: 'success' });
  };

  const hasRole = (roles: Role[]) => {
    if (!user || !user.roles || !Array.isArray(user.roles)) return false;
    return roles.some(r => user.roles.includes(r));
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    // Administrator always has all permissions
    if (user.roles?.includes('Administrator')) return true;
    return user.permissions?.includes(permission);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
        <Sidebar 
          user={user} 
          onLogout={handleLogout} 
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />
        
        <main className={`flex-1 transition-all duration-300 min-h-screen ${user ? 'ml-20 md:ml-64' : 'ml-0'}`}>
          <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user && (
                <button 
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <MenuIcon size={24} />
                </button>
              )}
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold">D</div>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate max-w-[150px] sm:max-w-none">Sistem Desa Digital</h2>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-900">{user.nama_lengkap}</p>
                    <p className="text-xs font-medium text-slate-500">{user.roles?.join(', ') || ''}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden">
                    {user.foto_profil ? (
                      <img src={user.foto_profil} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={24} />
                    )}
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Keluar"
                  >
                    <LogOut size={20} />
                  </button>
                </>
              ) : (
                <Link to="/login" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2">
                  <LogIn size={18} />
                  <span>Masuk</span>
                </Link>
              )}
            </div>
          </header>

          {message && (
            <div className="fixed top-24 right-8 z-[100] animate-in fade-in slide-in-from-right-4">
              <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border ${
                message.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-red-500 text-white border-red-400'
              }`}>
                <CheckCircle2 size={20} />
                <span className="font-bold">{message.text}</span>
              </div>
            </div>
          )}

          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
              
              {/* Protected Routes */}
              <Route path="/penduduk" element={user ? <Penduduk user={user} /> : <Navigate to="/login" replace />} />
              
              {hasPermission('menu_perangkat') && (
                <Route path="/perangkat" element={user ? <Perangkat user={user} /> : <Navigate to="/login" replace />} />
              )}
              {hasPermission('menu_laporan') && (
                <Route path="/laporan" element={user ? <Laporan /> : <Navigate to="/login" replace />} />
              )}
              {hasPermission('menu_lembaga') && (
                <Route path="/lembaga/:type" element={user ? <Lembaga user={user} /> : <Navigate to="/login" replace />} />
              )}
              
              <Route path="/pengaturan" element={user ? <Pengaturan user={user} /> : <Navigate to="/login" replace />} />
              
              {hasPermission('menu_users') && (
                <Route path="/users" element={user ? <UserManagement user={user} /> : <Navigate to="/login" replace />} />
              )}
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
