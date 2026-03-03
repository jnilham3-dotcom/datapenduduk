/**
 * API Service Layer
 * Supports both standard fetch (Express) and google.script.run (Google Apps Script)
 */

declare const google: any;

const isGAS = typeof google !== 'undefined' && google.script && google.script.run;
const GAS_URL = (import.meta.env.VITE_GAS_URL || '').trim();
// Only use GAS if it's a real URL and not a placeholder
export const isValidGasUrl = GAS_URL && GAS_URL.startsWith('http') && !GAS_URL.includes('YOUR_GAS_URL') && !GAS_URL.includes('MASUKKAN_URL');
export const useGAS = () => {
  if ((window as any).FORCE_LOCAL_BACKEND) return false;
  return isGAS || isValidGasUrl;
};

console.log('API Service initialized. useGAS:', useGAS(), 'isGAS:', isGAS, 'GAS_URL:', GAS_URL);

const callGAS = async (functionName: string, ...args: any[]): Promise<any> => {
  if (isGAS) {
    return new Promise((resolve, reject) => {
      (google.script.run as any)
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)[functionName](...args);
    });
  }
  
  // Fallback to Web App URL if provided
  if (isValidGasUrl) {
    const action = functionName.replace('api', '');
    const normalizedAction = action.charAt(0).toLowerCase() + action.slice(1);
    
    // Map function names to Web App actions
    const postActions = [
      'Login', 'SavePenduduk', 'DeletePenduduk', 
      'SavePerangkat', 'DeletePerangkat', 
      'SaveLembaga', 'DeleteLembaga', 
      'SavePengaturan', 'SaveUser', 'DeleteUser',
      'SavePermissions'
    ];

    try {
      if (postActions.includes(action)) {
        // POST requests
        const body: any = { action: normalizedAction };
        if (action === 'Login') { body.username = args[0]; body.password = args[1]; }
        else if (action === 'SavePermissions') { body.role = args[0]; body.permissions = args[1]; }
        else if (action.startsWith('Delete')) { body.id = args[0]; }
        else { body.data = args[0]; }
        
        const res = await fetch(GAS_URL, {
          method: 'POST',
          body: JSON.stringify(body)
        });
        return await res.json();
      } else {
        // GET requests
        let url = `${GAS_URL}?action=${normalizedAction}`;
        if (action === 'GetPenduduk') {
          const opt = args[0] || {};
          url += `&search=${opt.search || ''}&dusun=${opt.dusun || ''}&limit=${opt.limit || ''}&offset=${opt.offset || 0}&hubungan_keluarga=${opt.hubungan_keluarga || ''}`;
        }
        if (action === 'GetLembaga') url += `&type=${args[0]}`;
        
        const res = await fetch(url);
        return await res.json();
      }
    } catch (err: any) {
      console.error(`GAS Fetch Error (${functionName}):`, err);
      
      // If GAS fails, we might want to throw a specific error that allows the UI to suggest switching back
      const errorMsg = err.message === 'Failed to fetch' 
        ? 'Gagal terhubung ke Google Apps Script. Pastikan Web App sudah di-deploy sebagai "Anyone" dan URL sudah benar.'
        : `Error GAS: ${err.message}`;
      
      throw new Error(errorMsg);
    }
  }

  throw new Error('Google Apps Script environment or valid VITE_GAS_URL not found');
};

