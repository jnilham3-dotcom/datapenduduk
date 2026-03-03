import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Home, 
  MapPin,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DashboardStats } from '../types';
import { api } from '../services/api';
import { motion } from 'motion/react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'Gagal mengambil data statistik');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center gap-6 max-w-lg text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center shadow-inner">
            <AlertTriangle size={40} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Koneksi Terputus</h2>
            <p className="text-slate-500 leading-relaxed">
              {error?.includes('Google Apps Script') 
                ? 'Sistem tidak dapat terhubung ke database Google Sheets. Pastikan URL Web App sudah benar dan script sudah dideploy.'
                : 'Terjadi kesalahan saat mengambil data statistik dari server. Silakan periksa koneksi internet Anda.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button 
              onClick={fetchStats}
              className="flex-1 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <TrendingUp size={20} className="rotate-0" />
              <span>Coba Muat Ulang</span>
            </button>
            
            {error?.includes('Google Apps Script') && (
              <button 
                onClick={() => {
                  (window as any).FORCE_LOCAL_BACKEND = true;
                  fetchStats();
                }}
                className="flex-1 bg-white text-slate-900 border-2 border-slate-100 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95"
              >
                Mode Lokal
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-slate-50 w-full">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Error Code: {error?.split(':')[0] || 'UNKNOWN_ERR'}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const ageData = [
    { name: 'Balita (0-5)', value: stats.ageStats.balita },
    { name: 'Kanak (6-11)', value: stats.ageStats.kanak },
    { name: 'Remaja (12-25)', value: stats.ageStats.remaja },
    { name: 'Dewasa (26-45)', value: stats.ageStats.dewasa },
    { name: 'Lansia (46-65)', value: stats.ageStats.lansia },
    { name: 'Manula (>65)', value: stats.ageStats.manula },
  ];

  const dusunData = stats.dusunStats.map(d => ({
    name: d.dusun,
    count: d.count
  }));

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Utama</h1>
          <p className="text-slate-500 mt-1">Ringkasan data kependudukan desa hari ini.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-slate-600">Sistem Online</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Penduduk', value: stats.totalPenduduk, icon: Users, color: 'bg-blue-500', text: 'Jiwa' },
          { label: 'Total KK', value: stats.totalKK, icon: Home, color: 'bg-emerald-500', text: 'Kepala Keluarga' },
          { label: 'Laki-Laki', value: stats.totalLaki, icon: UserCheck, color: 'bg-indigo-500', text: 'Jiwa' },
          { label: 'Perempuan', value: stats.totalPerempuan, icon: UserPlus, color: 'bg-pink-500', text: 'Jiwa' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 card-hover relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color} opacity-[0.03] rounded-bl-full`} />
            <div className="flex items-center gap-4">
              <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg shadow-${stat.color.split('-')[1]}-500/20`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</h3>
                  <span className="text-xs text-slate-400 font-medium">{stat.text}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dusun Summary Table */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg text-blue-600">
                <MapPin size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Rekapitulasi per Dusun</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Dusun</th>
                  <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Jumlah Penduduk</th>
                  <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.dusunStats.map((d, i) => (
                  <tr key={i} className="group hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-bold text-slate-700">{d.dusun}</td>
                    <td className="py-4 text-right font-mono text-slate-600">{d.count.toLocaleString()} Jiwa</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-xs font-bold text-slate-400">
                          {((d.count / stats.totalPenduduk) * 100).toFixed(1)}%
                        </span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${(d.count / stats.totalPenduduk) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Age Categories Bar Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-600">
                <BarChartIcon size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Kelompok Umur (Kemenkes)</h2>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
