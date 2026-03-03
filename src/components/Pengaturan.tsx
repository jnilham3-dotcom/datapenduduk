import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  MapPin, 
  User as UserIcon, 
  Save, 
  CheckCircle2,
  Image as ImageIcon,
  Globe,
  Lock,
  Camera,
  AlertCircle
} from 'lucide-react';
import { Pengaturan, User } from '../types';
import { api } from '../services/api';

interface PengaturanProps {
  user: User | null;
}

const PengaturanPage: React.FC<PengaturanProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'desa' | 'profil'>('desa');
  const [config, setConfig] = useState<Pengaturan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Profile State
  const [profileData, setProfileData] = useState({
    nama_lengkap: user?.nama_lengkap || '',
    foto_profil: user?.foto_profil || '',
    password_lama: '',
    password_baru: '',
    konfirmasi_password: ''
  });

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.roles?.includes('Administrator')) return true;
    return user.permissions?.includes(permission);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await api.getPengaturan();
      setConfig(data);
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setError('');
    try {
      await api.savePengaturan(config);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (profileData.password_baru && profileData.password_baru !== profileData.konfirmasi_password) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setSaving(true);
    setError('');
    try {
      // Update profile info
      const updatedUser = await api.saveUser({
        ...user,
        nama_lengkap: profileData.nama_lengkap,
        foto_profil: profileData.foto_profil,
        password: profileData.password_baru || undefined
      });
      
      // Update local storage and state if necessary
      // In a real app, we'd have a context or global state for this
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const newUser = { ...savedUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        window.location.reload(); // Quick way to refresh user data everywhere
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pengaturan</h1>
          <p className="text-slate-500 mt-1">Kelola informasi desa dan profil akun Anda.</p>
        </div>
        {success && (
          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2 text-emerald-600 font-bold animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={18} />
            <span>Berhasil Disimpan</span>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 text-red-600 font-bold animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('desa')}
          className={`px-6 py-3 font-bold text-sm transition-all relative ${
            activeTab === 'desa' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Pengaturan Desa
          {activeTab === 'desa' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('profil')}
          className={`px-6 py-3 font-bold text-sm transition-all relative ${
            activeTab === 'profil' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Profil Saya
          {activeTab === 'profil' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeTab === 'desa' ? (
            <form onSubmit={handleSaveConfig} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600">
                  <Building2 size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Identitas Desa</h2>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nama Desa</label>
                    <input 
                      type="text" 
                      value={config.nama_desa || ''} 
                      onChange={(e) => setConfig({...config, nama_desa: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nama Kepala Desa</label>
                    <input 
                      type="text" 
                      value={config.nama_kepala_desa || ''} 
                      onChange={(e) => setConfig({...config, nama_kepala_desa: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Kecamatan</label>
                    <input 
                      type="text" 
                      value={config.kecamatan || ''} 
                      onChange={(e) => setConfig({...config, kecamatan: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Kabupaten</label>
                    <input 
                      type="text" 
                      value={config.kabupaten || ''} 
                      onChange={(e) => setConfig({...config, kabupaten: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Provinsi</label>
                    <input 
                      type="text" 
                      value={config.provinsi || ''} 
                      onChange={(e) => setConfig({...config, provinsi: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Kode Pos</label>
                    <input 
                      type="text" 
                      value={config.kode_pos || ''} 
                      onChange={(e) => setConfig({...config, kode_pos: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">URL Logo Desa</label>
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      value={config.logo_url || ''} 
                      onChange={(e) => setConfig({...config, logo_url: e.target.value})}
                      placeholder="https://example.com/logo.png"
                      className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                    {config.logo_url && (
                      <div className="w-11 h-11 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                        <img src={config.logo_url} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                {hasPermission('action_edit_pengaturan') && (
                  <button 
                    type="submit"
                    disabled={saving}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center gap-2"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={20} />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-lg text-blue-600">
                  <UserIcon size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Profil Saya</h2>
              </div>
              
              <div className="p-8 space-y-8">
                {/* Profile Photo */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <div className="w-32 h-32 bg-slate-100 rounded-3xl border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                      {profileData.foto_profil ? (
                        <img src={profileData.foto_profil} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={48} className="text-slate-300" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl cursor-pointer">
                      <Camera className="text-white" size={24} />
                    </div>
                  </div>
                  <div className="w-full max-w-sm space-y-2">
                    <label className="text-sm font-bold text-slate-700">URL Foto Profil</label>
                    <input 
                      type="text" 
                      value={profileData.foto_profil}
                      onChange={(e) => setProfileData({...profileData, foto_profil: e.target.value})}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={profileData.nama_lengkap}
                      onChange={(e) => setProfileData({...profileData, nama_lengkap: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Lock size={16} className="text-slate-400" />
                      Ubah Password
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Password Baru</label>
                        <input 
                          type="password" 
                          value={profileData.password_baru}
                          onChange={(e) => setProfileData({...profileData, password_baru: e.target.value})}
                          placeholder="Kosongkan jika tidak diubah"
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Konfirmasi Password</label>
                        <input 
                          type="password" 
                          value={profileData.konfirmasi_password}
                          onChange={(e) => setProfileData({...profileData, konfirmasi_password: e.target.value})}
                          placeholder="Ulangi password baru"
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Perbarui Profil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Globe size={20} className="text-blue-500" />
              Informasi Publik
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kepala Desa</p>
                <p className="font-bold text-slate-900">{config.nama_kepala_desa || '-'}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Lokasi</p>
                <p className="font-bold text-slate-900">{config.nama_desa}, {config.kecamatan}</p>
                <p className="text-sm text-slate-500">{config.kabupaten}, {config.provinsi}</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <h3 className="text-lg font-bold mb-2 relative z-10">Bantuan Sistem</h3>
            <p className="text-indigo-100 text-sm mb-6 relative z-10">
              Jika Anda mengalami kesulitan dalam mengonfigurasi sistem, silakan hubungi tim teknis kami.
            </p>
            <button className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all relative z-10">
              Buka Tiket Bantuan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PengaturanPage;
