# Lowies Personal Finance

Aplikasi manajemen keuangan pribadi modern, bersih, dan profesional — dibangun sebagai proyek portofolio frontend berkualitas produksi.

**Live Preview:** `npm run dev` → http://localhost:5173  
**Stack:** React 19 + Vite 6 + Tailwind CSS 4 + React Router 7 + Recharts + Axios + Lucide React

![Lowies Personal Finance](public/favicon.svg)

---

## ✨ Fitur Utama

- **Dashboard** — ringkasan saldo, pemasukan, pengeluaran, sisa anggaran, grafik pemasukan vs pengeluaran, pengeluaran per kategori, transaksi terbaru, progres anggaran
- **Transaksi** — CRUD penuh, pencarian, filter tipe/kategori/tanggal, sort, pagination, layout tabel (desktop) & kartu (mobile), validasi form
- **Anggaran (Budgets)** — anggaran per kategori per bulan, progress bar dengan state warning/melebihi, ringkasan total
- **Analitik** — 4 visualisasi Recharts (Pie, Bar, Area, stacked Bar) + ringkasan teks aksesibel
- **Laporan** — filter bulan/rentang tanggal/tipe, pratinjau tabel, ekspor CSV (download blob) & placeholder PDF
- **Pengaturan** — profil (update nama/email), tema gelap/terang, preferensi notifikasi & status Telegram (placeholder), logout
- **Autentikasi** — login, register, lupa kata sandi, tombol Google (placeholder), protected routes, session persist via `localStorage`
- **Desain System** — komponen UI reusable (Button, Input, Select, Card, Badge, Modal, EmptyState, dll), dark/light mode, responsif 390px–1440px

Semua nilai uang diformat sebagai **Rupiah (IDR)** via `Intl.NumberFormat` (`src/utils/formatters.js:4`).

---

## 🧱 Arsitektur

```
src/
├── assets/
├── components/
│   ├── layout/   → Sidebar.jsx, Navbar.jsx
│   └── ui/       → Button, Input, Select, Card, Badge, Modal, EmptyState, Skeleton, ProgressBar, PageHeader, StatCard, LoadingSpinner
├── layouts/      → AppLayout.jsx (sidebar+navbar), AuthLayout.jsx (split branding + form)
├── pages/
│   ├── auth/     → Login.jsx, Register.jsx, ForgotPassword.jsx
│   ├── Dashboard.jsx, Transactions.jsx, Budgets.jsx, Analytics.jsx, Reports.jsx, Settings.jsx
├── routes/       → AppRoutes.jsx, ProtectedRoute.jsx
├── services/     → api.js (Axios instance), authService.js, transactionService.js, budgetService.js, dashboardService.js
├── context/      → ThemeContext.jsx, AuthContext.jsx, ToastContext.jsx
├── data/         → mockData.js (data pengembangan, jelas terpisah)
├── utils/        → formatters.js, constants.js
├── lib/          → cn.js
├── App.jsx
├── main.jsx
└── index.css
```

**Prinsip:**
- `VITE_USE_MOCK=true` → semua service memakai mock `localStorage` (tanpa backend). Set `false` untuk mengarah ke Express.js.
- Axios instance terpusat di `src/services/api.js:1` (baseURL dari `VITE_API_URL`, attach Bearer token, handler 401).
- Context minimal: Auth & Theme global, sisanya state lokal per halaman.
- Tidak ada kredensial sensitif di frontend; token Telegram tidak pernah diekspos.

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js 18+ dan npm

### Instalasi
```bash
npm install
```

### Environment
Salin `.env.example` ke `.env`:

```
VITE_API_URL=http://localhost:5000/api
VITE_USE_MOCK=true
```

- `VITE_USE_MOCK=true` → mode pengembangan tanpa backend (disarankan untuk demo/portofolio)
- `VITE_USE_MOCK=false` → gunakan backend Node.js + Express + MySQL yang sebenarnya

### Development
```bash
npm run dev
```
Buka http://localhost:5173

**Login mode mock:** gunakan email apa saja (mis. `demo@lowies.com`) dengan password minimal 6 karakter.

### Build Produksi
```bash
npm run build
npm run preview
```

Build output ada di `dist/`. Build telah diverifikasi (`vite build` sukses, ~869 kB JS / 58 kB CSS, gzip ~250 kB / 9.7 kB).

### Lint
```bash
npm run lint
```

---

## 🔌 Integrasi Backend (yang akan datang)

Frontend sudah siap untuk backend Express.js:

| Service | Endpoint (contoh) |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`, `PUT /api/auth/profile` |
| Transaksi | `GET /api/transactions?page&limit&search&type&category&dateFrom&dateTo&sort`, `POST /api/transactions`, `PUT /api/transactions/:id`, `DELETE /api/transactions/:id` |
| Anggaran | `GET /api/budgets?month=YYYY-MM`, `POST /api/budgets`, `PUT /api/budgets/:id`, `DELETE /api/budgets/:id` |
| Dashboard | `GET /api/dashboard?month=YYYY-MM`, `GET /api/dashboard/analytics?month=YYYY-MM` |
| Laporan | `GET /api/reports/export?format=csv&...` (akan mengembalikan file) |

Cukup set `VITE_USE_MOCK=false` dan `VITE_API_URL` ke URL backend.

---

## 🎨 Desain & Responsivitas

- **Tema:** Dark (`#090d16` bg) & Light (`#f8fafc` bg), aksen indigo-600, emerald/rose/amber untuk status finansial
- **Tipografi:** Plus Jakarta Sans (Google Fonts), hierarki konsisten via Tailwind
- **Komponen:** rounded-2xl cards, border halus, shadow-sm, ikon Lucide konsisten
- **Responsif:** diuji pada 390px (mobile), 768px (tablet), 1024px (laptop), 1440px (desktop) — tanpa overflow horizontal, tabel menjadi kartu di mobile, chart dalam `ResponsiveContainer`

---

## 📝 Lisensi & Catatan

- Data mock di `src/data/mockData.js:1` hanya untuk pengembangan dan tidak diklaim sebagai data pengguna nyata.
- Google Login & Telegram adalah placeholder UI; integrasi sebenarnya ditangani backend.
- Dibuat untuk tujuan portofolio profesional.

---

## 👤 Author

Lowies Personal Finance — © 2026
"# LowiesPersonalFinance" 
