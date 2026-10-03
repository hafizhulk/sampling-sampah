# Kalkulator Sampling Timbulan Sampah — SNI 3964:2025

Aplikasi web untuk menentukan **jumlah contoh (sampling)** timbulan sampah pada empat kategori sumber sampah, mengikuti rumus **SNI 3964:2025**:

**SRT** (Sampah Rumah Tangga) · **SSSRT** (Sampah Sejenis Sampah Rumah Tangga) · **TPS/TPS3R/TPST** · **TPA**

### 🔗 Live: <https://play.reloop.id/sampling-sampah/>

---

## Daftar isi

- [Tentang](#tentang)
- [Fitur](#fitur)
- [Rumus yang dipakai](#rumus-yang-dipakai)
- [Struktur proyek](#struktur-proyek)
- [Persyaratan](#persyaratan)
- [Menjalankan secara lokal](#menjalankan-secara-lokal)
- [Deployment](#deployment)
- [Catatan & batasan](#catatan--batasan)

---

## Tentang

Penentuan jumlah contoh timbulan sampah biasanya dikerjakan manual dengan spreadsheet: rumus di-copy berulang, klasifikasi kota dan koefisien `Cd` dicari di tabel, dan langkah perhitungannya hilang begitu file ditutup.

Aplikasi ini mengubah proses itu menjadi kalkulator terpandu: masukkan data lapangan, dan semua perhitungan — termasuk **langkah perhitungan yang bisa diverifikasi satu per satu** — keluar sebagai hasil siap dilampirkan ke laporan.

Aplikasi bersifat **stateless**: tidak ada database, tidak ada login, tidak ada data yang disimpan di server. Semua input hidup di dalam satu request POST.

## Fitur

### 1. SRT — Sampah Rumah Tangga (Pasal 4.2.2)

- **Proyeksi penduduk geometrik** `Pt = P₀ × (1 + r/100)ⁿ` bila data penduduk tahun rencana belum tersedia; atau isi `Pt` secara langsung.
- **Klasifikasi kota & koefisien `Cd` ditentukan otomatis** dari `Pt` (Tabel 3) — Megapolitan 1,5 · Metropolitan 1,0 · Kota Besar 1,0 · Kota Sedang 0,5 · Kota Kecil 0,5. Tidak perlu menebak.
- Dua alternatif metode:
  - **Alt 1:** `Ps = Cd × √Pt`; untuk `Pt > 1.000.000` otomatis memakai faktor `Cj = Pt / 1.000.000`.
  - **Alt 2 (Slovin):** `n = N / (1 + N·e²)` dengan `e` = 10% / 5% / 1%.
- Konversi jumlah orang → rumah tangga melalui **rata-rata orang per KK (`N̄`)**.
- **Distribusi jumlah rumah per tingkat ekonomi (H/M/L)** mengikuti proporsi `Sn`, memakai *largest remainder method* sehingga `Nr(H) + Nr(M) + Nr(L)` selalu **tepat sama** dengan `K` — tidak ada pembulatan yang hilang.

### 2. SSSRT — Sampah Sejenis Sampah Rumah Tangga (Pasal 4.2.3)

- Input **banyak jenis fasilitas** secara dinamis (kawasan komersial, industri, fasilitas sosial/umum/lain) dengan daftar jenis fasilitas yang sudah disiapkan.
- **Alt 1:** `S = Cd × √Ts` · **Alt 2 (Slovin):** `n = Ts / (1 + Ts·e²)`.
- Hasil per fasilitas **dibatasi tidak melebihi** `Ts` (unit berbeda tanpa pengembalian), lengkap dengan keterangan bila pemotongan terjadi.
- Tabel hasil dengan baris total unit dan total contoh.

### 3. TPS / TPS3R / TPST (Pasal 4.2.4)

- **Metode dipilih otomatis per lokasi**, sesuai pasal: `N > 30` ritasi/hari → Alt 1 (Slovin), `N ≤ 30` → Alt 2 (`⌈10% × N⌉`).
- Bila metode yang tersimpan bertentangan dengan aturan pasal, aplikasi **mengoreksi sendiri** dan menandainya di kolom metode (mis. `[dikoreksi dari Alt 2]`).
- **Pratinjau langsung** jumlah contoh saat `N` diketik, sebelum tombol Hitung ditekan.
- Mendukung banyak lokasi sekaligus, masing-masing dengan nama, jenis, dan kapasitas alat (m³).

### 4. TPA (Pasal 4.2.5)

- **Alt 1 (Slovin)** atau **Alt 2 (10% × N)**, dengan `e` = 10% / 5% / 1%.
- Banyak TPA sekaligus, masing-masing dengan kapasitas (ton/hari) dan jumlah ritasi alat angkut per hari.
- Pratinjau langsung, plus tabel hasil dengan baris total.

### 5. Panduan

Tab berisi kumpulan rumus tiap pasal dan tabel koefisien `Cd` (Tabel 3), sehingga tidak perlu membuka dokumen SNI hanya untuk melihat rumus.

### Lintas fitur

- **Transparansi perhitungan:** setiap hasil disertai daftar *langkah perhitungan* bernomor, sehingga angka dapat diaudit manual.
- **Validasi input** dengan pesan galat Bahasa Indonesia yang spesifik (mis. `Total Sn harus = 100%`, `Tahun rencana harus lebih besar dari tahun dasar`).
- **Nilai form dipertahankan** setelah POST — hasil tidak hilang saat ingin mengubah satu parameter lalu menghitung ulang.
- **UI responsif** dengan tema terang berkontras AA, tanpa dependensi eksternal (tanpa CDN, tanpa font eksternal, tanpa pelacak).

## Rumus yang dipakai

```text
Proyeksi penduduk : Pt = P₀ × (1 + r/100)ⁿ

SRT    Alt 1 (Pt ≤ 1 jt) : Ps = Cd × √Pt
SRT    Alt 1 (Pt > 1 jt) : Cj = Pt / 1.000.000 ;  Ps = Cd × Cj × √Pt
SRT    Alt 2 (Slovin)    : n = N / (1 + N·e²)
SRT    Konversi          : K = Ps / N̄
SRT    Distribusi        : Nr = Sn × K             (per level H / M / L)

SSSRT  Alt 1             : S = Cd × √Ts
SSSRT  Alt 2 (Slovin)    : n = N / (1 + N·e²)

TPS    N > 30 /hari      : n = N / (1 + N·e²)
TPS    N ≤ 30 /hari      : n = ⌈10% × N⌉

TPA    Alt 1             : n = N / (1 + N·e²)
TPA    Alt 2             : n = ⌈10% × N⌉
```

### Koefisien Cd (Tabel 3)

| Klasifikasi  | Jumlah penduduk         | Cd  |
| ------------ | ----------------------- | --- |
| Megapolitan  | ≥ 5.000.000             | 1,5 |
| Metropolitan | 1.000.000 – < 5.000.000 | 1,0 |
| Kota Besar   | 500.000 – < 1.000.000   | 1,0 |
| Kota Sedang  | 100.000 – < 500.000     | 0,5 |
| Kota Kecil   | < 100.000               | 0,5 |

## Struktur proyek

```text
sampling-sampah/
├── index.php                  # Satu-satunya entry point yang diakses browser
├── assets/
│   ├── style.css              # Seluruh styling (tanpa framework CSS)
│   └── app.js                 # Tab, proyeksi, pratinjau, baris dinamis
├── app/                       # Dibuka hanya oleh index.php, bukan via web
│   ├── .htaccess              # Deny direct access (Apache)
│   ├── config.php             # Konstanta & nilai default form
│   ├── bootstrap.php          # Baca state form + proses POST
│   ├── lib/
│   │   ├── helpers.php        # Helper presentasi (esc, numf, kartu hasil)
│   │   └── sampling.php       # Rumus SNI 3964:2025 (murni, tanpa I/O)
│   └── templates/
│       ├── layout.php         # Kerangka HTML
│       └── tabs/              # srt · sssrt · tps · tpa · info
└── .vscode/tasks.json         # Task "PHP: Start Server"
```

Pemisahan ini disengaja: **semua rumus terkumpul di `app/lib/sampling.php` sebagai fungsi murni** (tanpa akses `$_POST`), sehingga mudah diuji dan diverifikasi terhadap dokumen SNI secara terpisah dari lapisan tampilan.

## Persyaratan

- **PHP 7.4+** (disarankan PHP 8.x) — memakai *arrow function* (`fn()`) dan *null coalescing* (`??`).
- Tidak ada **Composer**, `npm`, atau proses build. Tidak ada dependensi pihak ketiga.

## Menjalankan secara lokal

```bash
git clone https://github.com/hafizhulk/sampling-sampah.git
cd sampling-sampah
php -S 127.0.0.1:8001
```

Lalu buka <http://127.0.0.1:8001/>.

Atau, di VS Code: jalankan task **`PHP: Start Server`** (`.vscode/tasks.json`), yang menyalakan server pada port `8001` dengan document root di folder proyek.

> Aplikasi tidak membutuhkan konfigurasi apa pun — tidak ada `.env`, tidak ada koneksi database.

## Deployment

Aplikasi berjalan baik di **subdirektori** (seperti live demo di `/sampling-sampah/`) maupun di **root domain**, karena semua aset direferensikan dengan path relatif.

Cukup unggah seluruh isi repositori ke direktori target pada web server dengan PHP aktif:

```bash
rsync -av --delete ./ user@server:/var/www/html/sampling-sampah/
```

Yang perlu dipastikan di server:

- PHP 7.4+ aktif pada direktori tersebut.
- **Jangan** menaruh isi `app/` langsung di dalam docroot. `index.php` ada di root dan merangkai semuanya.
- `app/.htaccess` bekerja pada **Apache**. Untuk **Nginx**, tambahkan aturan setara agar `app/` tidak dapat diakses langsung:

```nginx
location ^~ /app/ { deny all; }
```

Lapisan pengaman kedua tetap berlaku di lingkungan apa pun: setiap file di `app/` diawali `defined('APP') or exit('No direct access');`, sehingga request langsung akan berhenti dengan sendirinya.

## Catatan & batasan

- Aplikasi hanya menerima nilai `e` = **10%, 5%, atau 1%**, sesuai pilihan yang divalidasi di server (`eValid()`).
- **`Cd` pada tab SRT tidak dapat diisi manual** — sengaja diturunkan dari `Pt` agar tidak ada ketidakcocokan antara klasifikasi kota dan koefisiennya.
- Aplikasi **tidak menyimpan riwayat perhitungan** dan belum mengekspor PDF/Excel; hasil ditampilkan di layar sebagai tabel dan langkah perhitungan.
- Ini alat bantu hitung. **Keputusan akhir metode sampling dan validitas data lapangan tetap berada pada perencana/penyusun dokumen**, dengan merujuk pada dokumen resmi **SNI 3964:2025**.

---

Dibuat untuk mempermudah perencanaan sampling timbulan sampah di Indonesia.
