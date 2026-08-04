# Mini App: Project Tracker Monorepo

Project Tracker adalah aplikasi manajemen proyek dan tugas (task manager) satu halaman (SPA) berbasis monorepo. Proyek ini memisahkan layer server backend (Express.js) dan client frontend (React + Vite) yang ditulis menggunakan **TypeScript** serta didukung oleh basis data relasional **PostgreSQL** (Prisma ORM).

Aplikasi ini diimplementasikan dengan mematuhi aturan bisnis domain (*business rules domain*) yang ketat, pencegahan N+1 query, input validation, serta visual antarmuka bernuansa gelap (*dark theme*) yang modern.

---

## 🛠️ Tech Stack & Architecture

### Backend:
- **Runtime & Language**: Node.js & TypeScript
- **Framework**: Express.js
- **ORM & Database**: Prisma Client & PostgreSQL (Local)
- **Validation**: Zod (Request payload parsing)
- **Testing**: Vitest (Unit & Integration tests)

### Frontend:
- **Framework & Bundler**: React.js & Vite
- **Styling**: Tailwind CSS & Lucide Icons
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios (dengan proxy API otomatis `/api`)

---

## 📐 Skema Relasi Database

Basis data PostgreSQL diatur dengan relasi kuat melalui Prisma ORM:
1. **`projects`**: Menyimpan identitas proyek, jadwal tanggal mulai-selesai, derived status, dan bobot penyelesaian.
2. **`tasks`**: Menyimpan hirarki tugas (parent-child) untuk merepresentasikan task utama dan subtask.
3. **`project_dependencies`**: Tabel pivot unik (`project_id`, `depends_on_project_id`) untuk mendefinisikan ketergantungan antar-proyek.
4. **`task_dependencies`**: Tabel pivot unik (`task_id`, `depends_on_task_id`) untuk mendefinisikan ketergantungan antar-tugas.

---

## 🚀 Panduan Instalasi & Persiapan Lingkungan

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi pada mesin lokal Anda:

### 1. Prasyarat (Prerequisites)
Pastikan Anda telah menginstal:
- **Node.js** (v18 ke atas direkomendasikan)
- **PostgreSQL** lokal yang menyala pada port default `5432`

### 2. Kloning Proyek & Instal Dependensi Workspace
Jalankan perintah berikut di root direktori workspace untuk menginstal seluruh package monorepo:
```bash
npm install
```

### 3. Konfigurasi Environment Variables (`.env`)
Buat file `.env` di dalam sub-direktori **`backend/`** dengan isi sebagai berikut (sesuaikan password PostgreSQL lokal Anda):
```env
PORT=5000
DATABASE_URL="postgresql://postgres:admin@localhost:5432/project_tracker?schema=public"
```
*(Catatan: Anda dapat menyalin templat dasar dari file `.env.example` di root).*

### 4. Setup Database: Migrasi & Seeding
Jalankan perintah ini di root direktori untuk mengotomatiskan migrasi skema tabel ke PostgreSQL lokal Anda sekaligus mengisi data contoh awal (*seeded data*):
```bash
# Menjalankan prisma migration & prisma seed di workspace backend
npm run db:setup -w backend
```

### 5. Jalankan Server Pengembangan (Dev Servers)
Gunakan perintah pintas di root direktori untuk menyalakan Express server (port `5000`) dan Vite server (port `5173`) secara simultan menggunakan `concurrently`:
```bash
npm run dev
```
Setelah aktif, silakan buka browser Anda di alamat: **[http://localhost:5173](http://localhost:5173)**.

---

## 🧪 Eksekusi Suite Pengujian (Testing)

Suite pengujian unit (*unit tests*) untuk domain logic dan uji integrasi REST API dapat dijalankan dengan perintah:
```bash
npm run test -w backend
```
*Vitest akan menjalankan 11/11 test cases secara berurutan (sequential) untuk memverifikasi aturan bisnis.*

---

## 🛡️ Aturan Bisnis yang Diimplementasikan (Domain Rules)

Aplikasi Project Tracker ini dibangun di atas aturan-aturan logika bisnis berikut:

1. **Pencegahan Ketergantungan Melingkar (Circular Dependency Prevention)**:
   - Sistem akan memblokir penambahan dependensi baru baik antar-tugas maupun antar-proyek jika memicu hubungan melingkar secara langsung (misal: A bergantung ke B, lalu B diatur bergantung ke A) atau tidak langsung (misal: A -> B -> C -> A) menggunakan penelusuran graf **DFS (Depth-First Search)**. Respon HTTP: `409 Conflict`.

2. **Validasi Jadwal Bentrok (Schedule Overlap Prevention)**:
   - Dua proyek tidak boleh memiliki rentang tanggal pengerjaan yang saling beririsan. Jika ada bentrokan saat pembuatan atau modifikasi proyek, sistem akan memblokir aksi tersebut dan mengembalikan detail proyek yang menghambat. Respon HTTP: `409 Conflict`.

3. **Status Guard & Propagation**:
   - **Task Status Guard**: Sebuah tugas tidak dapat diubah statusnya menjadi `Done` jika salah satu dari tugas dependensinya belum berstatus `Done`.
   - **Task Status Regression**: Jika sebuah tugas diturunkan statusnya dari `Done` (menjadi `In Progress` atau `Draft`), seluruh tugas lain yang bergantung padanya akan ditarik mundur statusnya secara rekursif.
   - **Project Status Guard**: Sebuah proyek otomatis dipaksa berstatus `Draft` jika proyek lain yang didependensikannya belum rampung (`Done`).
   - **Progress & Derived Status**: Progres proyek (%) dihitung otomatis berdasarkan bobot tugas (`weight`) yang berstatus `Done`. Status proyek juga diturunkan secara otomatis (`Draft` jika semua draft, `Done` jika semua done, dan `In Progress` di antaranya).

4. **Parent Visibility Rule (Filtering Tree)**:
   - Penyaringan data tugas mendukung query teks dan filter status. Jika sebuah subtask (anak node) cocok dengan filter pencarian, seluruh node induknya (parent) di atasnya harus tetap tampil di UI tree view agar konteks hierarki visual tetap terjaga.

---

## 📦 Kompilasi Production (Production Build)

Untuk memvalidasi kebersihan kode TypeScript dan melakukan build aset statis sebelum deployment, jalankan:
```bash
# Mengompilasi kode server backend (TypeScript -> JavaScript)
npm run build -w backend

# Mem-bundle aplikasi React frontend menjadi file statis siap saji
npm run build -w frontend
```
Kedua perintah di atas harus berhasil selesai tanpa adanya error ataupun peringatan kompilasi.
