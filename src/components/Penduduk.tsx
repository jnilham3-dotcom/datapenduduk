import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Eye, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  X,
  Check,
  AlertTriangle,
  Download,
  MapPin
} from 'lucide-react';
import { Penduduk, Role, User } from '../types';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

interface PendudukProps {
  user: User | null;
}

const PendudukPage: React.FC<PendudukProps> = ({ user }) => {
  const [data, setData] = useState<Penduduk[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dusun, setDusun] = useState('Semua');
  const [hubunganFilter, setHubunganFilter] = useState('Kepala Keluarga');
  const [limit, setLimit] = useState('10');
  const [page, setPage] = useState(0);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFamilyOpen, setIsFamilyOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<Penduduk | null>(null);
  const [familyMembers, setFamilyMembers] = useState<Penduduk[]>([]);
  const [formData, setFormData] = useState<Partial<Penduduk>>({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.roles?.includes('Administrator')) return true;
    return user.permissions?.includes(permission);
  };

  const dusunList = ['Ciodeng', 'Sukawangi', 'Sinargalih 1', 'Sinargalih 2', 'Panguyuhan 1', 'Panguyuhan 2'];
  const hubunganList = ['Semua', 'Kepala Keluarga', 'Istri', 'Anak', 'Cucu', 'Orang Tua', 'Mertua', 'Lainnya'];
  const limitOptions = ['10', '25', '50', '100', 'Semua'];

  useEffect(() => {
    fetchData();
  }, [search, dusun, hubunganFilter, limit, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const offset = page * (limit === 'Semua' ? 0 : parseInt(limit));
      const result = await api.getPenduduk({ 
        search, 
        dusun, 
        limit, 
        offset, 
        hubungan_keluarga: hubunganFilter === 'Semua' ? '' : hubunganFilter
      });
      setData(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    // Validation
    if (!formData.nik || formData.nik.length !== 16) {
      setFormError('NIK harus 16 digit');
      return;
    }
    if (!formData.no_kk || formData.no_kk.length !== 16) {
      setFormError('No. KK harus 16 digit');
      return;
    }

    try {
      await api.savePenduduk(formData);
      setSuccessMessage('Data berhasil tersimpan');
      setTimeout(() => {
        setIsFormOpen(false);
        setSuccessMessage('');
        fetchData();
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await api.deletePenduduk(selectedItem.id);
      setIsDeleteOpen(false);
      
      // If we were in a sub-view, refresh that too
      if (isFamilyOpen) {
        const members = await api.getPendudukByKK(selectedItem.no_kk);
        setFamilyMembers(members);
      }
      
      if (isDetailOpen) {
        setIsDetailOpen(false);
      }
      
      fetchData();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const openDetail = async (item: Penduduk) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
    // Also fetch family members for the detail view
    try {
      const members = await api.getPendudukByKK(item.no_kk);
      setFamilyMembers(members);
    } catch (err) {
      console.error('Error fetching family:', err);
    }
  };

  const openFamily = async (item: Penduduk) => {
    setSelectedItem(item);
    try {
      const members = await api.getPendudukByKK(item.no_kk);
      setFamilyMembers(members);
      setIsFamilyOpen(true);
    } catch (err) {
      console.error('Error fetching family:', err);
    }
  };

  const openEdit = (item: Penduduk) => {
    setFormData(item);
    setIsFormOpen(true);
  };

  const openAdd = () => {
    setFormData({
      jenis_kelamin: 'Laki-Laki',
      agama: 'Islam',
      pendidikan: 'SMA/Sederajat',
      status_perkawinan: 'Belum Kawin',
      hubungan_keluarga: 'Kepala Keluarga',
      kewarganegaraan: 'WNI',
      golongan_darah: 'Tidak Tahu',
      dusun: dusunList[0]
    });
    setFormError('');
    setSuccessMessage('');
    setIsFormOpen(true);
  };

  const openAddFamilyMember = (kk: string, dusunName: string, alamat: string, rt: string, rw: string) => {
    setFormData({
      no_kk: kk,
      dusun: dusunName,
      alamat: alamat,
      rt: rt,
      rw: rw,
      jenis_kelamin: 'Perempuan',
      agama: 'Islam',
      pendidikan: 'SMA/Sederajat',
      status_perkawinan: 'Kawin',
      hubungan_keluarga: 'Istri',
      kewarganegaraan: 'WNI',
      golongan_darah: 'Tidak Tahu',
    });
    setFormError('');
    setSuccessMessage('');
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Penduduk</h1>
          <p className="text-slate-500 mt-1">Kelola data kependudukan desa secara efisien.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
            <Users size={18} className="text-emerald-500" />
            <span className="text-sm font-bold text-slate-700">Total: {total} Jiwa</span>
          </div>
          {hasPermission('action_edit_penduduk') && (
            <button 
              onClick={openAdd}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center gap-2 font-semibold"
            >
              <Plus size={20} />
              <span>Tambah Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Cari berdasarkan NIK, No. KK, atau Nama..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={hubunganFilter}
              onChange={(e) => { setHubunganFilter(e.target.value); setPage(0); }}
              className="bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer"
            >
              {hubunganList.map(h => <option key={h} value={h}>{h === 'Semua' ? 'Semua Status' : h}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <MapPin size={16} className="text-slate-400" />
            <select 
              value={dusun}
              onChange={(e) => { setDusun(e.target.value); setPage(0); }}
              className="bg-transparent text-sm font-medium text-slate-600 outline-none cursor-pointer"
            >
              <option value="Semua">Semua Dusun</option>
              {dusunList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <span className="text-sm text-slate-400 font-medium">Tampilkan:</span>
            <select 
              value={limit}
              onChange={(e) => { setLimit(e.target.value); setPage(0); }}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
            >
              {limitOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">No.</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Identitas Penduduk</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Alamat & Dusun</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Aksi</th>
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
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-100 p-4 rounded-full text-slate-300">
                        <Users size={48} />
                      </div>
                      <span className="text-slate-400 font-medium">Tidak ada data ditemukan</span>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {data.map((item, index) => (
                    <motion.tr 
                      key={item.id} 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onClick={() => openDetail(item)}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-400">
                        {page * (limit === 'Semua' ? 0 : parseInt(limit)) + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-base">{item.nama_lengkap}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">NIK: {item.nik}</span>
                            <span className="text-xs font-mono bg-blue-50 text-blue-500 px-2 py-0.5 rounded">KK: {item.no_kk}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-600 font-medium">{item.alamat}</span>
                          <span className="text-xs text-slate-400 mt-1">RT {item.rt} / RW {item.rw} - Dusun {item.dusun}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit ${
                            item.jenis_kelamin === 'Laki-Laki' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                          }`}>
                            {item.jenis_kelamin}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{item.hubungan_keluarga}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openDetail(item)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" 
                            title="Detail"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => openFamily(item)}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 text-emerald-50 rounded-lg transition-all" 
                            title="Anggota Keluarga"
                          >
                            <Users size={18} />
                          </button>
                          {hasPermission('action_edit_penduduk') && (
                            <button 
                              onClick={() => openEdit(item)}
                              className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" 
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                          {hasPermission('action_delete_penduduk') && (
                            <button 
                              onClick={() => { setSelectedItem(item); setIsDeleteOpen(true); }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" 
                              title="Hapus"
                            >
                              <Trash2 size={18} />
                            </button>
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

        {/* Pagination */}
        {limit !== 'Semua' && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-slate-500 font-medium order-2 sm:order-1">
              Menampilkan <span className="text-slate-900 font-bold">{data.length}</span> dari <span className="text-slate-900 font-bold">{total}</span> data
            </span>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button 
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all active:scale-95"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-1">
                {(() => {
                  const totalPages = Math.ceil(total / parseInt(limit));
                  const pages = [];
                  const maxVisible = 5;
                  
                  let start = Math.max(0, page - Math.floor(maxVisible / 2));
                  let end = Math.min(totalPages, start + maxVisible);
                  
                  if (end - start < maxVisible) {
                    start = Math.max(0, end - maxVisible);
                  }

                  if (start > 0) {
                    pages.push(
                      <button key={0} onClick={() => setPage(0)} className="w-9 h-9 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-all">1</button>
                    );
                    if (start > 1) pages.push(<span key="dots-start" className="px-1 text-slate-300">...</span>);
                  }

                  for (let i = start; i < end; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                          page === i ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110 z-10' : 'text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  }

                  if (end < totalPages) {
                    if (end < totalPages - 1) pages.push(<span key="dots-end" className="px-1 text-slate-300">...</span>);
                    pages.push(
                      <button key={totalPages - 1} onClick={() => setPage(totalPages - 1)} className="w-9 h-9 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-all">{totalPages}</button>
                    );
                  }

                  return pages;
                })()}
              </div>

              <button 
                disabled={page >= Math.ceil(total / parseInt(limit)) - 1}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all active:scale-95"
                title="Halaman Berikutnya"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-500 text-white">
              <h2 className="text-xl font-bold">{formData.id ? 'Edit Data Penduduk' : 'Tambah Data Penduduk'}</h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8">
              {formError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-medium">
                  <AlertTriangle size={18} />
                  <span>{formError}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-sm font-bold">
                  <Check size={18} />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Section 1: Identitas Dasar */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600">
                      <span className="font-bold text-sm">01</span>
                    </div>
                    <h3 className="font-bold text-slate-800">Identitas Dasar</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                      <input 
                        required
                        type="text" 
                        value={formData.nama_lengkap || ''} 
                        onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">NIK (16 Digit)</label>
                        <input 
                          required
                          maxLength={16}
                          type="text" 
                          value={formData.nik || ''} 
                          onChange={(e) => setFormData({...formData, nik: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">No. KK (16 Digit)</label>
                        <input 
                          required
                          maxLength={16}
                          type="text" 
                          value={formData.no_kk || ''} 
                          onChange={(e) => setFormData({...formData, no_kk: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Kelahiran & Fisik */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-8 h-8 bg-pink-500/10 rounded-lg flex items-center justify-center text-pink-600">
                      <span className="font-bold text-sm">02</span>
                    </div>
                    <h3 className="font-bold text-slate-800">Kelahiran & Fisik</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Jenis Kelamin</label>
                        <select 
                          value={formData.jenis_kelamin || 'Laki-Laki'} 
                          onChange={(e) => setFormData({...formData, jenis_kelamin: e.target.value as any})}
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        >
                          <option value="Laki-Laki">Laki-Laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Golongan Darah</label>
                        <select 
                          value={formData.golongan_darah || 'O'} 
                          onChange={(e) => setFormData({...formData, golongan_darah: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        >
                          {['Tidak Tahu', 'A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Tempat Lahir</label>
                        <input 
                          type="text" 
                          value={formData.tempat_lahir || ''} 
                          onChange={(e) => setFormData({...formData, tempat_lahir: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Tanggal Lahir</label>
                        <input 
                          type="date" 
                          value={formData.tanggal_lahir || ''} 
                          onChange={(e) => setFormData({...formData, tanggal_lahir: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Sosial & Pendidikan */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-600">
                      <span className="font-bold text-sm">03</span>
                    </div>
                    <h3 className="font-bold text-slate-800">Sosial & Pendidikan</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Agama</label>
                      <select 
                        value={formData.agama || 'Islam'} 
                        onChange={(e) => setFormData({...formData, agama: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      >
                        {['Islam', 'Kristen', 'Katolik', 'Hindu', 'Budha', 'Konghucu'].map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Pendidikan</label>
                      <select 
                        value={formData.pendidikan || 'SMA/Sederajat'} 
                        onChange={(e) => setFormData({...formData, pendidikan: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      >
                        {['Tidak Sekolah', 'SD', 'SMP', 'SMA/Sederajat', 'D1/D2/D3', 'S1/D4', 'S2', 'S3'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Pekerjaan</label>
                      <input 
                        type="text" 
                        value={formData.jenis_pekerjaan || ''} 
                        onChange={(e) => setFormData({...formData, jenis_pekerjaan: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Status Kawin</label>
                      <select 
                        value={formData.status_perkawinan || 'Belum Kawin'} 
                        onChange={(e) => setFormData({...formData, status_perkawinan: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      >
                        {['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Hubungan Keluarga</label>
                      <select 
                        value={formData.hubungan_keluarga || 'Kepala Keluarga'} 
                        onChange={(e) => setFormData({...formData, hubungan_keluarga: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      >
                        {['Kepala Keluarga', 'Istri', 'Anak', 'Cucu', 'Orang Tua', 'Mertua', 'Lainnya'].map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Kewarganegaraan</label>
                      <select 
                        value={formData.kewarganegaraan || 'WNI'} 
                        onChange={(e) => setFormData({...formData, kewarganegaraan: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      >
                        <option value="WNI">WNI</option>
                        <option value="WNA">WNA</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 4: Orang Tua & Alamat */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-600">
                      <span className="font-bold text-sm">04</span>
                    </div>
                    <h3 className="font-bold text-slate-800">Orang Tua & Alamat</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Ayah</label>
                      <input 
                        type="text" 
                        value={formData.nama_ayah || ''} 
                        onChange={(e) => setFormData({...formData, nama_ayah: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Ibu</label>
                      <input 
                        type="text" 
                        value={formData.nama_ibu || ''} 
                        onChange={(e) => setFormData({...formData, nama_ibu: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Alamat Lengkap</label>
                    <textarea 
                      rows={2}
                      value={formData.alamat || ''} 
                      onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">RT</label>
                      <input 
                        type="text" 
                        value={formData.rt || ''} 
                        onChange={(e) => setFormData({...formData, rt: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">RW</label>
                      <input 
                        type="text" 
                        value={formData.rw || ''} 
                        onChange={(e) => setFormData({...formData, rw: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Dusun</label>
                      <select 
                        value={formData.dusun || dusunList[0]} 
                        onChange={(e) => setFormData({...formData, dusun: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      >
                        {dusunList.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                >
                  Tutup
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 rounded-xl bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-[0.98]"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
              <h2 className="text-xl font-bold">Detail Data Penduduk</h2>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <Users size={48} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-900">{selectedItem.nama_lengkap}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-mono bg-slate-100 text-slate-600 px-3 py-1 rounded-lg border border-slate-200">NIK: {selectedItem.nik}</span>
                    <span className="text-sm font-mono bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-100">KK: {selectedItem.no_kk}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 grid grid-cols-2 gap-y-6 gap-x-8">
                  {[
                    { label: 'Tempat, Tgl Lahir', value: `${selectedItem.tempat_lahir}, ${selectedItem.tanggal_lahir}` },
                    { label: 'Jenis Kelamin', value: selectedItem.jenis_kelamin },
                    { label: 'Agama', value: selectedItem.agama },
                    { label: 'Pendidikan', value: selectedItem.pendidikan },
                    { label: 'Pekerjaan', value: selectedItem.jenis_pekerjaan },
                    { label: 'Status Kawin', value: selectedItem.status_perkawinan },
                    { label: 'Hubungan Keluarga', value: selectedItem.hubungan_keluarga },
                    { label: 'Golongan Darah', value: selectedItem.golongan_darah },
                    { label: 'Kewarganegaraan', value: selectedItem.kewarganegaraan },
                    { label: 'Nama Ayah', value: selectedItem.nama_ayah },
                    { label: 'Nama Ibu', value: selectedItem.nama_ibu },
                  ].map((info, i) => (
                    <div key={i}>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{info.label}</p>
                      <p className="text-slate-700 font-semibold">{info.value || '-'}</p>
                    </div>
                  ))}
                  <div className="col-span-2 pt-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Alamat Lengkap</p>
                    <p className="text-slate-700 font-semibold leading-relaxed">
                      {selectedItem.alamat}, RT {selectedItem.rt} / RW {selectedItem.rw}, Dusun {selectedItem.dusun}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-emerald-500" />
                    Anggota Keluarga
                  </h4>
                  <div className="space-y-3">
                    {familyMembers.length > 0 ? (
                      familyMembers.map(member => (
                        <div key={member.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group/item">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{member.nama_lengkap}</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">{member.hubungan_keluarga}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setIsDetailOpen(false); openEdit(member); }}
                              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => { setSelectedItem(member); setIsDeleteOpen(true); }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">Memuat data keluarga...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => openAddFamilyMember(selectedItem.no_kk, selectedItem.dusun, selectedItem.alamat, selectedItem.rt, selectedItem.rw)}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <Plus size={18} />
                Tambah Anggota Keluarga
              </button>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="px-8 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Family Modal */}
      {isFamilyOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-500 text-white">
              <div className="flex items-center gap-3">
                <Users size={24} />
                <h2 className="text-xl font-bold">Anggota Keluarga (KK: {selectedItem.no_kk})</h2>
              </div>
              <button onClick={() => setIsFamilyOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8">
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">NIK</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Nama Lengkap</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Hubungan</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Jenis Kelamin</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {familyMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-slate-600">{member.nik}</td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-900">{member.nama_lengkap}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-600">{member.hubungan_keluarga}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            member.jenis_kelamin === 'Laki-Laki' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
                          }`}>
                            {member.jenis_kelamin}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              onClick={() => { setIsFamilyOpen(false); openEdit(member); }}
                              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => { setSelectedItem(member); setIsDeleteOpen(true); }}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsFamilyOpen(false)}
                className="px-6 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Hapus Data?</h2>
            <p className="text-slate-500 mb-8">
              Apakah Anda yakin ingin menghapus data <strong>{selectedItem.nama_lengkap}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-[0.98]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendudukPage;
