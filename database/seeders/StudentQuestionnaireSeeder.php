<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\StudentQuestionnaire;

class StudentQuestionnaireSeeder extends Seeder
{
    public function run()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        StudentQuestionnaire::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $data = [
            'A' => [
                'Penjelasan guru dapat saya pahami tanpa harus sering bertanya ulang',
                'Guru memberikan contoh saat menjelaskan materi',
                'Materi yang diajarkan sesuai dengan pelajaran yang sedang dipelajari',
                'Guru terlihat siap saat mengajar (tidak bingung atau ragu-ragu)',
            ],
            'B' => [
                'Pelajaran dimulai saat kelas sudah tertib',
                'Guru mengaitkan pelajaran dengan materi sebelumnya atau kehidupan nyata',
                'Guru menyampaikan apa yang akan dipelajari di awal',
                'Pembukaan pelajaran tidak terlalu singkat dan tidak terlalu lama',
            ],
            'C' => [
                'Guru menggunakan lebih dari satu cara mengajar (misalnya penjelasan, tanya jawab, diskusi, atau praktik)',
                'Guru mengajukan pertanyaan selama pelajaran',
                'Banyak siswa ikut aktif (bukan hanya beberapa orang saja)',
                'Guru membantu siswa yang kesulitan memahami pelajaran',
                'Guru memberikan tantangan atau perhatian khusus kepada siswa yang lebih cepat memahami',
            ],
            'D' => [
                'Jika ada siswa yang mengganggu, guru menanganinya dengan tenang',
                'Waktu pelajaran tidak banyak terbuang untuk hal di luar pelajaran',
                'Perpindahan dari satu kegiatan ke kegiatan lain berjalan lancar',
                'Saya tetap bisa fokus sampai akhir pelajaran',
            ],
            'E' => [
                'Di akhir pelajaran, ada kesimpulan tentang apa yang dipelajari',
                'Guru melibatkan siswa saat membuat kesimpulan',
                'Guru memberi arahan untuk mengulang atau latihan setelah pelajaran',
                'Pelajaran ditutup dengan tertib (tidak mendadak)',
            ],
            'F' => [
                'Pelajaran dimulai tanpa menunggu lama',
                'Suara guru terdengar jelas dan mudah diikuti',
                'Penjelasan guru tidak terlalu cepat dan tidak membingungkan',
                'Saya dapat memahami bahasa yang digunakan guru (termasuk Bahasa Arab)',
            ],
            'G' => [
                'Setelah pelajaran ini, saya lebih paham dibanding sebelumnya',
                'Dalam pelajaran ini, saya benar-benar belajar sesuatu yang baru',
                'Jika guru ini mengajar lagi, saya ingin ikut kelasnya',
            ],
        ];

        $globalOrder = 1;
        foreach ($data as $aspect => $questions) {
            foreach ($questions as $qText) {
                StudentQuestionnaire::create([
                    'question' => $qText,
                    'order'    => $globalOrder++,
                    'is_active' => true,
                    'type'     => 'scale_1_3',
                    'aspect'   => $aspect,
                ]);
            }
        }
    }
}
