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
Pastikan sistem Anda telah menginstal:
- **Node.js** (v18 ke atas)
- **PostgreSQL** lokal yang menyala pada port default `5432`

### 2. Kloning Proyek & Instal Dependensi Workspace
Jalankan perintah berikut di root direktori workspace untuk menginstal seluruh package monorepo:
```bash
npm install
```

### 3. Konfigurasi Environment Variables (`.env`)
Buat file bernama `.env` di dalam sub-direktori **`backend/`** dengan isi sebagai berikut. Sesuaikan `username`, `password`, dan `port` database PostgreSQL lokal Anda:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:admin@localhost:5432/project_tracker?schema=public"
```
*(Catatan: Anda dapat menyalin templat dasar dari file `backend/.env.example` sebagai referensi).*

### 4. Setup Database: Migrasi & Seeding Data Contoh
Jalankan perintah ini di root direktori untuk mengotomatiskan migrasi skema tabel ke PostgreSQL lokal Anda sekaligus mengisi data contoh awal (*seeded data*):
```bash
# Menjalankan prisma migration & prisma seed di workspace backend
npm run db:setup -w backend
```
*Perintah ini akan membuat database `project_tracker`, menerapkan struktur tabel, dan memicu script `seed.ts` untuk mengisi data uji coba.*

### 5. Jalankan Server Pengembangan (Dev Servers)
Gunakan perintah pintas di root direktori untuk menyalakan Express server (port `5000`) dan Vite server (port `5173`) secara simultan menggunakan `concurrently`:
```bash
npm run dev
```
Setelah aktif, silakan buka browser Anda di alamat: **[http://localhost:5173](http://localhost:5173)**.

---

## 🕵️ Panduan Pengujian Fitur bagi Reviewer (Manual Testing Scenarios)

Setelah membuka aplikasi di **http://localhost:5173**, Anda dapat memverifikasi pemenuhan kriteria kelulusan aturan bisnis menggunakan skenario berikut:

### Skenario 1: Deteksi Bentrokan Jadwal (Schedule Overlap Rule)
*   **Tujuan**: Memastikan dua proyek tidak memiliki rentang tanggal yang saling beririsan.
*   **Langkah**:
    1. Klik tombol **"+ Project"** di kiri atas untuk menambah proyek baru.
    2. Masukkan nama proyek bebas, lalu atur Tanggal Mulai dan Tanggal Selesai di antara tanggal `2026-08-05` s/d `2026-08-08` (bentrok dengan jadwal *Project Alpha* yang berjalan dari `2026-08-01` s/d `2026-08-10`).
    3. Klik **"Simpan"**.
*   **Hasil**: Sistem memblokir penyimpanan, dan memunculkan kotak alert merah di dalam form bertuliskan: **`"Jadwal proyek berbenturan dengan proyek "Project Alpha (Design & Foundation)" (2026-08-01 s/d 2026-08-10)"`**.

### Skenario 2: Aturan Dependensi Tugas (Task Dependency Guard)
*   **Tujuan**: Memastikan tugas tidak bisa diubah menjadi status `Done` jika dependensinya belum berstatus `Done`.
*   **Langkah**:
    1. Klik proyek **Project Alpha** di sidebar kiri.
    2. Di dalam pohon tugas, klik tugas **"Task 3: Backend REST Services Implementation"** (Tugas ini diatur bergantung pada *Task 2: Database Setup*).
    3. Ubah status *Task 3* dari `Draft` menjadi `Done` melalui menu select dropdown status di panel kanan.
    4. Klik **"Simpan"**.
*   **Hasil**: Sistem menolak penyimpanan dan menampilkan alert merah: **`"Gagal mengubah status task karena task dependency belum Done"`**.

### Skenario 3: Penurunan Status Beruntun (Regression Cascade Propagation)
*   **Tujuan**: Memverifikasi bahwa jika dependensi diturunkan statusnya dari `Done`, status tugas yang bergantung padanya ikut turun secara rekursif.
*   **Langkah**:
    1. Pastikan **"Task 2"** (dan subtask di bawahnya) serta **"Task 3"** saat ini berstatus `Done`.
    2. Klik **"Subtask 2.1: Schema Design"** yang saat ini berstatus `Done`.
    3. Ubah statusnya mundur menjadi `Draft` atau `In Progress`, lalu klik **"Simpan"**.
*   **Hasil**: Status **"Subtask 2.2"** dan **"Task 3"** di sidebar tree list akan otomatis ikut mundur statusnya menjadi **`In Progress`** secara real-time di layar DOM tanpa perlu memuat ulang halaman.

### Skenario 4: Dependensi Proyek (Project Dependency Guard)
*   **Tujuan**: Memastikan proyek berstatus `Draft` jika proyek dependensinya belum selesai (`Done`).
*   **Langkah**:
    1. Klik proyek **Project Beta** di sidebar kiri. Perhatikan bahwa status proyek ini adalah **`Draft`** karena ia bergantung pada *Project Alpha* yang belum berstatus `Done`.
    2. Di dalam panel kanan detail proyek, Anda tidak akan menemukan tombol untuk mempromosikan status proyek secara manual (karena status proyek bersifat dinamis/derived dari status penyelesaian task).
    3. Selesaikan semua task di bawah **Project Alpha** hingga status proyek *Alpha* menjadi `Done`.
*   **Hasil**: Status **Project Beta** akan otomatis dapat berubah menjadi `In Progress` saat tugas di bawahnya mulai dikerjakan karena dependensinya (*Project Alpha*) telah selesai (`Done`).

### Skenario 5: Pencarian Hierarkis (Parent Visibility Rule)
*   **Tujuan**: Memastikan struktur pohon tugas (parent) tetap terlihat saat pencarian teks mencocokkan subtask di bawahnya.
*   **Langkah**:
    1. Ketik kata kunci **`"Docker"`** di kolom input pencarian di panel kiri.
*   **Hasil**:
    - Subtask **"Subtask 2.2: Docker Container Mapping"** (yang cocok dengan kata "Docker") tetap ditampilkan.
    - Node induk **"Task 2: Database Setup"** (yang namanya tidak mengandung kata "Docker") **tetap dipertahankan visibilitasnya** di atas subtask agar hierarki visual pohon tidak terputus.
    - Tugas lain yang tidak cocok dan tidak berasosiasi dengan subtask (seperti *Task 1* dan *Task 3*) disembunyikan secara otomatis.

---

## 🔍 Cara Memantau Basis Data Secara Visual (Prisma Studio)

Jika Anda ingin memeriksa status baris data di tabel PostgreSQL secara visual saat pengujian berlangsung:
1. Buka terminal baru di direktori `backend/`.
2. Jalankan perintah:
   ```bash
   npx prisma studio
   ```
3. Akses **[http://localhost:5555](http://localhost:5555)** di browser Anda untuk menjelajahi baris data di tabel `Project`, `Task`, `ProjectDependency`, dan `TaskDependency`.
