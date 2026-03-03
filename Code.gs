/**
 * GOOGLE APPS SCRIPT BACKEND FOR SISTEM INFORMASI DESA DIGITAL
 * 
 * Petunjuk:
 * 1. Buka Google Spreadsheet Anda.
 * 2. Salin ID dari URL (antara /d/ dan /edit). Contoh: 1abc123xyz...
 * 3. Masukkan ID tersebut di variabel SPREADSHEET_ID di bawah ini.
 */

const SPREADSHEET_ID = "MASUKKAN_ID_SPREADSHEET_ANDA_DI_SINI";

// Jika Anda ingin menggunakan deteksi otomatis (hanya jika script dibuat dari menu Extensions > Apps Script),
// hapus baris di atas dan gunakan baris di bawah ini:
// const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('Desa Digital')
      .addItem('Inisialisasi Database', 'initializeDatabase')
      .addToUi();
  } catch (e) {}
}

function initializeDatabase() {
  const sheets = ['users', 'penduduk', 'perangkat', 'lembaga', 'pengaturan', 'role_permissions'];
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  sheets.forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      // Set Headers
      let headers = [];
      if (name === 'users') headers = ['id', 'username', 'password', 'nama_lengkap', 'roles', 'foto_profil', 'created_at'];
      if (name === 'penduduk') headers = ['id', 'no_kk', 'nik', 'nama_lengkap', 'jenis_kelamin', 'alamat', 'rt', 'rw', 'dusun', 'tempat_lahir', 'tanggal_lahir', 'agama', 'pendidikan', 'jenis_pekerjaan', 'golongan_darah', 'status_perkawinan', 'hubungan_keluarga', 'kewarganegaraan', 'nama_ayah', 'nama_ibu', 'created_at'];
      if (name === 'perangkat') headers = ['id', 'nik', 'nama', 'jabatan', 'sk_pengangkatan', 'tanggal_sk', 'status_aktif'];
      if (name === 'lembaga') headers = ['id', 'nama_lembaga', 'nik_pengurus', 'nama_pengurus', 'jabatan'];
      if (name === 'role_permissions') headers = ['role', 'permissions'];
      if (name === 'pengaturan') {
        headers = ['id', 'nama_desa', 'kecamatan', 'kabupaten', 'provinsi', 'kode_pos', 'nama_kepala_desa', 'logo_url'];
        sheet.appendRow(headers);
        sheet.appendRow([1, 'Desa Contoh', 'Kecamatan A', 'Kabupaten B', 'Provinsi C', '12345', 'Bpk. Kepala Desa', '']);
        return;
      }
      sheet.appendRow(headers);
      
      // Add default admin for users
      if (name === 'users') {
        sheet.appendRow([1, 'admin', 'admin123', 'Administrator Utama', 'Administrator', '', new Date().toISOString()]);
      }

      // Add default permissions
      if (name === 'role_permissions') {
        sheet.appendRow(['Administrator', 'menu_dashboard,menu_penduduk,menu_perangkat,menu_laporan,menu_pengaturan,menu_users,menu_lembaga,action_edit_penduduk,action_delete_penduduk,action_edit_perangkat,action_delete_perangkat,action_edit_lembaga,action_delete_lembaga,action_edit_pengaturan,action_manage_users']);
        sheet.appendRow(['Admin', 'menu_dashboard,menu_penduduk,menu_perangkat,menu_laporan,menu_lembaga,action_edit_penduduk,action_edit_perangkat,action_edit_lembaga']);
        sheet.appendRow(['User', 'menu_dashboard,menu_penduduk,menu_perangkat,menu_lembaga']);
      }
    }
  });
  
  try {
    SpreadsheetApp.getUi().alert('Database berhasil diinisialisasi!');
  } catch (e) {
    console.log('Database initialized, but UI alert failed: ' + e.message);
  }
}

// --- API IMPLEMENTATIONS ---

function getSheetData(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function saveToSheet(sheetName, data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  if (data.id) {
    const rows = sheet.getDataRange().getValues();
    const targetId = String(data.id);
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === targetId) {
        const rowValues = headers.map(h => data[h] !== undefined ? data[h] : rows[i][headers.indexOf(h)]);
        sheet.getRange(i + 1, 1, 1, headers.length).setValues([rowValues]);
        return { success: true };
      }
    }
  }
  
  // Create new
  data.id = data.id || new Date().getTime();
  if (!data.created_at && headers.includes('created_at')) data.created_at = new Date().toISOString();
  const rowValues = headers.map(h => data[h] || '');
  sheet.appendRow(rowValues);
  return { success: true, id: data.id };
}

