import React, { useState } from 'react';
import MainLayout from '@/Layouts/MainLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import { Copy } from 'lucide-react';

export default function Index({ apiKeys }) {
    const { app_settings } = usePage().props;
    const [creationModal, setCreationModal] = useState(false);
    const [deletionModal, setDeletionModal] = useState(false);
    const [docModal, setDocModal] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState(null);

    const { data: createData, setData: setCreateData, post: createPost, processing: createProcessing, errors: createErrors, reset: createReset } = useForm({
        name: '',
    });

    const { delete: destroy } = useForm();

    const openCreationModal = () => {
        setCreationModal(true);
    };

    const closeCreationModal = () => {
        setCreationModal(false);
        createReset();
    };

    const openDocModal = () => {
        setDocModal(true);
    };

    const closeDocModal = () => {
        setDocModal(false);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        createPost(route('settings.api-keys.store'), {
            onSuccess: () => closeCreationModal(),
        });
    };

    const openDeletionModal = (keyId) => {
        setKeyToDelete(keyId);
        setDeletionModal(true);
    };

    const closeDeletionModal = () => {
        setDeletionModal(false);
        setKeyToDelete(null);
    };

    const submitDelete = (e) => {
        e.preventDefault();
        destroy(route('settings.api-keys.destroy', keyToDelete), {
            onSuccess: () => closeDeletionModal(),
        });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('API Key disalin ke clipboard!');
    };

    const toggleStatus = (key) => {
        if(confirm(`Apakah Anda yakin ingin ${key.is_active ? 'menonaktifkan' : 'mengaktifkan'} API Key ini?`)) {
            // Kita bisa menggunakan post/put untuk ini, buat form cepat
            const formObj = {
                name: key.name,
                is_active: !key.is_active
            };
            
            // Using a simple fetch or Inertia visit is fine, here we just use router.put
            // But we need router from @inertiajs/react. Let's use useForm instead inside a component or just router.
            import('@inertiajs/react').then(({ router }) => {
                router.put(route('settings.api-keys.update', key.id), formObj);
            });
        }
    }

    return (
        <MainLayout>
            <Head title="Manajemen API Key" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Manajemen API Key</h2>
                        <p className="text-muted-foreground">Kelola autentikasi untuk aplikasi pihak ketiga.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={openDocModal}>Dokumentasi API</Button>
                        <Button onClick={openCreationModal}>Buat API Key Baru</Button>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar API Key</CardTitle>
                        <CardDescription>Semua kunci API yang digunakan untuk akses ke sistem ini.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Aplikasi</TableHead>
                                        <TableHead>Kunci API (Token)</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Terakhir Digunakan</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apiKeys.length > 0 ? (
                                        apiKeys.map((key) => (
                                            <TableRow key={key.id}>
                                                <TableCell className="font-medium">{key.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <code className="bg-gray-100 px-2 py-1 rounded text-sm select-all">
                                                            {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                                                        </code>
                                                        <button onClick={() => copyToClipboard(key.key)} className="text-gray-500 hover:text-indigo-600" title="Salin">
                                                            <Copy className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${key.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {key.is_active ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{key.last_used_at ? new Date(key.last_used_at).toLocaleString('id-ID') : 'Belum pernah digunakan'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" className="mr-2" onClick={() => toggleStatus(key)}>
                                                        {key.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => openDeletionModal(key.id)}>Hapus</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">Belum ada API Key dibuat.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Create Modal */}
                <Modal show={creationModal} onClose={closeCreationModal}>
                    <form onSubmit={submitCreate} className="p-6">
                        <h2 className="text-lg font-medium text-gray-900">Buat API Key Baru</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Masukkan nama identifikasi aplikasi atau layanan yang akan menggunakan kunci ini.
                        </p>
                        <div className="mt-6">
                            <InputLabel htmlFor="name" value="Nama Aplikasi / Layanan" />
                            <TextInput
                                id="name"
                                type="text"
                                className="mt-1 block w-full"
                                value={createData.name}
                                onChange={(e) => setCreateData('name', e.target.value)}
                                required
                            />
                            <InputError message={createErrors.name} className="mt-2" />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <SecondaryButton onClick={closeCreationModal}>Batal</SecondaryButton>
                            <PrimaryButton className="ml-3" disabled={createProcessing}>
                                Buat API Key
                            </PrimaryButton>
                        </div>
                    </form>
                </Modal>

                {/* Delete Modal */}
                <Modal show={deletionModal} onClose={closeDeletionModal}>
                    <form onSubmit={submitDelete} className="p-6">
                        <h2 className="text-lg font-medium text-gray-900">Konfirmasi Hapus</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Apakah Anda yakin ingin menghapus permanen API API Key ini? Akses dari aplikasi tersebut akan terputus seketika.
                        </p>
                        <div className="mt-6 flex justify-end">
                            <SecondaryButton onClick={closeDeletionModal}>Batal</SecondaryButton>
                            <DangerButton className="ml-3">Hapus Permanen</DangerButton>
                        </div>
                    </form>
                </Modal>

                {/* Documentation Modal */}
                <Modal show={docModal} onClose={closeDocModal} maxWidth="4xl">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Petunjuk Teknis Integrasi API</h2>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    const text = document.getElementById('api-doc-content').innerText;
                                    navigator.clipboard.writeText(text);
                                    alert('Dokumentasi disalin!');
                                }}>
                                    Salin Teks
                                </Button>
                                <Button variant="outline" size="sm" onClick={closeDocModal}>Tutup</Button>
                            </div>
                        </div>
                        
                        <div id="api-doc-content" className="bg-gray-50 p-6 rounded-lg border max-h-[70vh] overflow-y-auto text-sm font-mono whitespace-pre-wrap leading-relaxed">
{`# Dokumentasi API SIKAP ${app_settings?.app_name || 'Lembaga Anda'} (v1) - Pembaruan 01 Juni 2026

Gunakan panduan ini untuk mengintegrasikan aplikasi pihak ketiga dengan data santri secara aman. Pembaruan ini mencakup *endpoint* tambahan khusus untuk sinkronisasi nilai Tahfidz dan Pantauan Akhlak bulanan.

---

### 🚀 Base URL & Autentikasi
Semua permintaan harus dikirim melalui HTTPS dengan header berikut:

**Base URL:** \`${window.location.origin}/api/v1\`
**Auth Header:** \`X-Api-Key: [TOKEN_ANDA]\`

---

### 📘 Langkah Integrasi (Quick Start)

#### Langkah 1: Ambil Referensi Semester
Gunakan endpoint ini untuk mendapatkan daftar ID semester yang pernah diikuti santri.
**GET** \`/student/{nomor_induk}/semesters\`

#### Langkah 2: Ambil Data Nilai (Rapor)
Pilih salah satu metode URL untuk mengambil nilai akademik, akhlak, dan tahfidz secara umum (format lama):

*   **Opsi A (Rapor Aktif):**
    \`GET /student/{nomor_induk}/grades\`
*   **Opsi B (Rapor Histori - Query Params):**
    \`GET /student/{nomor_induk}/{semester}/grades?tahunAjaran=2025/2026\`

> [!TIP]
> **{semester}** menggunakan nama semester: "Ganjil" atau "Genap"
> **tahunAjaran** menggunakan format: "2025/2026"

#### Langkah 3: Ambil Data Karakter/Akhlak
Terdapat tiga opsi untuk menarik data karakter/akhlak santri:

*   **Opsi A (Karakter Aktif - Format Umum):**
    \`GET /student/{nomor_induk}/character\`
*   **Opsi B (Karakter Histori - Format Umum):**
    \`GET /student/{nomor_induk}/{semester}/character?tahunAjaran=2025/2026\`
*   **[BARU] Opsi C (Histori Bulanan - Khusus UI Aplikasi Eksternal):**
    \`GET /student/{nomor_induk}/{semester}/character/monthly?tahunAjaran=2025/2026\`

#### Langkah 4: Ambil Data Nilai Tahfidz
*   **[BARU] Opsi Khusus Tabel Tahfidz (UI Aplikasi Eksternal):**
    \`GET /student/{nomor_induk}/{semester}/tahfidz?tahunAjaran=2025/2026\`

---

### 📊 Contoh Struktur Response (200 OK)

#### 1. Rapor Keseluruhan (\`/grades\`)
\`\`\`json
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
\`\`\`

#### 2. Akhlak Bulanan (\`/character/monthly\`) - [BARU]
*Respons yang dirancang khusus agar langsung cocok dengan tabel pantauan akhlak bulanan.*
\`\`\`json
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
\`\`\`

#### 3. Nilai Tahfidz Eksternal (\`/tahfidz\`) - [BARU]
*Respons yang dirancang khusus untuk mengisi tabel ujian/nilai Tahfidz.*
\`\`\`json
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
\`\`\`

---

### ⚠️ Keamanan & Rate Limit
1. Jangan pernah menanamkan (*hardcode*) API Key dalam kode sumber aplikasi mobile/web sisi klien. Gunakan *backend proxy* jika memungkinkan.
2. Token dapat dicabut (*revoke*) sewaktu-waktu oleh admin SIKAP jika terdeteksi aktivitas mencurigakan.
3. Gunakan header \`Accept: application/json\` pada setiap permintaan.
`}
                        </div>
                    </div>
                </Modal>
            </div>
        </MainLayout>
    );
}
