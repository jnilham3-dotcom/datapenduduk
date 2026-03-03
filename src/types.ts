export type Role = 'Administrator' | 'Admin' | 'User';

export interface User {
  id: number;
  username: string;
  nama_lengkap: string;
  roles: Role[];
  permissions: string[];
  foto_profil?: string;
  created_at: string;
}

export interface RolePermission {
  role: Role;
  permissions: string[];
}

export interface Penduduk {
  id: number;
  no_kk: string;
  nik: string;
  nama_lengkap: string;
  jenis_kelamin: 'Laki-Laki' | 'Perempuan';
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  agama: string;
  pendidikan: string;
  jenis_pekerjaan: string;
  golongan_darah: string;
  status_perkawinan: string;
  hubungan_keluarga: string;
  kewarganegaraan: string;
  nama_ayah: string;
  nama_ibu: string;
  created_at: string;
}

export interface Perangkat {
  id: number;
  nik: string;
  nama: string;
  jabatan: string;
  sk_pengangkatan: string;
  tanggal_sk: string;
  status_aktif: number;
}

export interface Lembaga {
  id: number;
  nama_lembaga: string;
  nik_pengurus: string;
  nama_pengurus: string;
  jabatan: string;
}

export interface Pengaturan {
  id: number;
  nama_desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kode_pos: string;
  nama_kepala_desa: string;
  logo_url: string;
}

export interface DashboardStats {
  totalPenduduk: number;
  totalKK: number;
  totalLaki: number;
  totalPerempuan: number;
  dusunStats: { dusun: string; count: number }[];
  ageStats: {
    balita: number;
    kanak: number;
    remaja: number;
    dewasa: number;
    lansia: number;
    manula: number;
  };
}