export const api = {
  login: async (username: string, password: string) => {
    if (useGAS()) return callGAS('apiLogin', username, password);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getPenduduk: async (options: any) => {
    if (useGAS()) return callGAS('apiGetPenduduk', options);
    const { dusun, search, limit, offset, hubungan_keluarga } = options;
    const res = await fetch(`/api/penduduk?search=${search || ''}&dusun=${dusun || ''}&limit=${limit || ''}&offset=${offset || 0}&hubungan_keluarga=${hubungan_keluarga || ''}`);
    return res.json();
  },

  savePenduduk: async (data: any) => {
    if (useGAS()) return callGAS('apiSavePenduduk', data);
    const method = data.id ? 'PUT' : 'POST';
    const url = data.id ? `/api/penduduk/${data.id}` : '/api/penduduk';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal menyimpan data');
    }
    return res.json();
  },

  deletePenduduk: async (id: number) => {
    if (useGAS()) return callGAS('apiDeletePenduduk', id);
    const res = await fetch(`/api/penduduk/${id}`, { method: 'DELETE' });
    return res.json();
  },

  getPerangkat: async () => {
    if (useGAS()) return callGAS('apiGetPerangkat');
    const res = await fetch('/api/perangkat');
    return res.json();
  },

  savePerangkat: async (data: any) => {
    if (useGAS()) return callGAS('apiSavePerangkat', data);
    const res = await fetch('/api/perangkat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deletePerangkat: async (id: number) => {
    if (useGAS()) return callGAS('apiDeletePerangkat', id);
    const res = await fetch(`/api/perangkat/${id}`, { method: 'DELETE' });
    return res.json();
  },

  getLembaga: async (type: string) => {
    if (useGAS()) return callGAS('apiGetLembaga', type);
    const res = await fetch(`/api/lembaga?nama_lembaga=${type}`);
    return res.json();
  },

  saveLembaga: async (data: any) => {
    if (useGAS()) return callGAS('apiSaveLembaga', data);
    const res = await fetch('/api/lembaga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteLembaga: async (id: number) => {
    if (useGAS()) return callGAS('apiDeleteLembaga', id);
    const res = await fetch(`/api/lembaga/${id}`, { method: 'DELETE' });
    return res.json();
  },

  getPengaturan: async () => {
    if (useGAS()) return callGAS('apiGetPengaturan');
    const res = await fetch('/api/pengaturan');
    return res.json();
  },

  savePengaturan: async (data: any) => {
    if (useGAS()) return callGAS('apiSavePengaturan', data);
    const res = await fetch('/api/pengaturan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getUsers: async () => {
    if (useGAS()) return callGAS('apiGetUsers');
    const res = await fetch('/api/users');
    return res.json();
  },

  saveUser: async (data: any) => {
    if (useGAS()) return callGAS('apiSaveUser', data);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteUser: async (id: number) => {
    if (useGAS()) return callGAS('apiDeleteUser', id);
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    return res.json();
  },

  getPermissions: async () => {
    if (useGAS()) return callGAS('apiGetPermissions');
    const res = await fetch('/api/permissions');
    return res.json();
  },

  savePermissions: async (role: string, permissions: string[]) => {
    if (useGAS()) return callGAS('apiSavePermissions', role, permissions);
    const res = await fetch('/api/permissions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, permissions })
    });
    return res.json();
  },

  getStats: async () => {
    if (useGAS()) return callGAS('apiGetStats');
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Gagal mengambil statistik' }));
        throw new Error(err.error || err.message || 'Gagal mengambil statistik');
      }
      return res.json();
    } catch (err: any) {
      console.error('Local Stats Fetch Error:', err);
      if (err.message === 'Failed to fetch') {
        throw new Error('Gagal terhubung ke server. Pastikan server backend sedang berjalan.');
      }
      throw err;
    }
  },

  // Specific helpers
  getPendudukByNIK: async (nik: string) => {
    if (isGAS || GAS_URL) {
      const { data } = await callGAS('apiGetPenduduk', { search: nik });
      return data.find((p: any) => p.nik == nik) || null;
    }
    const res = await fetch(`/api/penduduk/nik/${nik}`);
    return res.json();
  },

  getPendudukByKK: async (no_kk: string) => {
    if (isGAS || GAS_URL) {
      const { data } = await callGAS('apiGetPenduduk', { search: no_kk });
      return data.filter((p: any) => p.no_kk == no_kk);
    }
    const res = await fetch(`/api/penduduk/kk/${no_kk}`);
    return res.json();
  }
};
