import React, { useState } from 'react';
import { 
  FileDown, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Users, 
  Briefcase, 
  Building2,
  CheckCircle2
} from 'lucide-react';
const LaporanPage: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const exportToExcel = async (type: 'penduduk' | 'perangkat' | 'lembaga') => {
    setLoading(type);
    try {
      const XLSX = await import('xlsx');
      const response = await fetch(`/api/${type}`);
      const result = await response.json();
      const data = type === 'penduduk' ? result.data : result;

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, type.toUpperCase());
      XLSX.writeFile(wb, `Data_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setSuccess(`Berhasil mengekspor Data ${type} ke Excel`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(null);
    }
  };

  const exportToPDF = async (type: 'penduduk' | 'perangkat' | 'lembaga') => {
    setLoading(type);
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const response = await fetch(`/api/${type}`);
      const result = await response.json();
      const data = type === 'penduduk' ? result.data : result;

      const doc = new jsPDF();
      doc.text(`Laporan Data ${type.toUpperCase()}`, 14, 15);
      
      const headers = Object.keys(data[0] || {}).filter(k => !['id', 'created_at'].includes(k));
      const body = data.map((item: any) => headers.map(h => item[h]));

      autoTable(doc, {
        head: [headers.map(h => h.replace('_', ' ').toUpperCase())],
        body: body,
        startY: 20,
        styles: { fontSize: 8 },
      });

      doc.save(`Data_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setSuccess(`Berhasil mengekspor Data ${type} ke PDF`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Ekspor & Laporan</h1>
        <p className="text-slate-500 mt-1">Unduh data kependudukan, perangkat, dan lembaga dalam format Excel atau PDF.</p>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-600 font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={20} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { id: 'penduduk', label: 'Data Penduduk', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { id: 'perangkat', label: 'Data Perangkat', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { id: 'lembaga', label: 'Data Lembaga', icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((item) => (
          <div key={item.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden card-hover">
            <div className={`p-8 ${item.bg} border-b border-slate-100 flex items-center gap-4`}>
              <div className={`p-3 bg-white rounded-2xl shadow-sm ${item.color}`}>
                <item.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{item.label}</h3>
            </div>
            <div className="p-8 space-y-4">
              <button 
                onClick={() => exportToExcel(item.id as any)}
                disabled={loading !== null}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-emerald-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <FileSpreadsheet size={20} />
                  </div>
                  <span className="font-bold text-slate-700">Format Excel (.xlsx)</span>
                </div>
                {loading === item.id ? (
                  <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                ) : (
                  <Download size={18} className="text-slate-300 group-hover:text-emerald-500" />
                )}
              </button>

              <button 
                onClick={() => exportToPDF(item.id as any)}
                disabled={loading !== null}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-red-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <FileText size={20} />
                  </div>
                  <span className="font-bold text-slate-700">Format PDF (.pdf)</span>
                </div>
                {loading === item.id ? (
                  <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                ) : (
                  <Download size={18} className="text-slate-300 group-hover:text-red-500" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold mb-3">Butuh Laporan Kustom?</h2>
            <p className="text-slate-400">
              Sistem ini mendukung pembuatan laporan periodik otomatis. Hubungi administrator untuk konfigurasi jadwal pengiriman laporan ke email.
            </p>
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]">
            Hubungi Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaporanPage;
