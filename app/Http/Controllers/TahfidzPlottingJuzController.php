<?php

namespace App\Http\Controllers;

use App\Models\TahfidzClassTarget;
use App\Models\TahfidzStudentTarget;
use App\Models\ActiveClass;
use App\Models\Student;
use App\Models\TahfidzMemorization;
use Illuminate\Http\Request;

class TahfidzPlottingJuzController extends Controller
{
    public function getData(Request $request)
    {
        $activeClassId = $request->active_class_id;
        $semester = $request->semester;

        if (!$activeClassId || !$semester) {
            return response()->json([]);
        }

        $classTarget = TahfidzClassTarget::where('active_class_id', $activeClassId)
            ->where('semester', $semester)
            ->first();

        // Get students in this active class
        $activeClass = ActiveClass::with(['classMembers.student.user'])->find($activeClassId);
        
        if (!$activeClass) {
            return response()->json([]);
        }

        $studentsData = [];
        foreach ($activeClass->classMembers as $member) {
            $student = $member->student;
            
            // Get completed juz by this student
            $completedJuz = TahfidzMemorization::where('student_id', $student->id)
                ->where('is_completed', true)
                ->pluck('juz')
                ->toArray();
                
            // Get personal target exception if any
            $studentTarget = TahfidzStudentTarget::where('student_id', $student->id)
                ->where('active_class_id', $activeClassId)
                ->where('semester', $semester)
                ->first();

            $classTargetArr = $classTarget ? (is_array($classTarget->juz_targets) ? $classTarget->juz_targets : json_decode($classTarget->juz_targets, true) ?? []) : [];
            $isCustom = $studentTarget ? true : false;
            $rawTarget = $isCustom ? (is_array($studentTarget->juz_targets) ? $studentTarget->juz_targets : json_decode($studentTarget->juz_targets, true) ?? []) : [];
            
            // Computed target is rawTarget if custom, otherwise classTargetArr. Filter out completed juzs.
            $baseTarget = $isCustom ? $rawTarget : $classTargetArr;
            $computedTarget = array_values(array_diff($baseTarget, $completedJuz));

            $studentsData[] = [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->user ? $student->user->nomor_induk : null,
                'is_custom' => $isCustom,
                'completed_juzs' => $completedJuz,
                'computed_target' => $computedTarget,
                'raw_target' => $rawTarget,
            ];
        }

        return response()->json([
            'class_target' => $classTarget ? (is_array($classTarget->juz_targets) ? $classTarget->juz_targets : json_decode($classTarget->juz_targets, true) ?? []) : [],
            'students' => $studentsData
        ]);
    }

    public function storeClass(Request $request)
    {
        $request->validate([
            'active_class_id' => 'required|exists:active_classes,id',
            'semester' => 'required|integer',
            'juz_targets' => 'nullable|array'
        ]);

        TahfidzClassTarget::updateOrCreate(
            [
                'active_class_id' => $request->active_class_id,
                'semester' => $request->semester,
            ],
            [
                'juz_targets' => $request->juz_targets ?? []
            ]
        );

        return redirect()->back()->with('success', 'Target umum kelas berhasil disimpan');
    }

    public function storeStudent(Request $request)
    {
        $request->validate([
            'active_class_id' => 'required|exists:active_classes,id',
            'semester' => 'required|integer',
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'juz_targets' => 'nullable|array',
            'is_custom' => 'required|boolean'
        ]);

        $activeClassId = $request->active_class_id;
        $semester = $request->semester;

        foreach ($request->student_ids as $studentId) {
            if ($request->is_custom && is_array($request->juz_targets)) {
                TahfidzStudentTarget::updateOrCreate(
                    [
                        'student_id' => $studentId,
                        'active_class_id' => $activeClassId,
                        'semester' => $semester,
                    ],
                    [
                        'juz_targets' => $request->juz_targets
                    ]
                );
            } else {
                // If not custom (follow class target), delete the exception
                TahfidzStudentTarget::where('student_id', $studentId)
                    ->where('active_class_id', $activeClassId)
                    ->where('semester', $semester)
                    ->delete();
            }
        }

        return redirect()->back()->with('success', 'Pengecualian target santri berhasil disimpan');
    }
}
