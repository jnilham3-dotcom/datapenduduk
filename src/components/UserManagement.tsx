import React, { useState, useEffect } from 'react';
import { 
  UserCircle, 
  Plus, 
  Trash2, 
  Shield, 
  User as UserIcon, 
  X,
  Check,
  AlertCircle,
  Key,
  Edit2,
  Lock,
  ChevronRight,
  Save,
  Eye,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { User, Role, RolePermission } from '../types';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

interface UserManagementProps {
  user: User | null;
}

const UserManagement: React.FC<UserManagementProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    id: undefined as number | undefined,
    username: '',
    password: '',
    nama_lengkap: '',
    roles: [] as Role[]
  });
  const [error, setError] = useState('');
  const [savingPermissions, setSavingPermissions] = useState(false);

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.roles?.includes('Administrator')) return true;
    return user.permissions?.includes(permission);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, permissionsData] = await Promise.all([
        api.getUsers(),
        api.getPermissions()
      ]);
      setUsers(usersData);
      setPermissions(permissionsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const data = await api.getPermissions();
      setPermissions(data);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || (!formData.id && !formData.password) || !formData.nama_lengkap || formData.roles.length === 0) {
      setError('Semua field harus diisi, minimal pilih satu role.');
      return;
    }

    try {
      await api.saveUser(formData);
      setIsModalOpen(false);
      setFormData({ id: undefined, username: '', password: '', nama_lengkap: '', roles: [] });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan user');
    }
  };

  const openEdit = (user: User) => {
    setFormData({
      id: user.id,
      username: user.username,
      password: '', // Don't show password
      nama_lengkap: user.nama_lengkap,
      roles: user.roles
    });
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setFormData({ id: undefined, username: '', password: '', nama_lengkap: '', roles: ['User'] });
    setIsModalOpen(true);
  };

  const toggleRole = (role: Role) => {
    setFormData(prev => {
      const currentRoles = Array.isArray(prev.roles) ? prev.roles : [];
      const roles = currentRoles.includes(role)
        ? currentRoles.filter(r => r !== role)
        : [...currentRoles, role];
      return { ...prev, roles };
    });
  };

  const openDeleteConfirm = (user: User) => {
    setSelectedUser(user);
    setIsDeleteConfirmOpen(true);
  };

  const openViewDetail = (user: User) => {
    setSelectedUser(user);
    setIsViewDetailOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await api.deleteUser(selectedUser.id);
      setIsDeleteConfirmOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const togglePermission = (role: Role, permission: string) => {
    setPermissions(prev => prev.map(rp => {
      if (rp.role === role) {
        const newPermissions = rp.permissions.includes(permission)
          ? rp.permissions.filter(p => p !== permission)
          : [...rp.permissions, permission];
        return { ...rp, permissions: newPermissions };
      }
      return rp;
    }));
  };

  const handleSavePermissions = async (role: Role) => {
    const rp = permissions.find(p => p.role === role);
    if (!rp) return;
    
    setSavingPermissions(true);
    try {
      await api.savePermissions(role, rp.permissions);
      alert(`Izin untuk role ${role} berhasil disimpan.`);
    } catch (err) {
      console.error('Error saving permissions:', err);
      alert('Gagal menyimpan izin.');
    } finally {
      setSavingPermissions(false);
    }
  };

  const permissionGroups = [
    {
      title: 'Menu Navigasi',
      items: [
        { key: 'menu_dashboard', label: 'Dashboard' },
        { key: 'menu_penduduk', label: 'Data Penduduk' },
        { key: 'menu_perangkat', label: 'Data Perangkat' },
        { key: 'menu_laporan', label: 'Ekspor & Laporan' },
        { key: 'menu_lembaga', label: 'Data Lembaga' },
        { key: 'menu_pengaturan', label: 'Pengaturan Desa' },
        { key: 'menu_users', label: 'Manajemen User' },
      ]
    },
    {
      title: 'Aksi & Data',
      items: [
        { key: 'action_edit_penduduk', label: 'Tambah/Edit Penduduk' },
        { key: 'action_delete_penduduk', label: 'Hapus Penduduk' },
        { key: 'action_edit_perangkat', label: 'Tambah/Edit Perangkat' },
        { key: 'action_delete_perangkat', label: 'Hapus Perangkat' },
        { key: 'action_edit_lembaga', label: 'Tambah/Edit Lembaga' },
        { key: 'action_delete_lembaga', label: 'Hapus Lembaga' },
        { key: 'action_edit_pengaturan', label: 'Simpan Pengaturan' },
        { key: 'action_manage_users', label: 'Kelola Akun User' },
      ]
    }
  ];

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'Administrator': return 'bg-red-50 text-red-600 border-red-100 shadow-sm shadow-red-500/5';
      case 'Admin': return 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-500/5';
      case 'User': return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5';
      default: return 'bg-slate-50 text-slate-600 border-slate-100 shadow-sm shadow-slate-500/5';
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Pengguna</h1>
          <p className="text-slate-500 mt-1">Kelola akun dan hak akses pengguna sistem.</p>
        </div>
        {activeTab === 'users' && hasPermission('action_manage_users') && (
          <button 
            onClick={openAdd}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center gap-2 font-semibold"
          >
            <Plus size={20} />
            <span>Tambah User</span>
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Daftar Pengguna
        </button>
        <button 
          onClick={() => setActiveTab('permissions')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'permissions' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Hak Akses Role
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pengguna</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role / Hak Akses</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dibuat Pada</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                        <span className="text-slate-400 font-medium">Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-300">
                        <UserCircle size={48} />
                        <span className="text-slate-400 font-medium">Belum ada data user</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {users.map((u) => (
                      <motion.tr 
                        key={u.id} 
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 shadow-sm group-hover:bg-white group-hover:border-emerald-100 group-hover:text-emerald-500 transition-all duration-300">
                              <UserIcon size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 leading-none">{u.nama_lengkap}</span>
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1.5 font-semibold">ID: #{u.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono text-slate-500">{u.username}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {u.roles?.map(role => (
                              <span key={role} className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getRoleBadge(role)}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  role === 'Administrator' ? 'bg-red-500' : 
                                  role === 'Admin' ? 'bg-blue-500' : 
                                  'bg-emerald-500'
                                }`} />
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-500">{new Date(u.created_at || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => openViewDetail(u)}
                              className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                              title="Detail"
                            >
                              <Eye size={18} />
                            </button>
                            {hasPermission('action_manage_users') && (
                              <>
                                <button 
                                  onClick={() => openEdit(u)}
                                  className="p-2 text-slate-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                  title="Edit"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button 
                                  onClick={() => openDeleteConfirm(u)}
                                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="Hapus"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {(['Administrator', 'Admin', 'User'] as Role[]).map(role => {
            const rolePerms = permissions.find(p => p.role === role);
            return (
              <div key={role} className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getRoleBadge(role)}`}>
                      <Shield size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Izin Role: {role}</h3>
                      <p className="text-xs text-slate-500">Tentukan apa yang bisa diakses oleh {role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSavePermissions(role)}
                    disabled={savingPermissions}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>Simpan</span>
                  </button>
                </div>

                <div className="p-6 space-y-8 flex-1">
                  {permissionGroups.map(group => (
                    <div key={group.title} className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{group.title}</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {group.items.map(item => (
                          <label 
                            key={item.key} 
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                              rolePerms?.permissions.includes(item.key) 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                                : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span className="text-sm font-semibold">{item.label}</span>
                            <div className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={rolePerms?.permissions.includes(item.key) || false}
                                onChange={() => togglePermission(role, item.key)}
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-500 text-white">
              <h2 className="text-xl font-bold">{formData.id ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Nama Lengkap</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon size={16} />
                  </div>
                  <input 
                    type="text" 
                    value={formData.nama_lengkap}
                    onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Masukkan nama lengkap..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserCircle size={16} />
                  </div>
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Masukkan username..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Password {formData.id && '(Kosongkan jika tidak ingin merubah)'}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Key size={16} />
                  </div>
                  <input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder={formData.id ? "Biarkan kosong untuk tetap..." : "Masukkan password..."}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">Role / Hak Akses (Bisa pilih lebih dari satu)</label>
                <div className="grid grid-cols-1 gap-2">
                  {(['Administrator', 'Admin', 'User'] as Role[]).map(role => {
                    const isChecked = Array.isArray(formData.roles) && formData.roles.includes(role);
                    return (
                      <label 
                        key={role} 
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked 
                            ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/10' 
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getRoleBadge(role)}`}>
                            <Shield size={16} />
                          </div>
                          <span className={`text-sm font-bold ${isChecked ? 'text-emerald-900' : 'text-slate-700'}`}>{role}</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => toggleRole(role)}
                          className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                >
                  Tutup
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-[0.98]"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && selectedUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center"
          >
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Hapus Pengguna?</h2>
            <p className="text-slate-500 mb-8">
              Apakah Anda yakin ingin menghapus akun <strong>{selectedUser.nama_lengkap}</strong>? Pengguna ini tidak akan bisa masuk ke sistem lagi.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-[0.98]"
              >
                Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* View Detail Modal */}
      {isViewDetailOpen && selectedUser && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <h2 className="text-xl font-bold">Detail Pengguna</h2>
              <button onClick={() => setIsViewDetailOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
                <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mb-4 overflow-hidden border-4 border-white shadow-xl">
                  {selectedUser.foto_profil ? (
                    <img src={selectedUser.foto_profil} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={48} />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{selectedUser.nama_lengkap}</h3>
                <p className="text-slate-500 font-mono text-sm">@{selectedUser.username}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hak Akses / Role</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedUser.roles?.map(role => (
                        <span key={role} className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoleBadge(role)}`}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terdaftar Sejak</p>
                    <p className="text-sm font-bold text-slate-700">
                      {new Date(selectedUser.created_at || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                    <Lock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Akun</p>
                    <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                      <Check size={14} /> Aktif
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setIsViewDetailOpen(false)}
                className="w-full py-3 mt-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
