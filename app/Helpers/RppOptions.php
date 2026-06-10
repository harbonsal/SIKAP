<?php

namespace App\Helpers;

class RppOptions
{
    public static function methods()
    {
        return [
            'Ceramah Interaktif',
            'Diskusi Kelompok',
            'Tanya Jawab',
            'Demonstrasi',
            'Eksperimen',
            'Problem Based Learning (PBL)',
            'Project Based Learning (PjBL)',
            'Inquiry Learning',
            'Discovery Learning',
            'Cooperative Learning',
            'Simulasi / Role Playing',
            'Penugasan Terstruktur',
        ];
    }

    public static function media()
    {
        return [
            'LCD Proyektor & Laptop',
            'Papan Tulis & Alat Tulis',
            'Video Pembelajaran',
            'Slide Presentasi (PPT)',
            'Lembar Kerja Siswa (LKS)',
            'Modul / Buku Paket',
            'Alat Peraga Fisik',
            'Platform E-Learning',
            'Gambar / Poster',
            'Lingkungan Sekitar',
        ];
    }

    public static function assessments()
    {
        return [
            'Tes Tulis (Pilihan Ganda/Uraian)',
            'Tes Lisan',
            'Penugasan Individu',
            'Penugasan Kelompok',
            'Portofolio',
            'Unjuk Kerja / Praktik',
            'Proyek',
            'Observasi Sikap',
            'Penilaian Diri',
            'Penilaian Antar Teman',
        ];
    }
}
