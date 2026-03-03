# Panduan Integrasi Google Spreadsheet & Google Apps Script

Aplikasi ini telah dimodifikasi agar dapat menggunakan Google Spreadsheet sebagai database utama melalui Google Apps Script.

## Langkah 1: Persiapan Google Spreadsheet
1. Buat Google Spreadsheet baru.
2. Beri nama spreadsheet tersebut (misal: `Database Desa Digital`).
3. Buka menu **Extensions** > **Apps Script**.

## Langkah 2: Memasang Script Backend
1. Di editor Apps Script, hapus semua kode yang ada di file `Code.gs`.
2. Salin seluruh isi file `Code.gs` dari folder root proyek ini dan tempelkan ke editor Apps Script.
3. Klik ikon simpan (Save).
4. Klik tombol **Run** pada fungsi `initializeDatabase` untuk membuat lembar kerja (sheets) yang diperlukan secara otomatis. Anda akan diminta memberikan izin akses ke spreadsheet Anda.

## Langkah 3: Deploy sebagai Web App
1. Klik tombol **Deploy** > **New Deployment**.
2. Pilih tipe **Web App**.
3. Isi deskripsi (misal: `API Desa Digital`).
4. Set **Execute as** ke `Me`.
5. Set **Who has access** ke `Anyone`.
6. Klik **Deploy**.
7. Salin **Web App URL** yang muncul (URL ini akan berakhir dengan `/exec`).

## Langkah 4: Menghubungkan Aplikasi React
Ada dua cara untuk menghubungkan aplikasi ini dengan Google Apps Script:

### Cara A: Menggunakan Environment Variable (Rekomendasi)
Jika Anda menjalankan aplikasi ini di lingkungan pengembangan (seperti AI Studio atau Local), tambahkan URL Web App tersebut ke environment variable:
1. Buka file `.env` atau pengaturan environment di platform Anda.
2. Tambahkan baris berikut:
   ```env
   VITE_GAS_URL=URL_WEB_APP_ANDA_DI_SINI
   ```
3. Restart aplikasi.

### Cara B: Deploy Langsung ke Apps Script (Advanced)
Anda dapat mem-build aplikasi React ini dan memasukkan file HTML-nya ke dalam Apps Script. Jika dilakukan dengan cara ini, aplikasi akan otomatis mengenali lingkungan Google Apps Script dan menggunakan `google.script.run` tanpa perlu konfigurasi URL tambahan.

## Fitur Tambahan di Spreadsheet
Setelah menjalankan `initializeDatabase`, akan muncul menu baru bernama **Desa Digital** di Google Spreadsheet Anda. Anda dapat menggunakan menu tersebut untuk melakukan inisialisasi ulang jika diperlukan.

---
**Catatan Keamanan:**
Web App yang diatur ke "Anyone" memungkinkan siapa saja yang memiliki URL tersebut untuk mengakses data jika tidak ada sistem token tambahan. Pastikan URL Web App Anda tetap rahasia.
