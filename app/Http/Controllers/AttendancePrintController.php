<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendancePrintController extends Controller
{
    public function index()
    {
        $activeAcademicYear = \App\Models\AcademicYear::where('is_active', true)->first();

        $activeClasses = \App\Models\ActiveClass::with(['kelas', 'kelasParalel'])
            ->where('academic_year_id', $activeAcademicYear->id ?? 0)
            ->get()
            ->sortBy(function ($query) {
                return $query->kelas->jenjang_id . $query->kelas->name;
            })
            ->values()
            ->map(function ($class) {
                $kelasName = $class->kelas ? $class->kelas->name : 'Unknown Class';
                $paralelName = $class->kelasParalel ? $class->kelasParalel->name : '';
                return [
                    'id' => $class->id,
                    'name' => trim($kelasName . ' ' . $paralelName),
                ];
            });

        return Inertia::render('Academic/Attendance/Print/Index', [
            'title' => 'Cetak Absensi Manual',
            'activeClasses' => $activeClasses,
            'academicYear' => \App\Models\AcademicYear::where('is_active', true)->first(),
        ]);
    }

    public function print(Request $request)
    {
        $request->validate([
            'active_class_id' => 'required|exists:active_classes,id',
            'months' => 'nullable|array|max:3', // Nullable for 'kelas'
            'months.*' => 'integer|min:1|max:12',
            'type' => 'required|in:beladiri,pkbm,tahfidz,kelas,jurnal,sampul',
        ]);

        $activeClass = \App\Models\ActiveClass::with(['kelas.jenjang', 'kelasParalel', 'academicYear', 'classMembers.student.user'])
            ->findOrFail($request->active_class_id);

        // Sort students by name
        $students = $activeClass->classMembers->sortBy(function ($member) {
            return $member->student->user->name;
        })->values();

        // Handle 'kelas' type specifically
        if ($request->type === 'kelas') {
            return view('reports.attendance.daily_class_sheet', [
                'activeClass' => $activeClass,
                'students' => $students,
            ]);
        }

        if ($request->type === 'jurnal') {
            return view('reports.attendance.journal_sheet', [
                'activeClass' => $activeClass,
                'activeAcademicYear' => \App\Models\AcademicYear::where('is_active', true)->first(),
                'activeSemester' => \App\Models\Semester::where('is_active', true)->first(),
            ]);
        }

        if ($request->type === 'sampul') {
            return view('reports.attendance.cover_sheet', [
                'activeClass' => $activeClass,
                'activeAcademicYear' => \App\Models\AcademicYear::where('is_active', true)->first(),
                'activeSemester' => \App\Models\Semester::where('is_active', true)->first(),
            ]);
        }

        $months = $request->months ?? []; // Default to empty if not provided
        $monthNames = [
            1 => 'Januari',
            2 => 'Februari',
            3 => 'Maret',
            4 => 'April',
            5 => 'Mei',
            6 => 'Juni',
            7 => 'Juli',
            8 => 'Agustus',
            9 => 'September',
            10 => 'Oktober',
            11 => 'November',
            12 => 'Desember'
        ];

        return view('reports.attendance.manual_sheet', [
            'activeClass' => $activeClass,
            'students' => $students,
            'selectedMonths' => $months,
            'monthNames' => $monthNames,
            'type' => $request->type,
        ]);
    }
}