function deleteFromSheet(sheetName, id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  const rows = sheet.getDataRange().getValues();
  const targetId = String(id);
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === targetId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { error: 'Data tidak ditemukan' };
}

function apiLogin(username, password) {
  const users = getSheetData('users');
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) throw new Error('Username atau password salah');
  
  // Convert roles string to array
  const roles = user.roles ? String(user.roles).split(',').map(r => r.trim()) : [];
  
  // Fetch permissions for roles
  const rolePerms = getSheetData('role_permissions');
  const permissionsSet = new Set();
  
  roles.forEach(role => {
    const rp = rolePerms.find(p => p.role === role);
    if (rp && rp.permissions) {
      String(rp.permissions).split(',').forEach(p => permissionsSet.add(p.trim()));
    }
  });

  const { password: _, ...safeUser } = user;
  return {
    ...safeUser,
    roles: roles,
    permissions: Array.from(permissionsSet)
  };
}

function apiGetPenduduk(options = {}) {
  let data = getSheetData('penduduk');
  const { search, dusun, limit, offset, hubungan_keluarga } = options;
  
  if (hubungan_keluarga) {
    data = data.filter(p => p.hubungan_keluarga === hubungan_keluarga);
  }

  if (dusun && dusun !== 'Semua' && dusun !== '') {
    data = data.filter(p => p.dusun === dusun);
  }
  
  if (search) {
    const s = search.toLowerCase();
    data = data.filter(p => 
      String(p.nik).includes(s) || 
      String(p.no_kk).includes(s) || 
      p.nama_lengkap.toLowerCase().includes(s)
    );
  }
  
  const total = data.length;
  if (limit && limit !== 'Semua' && limit !== '') {
    data = data.slice(parseInt(offset) || 0, (parseInt(offset) || 0) + parseInt(limit));
  }
  
  return { data, total };
}

function apiSavePenduduk(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('penduduk');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rows = sheet.getDataRange().getValues();
  
  // NIK Validation (Check for duplicates on new entry)
  if (!data.id) {
    const nikIndex = headers.indexOf('nik');
    const isDuplicate = rows.some(row => row[nikIndex] == data.nik);
    if (isDuplicate) throw new Error('NIK sudah terdaftar dalam sistem (Data Ganda)');
  }

  if (data.id) {
    const targetId = String(data.id);
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === targetId) {
        const rowValues = headers.map(h => data[h] !== undefined ? data[h] : rows[i][headers.indexOf(h)]);
        sheet.getRange(i + 1, 1, 1, headers.length).setValues([rowValues]);
        return { success: true };
      }
    }
  }
  
  // Create new
  data.id = new Date().getTime();
  data.created_at = new Date().toISOString();
  const rowValues = headers.map(h => data[h] || '');
  sheet.appendRow(rowValues);
  return { success: true, id: data.id };
}
function apiDeletePenduduk(id) { return deleteFromSheet('penduduk', id); }

function apiGetPerangkat() { return getSheetData('perangkat'); }
function apiSavePerangkat(data) { return saveToSheet('perangkat', data); }
function apiDeletePerangkat(id) { return deleteFromSheet('perangkat', id); }

function apiGetLembaga(type) {
  return getSheetData('lembaga').filter(l => l.nama_lembaga === type);
}
function apiSaveLembaga(data) { return saveToSheet('lembaga', data); }
function apiDeleteLembaga(id) { return deleteFromSheet('lembaga', id); }

function apiGetPengaturan() { return getSheetData('pengaturan')[0]; }
function apiSavePengaturan(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('pengaturan');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowValues = headers.map(h => data[h] || '');
  sheet.getRange(2, 1, 1, headers.length).setValues([rowValues]);
  return { success: true };
}

function apiGetUsers() {
  const users = getSheetData('users');
  const rolePerms = getSheetData('role_permissions');
  
  return users.map(u => {
    const roles = u.roles ? String(u.roles).split(',').map(r => r.trim()) : [];
    const permissionsSet = new Set();
    
    roles.forEach(role => {
      const rp = rolePerms.find(p => p.role === role);
      if (rp && rp.permissions) {
        String(rp.permissions).split(',').forEach(p => permissionsSet.add(p.trim()));
      }
    });

    const { password, ...safe } = u;
    return {
      ...safe,
      roles: roles,
      permissions: Array.from(permissionsSet)
    };
  });
}

