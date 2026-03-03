import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

console.log("Starting Digital Village Server...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  console.log("Initializing Express app...");
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const db = new Database("desa.db");
  console.log("Database connection established.");

  // Migration: Check if 'role' column exists and rename to 'roles'
  try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
    const hasRole = tableInfo.some(col => col.name === 'role');
    const hasRoles = tableInfo.some(col => col.name === 'roles');
    
    if (hasRole && !hasRoles) {
      console.log("Migrating 'role' column to 'roles'...");
      db.exec("ALTER TABLE users RENAME COLUMN role TO roles;");
    }

    const hasFotoProfil = tableInfo.some(col => col.name === 'foto_profil');
    if (!hasFotoProfil && hasRoles) {
      console.log("Adding 'foto_profil' column to 'users'...");
      db.exec("ALTER TABLE users ADD COLUMN foto_profil TEXT;");
    }
  } catch (e) {
    console.log("Migration check skipped (table might not exist).");
  }

  // Initialize Database
  try {
    console.log("Initializing database tables...");
    db.exec(`
      CREATE TABLE IF NOT EXISTS penduduk (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        no_kk TEXT NOT NULL,
        nik TEXT NOT NULL UNIQUE,
        nama_lengkap TEXT NOT NULL,
        jenis_kelamin TEXT,
        alamat TEXT,
        rt TEXT,
        rw TEXT,
        dusun TEXT,
        tempat_lahir TEXT,
        tanggal_lahir TEXT,
        agama TEXT,
        pendidikan TEXT,
        jenis_pekerjaan TEXT,
        golongan_darah TEXT,
        status_perkawinan TEXT,
        hubungan_keluarga TEXT,
        kewarganegaraan TEXT,
        nama_ayah TEXT,
        nama_ibu TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS perangkat (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nik TEXT NOT NULL,
        nama TEXT NOT NULL,
        jabatan TEXT NOT NULL,
        sk_pengangkatan TEXT,
        tanggal_sk TEXT,
        status_aktif INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS lembaga (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama_lembaga TEXT NOT NULL, -- BPD, RT, RW, PKK, Karang Taruna, LPMD, Posyandu
        nik_pengurus TEXT NOT NULL,
        nama_pengurus TEXT NOT NULL,
        jabatan TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pengaturan (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        nama_desa TEXT,
        kecamatan TEXT,
        kabupaten TEXT,
        provinsi TEXT,
        kode_pos TEXT,
        nama_kepala_desa TEXT,
        logo_url TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        nama_lengkap TEXT,
        roles TEXT NOT NULL, -- Comma-separated: Administrator,Admin,User
        foto_profil TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        role TEXT PRIMARY KEY,
        permissions TEXT NOT NULL -- Comma-separated permission keys
      );

      -- Initial Data
      INSERT OR IGNORE INTO pengaturan (id, nama_desa, kecamatan, kabupaten, provinsi, kode_pos, nama_kepala_desa)
      VALUES (1, 'Desa Sukamaju', 'Kecamatan Ciawi', 'Kabupaten Bogor', 'Jawa Barat', '16720', 'H. Ahmad Syarif');

      INSERT OR IGNORE INTO users (username, password, nama_lengkap, roles)
      VALUES ('admin', 'admin123', 'Administrator Utama', 'Administrator');
      
      INSERT OR IGNORE INTO users (username, password, nama_lengkap, roles)
      VALUES ('staff', 'staff123', 'Staff Desa', 'Admin');

      INSERT OR IGNORE INTO users (username, password, nama_lengkap, roles)
      VALUES ('user', 'user123', 'Warga Terdaftar', 'User');

      -- Default Permissions
      INSERT OR IGNORE INTO role_permissions (role, permissions)
      VALUES ('Administrator', 'menu_dashboard,menu_penduduk,menu_perangkat,menu_laporan,menu_pengaturan,menu_users,menu_lembaga,action_edit_penduduk,action_delete_penduduk,action_edit_perangkat,action_delete_perangkat,action_edit_lembaga,action_delete_lembaga,action_edit_pengaturan,action_manage_users');

      INSERT OR IGNORE INTO role_permissions (role, permissions)
      VALUES ('Admin', 'menu_dashboard,menu_penduduk,menu_perangkat,menu_laporan,menu_lembaga,action_edit_penduduk,action_edit_perangkat,action_edit_lembaga');

      INSERT OR IGNORE INTO role_permissions (role, permissions)
      VALUES ('User', 'menu_dashboard,menu_penduduk,menu_perangkat,menu_lembaga');
    `);
    console.log("Database initialized successfully.");
  } catch (e) {
    console.error("Database initialization failed:", e);
  }

  console.log("Setting up API routes...");
  
  // Auth
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      const { password, roles, ...userWithoutPassword } = user;
      const roleList = (roles || "").split(",").filter(Boolean);
      const isAdministrator = roleList.includes('Administrator');
      
      // Get permissions for all roles
      const allPermissions = new Set<string>();
      
      if (isAdministrator) {
        // Add all possible permissions for Administrator
        const allPossiblePermissions = [
          'menu_dashboard', 'menu_penduduk', 'menu_perangkat', 'menu_laporan', 
          'menu_lembaga', 'menu_pengaturan', 'menu_users',
          'action_edit_penduduk', 'action_delete_penduduk',
          'action_edit_perangkat', 'action_delete_perangkat',
          'action_edit_lembaga', 'action_delete_lembaga',
          'action_edit_pengaturan', 'action_manage_users'
        ];
        allPossiblePermissions.forEach(p => allPermissions.add(p));
      } else {
        roleList.forEach((role: string) => {
          const row = db.prepare("SELECT permissions FROM role_permissions WHERE role = ?").get(role) as any;
          if (row && row.permissions) {
            row.permissions.split(",").forEach((p: string) => allPermissions.add(p));
          }
        });
      }

      res.json({
        ...userWithoutPassword,
        roles: roleList,
        permissions: Array.from(allPermissions)
      });
    } else {
      res.status(401).json({ message: "Username atau password salah" });
    }
  });

  // Role Permissions
  app.get("/api/permissions", (req, res) => {
    const data = db.prepare("SELECT * FROM role_permissions").all() as any[];
    res.json(data.map(r => ({ ...r, permissions: r.permissions.split(",") })));
  });

  app.put("/api/permissions", (req, res) => {
    const { role, permissions } = req.body;
    const permissionsStr = Array.isArray(permissions) ? permissions.join(",") : permissions;
    db.prepare("UPDATE role_permissions SET permissions = ? WHERE role = ?").run(permissionsStr, role);
    res.json({ success: true });
  });

  // Penduduk
  app.get("/api/penduduk", (req, res) => {
    const { dusun, search, limit, offset, hubungan_keluarga } = req.query;
    let query = "SELECT * FROM penduduk WHERE 1=1";
    const params: any[] = [];

    if (dusun && dusun !== "Semua") {
      query += " AND dusun = ?";
      params.push(dusun);
    }

    if (hubungan_keluarga) {
      query += " AND hubungan_keluarga = ?";
      params.push(hubungan_keluarga);
    }

    if (search) {
      query += " AND (nama_lengkap LIKE ? OR nik LIKE ? OR no_kk LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const total = (db.prepare(query.replace("SELECT *", "SELECT COUNT(*) as count")).get(...params) as any).count;

    if (limit && limit !== "Semua") {
      query += " LIMIT ? OFFSET ?";
      params.push(parseInt(limit as string), parseInt((offset as string) || "0"));
    }

    const data = db.prepare(query).all(...params);
    res.json({ data, total });
  });

  app.get("/api/penduduk/:id", (req, res) => {
    const data = db.prepare("SELECT * FROM penduduk WHERE id = ?").get(req.params.id);
    res.json(data);
  });

  app.get("/api/penduduk/nik/:nik", (req, res) => {
    const data = db.prepare("SELECT * FROM penduduk WHERE nik = ?").get(req.params.nik);
    res.json(data);
  });

  app.get("/api/penduduk/kk/:no_kk", (req, res) => {
    const data = db.prepare("SELECT * FROM penduduk WHERE no_kk = ?").all(req.params.no_kk);
    res.json(data);
  });

  app.post("/api/penduduk", (req, res) => {
    const data = req.body;
    // Check duplicate NIK
    const existing = db.prepare("SELECT id FROM penduduk WHERE nik = ?").get(data.nik);
    if (existing) {
      return res.status(400).json({ message: "NIK sudah terdaftar" });
    }

    const stmt = db.prepare(`
      INSERT INTO penduduk (
        no_kk, nik, nama_lengkap, jenis_kelamin, alamat, rt, rw, dusun,
        tempat_lahir, tanggal_lahir, agama, pendidikan, jenis_pekerjaan,
        golongan_darah, status_perkawinan, hubungan_keluarga, kewarganegaraan,
        nama_ayah, nama_ibu
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        data.no_kk, data.nik, data.nama_lengkap, data.jenis_kelamin, data.alamat, data.rt, data.rw, data.dusun,
        data.tempat_lahir, data.tanggal_lahir, data.agama, data.pendidikan, data.jenis_pekerjaan,
        data.golongan_darah, data.status_perkawinan, data.hubungan_keluarga, data.kewarganegaraan,
        data.nama_ayah, data.nama_ibu
      );
      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/penduduk/:id", (req, res) => {
    const data = req.body;
    const stmt = db.prepare(`
      UPDATE penduduk SET
        no_kk = ?, nik = ?, nama_lengkap = ?, jenis_kelamin = ?, alamat = ?, rt = ?, rw = ?, dusun = ?,
        tempat_lahir = ?, tanggal_lahir = ?, agama = ?, pendidikan = ?, jenis_pekerjaan = ?,
        golongan_darah = ?, status_perkawinan = ?, hubungan_keluarga = ?, kewarganegaraan = ?,
        nama_ayah = ?, nama_ibu = ?
      WHERE id = ?
    `);

    try {
      stmt.run(
        data.no_kk, data.nik, data.nama_lengkap, data.jenis_kelamin, data.alamat, data.rt, data.rw, data.dusun,
        data.tempat_lahir, data.tanggal_lahir, data.agama, data.pendidikan, data.jenis_pekerjaan,
        data.golongan_darah, data.status_perkawinan, data.hubungan_keluarga, data.kewarganegaraan,
        data.nama_ayah, data.nama_ibu, req.params.id
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/penduduk/:id", (req, res) => {
    db.prepare("DELETE FROM penduduk WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Perangkat
  app.get("/api/perangkat", (req, res) => {
    const data = db.prepare("SELECT * FROM perangkat").all();
    res.json(data);
  });

  app.post("/api/perangkat", (req, res) => {
    const data = req.body;
    const stmt = db.prepare("INSERT INTO perangkat (nik, nama, jabatan, sk_pengangkatan, tanggal_sk) VALUES (?, ?, ?, ?, ?)");
    const result = stmt.run(data.nik, data.nama, data.jabatan, data.sk_pengangkatan, data.tanggal_sk);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/perangkat/:id", (req, res) => {
    db.prepare("DELETE FROM perangkat WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Lembaga
  app.get("/api/lembaga", (req, res) => {
    const { nama_lembaga } = req.query;
    let query = "SELECT * FROM lembaga";
    const params = [];
    if (nama_lembaga) {
      query += " WHERE nama_lembaga = ?";
      params.push(nama_lembaga);
    }
    const data = db.prepare(query).all(...params);
    res.json(data);
  });

  app.post("/api/lembaga", (req, res) => {
    const data = req.body;
    const stmt = db.prepare("INSERT INTO lembaga (nama_lembaga, nik_pengurus, nama_pengurus, jabatan) VALUES (?, ?, ?, ?)");
    const result = stmt.run(data.nama_lembaga, data.nik_pengurus, data.nama_pengurus, data.jabatan);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/lembaga/:id", (req, res) => {
    db.prepare("DELETE FROM lembaga WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Pengaturan
  app.get("/api/pengaturan", (req, res) => {
    const data = db.prepare("SELECT * FROM pengaturan WHERE id = 1").get();
    res.json(data);
  });

  app.put("/api/pengaturan", (req, res) => {
    const data = req.body;
    const stmt = db.prepare(`
      UPDATE pengaturan SET
        nama_desa = ?, kecamatan = ?, kabupaten = ?, provinsi = ?, kode_pos = ?, nama_kepala_desa = ?, logo_url = ?
      WHERE id = 1
    `);
    stmt.run(data.nama_desa, data.kecamatan, data.kabupaten, data.provinsi, data.kode_pos, data.nama_kepala_desa, data.logo_url);
    res.json({ success: true });
  });

  // Users
  app.get("/api/users", (req, res) => {
    console.log("GET /api/users requested");
    const data = db.prepare("SELECT id, username, nama_lengkap, roles, foto_profil, created_at FROM users").all() as any[];
    res.json(data.map(u => ({ ...u, roles: (u.roles || "").split(",").filter(Boolean) })));
  });

  app.post("/api/users", (req, res) => {
    const data = req.body;
    const rolesStr = Array.isArray(data.roles) ? data.roles.join(",") : (data.roles || "User");
    
    if (data.id) {
      // Update
      if (data.password) {
        const stmt = db.prepare("UPDATE users SET username = ?, password = ?, nama_lengkap = ?, roles = ?, foto_profil = ? WHERE id = ?");
        stmt.run(data.username, data.password, data.nama_lengkap, rolesStr, data.foto_profil, data.id);
      } else {
        const stmt = db.prepare("UPDATE users SET username = ?, nama_lengkap = ?, roles = ?, foto_profil = ? WHERE id = ?");
        stmt.run(data.username, data.nama_lengkap, rolesStr, data.foto_profil, data.id);
      }
      
      // Return updated user data (excluding password)
      const updated = db.prepare("SELECT id, username, nama_lengkap, roles, foto_profil, created_at FROM users WHERE id = ?").get(data.id) as any;
      res.json({ ...updated, roles: (updated.roles || "").split(",").filter(Boolean) });
    } else {
      // Create
      const stmt = db.prepare("INSERT INTO users (username, password, nama_lengkap, roles, foto_profil) VALUES (?, ?, ?, ?, ?)");
      const result = stmt.run(data.username, data.password, data.nama_lengkap, rolesStr, data.foto_profil);
      res.json({ id: result.lastInsertRowid });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    try {
      console.log(`[${new Date().toISOString()}] GET /api/stats requested`);
      
      // Check if tables exist
      const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='penduduk'").get();
      if (!tableCheck) {
        console.warn("Table 'penduduk' does not exist yet.");
        return res.json({
          totalPenduduk: 0,
          totalKK: 0,
          totalLaki: 0,
          totalPerempuan: 0,
          dusunStats: [],
          ageStats: { balita: 0, kanak: 0, remaja: 0, dewasa: 0, lansia: 0, manula: 0 }
        });
      }

      const totalPenduduk = (db.prepare("SELECT COUNT(*) as count FROM penduduk").get() as any).count;
      const totalKK = (db.prepare("SELECT COUNT(DISTINCT no_kk) as count FROM penduduk").get() as any).count;
      const totalLaki = (db.prepare("SELECT COUNT(*) as count FROM penduduk WHERE jenis_kelamin = 'Laki-Laki'").get() as any).count;
      const totalPerempuan = (db.prepare("SELECT COUNT(*) as count FROM penduduk WHERE jenis_kelamin = 'Perempuan'").get() as any).count;
      
      const dusunStats = db.prepare("SELECT dusun, COUNT(*) as count FROM penduduk GROUP BY dusun").all();
      
      const penduduk = db.prepare("SELECT tanggal_lahir FROM penduduk").all() as any[];
      const today = new Date();
      const ageStats = {
        balita: 0,
        kanak: 0,
        remaja: 0,
        dewasa: 0,
        lansia: 0,
        manula: 0
      };

      penduduk.forEach(p => {
        if (!p.tanggal_lahir) return;
        const birthDate = new Date(p.tanggal_lahir);
        if (isNaN(birthDate.getTime())) return;
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age <= 5) ageStats.balita++;
        else if (age <= 11) ageStats.kanak++;
        else if (age <= 25) ageStats.remaja++;
        else if (age <= 45) ageStats.dewasa++;
        else if (age <= 65) ageStats.lansia++;
        else ageStats.manula++;
      });

      res.json({
        totalPenduduk,
        totalKK,
        totalLaki,
        totalPerempuan,
        dusunStats,
        ageStats
      });
    } catch (err: any) {
      console.error("Error in /api/stats:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite dev server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("GLOBAL ERROR:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL: Failed to start server:", err);
});
