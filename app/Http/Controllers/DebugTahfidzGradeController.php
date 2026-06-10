<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DebugTahfidzGradeController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        // If user is student, show their own grades
        if ($user->student) {
            $student = $user->student;
        } else {
            // If user is admin, they need to provide student_id parameter
            $studentId = $request->query('student_id');
            if (!$studentId) {
                return response()->json([
                    'error' => 'User bukan siswa. Gunakan parameter ?student_id=ID_SISWA untuk melihat data siswa tertentu',
                    'example' => '/debug-tahfidz-grades?student_id=123'
                ]);
            }
            $student = \App\Models\Student::find($studentId);
            if (!$student) {
                return response()->json([
                    'error' => 'Siswa dengan ID tersebut tidak ditemukan'
                ]);
            }
        }

        $activeSemester = \App\Models\Semester::where('is_active', true)->first();

        if (!$activeSemester) {
            return response()->json([
                'error' => 'Tidak ada semester aktif'
            ]);
        }

        // Get Tahfidz Mapel IDs
        $tahfidzMapelIds = \App\Models\Mapel::where('name', 'like', '%Tahfi%')->pluck('id');

        // Get Tahfidz Grades
        $tahfidzGrades = \App\Models\StudentGrade::where('student_id', $student->id)
            ->whereHas('activeSubject', function ($q) use ($tahfidzMapelIds) {
                $q->whereIn('mapel_id', $tahfidzMapelIds);
            })
            ->where('semester_id', $activeSemester->id)
            ->with(['activeSubject.mapel', 'gradeWeight', 'semester'])
            ->orderBy('created_at', 'desc')
            ->get();

        $data = [
            'student_id' => $student->id,
            'student_name' => $student->name,
            'semester' => $activeSemester->name,
            'grades' => $tahfidzGrades->map(function($grade) {
                return [
                    'id' => $grade->id,
                    'mapel' => $grade->activeSubject?->mapel?->name,
                    'grade_weight' => $grade->gradeWeight?->name,
                    'score' => $grade->score,
                    'original_score' => $grade->original_score,
                    'display_value' => $grade->original_score ?? $grade->score,
                    'created_at' => $grade->created_at,
                ];
            })->toArray()
        ];

        return response()->json($data);
    }
}
