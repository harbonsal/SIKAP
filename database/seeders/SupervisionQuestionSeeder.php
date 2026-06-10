<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SupervisionQuestion;
use App\Models\SupervisionRubric;

class SupervisionQuestionSeeder extends Seeder
{
    public function run()
    {
        // Clear existing data
        if (app()->environment() !== 'production') {
            SupervisionQuestion::query()->delete();
            // Rubrics cascade delete
        }

        $data = [
            [
                'number' => 1,
                'category' => 'Silabus',
                'aspect' => 'Kesesuaian pencapaian silabus',
                'rubrics' => [
                    1 => 'Asdik tidak menyampaikan materi sama sekali atau menyimpang total dari silabus yang direncanakan, tanpa penyesuaian.',
                    2 => 'Asdik menyampaikan materi yang sebagian kecil sesuai silabus, tapi banyak penyimpangan tanpa alasan valid.',
                    3 => 'Asdik menyampaikan materi berdasarkan silabus yang telah direncanakan, tapi ada beberapa ketidaksesuaian kecil.',
                    4 => 'Asdik menyampaikan materi yang sepenuhnya sesuai silabus dengan penyesuaian yang tepat jika diperlukan.',
                    5 => 'Asdik menyampaikan materi yang tidak hanya sesuai silabus tapi juga diintegrasikan dengan elemen tambahan untuk pengayaan siswa.',
                ]
            ],
            [
                'number' => 2,
                'category' => 'Kegiatan Pendahuluan',
                'aspect' => 'Menertibkan kelas',
                'rubrics' => [
                    1 => 'Asdik tidak mengelola kelas sama sekali, siswa bergerak bebas, tidak efektif, dan mengganggu pembelajaran.',
                    2 => 'Asdik mencoba menertibkan kelas tapi tidak konsisten, siswa masih sering terganggu atau tidak mendengarkan.',
                    3 => 'Asdik memiliki aturan kelas yang jelas dan konsisten, siswa tertib secara umum tapi masih ada gangguan kecil.',
                    4 => 'Asdik mengelola kelas dengan efektif, siswa tertib sepenuhnya, tidak ada gangguan, dan siap belajar.',
                    5 => 'Asdik tidak hanya menertibkan tapi juga membangun budaya kelas positif yang mendorong siswa mandiri dalam keteraturan.',
                ]
            ],
            [
                'number' => 3,
                'category' => 'Kegiatan Pendahuluan',
                'aspect' => 'Membangkitkan motivasi belajar (umum)',
                'rubrics' => [
                    1 => 'Asdik tidak menggunakan strategi apa pun untuk membangkitkan minat, siswa tampak bosan dan tidak terlibat.',
                    2 => 'Asdik menggunakan strategi sederhana tapi tidak efektif, minat siswa hanya muncul sesaat.',
                    3 => 'Asdik menggunakan strategi yang efektif untuk membangkitkan minat siswa dalam pembelajaran umum.',
                    4 => 'Asdik menyampaikan rangsangan positif dan pengakuan atas upaya siswa, minat siswa tinggi dan berkelanjutan.',
                    5 => 'Asdik mengintegrasikan elemen inovatif (seperti cerita inspiratif) yang membuat siswa sangat termotivasi dan aktif.',
                ]
            ],
            [
                'number' => 4,
                'category' => 'Kegiatan Pendahuluan',
                'aspect' => 'Memberikan apersepsi',
                'rubrics' => [
                    1 => 'Asdik tidak memberikan apersepsi sama sekali, siswa bingung menghubungkan materi baru dengan pengetahuan lama.',
                    2 => 'Asdik memberikan apersepsi tapi tidak menarik dan tidak membangkitkan rasa ingin tahu siswa.',
                    3 => 'Asdik menyajikan apersepsi dengan cara yang menarik dan membangkitkan hubungan antara apersepsi dan pembelajaran.',
                    4 => 'Asdik memberikan apersepsi yang relevan, inspiratif, dan efektif dalam mempersiapkan siswa.',
                    5 => 'Asdik menggunakan apersepsi kreatif (misalnya video/gambar) yang sangat memotivasi dan mendalam.',
                ]
            ],
            [
                'number' => 5,
                'category' => 'Kegiatan Pendahuluan',
                'aspect' => 'Memberitahukan tujuan pembelajaran',
                'rubrics' => [
                    1 => 'Asdik tidak menyampaikan tujuan pembelajaran sama sekali, siswa tidak tahu arah pelajaran.',
                    2 => 'Asdik menyampaikan tujuan tapi tidak jelas dan tidak terkait dengan materi.',
                    3 => 'Asdik menyampaikan tujuan pembelajaran dengan jelas dan terkait dengan materi.',
                    4 => 'Asdik menyampaikan tujuan secara verbal dan siswa memahami serta bisa menjelaskan kembali.',
                    5 => 'Asdik menyampaikan tujuan dengan elemen reflektif yang membuat siswa termotivasi untuk mencapainya.',
                ]
            ],
            [
                'number' => 6,
                'category' => 'Unsur Pengembangan Materi',
                'aspect' => 'Penguasaan materi',
                'rubrics' => [
                    1 => 'Asdik tidak menguasai materi, banyak kesalahan konsep dan tidak bisa menjawab pertanyaan siswa.',
                    2 => 'Asdik menguasai sebagian kecil materi, tapi sering ragu dan tidak akurat.',
                    3 => 'Asdik menguasai materi dengan baik, bisa menjawab pertanyaan dasar dengan akurat.',
                    4 => 'Asdik menguasai materi secara mendalam, bisa memberikan contoh dan ilustrasi yang memperkaya.',
                    5 => 'Asdik menguasai materi secara ekspert, mengintegrasikan konsep lanjutan dan menangani pertanyaan kompleks.',
                ]
            ],
            [
                'number' => 7,
                'category' => 'Unsur Pengembangan Materi',
                'aspect' => 'Keteraturan materi yang disampaikan',
                'rubrics' => [
                    1 => 'Materi disampaikan tanpa struktur, acak dan membingungkan siswa.',
                    2 => 'Materi memiliki urutan dasar tapi sering melompat-lompat tanpa logika.',
                    3 => 'Materi disampaikan dengan struktur baik dan mengikuti urutan logis.',
                    4 => 'Materi terstruktur dengan transisi mulus, mudah diikuti siswa.',
                    5 => 'Materi terstruktur secara inovatif, dengan poin-poin yang saling terkait dan contoh mendalam.',
                ]
            ],
            [
                'number' => 8,
                'category' => 'Unsur Pengembangan Materi',
                'aspect' => 'Kejelasan konsep materi',
                'rubrics' => [
                    1 => 'Konsep tidak jelas, siswa tidak paham sama sekali, bahasa kabur dan tanpa contoh.',
                    2 => 'Konsep dijelaskan tapi masih banyak kebingungan, contoh minim.',
                    3 => 'Asdik menyampaikan konsep dengan jelas dan mudah dipahami siswa.',
                    4 => 'Konsep dijelaskan dengan bahasa tepat, contoh ilustrasi, dan siswa bisa mengaplikasikannya.',
                    5 => 'Konsep dijelaskan secara mendalam dengan variasi contoh, membuat siswa sangat paham dan bisa menganalisis.',
                ]
            ],
            [
                'number' => 9,
                'category' => 'Unsur Proses Pembelajaran',
                'aspect' => 'Menggunakan metode pembelajaran',
                'rubrics' => [
                    1 => 'Asdik tidak menggunakan metode apa pun atau hanya 1 metode yang tidak sesuai (minimal 2 metode tidak terpenuhi).',
                    2 => 'Asdik menggunakan 1–2 metode tapi tidak variatif dan tidak mendukung pemahaman siswa.',
                    3 => 'Asdik menggunakan minimal 2 metode (misalnya ceramah + diskusi) yang sesuai tujuan dan mendukung pemahaman.',
                    4 => 'Asdik memvariasikan 3+ metode yang efektif mengaktifkan siswa secara beragam.',
                    5 => 'Asdik menggunakan metode inovatif dan variatif yang sangat mendukung pemahaman dan keterlibatan siswa.',
                ]
            ],
            [
                'number' => 10,
                'category' => 'Unsur Proses Pembelajaran',
                'aspect' => 'Menggunakan media belajar',
                'rubrics' => [
                    1 => 'Asdik tidak menggunakan media sama sekali, pembelajaran monoton.',
                    2 => 'Asdik menggunakan media minim tapi tidak efektif atau relevan.',
                    3 => 'Asdik menggunakan media yang relevan untuk memperjelas dan memperkaya pembelajaran.',
                    4 => 'Asdik memanfaatkan media secara baik (misalnya papan tulis + visual) untuk mengajar.',
                    5 => 'Asdik menggunakan media kreatif dan variatif yang sangat meningkatkan pemahaman siswa.',
                ]
            ],
            [
                'number' => 11,
                'category' => 'Unsur Proses Pembelajaran',
                'aspect' => 'Menggunakan bahasa Arab yang baik dan benar (MTW 80%, Tsanawy 90%)',
                'rubrics' => [
                    1 => 'Penggunaan bahasa Arab <50%, banyak kesalahan, siswa tidak paham.',
                    2 => 'Penggunaan 50–70%, masih banyak kesalahan kosakata dan tata bahasa.',
                    3 => 'Penggunaan mencapai minimal (80%/90%), tapi ada kesalahan kecil.',
                    4 => 'Penggunaan > minimal, bahasa tepat dan membantu pemahaman siswa.',
                    5 => 'Penggunaan hampir 100%, bahasa lancar, akurat, dan menginspirasi siswa.',
                ]
            ],
            [
                'number' => 12,
                'category' => 'Unsur Proses Pembelajaran',
                'aspect' => 'Menerapkan teknik tanya jawab dan memberikan penghargaan (metode)',
                'rubrics' => [
                    1 => 'Tidak ada teknik tanya jawab atau penghargaan, siswa pasif.',
                    2 => 'Teknik minim, penghargaan jarang, siswa kurang aktif.',
                    3 => 'Asdik menggunakan teknik tanya jawab efektif dan memberikan penghargaan positif.',
                    4 => 'Teknik variatif, penghargaan konsisten, siswa aktif berpartisipasi.',
                    5 => 'Teknik inovatif dengan penghargaan yang memotivasi, siswa sangat terlibat.',
                ]
            ],
            [
                'number' => 13,
                'category' => 'Unsur Penilaian',
                'aspect' => 'Mengajukan pertanyaan (lisan/tulisan) guna mengukur pencapaian',
                'rubrics' => [
                    1 => 'Tidak ada pertanyaan sama sekali, tidak ada pengukuran.',
                    2 => '<3 pertanyaan, tidak relevan atau mendalam.',
                    3 => 'Minimal 3–4 pertanyaan yang relevan untuk mengukur pemahaman.',
                    4 => '5+ pertanyaan variatif yang mendalam dan mendorong analisis siswa.',
                    5 => 'Pertanyaan banyak, inovatif, dan efektif dalam memberikan feedback.',
                ]
            ],
            [
                'number' => 14,
                'category' => 'Unsur Penampilan',
                'aspect' => 'Kelengkapan dan kerapian seragam',
                'rubrics' => [
                    1 => 'Seragam tidak lengkap dan tidak rapi, mengganggu wibawa.',
                    2 => 'Seragam lengkap tapi tidak rapi atau sesuai aturan.',
                    3 => 'Seragam lengkap dan rapi sesuai aturan sekolah.',
                    4 => 'Seragam sangat rapi dan profesional, meningkatkan citra.',
                    5 => 'Seragam sempurna dengan elemen tambahan yang positif.',
                ]
            ],
            [
                'number' => 15,
                'category' => 'Unsur Penampilan',
                'aspect' => 'Kecakapan berbicara',
                'rubrics' => [
                    1 => 'Berbicara tidak jelas, banyak kesalahan, siswa sulit paham.',
                    2 => 'Berbicara cukup jelas tapi sering tergagap atau monoton.',
                    3 => 'Berbicara cakap, jelas, dan terorganisir.',
                    4 => 'Berbicara lancar dengan intonasi yang baik dan memengaruhi siswa.',
                    5 => 'Berbicara sangat ekspresif, inspiratif, dan efektif.',
                ]
            ],
            [
                'number' => 16,
                'category' => 'Unsur Penampilan',
                'aspect' => 'Kewibawaan',
                'rubrics' => [
                    1 => 'Tidak memiliki wibawa, siswa tidak hormat atau patuh.',
                    2 => 'Wibawa minim, siswa sering mengabaikan.',
                    3 => 'Memiliki wibawa yang cukup, siswa hormat secara umum.',
                    4 => 'Wibawa kuat, siswa patuh dan termotivasi.',
                    5 => 'Wibawa luar biasa, menjadi teladan bagi siswa.',
                ]
            ],
            [
                'number' => 17,
                'category' => 'Unsur Kedisiplinan',
                'aspect' => 'Masuk tepat waktu',
                'rubrics' => [
                    1 => 'Masuk sangat terlambat (>10 menit), mengganggu pelajaran.',
                    2 => 'Masuk terlambat (5–10 menit), tapi masih bisa dimulai.',
                    3 => 'Masuk tepat waktu atau sedikit awal.',
                    4 => 'Masuk awal dan siap memulai pelajaran.',
                    5 => 'Masuk sangat awal dengan persiapan lengkap.',
                ]
            ],
            [
                'number' => 18,
                'category' => 'Unsur Kedisiplinan',
                'aspect' => 'Keluar tepat waktu',
                'rubrics' => [
                    1 => 'Keluar sangat awal atau terlambat, waktu terbuang.',
                    2 => 'Keluar tidak tepat, tapi masih dalam toleransi kecil.',
                    3 => 'Keluar tepat waktu sesuai jadwal.',
                    4 => 'Keluar tepat dengan penutupan yang baik.',
                    5 => 'Keluar tepat dengan tambahan motivasi siswa.',
                ]
            ],
            [
                'number' => 19,
                'category' => 'Unsur Kedisiplinan',
                'aspect' => 'Pengisian jurnal dan absensi',
                'rubrics' => [
                    1 => 'Tidak mengisi jurnal/absensi sama sekali.',
                    2 => 'Mengisi tapi tidak akurat atau lengkap.',
                    3 => 'Mengisi jurnal dan absensi secara tepat dan akurat.',
                    4 => 'Mengisi dengan detail tambahan yang berguna.',
                    5 => 'Mengisi secara profesional dengan analisis singkat.',
                ]
            ],
            [
                'number' => 20,
                'category' => 'Unsur Penguasaan Kelas',
                'aspect' => 'Mengontrol suasana pembelajaran',
                'rubrics' => [
                    1 => 'Suasana tidak kondusif, siswa jenuh dan tidak terkontrol (kurang dari 1 unsur terpenuhi).',
                    2 => 'Suasana minim kontrol, kejenuhan tinggi (1–2 unsur terpenuhi).',
                    3 => 'Suasana kondusif dan tertib, minimal 3 unsur terpenuhi (misalnya berkeliling, posisi tepat).',
                    4 => 'Kontrol baik, menghilangkan kejenuhan efektif (4 unsur terpenuhi).',
                    5 => 'Kontrol luar biasa, suasana dinamis dan optimal (semua unsur + inovasi).',
                ]
            ],
            [
                'number' => 21,
                'category' => 'Penutup',
                'aspect' => 'Mendisiplinkan santri',
                'rubrics' => [
                    1 => 'Tidak mendisiplinkan sama sekali, siswa berperilaku buruk tanpa koreksi.',
                    2 => 'Mendisiplinkan minim, instruksi tidak jelas atau tegas.',
                    3 => 'Mendisiplinkan dengan instruksi jelas dan tegas untuk menegakkan aturan.',
                    4 => 'Mendisiplinkan efektif dengan pendekatan positif dan pencegahan.',
                    5 => 'Mendisiplinkan inovatif, membangun karakter siswa jangka panjang.',
                ]
            ],
            [
                'number' => 22,
                'category' => 'Penutup',
                'aspect' => 'Membuat kesimpulan belajar',
                'rubrics' => [
                    1 => 'Tidak ada kesimpulan, pelajaran berakhir tiba-tiba.',
                    2 => 'Kesimpulan minim dan tidak ringkas.',
                    3 => 'Asdik merangkum materi pembelajaran secara jelas dan ringkas.',
                    4 => 'Kesimpulan efektif, siswa bisa mengulang poin utama.',
                    5 => 'Kesimpulan inspiratif dengan koneksi ke kehidupan siswa.',
                ]
            ],
            [
                'number' => 23,
                'category' => 'Penutup',
                'aspect' => 'Memberikan nasehat atau motivasi untuk murojaah',
                'rubrics' => [
                    1 => 'Tidak memberikan nasehat sama sekali.',
                    2 => 'Nasehat minim dan tidak memotivasi.',
                    3 => 'Memberikan nasehat atau motivasi untuk meningkatkan pemahaman dan murojaah.',
                    4 => 'Nasehat spesifik dan memotivasi siswa untuk murojaah mandiri.',
                    5 => 'Nasehat mendalam dengan contoh pribadi yang sangat memotivasi.',
                ]
            ],
            [
                'number' => 24,
                'category' => 'Penutup',
                'aspect' => 'Membaca doa kafarotul majlis',
                'rubrics' => [
                    1 => 'Tidak membaca doa sama sekali.',
                    2 => 'Membaca doa tapi tidak tepat atau terburu-buru.',
                    3 => 'Membaca doa dengan benar untuk menutup KBM.',
                    4 => 'Membaca doa dengan khusyuk dan melibatkan siswa.',
                    5 => 'Membaca doa dengan tambahan penjelasan manfaat spiritual.',
                ]
            ],
            [
                'number' => 25,
                'category' => 'Unsur Waktu',
                'aspect' => 'Proporsi waktu pada setiap tahapan pembelajaran',
                'rubrics' => [
                    1 => 'Pembagian waktu tidak proporsional sama sekali (misalnya inti <30 menit).',
                    2 => 'Pembagian tidak seimbang, inti kurang dari 50 menit.',
                    3 => 'Pembagian proporsional: 5–10 menit pembukaan, 60–70 menit inti, 5–10 menit penutup.',
                    4 => 'Pembagian baik dengan fleksibilitas sesuai kebutuhan siswa.',
                    5 => 'Pembagian optimal, waktu dimanfaatkan maksimal dengan efisiensi tinggi.',
                ]
            ],
        ];

        foreach ($data as $item) {
            $question = SupervisionQuestion::create([
                'number' => $item['number'],
                'category' => $item['category'],
                'aspect' => $item['aspect'],
            ]);

            foreach ($item['rubrics'] as $score => $description) {
                SupervisionRubric::create([
                    'supervision_question_id' => $question->id,
                    'score' => $score,
                    'description' => $description,
                ]);
            }
        }
    }
}
