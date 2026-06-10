<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TeachingMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $methods = [
            // 5 METODE KLASIK (PESANTREN TRADISIONAL)
            [
                'name' => 'Sorogan',
                'description' => 'Metode pembelajaran individual di mana santri menghadap guru satu per satu untuk membaca dan mengkaji materi.',
            ],
            [
                'name' => 'Bandongan / Wetonan',
                'description' => 'Metode pembelajaran klasikal di mana kiai/guru membacakan dan menjelaskan kitab sementara santri menyimak dan memaknai kitabnya masing-masing.',
            ],
            [
                'name' => 'Bahtsul Masail (Diskusi Berbasis Masalah)',
                'description' => 'Diskusi kelompok tingkat lanjut untuk memecahkan permasalahan hukum Islam berdasarkan referensi kitab kuning.',
            ],
            [
                'name' => 'Hafalan (Tahfidz / Muhafadzah)',
                'description' => 'Metode menghafal teks-teks pelajaran, ayat Al-Qur\'an, bait nadzam, atau hadits secara berulang-ulang.',
            ],
            [
                'name' => 'Halaqah (Diskusi Melingkar)',
                'description' => 'Pembelajaran berbentuk lingkaran kecil untuk mendiskusikan materi secara mendalam bersama guru.',
            ],

            // 10 METODE KEKINIAN (MODERN CLASSROOM)
            [
                'name' => 'Project-Based Learning (PjBL)',
                'description' => 'Santri belajar melalui investigasi masalah dunia nyata dan menghasilkan proyek atau karya nyata sebagai solusi.',
            ],
            [
                'name' => 'Problem-Based Learning (PBL)',
                'description' => 'Pembelajaran yang berpusat pada pemecahan masalah (studi kasus) untuk melatih berpikir kritis dan analitis santri.',
            ],
            [
                'name' => 'Flipped Classroom (Kelas Terbalik)',
                'description' => 'Santri mempelajari materi di luar jam kelas melalui modul/video, kemudian waktu kelas digunakan untuk diskusi dan praktik mendalam.',
            ],
            [
                'name' => 'Cooperative Learning (Belajar Kooperatif)',
                'description' => 'Kerja kelompok terstruktur di mana setiap santri memiliki tanggung jawab spesifik dalam kelompoknya.',
            ],
            [
                'name' => 'Discovery Learning',
                'description' => 'Santri didorong untuk menemukan konsep dan prinsip sendiri melalui observasi, klasifikasi, dan eksperimen.',
            ],
            [
                'name' => 'Inquiry-Based Learning',
                'description' => 'Pembelajaran yang melibatkan santri untuk merumuskan pertanyaan, mencari informasi, dan membangun pemahaman mandiri.',
            ],
            [
                'name' => 'Blended Learning',
                'description' => 'Kombinasi antara pembelajaran tatap muka di kelas dengan pembelajaran berbasis digital/online.',
            ],
            [
                'name' => 'Gamification (Gamifikasi)',
                'description' => 'Penerapan elemen permainan (poin, level, dsb) ke dalam pembelajaran untuk meningkatkan motivasi dan keterlibatan santri.',
            ],
            [
                'name' => 'Role Playing (Bermain Peran)',
                'description' => 'Santri memainkan peran tertentu dalam situasi simulasi untuk memahami konsep, perspektif, atau sejarah materi.',
            ],
            [
                'name' => 'Mind Mapping (Peta Konsep)',
                'description' => 'Metode memvisualisasikan informasi ke dalam diagram grafis yang menghubungkan ide-ide pokok secara terstruktur.',
            ],
        ];

        // Hapus metode lama yang tidak ada di list jika diinginkan (opsional)
        // \App\Models\TeachingMethod::truncate();

        foreach ($methods as $method) {
            \App\Models\TeachingMethod::updateOrCreate(
                ['name' => $method['name']],
                ['description' => $method['description'], 'is_active' => true]
            );
        }
    }
}
