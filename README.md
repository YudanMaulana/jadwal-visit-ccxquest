# Update Booking Kunjungan - Chocolatos X-Quest

Proyek web update booking kunjungan ini dibuat menggunakan **Vite + React + Tailwind CSS v4** dengan integrasi database **Firebase Firestore** untuk pengelolaan jadwal secara real-time. Desain UI/UX dioptimalkan agar serupa dengan poster/pamflet fisik Chocolatos X-Quest dengan sentuhan futuristik cyberpunk dan responsif.

## 🚀 Fitur Utama
1. **Real-time & Flexibel Date Selection**: Menampilkan jadwal hari ini secara realtime dan dilengkapi dengan *carousel slider* tanggal interaktif serta *date picker* untuk memilih tanggal di masa depan.
2. **Firestore Integration**: Menghubungkan slot ketersediaan kunjungan langsung ke Firebase Firestore. Jika data belum terisi, aplikasi akan menampilkan jadwal default.
3. **WhatsApp Click-to-Chat**: Tombol kontak WhatsApp Admin otomatis memformat pesan booking sesuai dengan tanggal yang sedang dipilih pengguna.
4. **Built-in Admin Panel**: Halaman editor tersembunyi yang aman untuk memudahkan admin melakukan update status, jam, kuota, atau nomor WhatsApp langsung dari browser tanpa perlu membuka Firebase Console.

---

## 🛠️ Cara Menjalankan Project Secara Lokal

1. Masuk ke direktori project:
   ```bash
   cd d:/xquest/booking-kunjungan
   ```
2. Pastikan dependensi sudah terinstal (atau jalankan ulang jika diperlukan):
   ```bash
   npm install
   ```
3. Jalankan server development:
   ```bash
   npm run dev
   ```
4. Buka browser pada alamat yang tertera (biasanya `http://localhost:5173`).

---

## 📂 Konfigurasi Database Firestore & Firebase

### 1. Masukkan Credentials Firebase Anda
Buka file [src/config/firebase.js](file:///d:/xquest/booking-kunjungan/src/config/firebase.js) dan lengkapi objek `firebaseConfig` dengan detail proyek Firebase Anda:
```javascript
const firebaseConfig = {
  apiKey: "API_KEY_ANDA",
  authDomain: "PROJECT_ID_ANDA.firebaseapp.com",
  projectId: "PROJECT_ID_ANDA",
  storageBucket: "PROJECT_ID_ANDA.appspot.com",
  messagingSenderId: "SENDER_ID_ANDA",
  appId: "APP_ID_ANDA"
};
```
*Catatan: Jika config masih berisi `PLACEHOLDER_...`, aplikasi akan berjalan dalam **Demo Mode (Lokal)** menggunakan data dummy.*

### 2. Struktur Dokumen Firestore
Admin dapat menambahkan jadwal untuk tanggal tertentu dengan membuat dokumen di Firestore dengan aturan berikut:
* **Nama Koleksi (Collection Name)**: `schedules`
* **ID Dokumen (Document ID)**: Format tanggal `YYYY-MM-DD` (contoh: `2026-06-11`)
* **Isi Dokumen (Fields)**:
```json
{
  "whatsappNumber": "628131073719",
  "whatsappDisplay": "08131073719",
  "updatedAt": "2026-06-07T13:21:02Z",
  "batches": [
    {
      "id": 1,
      "batch": "Batch 1",
      "time": "08:45",
      "status": "tersedia_quota",
      "quota": 50,
      "statusLabel": "TERSEDIA 50 ORANG"
    },
    {
      "id": 2,
      "batch": "Batch 2",
      "time": "09:45",
      "status": "tersedia_quota",
      "quota": 24,
      "statusLabel": "TERSEDIA 24 ORANG"
    },
    {
      "id": 3,
      "batch": "Batch 3",
      "time": "12:45",
      "status": "tersedia",
      "quota": null,
      "statusLabel": "TERSEDIA"
    },
    {
      "id": 4,
      "batch": "Batch 4",
      "time": "13:45",
      "status": "tersedia",
      "quota": null,
      "statusLabel": "TERSEDIA"
    },
    {
      "id": 5,
      "batch": "Batch 5",
      "time": "14:45",
      "status": "penuh",
      "quota": null,
      "statusLabel": "PENUH"
    }
  ]
}
```

---

## 🔒 Menggunakan Panel Admin (Admin Control Panel)

Untuk memudahkan admin mengisi jadwal per tanggal secara cepat:
1. Klik tombol **ikon Roda Gigi (Settings)** di pojok kanan atas layar.
2. Masukkan passcode: **`xquest2026`**
3. Setelah terbuka, admin dapat:
   * Mengubah Jam kunjungan untuk setiap Batch.
   * Mengubah status booking: **TERSEDIA**, **TERSEDIA (DENGAN KUOTA)**, atau **PENUH**.
   * Menambahkan kuota spesifik jika status dipilih sebagai *TERSEDIA (DENGAN KUOTA)*.
   * Mengubah nomor telepon WhatsApp Admin utama dan nama tampilan nomor tersebut.
4. Klik **SIMPAN JADWAL** untuk langsung menulis data ke Firestore (atau menyimpannya secara lokal jika Firebase belum terhubung).
5. Klik **LOGOUT** atau tombol **X** untuk kembali ke tampilan publik.
