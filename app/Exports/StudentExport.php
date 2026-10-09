<?php

namespace App\Exports;

use App\Models\Student;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class StudentExport implements FromCollection, WithHeadings, WithMapping
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
            'Nama', 'NIS', 'NISN', 'NIK', 'Kelas', 'Kamar', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir',
            'Alamat', 'Provinsi', 'Kota/Kab', 'Kecamatan', 'Kelurahan', 'Kode Pos', 'Detail Alamat',
            'Agama', 'Asal Daerah', 'Kewarganegaraan', 'Anak Ke', 'Jml Saudara', 'Tinggal Bersama',
            'Penanggung Biaya', 'Tinggi (cm)', 'Berat (kg)', 'Gol. Darah',
            'Nama Ayah', 'NIK Ayah', 'Tahun Lahir Ayah', 'Pendidikan Ayah', 'Pekerjaan Ayah', 'Penghasilan Ayah',
            'Nama Ibu', 'NIK Ibu', 'Tahun Lahir Ibu', 'Pendidikan Ibu', 'Pekerjaan Ibu', 'Penghasilan Ibu',
            'Nama Wali', 'NIK Wali', 'Tahun Lahir Wali', 'Pendidikan Wali', 'Pekerjaan Wali', 'Penghasilan Wali', 'Alamat Wali'
        ];
    }

    public function map($student): array
    {
        return [
            $student->user->name,
            $student->user->nomor_induk,
            $student->nisn,
            $student->nik,
            $student->classMembers->first() && $student->classMembers->first()->activeClass 
                ? trim(optional($student->classMembers->first()->activeClass->kelas)->name . ' ' . optional($student->classMembers->first()->activeClass->kelasParalel)->name) 
                : (optional(optional($student->latestClassMember)->activeClass)->name ?? (is_array($student->kelas) ? ($student->kelas['name'] ?? '-') : (optional($student->kelas)->name ?? '-'))),
            $student->kamarMembers->first() && $student->kamarMembers->first()->activeKamar 
                ? optional($student->kamarMembers->first()->activeKamar->kamar)->name 
                : (optional(optional($student->latestKamarMember)->activeKamar)->name ?? (is_array($student->kamar) ? ($student->kamar['name'] ?? '-') : (optional($student->kamar)->name ?? '-'))),
            $student->gender,
            $student->birth_place,
            $student->birth_date,
            $student->address,
            $student->province,
            $student->city,
            $student->district,
            $student->village,
            $student->postal_code,
            $student->address_details,
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
