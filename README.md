# Project Tracker Monorepo

## Deskripsi Proyek

Project Tracker adalah alat manajemen proyek yang dirancang untuk mengorganisasi tugas, memantau kemajuan proyek, dan mengelola hubungan dependensi secara real-time.

Feature:

- Complete Project & Task Management (CRUD)
- Multi-Level Task Tree (Subtask Hierarchy)
- Dynamic Task & Project Dependencies
- Automated Weight-Based Progress Tracking
- Project Timeline Conflict Guard (Date Overlaps)
- Parent-Preserving Hierarchical Task Search
- DFS-Based Circular Dependency Validation

---

## Tech Stack & Architecture

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

## Skema Relasi Database

Basis data PostgreSQL diatur dengan relasi kuat melalui Prisma ORM:
1. **`projects`**: Menyimpan identitas proyek, jadwal tanggal mulai-selesai, derived status, dan bobot penyelesaian.
2. **`tasks`**: Menyimpan hirarki tugas (parent-child) untuk merepresentasikan task utama dan subtask.
3. **`project_dependencies`**: Tabel pivot unik (`project_id`, `depends_on_project_id`) untuk mendefinisikan ketergantungan antar-proyek.
4. **`task_dependencies`**: Tabel pivot unik (`task_id`, `depends_on_task_id`) untuk mendefinisikan ketergantungan antar-tugas.

---

## Panduan Instalasi & Persiapan Lingkungan

Ikuti langkah-langkah di bawah ini secara berurutan (satu per satu) untuk menjalankan aplikasi:

### Langkah 1: Memeriksa Prasyarat
Pastikan telah terinstal:
*   **Node.js** (versi 18 ke atas)
*   **PostgreSQL** (baik diinstal lokal secara langsung atau menggunakan Docker Desktop)

### Langkah 2: Mengkloning Repositori Proyek
Buka terminal/command prompt, jalankan perintah git berikut untuk clone project:
```bash
git clone https://github.com/AxsevSutrisna/case-project-tracker.git
```

### Langkah 3: Masuk ke Direktori Proyek
Pindahkan navigasi terminal ke dalam folder proyek yang baru saja dikloning:
```bash
cd case-project-tracker
```

### Langkah 4: Menginstal Seluruh Dependensi Proyek
Instal semua dependensi server (backend) dan client (frontend) secara otomatis sekaligus dengan menjalankan perintah berikut di direktori root:
```bash
npm install
```

### Langkah 5: Membuat File Konfigurasi Lingkungan (`.env`)
Buat file baru bernama **`.env`** di dalam folder **`backend/`** (yaitu `backend/.env`). Isikan kode konfigurasi berikut (silakan sesuaikan `username` dan `password`):
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/project_tracker?schema=public"
```
*(Catatan: Templat dasar ini juga dapat dilihat dan di copy dari berkas `backend/.env.example`).*

### Langkah 6: Menjalankan Server Database PostgreSQL
Nyalakan database PostgreSQL di port `5432` sesuai dengan kredensial yang tulis di berkas `.env`.
*   **Jika Menggunakan Docker**: Cukup jalankan perintah ini di direktori root:
    ```bash
    docker-compose up -d
    ```
*   **Jika Menggunakan PostgreSQL Lokal**: Pastikan aplikasi PostgreSQL di sistem operasi sudah menyala dan aktif.

### Langkah 7: Menerapkan Migrasi Database & Mengisi Data Contoh (Seed)
Buat struktur tabel basis data sekaligus isi datanya dengan contoh simulasi awal dengan menjalankan perintah berikut pada direktori root:
```bash
npm run db:setup
```

### Langkah 8: Menjalankan Server Aplikasi
Jalankan backend server (port `5000`) dan frontend client (port `5173`) secara bersamaan menggunakan perintah pintas berikut di direktori root:
```bash
npm run dev
```

*Buka browser dan akses alamat berikut untuk mulai menggunakan aplikasi:
**[http://localhost:5173](http://localhost:5173)**


---

## Memantau Basis Data Secara Visual (Prisma Studio)

1. Buka jendela terminal baru di direktori `backend/`.
2. Jalankan perintah berikut:
   ```bash
   npx prisma studio
   ```
3. Akses alamat **[http://localhost:5555](http://localhost:5555)** di browser untuk menjelajahi tabel database secara interaktif (`Project`, `Task`, `ProjectDependency`, `TaskDependency`).

---

## Pengujian API dengan Postman

Untuk mempermudah pengujian REST API, berkas ekspor Postman Collection telah disediakan di dalam direktori root:

1. Buka aplikasi **Postman**.
2. Klik tombol **Import** di area navigasi kiri atas.
3. Pilih atau seret berkas **`project-tracker.postman_collection.json`** dari direktori root proyek ini.
4. Koleksi bernama **`Project Tracker API Collection`** akan muncul dan siap digunakan untuk menguji fungsionalitas CRUD Proyek, Tugas, Dependensi, dan Health Check.
5. Jalankan server lokal (`npm run dev`) lalu silakan tekan tombol **Send** untuk mengirim request uji coba.
