<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class StudentUpdateTemplateExport implements FromCollection, WithHeadings, WithMapping
{
    protected $students;

    public function __construct($students)
    {
        $this->students = $students;
    }

    public function collection()
    {
        return collect($this->students);
    }

    public function headings(): array
    {
        return [
            'NIS',          // [0] KEY - tidak boleh diubah
            'Nama',         // [1]
            'NISN',         // [2]
            'NIK',          // [3]
            'Jenis Kelamin (L/P)', // [4]
            'Tempat Lahir', // [5]
            'Tanggal Lahir (YYYY-MM-DD)', // [6]
            'Agama',        // [7]
            'Asal Daerah',  // [8]
            'Kewarganegaraan', // [9]
            'Anak Ke',      // [10]
            'Jml Saudara',  // [11]
            'Tinggal Bersama', // [12]
            'Penanggung Biaya', // [13]
            'Tinggi (cm)',  // [14]
            'Berat (kg)',   // [15]
            'Gol Darah',    // [16]
            'Provinsi',     // [17]
            'Kota/Kab',     // [18]
            'Kecamatan',    // [19]
            'Kelurahan',    // [20]
            'Kode Pos',     // [21]
            'Detail Alamat', // [22]
            'Nama Ayah',    // [23]
            'NIK Ayah',     // [24]
            'Thn Lahir Ayah', // [25]
            'Pendidikan Ayah', // [26]
            'Pekerjaan Ayah', // [27]
            'Penghasilan Ayah', // [28]
            'Nama Ibu',     // [29]
            'NIK Ibu',      // [30]
            'Thn Lahir Ibu', // [31]
            'Pendidikan Ibu', // [32]
            'Pekerjaan Ibu', // [33]
            'Penghasilan Ibu', // [34]
            'Nama Wali',    // [35]
            'NIK Wali',     // [36]
            'Thn Lahir Wali', // [37]
            'Pendidikan Wali', // [38]
            'Pekerjaan Wali', // [39]
            'Penghasilan Wali', // [40]
            'Alamat Wali',  // [41]
        ];
    }

    public function map($student): array
    {
        return [
            $student->user->nomor_induk,
            $student->user->name,
            $student->nisn,
            $student->nik,
            $student->gender,
            $student->birth_place,
            $student->birth_date,
            $student->religion,
            $student->origin_region,
            $student->citizenship,
            $student->child_order,
            $student->siblings_count,
            $student->living_with,
            $student->financial_sponsor,
            $student->height,
            $student->weight,
            $student->blood_type,
            $student->province,
            $student->city,
            $student->district,
            $student->village,
            $student->postal_code,
            $student->address_details,
            $student->father_name,
            $student->father_nik,
            $student->father_birth_year,
            $student->father_education,
            $student->father_occupation,
            $student->father_income,
            $student->mother_name,
            $student->mother_nik,
            $student->mother_birth_year,
            $student->mother_education,
            $student->mother_occupation,
            $student->mother_income,
            $student->guardian_name,
            $student->guardian_nik,
            $student->guardian_birth_year,
            $student->guardian_education,
            $student->guardian_occupation,
            $student->guardian_income,
            $student->guardian_address,
        ];
    }
}
