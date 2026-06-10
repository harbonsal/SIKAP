# Dokumentasi API SIAP Alwan (v1)

Gunakan panduan ini untuk mengintegrasikan aplikasi pihak ketiga dengan data santri secara aman.

---

### 🚀 Base URL & Autentikasi
Semua permintaan harus dikirim melalui HTTPS dengan header berikut:

**Base URL:** `https://sikap.sinawang.my.id/api/v1`
**Auth Header:** `X-Api-Key: [TOKEN_ANDA]`

---

### 📘 Langkah Integrasi (Quick Start)

#### Langkah 1: Ambil Referensi Semester
Gunakan endpoint ini untuk mendapatkan daftar semester yang pernah diikuti santri.
**GET** `/student/{nomor_induk}/semesters`

#### Langkah 2: Ambil Data Nilai (Rapor)
Pilih salah satu metode URL untuk mengambil nilai akademik, akhlak, dan tahfidz:

*   **Opsi A (Rapor Aktif):**
    `GET /student/{nomor_induk}/grades`
*   **Opsi B (Rapor Histori - Query Params):**
    `GET /student/{nomor_induk}/{semester}/grades?tahunAjaran=2025/2026`

> [!TIP]
> **{semester}** menggunakan nama semester: "Ganjil" atau "Genap"
> **tahunAjaran** menggunakan format: "2025/2026"

#### Langkah 3: Ambil Data Karakter/Akhlak (Opsional)
Untuk mengambil data karakter/akhlak santri dari menu pengasuhan:

*   **Opsi A (Karakter Aktif):**
    `GET /student/{nomor_induk}/character`
*   **Opsi B (Karakter Histori - Query Params):**
    `GET /student/{nomor_induk}/{semester}/character?tahunAjaran=2025/2026`

> [!TIP]
> Format parameter sama dengan endpoint grades

---

### 📊 Contoh Struktur Response (200 OK)
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

---

### ⚠️ Keamanan & Rate Limit
1. Jangan pernah menanamkan (*hardcode*) API Key dalam kode sumber aplikasi mobile/web sisi klien. Gunakan *backend proxy* jika memungkinkan.
2. Token dapat dicabut (*revoke*) sewaktu-waktu oleh admin SIKAP jika terdeteksi aktivitas mencurigakan.
3. Gunakan header `Accept: application/json` pada setiap permintaan.
