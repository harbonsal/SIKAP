<?php

namespace App\Http\Controllers\Settings\Education;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Academic\StudentPlottingService;
use App\Models\ClassMember;
use Illuminate\Support\Facades\DB;

class PlottingController extends Controller
{
    /**
     * Display a listing of the resource.
     * Actually, the UI is part of the Schedule Workspace, 
     * but we provide APIs for preview and commit.
     */

    public function setupData()
    {
        return response()->json([
            'levels' => \App\Models\Kelas::with('jenjang')->get(),
            'semesters' => \App\Models\AcademicYear::orderBy('name', 'desc')->get(),
        ]);
    }

    public function preview(Request $request, StudentPlottingService $plottingService)
    {
        $rules = [
            'source_level_ids' => 'required|array',
            'target_class_ids' => 'required|array',
            'target_class_ids.*' => 'exists:active_classes,id',
            'grading_method' => 'required|string',
            'locked_students' => 'nullable|array',
            'retained_students' => 'nullable|array',
        ];

        if (!in_array('new_students', $request->source_level_ids)) {
            $rules['source_level_ids.*'] = 'required|exists:kelas,id';
            $rules['source_semester_id'] = 'required|exists:academic_years,id';
        }

        $validated = $request->validate($rules);
        $validated['source_level_ids'] = $request->source_level_ids;
        $validated['source_semester_id'] = $request->source_semester_id ?? null;

        $rankedStudents = $plottingService->getRankedStudents(
            $validated['source_level_ids'],
            $validated['source_semester_id'],
            $validated['grading_method']
        );

        $distribution = $plottingService->generateDistribution(
            $rankedStudents,
            $validated['target_class_ids'],
            $validated['locked_students'] ?? [],
            $validated['retained_students'] ?? [],
            in_array('new_students', $validated['source_level_ids'])
        );

        $retainedStudentsData = [];
        if (!empty($validated['retained_students'])) {
            $retainedStudentsData = \App\Models\Student::whereIn('id', $validated['retained_students'])->get();
        }

        return response()->json([
            'distribution' => $distribution,
            'retained_students' => $retainedStudentsData
        ]);
    }

    public function commit(Request $request)
    {
        $validated = $request->validate([
            'distribution' => 'required|array',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['distribution'] as $bucket) {
                if (!isset($bucket['class']['id'])) continue;
                $classId = $bucket['class']['id'];
                
                // For safety, we first remove existing plotting for this target class 
                // to allow re-running the commit without duplicates.
                ClassMember::where('active_class_id', $classId)->delete();

                $members = [];
                if (isset($bucket['students']) && is_array($bucket['students'])) {
                    foreach ($bucket['students'] as $student) {
                        $members[] = [
                            'active_class_id' => $classId,
                            'student_id' => $student['id'],
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                    if (count($members) > 0) {
                        ClassMember::insert($members);
                    }
                }
            }
            DB::commit();
            
            return redirect()->back()->with('success', 'Plotting santri berhasil disimpan permanen.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }
}
