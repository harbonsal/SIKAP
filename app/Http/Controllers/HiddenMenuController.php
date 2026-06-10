<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class HiddenMenuController extends Controller
{
    public function index()
    {
        $menus = [
            [
                'category' => 'Master Data',
                'items' => [
                    [
                        'title' => 'Jenjang Pendidikan',
                        'description' => 'Mengatur tingkat pendidikan (SD, SMP, SMA, dll).',
                        'route' => 'jenjangs.index',
                    ],
                    [
                        'title' => 'Kelas Paralel',
                        'description' => 'Mengatur rombongan belajar / nama kelas paralel.',
                        'route' => 'kelas-paralel.index',
                    ],
                    [
                        'title' => 'Bobot Nilai',
                        'description' => 'Konfigurasi bobot nilai harian, UTS, dan UAS.',
                        'route' => 'grade-weights.index',
                    ],
                    [
                        'title' => 'KKM',
                        'description' => 'Kriteria Ketuntasan Minimal per mata pelajaran.',
                        'route' => 'kkms.index',
                    ],
                    [
                        'title' => 'Data Pekan',
                        'description' => 'Mengatur jumlah pekan efektif dalam satu semester.',
                        'route' => 'pekans.index',
                    ],
                    [
                        'title' => 'Data Hari',
                        'description' => 'Translasi dan pengaturan hari aktif sekolah.',
                        'route' => 'days.index',
                    ],
                    [
                        'title' => 'Wilayah (Regions)',
                        'description' => 'Sinkronisasi data Provinsi, Kota, Kecamatan, Desa.',
                        'route' => 'settings.regions.index',
                    ],
                ]
            ],
            [
                'category' => 'Akademik & Guru',
                'items' => [
                    [
                        'title' => 'Data Ujian',
                        'description' => 'Manajemen jenis ujian dan jadwal ujian.',
                        'route' => 'ujians.index',
                    ],
                    [
                        'title' => 'Jadwal Piket',
                        'description' => 'Manajemen jadwal piket dan laporan piket guru.',
                        'route' => 'pickets.index',
                    ],
                    [
                        'title' => 'Distribusi Mengajar (Summary)',
                        'description' => 'Ringkasan beban jam mengajar seluruh guru di workspace jadwal.',
                        'route' => 'settings.education.schedules.index',
                    ],
                    [
                        'title' => 'Guru Berhalangan',
                        'description' => 'Menandai guru yang tidak bisa mengajar melalui workspace jadwal.',
                        'route' => 'settings.education.schedules.index',
                    ],
                ]
            ],
            [
                'category' => 'Tools & Legacy',
                'items' => [
                    [
                        'title' => 'Scan RFID / QR',
                        'description' => 'Halaman untuk scanning kartu siswa (Kehadiran/Kantin).',
                        'route' => 'rfid.scan',
                    ],
                    [
                        'title' => 'Sync Nilai (Legacy)',
                        'description' => 'Import nilai dari format database lama.',
                        'route' => 'settings.sync.grades.index',
                    ],
                    [
                        'title' => 'Sync Akhlak (Legacy)',
                        'description' => 'Import nilai akhlak dari format database lama.',
                        'route' => 'settings.sync.akhlak.index',
                    ],
                ]
            ]
        ];

        return Inertia::render('Settings/HiddenMenu/Index', [
            'menus' => $menus,
        ]);
    }
}
