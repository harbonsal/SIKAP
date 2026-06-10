# Dokumentasi API SIAP Alwan (v1) - Pembaruan 01 Juni 2026

Gunakan panduan ini untuk mengintegrasikan aplikasi pihak ketiga dengan data santri secara aman. Pembaruan ini mencakup *endpoint* tambahan khusus untuk sinkronisasi nilai Tahfidz dan Pantauan Akhlak bulanan.

---

### 🚀 Base URL & Autentikasi
Semua permintaan harus dikirim melalui HTTPS dengan header berikut:

**Base URL:** `https://sikap.sinawang.my.id/api/v1`
**Auth Header:** `X-Api-Key: [TOKEN_ANDA]`

---

### 📘 Langkah Integrasi (Quick Start)

#### Langkah 1: Ambil Referensi Semester
Gunakan endpoint ini untuk mendapatkan daftar ID semester yang pernah diikuti santri.
**GET** `/student/{nomor_induk}/semesters`

#### Langkah 2: Ambil Data Nilai (Rapor)
Pilih salah satu metode URL untuk mengambil nilai akademik, akhlak, dan tahfidz secara umum (format lama):

*   **Opsi A (Rapor Aktif):**
    `GET /student/{nomor_induk}/grades`
*   **Opsi B (Rapor Histori - Query Params):**
    `GET /student/{nomor_induk}/{semester}/grades?tahunAjaran=2025/2026`

> [!TIP]
> **{semester}** menggunakan nama semester: "Ganjil" atau "Genap"
> **tahunAjaran** menggunakan format: "2025/2026"

#### Langkah 3: Ambil Data Karakter/Akhlak
Terdapat tiga opsi untuk menarik data karakter/akhlak santri:

*   **Opsi A (Karakter Aktif - Format Umum):**
    `GET /student/{nomor_induk}/character`
*   **Opsi B (Karakter Histori - Format Umum):**
    `GET /student/{nomor_induk}/{semester}/character?tahunAjaran=2025/2026`
*   **[BARU] Opsi C (Histori Bulanan - Khusus UI Aplikasi Eksternal):**
    `GET /student/{nomor_induk}/{semester}/character/monthly?tahunAjaran=2025/2026`

#### Langkah 4: Ambil Data Nilai Tahfidz
*   **[BARU] Opsi Khusus Tabel Tahfidz (UI Aplikasi Eksternal):**
    `GET /student/{nomor_induk}/{semester}/tahfidz?tahunAjaran=2025/2026`

---

### 📊 Contoh Struktur Response (200 OK)

#### 1. Rapor Keseluruhan (`/grades`)
```json
{
    "success": true,
    "data": {
        "student": {
            "nomor_induk": "220011",
            "nama": "Fulan bin Fulan",
            "kelas": "VII A",
            "jenjang": "SMP"
        },
        "academic": {
            "semester": "Ganjil",
            "tahun_ajaran": "2024/2025",
            "average_score": 88.5,
            "subjects": [
                {
                    "name": "Matematika",
                    "kkm": 75,
                    "score": 90,
                    "components": { "UH1": 85, "UTS": 90, "UAS": 95 },
                    "status": "Tuntas"
                }
            ]
        },
        "character": [
            { "category": "Kedisiplinan", "score": 90, "note": "Sangat baik." }
        ],
        "tahfidz": {
            "completed_juz": [1, 2, 30],
            "validated_juz": [30],
            "total_completed": 3
        },
        "attendance": { "sakit": 1, "izin": 0, "alpa": 0, "total": 1 }
    }
}
```

#### 2. Akhlak Bulanan (`/character/monthly`) - [BARU]
*Respons yang dirancang khusus agar langsung cocok dengan tabel pantauan akhlak bulanan.*
```json
{
  "success": true,
  "data": {
    "student": {
      "nomor_induk": "220011",
      "nama": "Fulan bin Fulan",
      "kelas": "VII A"
    },
    "monthly_character": [
      {
        "Bulan": "Agustus",
        "Ibadah": 75,
        "Patuh": 72,
        "Disiplin": 75,
        "Sopan": 72,
        "Bersih": 73,
        "Rajin": 71
      }
    ]
  }
}
```

#### 3. Nilai Tahfidz Eksternal (`/tahfidz`) - [BARU]
*Respons yang dirancang khusus untuk mengisi tabel ujian/nilai Tahfidz.*
```json
{
  "success": true,
  "data": {
    "student": {
      "nomor_induk": "220011",
      "nama": "Fulan bin Fulan",
      "kelas": "VII A"
    },
    "tahfidz": [
      {
        "Juz": "30",
        "Lembar": "20",
        "Nilai": 85,
        "Predikat": "B",
        "Ujian": "UTS"
      }
    ]
  }
}
```

---

### ⚠️ Keamanan & Rate Limit
1. Jangan pernah menanamkan (*hardcode*) API Key dalam kode sumber aplikasi mobile/web sisi klien. Gunakan *backend proxy* jika memungkinkan.
2. Token dapat dicabut (*revoke*) sewaktu-waktu oleh admin SIKAP jika terdeteksi aktivitas mencurigakan.
3. Gunakan header `Accept: application/json` pada setiap permintaan.