function apiSaveUser(data) {
  // Handle roles array to string conversion
  if (data.roles && Array.isArray(data.roles)) {
    data.roles = data.roles.join(',');
  }
  return saveToSheet('users', data);
}

function apiGetPermissions() {
  return getSheetData('role_permissions').map(rp => ({
    role: rp.role,
    permissions: rp.permissions ? String(rp.permissions).split(',').map(p => p.trim()) : []
  }));
}

function apiSavePermissions(role, permissions) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('role_permissions');
  const rows = sheet.getDataRange().getValues();
  const permsString = Array.isArray(permissions) ? permissions.join(',') : permissions;
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === role) {
      sheet.getRange(i + 1, 2).setValue(permsString);
      return { success: true };
    }
  }
  
  // If role not found, append it
  sheet.appendRow([role, permsString]);
  return { success: true };
}
function apiDeleteUser(id) { return deleteFromSheet('users', id); }

function apiGetStats() {
  const penduduk = getSheetData('penduduk');
  const kkSet = new Set(penduduk.map(p => p.no_kk));
  const laki = penduduk.filter(p => p.jenis_kelamin === 'Laki-Laki').length;
  const perempuan = penduduk.filter(p => p.jenis_kelamin === 'Perempuan').length;
  
  const dusunMap = {};
  const ageStats = { balita: 0, kanak: 0, remaja: 0, dewasa: 0, lansia: 0, manula: 0 };
  const now = new Date();
  
  penduduk.forEach(p => {
    dusunMap[p.dusun] = (dusunMap[p.dusun] || 0) + 1;
    if (p.tanggal_lahir) {
      const birthDate = new Date(p.tanggal_lahir);
      let age = now.getFullYear() - birthDate.getFullYear();
      const m = now.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
      
      if (age <= 5) ageStats.balita++;
      else if (age <= 11) ageStats.kanak++;
      else if (age <= 25) ageStats.remaja++;
      else if (age <= 45) ageStats.dewasa++;
      else if (age <= 65) ageStats.lansia++;
      else ageStats.manula++;
    }
  });
  
  return {
    totalPenduduk: penduduk.length,
    totalKK: kkSet.size,
    totalLaki: laki,
    totalPerempuan: perempuan,
    dusunStats: Object.keys(dusunMap).map(d => ({ dusun: d, count: dusunMap[d] })),
    ageStats: ageStats
  };
}

// --- WEB APP HANDLERS ---

function doGet(e) {
  const action = e.parameter.action;
  let result;
  try {
    if (action === 'getPenduduk') result = apiGetPenduduk(e.parameter);
    else if (action === 'getPerangkat') result = apiGetPerangkat();
    else if (action === 'getLembaga') result = apiGetLembaga(e.parameter.type);
    else if (action === 'getPengaturan') result = apiGetPengaturan();
    else if (action === 'getStats') result = apiGetStats();
    else if (action === 'getUsers') result = apiGetUsers();
    else if (action === 'getPermissions') result = apiGetPermissions();
    else result = { error: 'Invalid action: ' + action };
  } catch (err) {
    result = { error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  let result;
  try {
    if (action === 'login') result = apiLogin(body.username, body.password);
    else if (action === 'savePenduduk') result = apiSavePenduduk(body.data);
    else if (action === 'deletePenduduk') result = apiDeletePenduduk(body.id);
    else if (action === 'savePerangkat') result = apiSavePerangkat(body.data);
    else if (action === 'deletePerangkat') result = apiDeletePerangkat(body.id);
    else if (action === 'saveLembaga') result = apiSaveLembaga(body.data);
    else if (action === 'deleteLembaga') result = apiDeleteLembaga(body.id);
    else if (action === 'savePengaturan') result = apiSavePengaturan(body.data);
    else if (action === 'saveUser') result = apiSaveUser(body.data);
    else if (action === 'deleteUser') result = apiDeleteUser(body.id);
    else if (action === 'savePermissions') result = apiSavePermissions(body.role, body.permissions);
    else result = { error: 'Invalid action: ' + action };
  } catch (err) {
    result = { error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
