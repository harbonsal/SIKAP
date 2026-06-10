<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\SupervisionQuestion;
use App\Models\SupervisionRubric;

class RubricSeeder extends Seeder
{
    public function run()
    {
        // 1. Truncate Tables
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('supervision_rubrics')->truncate();
        DB::table('supervision_questions')->truncate();
        DB::table('supervision_details')->truncate();
        DB::table('supervisions')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 2. Define Data (6 Aspects A-F)
        $rubricData = [
            [
                'aspect' => 'A. PERSIAPAN & PENGUASAAN MATERI',
                'scores' => [
                    3 => [
                        'Tidak ada kesalahan konsep atau kutipan',
                        'Materi sesuai silabus minggu ini + 1-2 pengayaan relevan',
                        'Langkah langkah pembelajaran tampak terencana dengan baik, bisa didukung dengan RPP',
                        'Kecakapan mengajar menunjukkan Asdik menyiapkan materi dengan beberapa referensi. Lebih sempurna jika referensi dibawa'
                    ],
                    2 => [
                        'Ada 1-2 kesalahan minor yang segera diperbaiki',
                        'Materi sesuai silabus minggu ini',
                        'Langkah-langkah pembelajaran tampak terencana meski terkadang ada keraguan',
                        'Kecakapan mengajar yang menunjukkan bahwa Asdik mencukupkan diri dengan buku ajar atau sedikit referensi tambahan'
                    ],
                    1 => [
                        'Ada 3+ kesalahan konsep atau kesalahan fatal',
                        'Materi tidak sesuai silabus minggu ini tanpa alasan yang jelas',
                        'Langkah-langkah pembelajaran tampak sebagai improvisasi tanpa persiapan',
                        'Terkadang kurang sesuai dengan buku ajar'
                    ]
                ]
            ],
            [
                'aspect' => 'B. PEMBUKAAN PEMBELAJARAN (5-7 menit)',
                'scores' => [
                    3 => [
                        'Kelas tertib dalam 1 menit pertama',
                        'Apersepsi menggunakan cerita/pertanyaan/kasus nyata yang membuat 70%+ santri antusias',
                        'Tujuan pembelajaran disampaikan dengan kalimat spesifik: "Di akhir pelajaran, kalian bisa menjelaskan/melakukan/mengidentifikasi..."',
                        'Waktu pembukaan tepat 5-7 menit'
                    ],
                    2 => [
                        'Kelas tertib dalam 2-3 menit pertama',
                        'Apersepsi sederhana (tanya jawab dasar) dengan 40-60% santri merespons',
                        'Tujuan disampaikan tapi terlalu umum: "Hari ini kita belajar tentang..."',
                        'Waktu pembukaan 7-10 menit'
                    ],
                    1 => [
                        'Kelas baru tertib setelah 5+ menit',
                        'Tidak ada apersepsi atau hanya formalitas: "Siapa yang masih ingat materi kemarin?" tanpa pengembangan',
                        'Tidak menyampaikan tujuan pembelajaran',
                        'Waktu pembukaan kurang dari 3 menit atau lebih dari 10 menit'
                    ]
                ]
            ],
            [
                'aspect' => 'C. METODE & INTERAKSI PEMBELAJARAN',
                'scores' => [
                    3 => [
                        'Menggunakan 2-3 metode bervariasi (diskusi, ceramah, praktik) sesuai karakter materi',
                        'Lebih dari 3 pertanyaan terbuka diajukan (bukan ya/tidak)',
                        '70%+ santri aktif berpartisipasi (mengangkat tangan, menjawab, diskusi kelompok)',
                        'Memberikan bantuan khusus kepada 2+ santri yang kesulitan DAN tantangan tambahan untuk santri yang cepat paham',
                        'Media sederhana tapi relevan digunakan secara efektif (gambar, benda nyata, peta konsep)'
                    ],
                    2 => [
                        'Menggunakan 1-2 metode (ceramah interaktif + tanya jawab)',
                        '3 pertanyaan diajukan, sebagian besar jenis tertutup',
                        '40-60% santri berpartisipasi aktif',
                        'Ada upaya memberi bantuan kepada santri kesulitan, tapi belum sistematis atau tidak ada tantangan untuk santri cepat',
                        'Media digunakan tapi kurang optimal atau kurang relevan'
                    ],
                    1 => [
                        'Hanya menggunakan ceramah satu arah',
                        'Kurang dari 3 pertanyaan atau tidak ada pertanyaan sama sekali',
                        'Kurang dari 30% santri berpartisipasi aktif',
                        'Tidak ada upaya diferensiasi - semua santri diperlakukan sama tanpa memperhatikan kebutuhan berbeda',
                        'Tidak menggunakan media padahal diperlukan untuk pemahaman materi'
                    ]
                ]
            ],
            [
                'aspect' => 'D. MANAJEMEN KELAS & WAKTU',
                'scores' => [
                    3 => [
                        'Gangguan kelas (berbicara di luar topik, menggambar, dll) ditangani segera dan efektif tanpa mengganggu alur',
                        'Transisi antar aktivitas lancar tanpa waktu mati',
                        'Pembagian waktu ideal: pembukaan 5-7 mnt, inti 25-30 mnt, penutup 5-8 mnt',
                        'Santri tetap fokus sampai akhir pelajaran (tidak mengemas buku sebelum waktu habis)'
                    ],
                    2 => [
                        '2-3 gangguan kelas terjadi dan ditangani meski kurang efektif',
                        'Ada jeda 1-2 menit antar aktivitas yang tidak termanfaatkan',
                        'Waktu inti pembelajaran 20-25 menit',
                        'Di 5 menit terakhir, 30% santri mulai tidak fokus'
                    ],
                    1 => [
                        '4+ gangguan kelas yang tidak ditangani atau ditangani dengan marah, emosi atau cara tidak elegan',
                        'Waktu terbuang >5 menit untuk hal tidak produktif',
                        'Waktu inti pembelajaran kurang dari 15 menit',
                        'Lebih dari 50% santri mengantuk/bosan di paruh kedua pelajaran'
                    ]
                ]
            ],
            [
                'aspect' => 'E. PENUTUPAN PEMBELAJARAN',
                'scores' => [
                    3 => [
                        'Kesimpulan dibuat dengan melibatkan santri (bukan hanya Asdik yang bicara)',
                        'Memberikan 1 nasihat spesifik terkait materi dengan contoh praktis, atau nasehat tarbawi',
                        'Memberikan tugas murojaah yang spesifik: "berlatihlah menggunakan المفعول لأجله, besok pagi berbaris didepan pintu kelas untuk praktek", dan motivasi mempraktekkan bahasa arab',
                        'Doa kafaratul majlis dibaca dengan khushu\''
                    ],
                    2 => [
                        'Kesimpulan disampaikan secara lisan oleh Asdik',
                        'Memberikan nasihat umum: "Jangan lupa diulang ya"',
                        'Tidak ada tugas murojaah spesifik',
                        'Doa kafaratul majlis dibaca tapi terburu-buru'
                    ],
                    1 => [
                        'Tidak ada kesimpulan atau hanya "Sudah ya, itu saja"',
                        'Tidak memberikan nasihat terkait pembelajaran',
                        'Pelajaran berakhir mendadak saat bel berbunyi',
                        'Tidak membaca doa kafaratul majlis'
                    ]
                ]
            ],
            [
                'aspect' => 'F. PROFESIONALISME ASDIK',
                'scores' => [
                    3 => [
                        'Ketepatan waktu: Hadir ≥5 menit sebelum pelajaran',
                        'Penampilan: 100% sesuai aturan + rapi sempurna',
                        'Bahasa Arab: Mencapai target (MTW 80%, TSA 90%) dengan tata bahasa benar dan disesuaikan kemampuan santri',
                        'Komunikasi: Suara jelas, intonasi variatif, kontak mata penuh'
                    ],
                    2 => [
                        'Ketepatan waktu: Tepat waktu atau terlambat ≤3 menit (alasan valid)',
                        'Penampilan: Sesuai aturan tapi 1-2 ketidaksesuaian minor (peci miring, kemeja kurang rapi)',
                        'Bahasa Arab: Mencapai target (MTW 80%, TSA 90%) dengan beberapa kesalahan minor',
                        'Komunikasi: Cukup jelas tapi terkadang monoton/terlalu cepat'
                    ],
                    1 => [
                        'Ketepatan waktu: Terlambat >3 menit tanpa alasan valid',
                        'Penampilan: Banyak ketidaksesuaian (seragam kusut, kotor, tidak sesuai warna celana dan baju)',
                        'Bahasa Arab: <80% (MTW) atau <90% (TSA), banyak kesalahan tata bahasa, dan/atau kalimatnya sulit dipahami karena ketidaktepatan penggunaan kosa kata',
                        'Komunikasi: Tidak jelas, volume tidak terdengar, atau sering gagap'
                    ]
                ]
            ]
        ];

        // 3. Insert Data
        $order = 1;
        foreach ($rubricData as $data) {
            // Create Question (Aspect)
            $question = SupervisionQuestion::create([
                'number' => $order++,
                'category' => 'Umum',
                'aspect' => $data['aspect'],
            ]);

            // Create Rubrics (Checklist Items per Score)
            // Iterate through scores (3, 2, 1)
            foreach ($data['scores'] as $scoreValue => $items) {
                foreach ($items as $itemText) {
                    SupervisionRubric::create([
                        'supervision_question_id' => $question->id,
                        'score' => $scoreValue,
                        'description' => $itemText,
                    ]);
                }
            }
        }
    }
}
