<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MusyrifDutyTemplate;

class MusyrifDutyTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $duties = [
            [
                'title' => 'Bangunkan Santri & Salat Subuh',
                'category' => 'Ibadah',
                'start_time' => '04:00:00',
                'end_time' => '05:15:00',
                'applicable_days' => 'all',
                'target_description' => 'Membangunkan seluruh santri kamar tepat waktu, mengarahkan wudu dan salat Subuh berjamaah di masjid.',
                'order_num' => 1,
            ],
            [
                'title' => 'Pendampingan Makan Pagi & Persiapan KBM',
                'category' => 'Makan',
                'start_time' => '06:30:00',
                'end_time' => '07:15:00',
                'applicable_days' => 'all',
                'target_description' => 'Memastikan antrean makan pagi tertib, santri berpakaian rapi, dan berangkat ke sekolah tepat waktu.',
                'order_num' => 2,
            ],
            [
                'title' => 'Salat Zuhur & Makan Siang',
                'category' => 'Ibadah',
                'start_time' => '12:00:00',
                'end_time' => '13:00:00',
                'applicable_days' => 'all',
                'target_description' => 'Pendampingan kepulangan santri dari kelas, salat Zuhur berjamaah, dan pendampingan makan siang.',
                'order_num' => 3,
            ],
            [
                'title' => 'Pelayanan Paket & Telepon Siang',
                'category' => 'Asrama',
                'start_time' => '13:00:00',
                'end_time' => '14:30:00',
                'applicable_days' => 'all',
                'target_description' => 'Membuka dan melayani penitipan paket, panggilan telepon santri dengan wali, serta pengawasan istirahat siang.',
                'order_num' => 4,
            ],
            [
                'title' => 'Salat Asar Berjamaah',
                'category' => 'Ibadah',
                'start_time' => '15:15:00',
                'end_time' => '16:00:00',
                'applicable_days' => 'all',
                'target_description' => 'Membangunkan santri dari qoilulah/istirahat siang dan salat Asar berjamaah di masjid.',
                'order_num' => 5,
            ],
            [
                'title' => 'Pendampingan Makan Malam & Salat Magrib',
                'category' => 'Makan',
                'start_time' => '17:30:00',
                'end_time' => '18:30:00',
                'applicable_days' => 'all',
                'target_description' => 'Pendampingan makan malam di dapur/ruang makan asrama dan persiapan menuju salat Magrib.',
                'order_num' => 6,
            ],
            [
                'title' => 'Salat Isya & Pendampingan Belajar Malam',
                'category' => 'Ibadah',
                'start_time' => '19:30:00',
                'end_time' => '20:30:00',
                'applicable_days' => 'all',
                'target_description' => 'Salat Isya berjamaah, pendampingan belajar mandiri atau muthola\'ah santri di asrama.',
                'order_num' => 7,
            ],
            [
                'title' => 'Penguncian Kamar, Cek Presensi & Jam Tidur',
                'category' => 'Asrama',
                'start_time' => '21:30:00',
                'end_time' => '22:00:00',
                'applicable_days' => 'all',
                'target_description' => 'Pengecekan lengkap kehadiran santri di kasur masing-masing, mematikan lampu kamar, dan penguncian pintu asrama.',
                'order_num' => 8,
            ],
            [
                'title' => 'Piket Khusus: Pendampingan Renang / Olahraga (Ahad)',
                'category' => 'Piket Khusus',
                'start_time' => '07:30:00',
                'end_time' => '10:30:00',
                'applicable_days' => '0', // Hari Ahad
                'target_description' => 'Pengawasan keselamatan dan ketertiban santri selama kegiatan renang atau olahraga di hari Ahad.',
                'order_num' => 9,
            ],
            [
                'title' => 'Piket Khusus: Kunjungan & Penjengukan Wali Santri (Ahad)',
                'category' => 'Piket Khusus',
                'start_time' => '10:00:00',
                'end_time' => '16:30:00',
                'applicable_days' => '0', // Hari Ahad
                'target_description' => 'Penyambutan wali santri, pendampingan pertemuan, dan pencatatan perizinan kunjungan hari Ahad.',
                'order_num' => 10,
            ],
        ];

        foreach ($duties as $duty) {
            MusyrifDutyTemplate::updateOrCreate(
                ['title' => $duty['title']],
                $duty
            );
        }
    }
}

