<?php

namespace App\Exports;

use App\Models\StudentPermission;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class PermissionTitipanExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();

        return StudentPermission::with([
            'student.user', 
            'student.classMembers' => function ($q) use ($activeYear) {
                if ($activeYear) {
                    $q->whereHas('activeClass', function ($sq) use ($activeYear) {
                        $sq->where('academic_year_id', $activeYear->id);
                    })->with(['activeClass.kelas', 'activeClass.kelasParalel']);
                }
            },
            'permissionGroup.activeKamar.kamar'
        ])
            ->where(function ($query) {
                $query->where('uang_saku', '>', 0)
                      ->orWhereNotNull('barang_titipan');
            })
            ->where('status', 'Returned')
            ->where('return_at', '>=', Carbon::now()->subDays(7)->startOfDay())
            ->latest('return_at')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Nama Santri',
            'Kelas',
            'Kamar',
            'Grup Perizinan',
            'Tanggal Keluar',
            'Tanggal Kembali',
            'Uang Saku (Rp)',
            'Barang Titipan'
        ];
    }

    public function map($permission): array
    {
        return [
            $permission->student->name ?? '-',
            $permission->student->classMembers->first() && $permission->student->classMembers->first()->activeClass 
                ? trim(optional($permission->student->classMembers->first()->activeClass->kelas)->name . ' ' . optional($permission->student->classMembers->first()->activeClass->kelasParalel)->name) 
                : (optional(optional($permission->student->latestClassMember)->activeClass)->name ?? (is_array($permission->student->kelas) ? ($permission->student->kelas['name'] ?? '-') : (optional($permission->student->kelas)->name ?? '-'))),
            $permission->permissionGroup->activeKamar->kamar->name ?? '-',
            $permission->permissionGroup->name ?? '-',
            $permission->exit_at ? Carbon::parse($permission->exit_at)->format('d/m/Y H:i') : '-',
            $permission->return_at ? Carbon::parse($permission->return_at)->format('d/m/Y H:i') : '-',
            $permission->uang_saku,
            $permission->barang_titipan,
        ];
    }
}
