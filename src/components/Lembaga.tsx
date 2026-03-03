import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Trash2, 
  Building2, 
  UserPlus, 
  X,
  Check,
  AlertCircle,
  Users2,
  Eye,
  Users
} from 'lucide-react';
import { Lembaga, Penduduk, User } from '../types';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

interface LembagaProps {
  user: User | null;
}

const LembagaPage: React.FC<LembagaProps> = ({ user }) => {
  const { type } = useParams<{ type: string }>();
  const [lembaga, setLembaga] = useState<Lembaga[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Lembaga | null>(null);
  const [selectedPenduduk, setSelectedPenduduk] = useState<Penduduk | null>(null);
  const [searchNIK, setSearchNIK] = useState('');
  const [foundPenduduk, setFoundPenduduk] = useState<Penduduk | null>(null);
  const [jabatan, setJabatan] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.roles?.includes('Administrator')) return true;
    return user.permissions?.includes(permission);
  };

  useEffect(() => {
    fetchLembaga();
  }, [type]);

  const fetchLembaga = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getLembaga(type || '');
      setLembaga(data);
    } catch (err: any) {
      console.error('Error fetching lembaga:', err);
      setError(err.message || 'Gagal mengambil data dari server');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPenduduk = async () => {
    if (!searchNIK || !/^\d{16}$/.test(searchNIK)) {
      setError('NIK harus berupa 16 digit angka');
      return;
    }
    try {
      const data = await api.getPendudukByNIK(searchNIK);
      if (data) {
        setFoundPenduduk(data);
        setError('');
      } else {
        setFoundPenduduk(null);
        setError('Data penduduk tidak ditemukan.');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mencari data.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundPenduduk) {
      setError('Silakan cari data penduduk terlebih dahulu');
      return;
    }
    if (!jabatan || jabatan.trim().length < 2) {
      setError('Jabatan wajib diisi (minimal 2 karakter)');
      return;
    }
    if (!type) return;
    setError('');
    setSuccessMessage('');

    try {
      await api.saveLembaga({
        nama_lembaga: type,
        nik_pengurus: foundPenduduk.nik,
        nama_pengurus: foundPenduduk.nama_lengkap,
        jabatan
      });
      setSuccessMessage('Data berhasil tersimpan');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage('');
        setSearchNIK('');
        setFoundPenduduk(null);
        setJabatan('');
        fetchLembaga();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data');
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await api.deleteLembaga(selectedItem.id);
      setIsDeleteOpen(false);
      setSelectedItem(null);
      fetchLembaga();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleShowDetail = async (nik: string) => {
    try {
      const data = await api.getPendudukByNIK(nik);
      if (data) {
        setSelectedPenduduk(data);
        setIsDetailOpen(true);
      }
    } catch (err) {
      console.error('Error fetching detail:', err);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Lembaga: {type}</h1>
          <p className="text-slate-500 mt-1">Kelola struktur kepengurusan {type} desa.</p>
        </div>
        {hasPermission('action_edit_lembaga') && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center gap-2 font-semibold"
          >
            <Plus size={20} />
            <span>Tambah Pengurus</span>
          </button>
        )}
      </div>

      {error && !isModalOpen && !isDetailOpen && !isDeleteOpen && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 animate-pulse">
          <AlertCircle size={20} />
          <div className="flex-1">
            <p className="text-sm font-bold">Gagal Memuat Data</p>
            <p className="text-xs opacity-80">{error}</p>
          </div>
          <button 
            onClick={fetchLembaga}
            className="bg-red-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-red-700 transition-all"
          >
            Coba Lagi
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-pulse">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl mb-4" />
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))
        ) : lembaga.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl shadow-sm border border-slate-100 text-center">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users2 size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Belum ada data pengurus {type}</h3>
            <p className="text-slate-500">Klik tombol "Tambah Pengurus" untuk memulai.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {lembaga.map((item) => (
              <motion.div 
                key={item.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 card-hover relative group"
              >
                <div className="absolute top-4 right-4 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => handleShowDetail(item.nik_pengurus)}
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                    title="Detail Penduduk"
                  >
                    <Eye size={18} />
                  </button>
                  {hasPermission('action_delete_lembaga') && (
                    <button 
                      onClick={() => { setSelectedItem(item); setIsDeleteOpen(true); }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Hapus"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
                    <Users2 size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{item.nama_pengurus}</h3>
                    <p className="text-blue-600 font-bold text-sm mt-1">{item.jabatan}</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold">NIK:</span>
                        <span className="font-mono">{item.nik_pengurus}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-500 text-white">
              <h2 className="text-xl font-bold">Tambah Pengurus {type}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-sm font-bold">
                  <Check size={18} />
                  <span>{successMessage}</span>
                </div>
              )}
              {/* Search Section */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Cari Data Penduduk (NIK)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search size={16} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Masukkan 16 digit NIK..."
                      value={searchNIK}
                      onChange={(e) => setSearchNIK(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <button 
                    onClick={handleSearchPenduduk}
                    className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all"
                  >
                    Cari
                  </button>
                </div>
                {error && <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1"><AlertCircle size={12} /> {error}</p>}
              </div>

              {foundPenduduk && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                    <Check size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Penduduk Ditemukan</p>
                    <p className="font-bold text-slate-900">{foundPenduduk.nama_lengkap}</p>
                    <p className="text-xs text-slate-500">{foundPenduduk.alamat}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Jabatan dalam Lembaga</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Contoh: Ketua, Sekretaris, Anggota..."
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
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
                    disabled={!foundPenduduk}
                    className="flex-1 px-6 py-3 rounded-xl bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:bg-slate-200 disabled:shadow-none transition-all active:scale-[0.98]"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedPenduduk && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
              <h2 className="text-xl font-bold">Detail Data Pengurus</h2>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <Users size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedPenduduk.nama_lengkap}</h3>
                  <p className="text-slate-500 font-medium">NIK: {selectedPenduduk.nik}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                {[
                  { label: 'No. Kartu Keluarga', value: selectedPenduduk.no_kk },
                  { label: 'Tempat, Tgl Lahir', value: `${selectedPenduduk.tempat_lahir}, ${selectedPenduduk.tanggal_lahir}` },
                  { label: 'Jenis Kelamin', value: selectedPenduduk.jenis_kelamin },
                  { label: 'Agama', value: selectedPenduduk.agama },
                  { label: 'Pendidikan', value: selectedPenduduk.pendidikan },
                  { label: 'Pekerjaan', value: selectedPenduduk.jenis_pekerjaan },
                  { label: 'Status Kawin', value: selectedPenduduk.status_perkawinan },
                  { label: 'Hubungan Keluarga', value: selectedPenduduk.hubungan_keluarga },
                  { label: 'Golongan Darah', value: selectedPenduduk.golongan_darah },
                  { label: 'Kewarganegaraan', value: selectedPenduduk.kewarganegaraan },
                  { label: 'Nama Ayah', value: selectedPenduduk.nama_ayah },
                  { label: 'Nama Ibu', value: selectedPenduduk.nama_ibu },
                ].map((info, i) => (
                  <div key={i}>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{info.label}</p>
                    <p className="text-slate-700 font-semibold">{info.value || '-'}</p>
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alamat Lengkap</p>
                <p className="text-slate-700 font-semibold">
                  {selectedPenduduk.alamat}, RT {selectedPenduduk.rt} / RW {selectedPenduduk.rw}, Dusun {selectedPenduduk.dusun}
                </p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsDetailOpen(false)}
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
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Hapus Pengurus?</h2>
            <p className="text-slate-500 mb-8">
              Apakah Anda yakin ingin menghapus <strong>{selectedItem.nama_pengurus}</strong> dari daftar pengurus lembaga? Peringatan: Tindakan ini tidak dapat dibatalkan.
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
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LembagaPage;
