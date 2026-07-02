<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class StudentTemplateMissingExport implements FromCollection, WithHeadings, WithMapping
{
    protected $users;

    public function __construct($users)
    {
        $this->users = $users;
    }

    public function collection()
    {
        return collect($this->users);
    }

    public function headings(): array
    {
        return [
            'Nama', 'NIS', 'NISN', 'NIK', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir',
            'Alamat', 'Provinsi', 'Kota/Kab', 'Kecamatan', 'Kelurahan', 'Kode Pos', 'Detail Alamat',
            'Agama', 'Asal Daerah', 'Kewarganegaraan', 'Anak Ke', 'Jml Saudara', 'Tinggal Bersama',
            'Penanggung Biaya', 'Tinggi (cm)', 'Berat (kg)', 'Gol. Darah',
            'Nama Ayah', 'NIK Ayah', 'Tahun Lahir Ayah', 'Pendidikan Ayah', 'Pekerjaan Ayah', 'Penghasilan Ayah',
            'Nama Ibu', 'NIK Ibu', 'Tahun Lahir Ibu', 'Pendidikan Ibu', 'Pekerjaan Ibu', 'Penghasilan Ibu',
            'Nama Wali', 'NIK Wali', 'Tahun Lahir Wali', 'Pendidikan Wali', 'Pekerjaan Wali', 'Penghasilan Wali', 'Alamat Wali'
        ];
    }

    public function map($user): array
    {
        // Name, NIS and 41 empty strings
        return array_merge([$user->name, $user->nomor_induk], array_fill(0, 41, ''));
    }
}
