<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Schedule;
use App\Models\AcademicYear;
use App\Models\ActiveClass;
use App\Models\Day;
use App\Models\DayLearningHour;
use App\Models\LearningHour;
use App\Models\User;

class PublicScheduleController extends Controller
{
    public function index(Request $request)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear() ?? AcademicYear::where('is_active', true)->firstOrFail();
        $user = Auth::user();
        $schoolInfo = \App\Models\SchoolInfo::first();

        // Determine default view based on role
        $defaultView = 'master';
        $defaultClassId = null;
        $defaultTeacherId = null;

        if ($user->userLevel->name === 'Santri') {
            $defaultView = 'class';
            // Find student's class
            if ($user->student) {
                $classMember = \App\Models\ClassMember::where('student_id', $user->student->id)
                    ->whereHas('activeClass', fn($q) => $q->where('academic_year_id', $activeYear->id))
                    ->first();

                if ($classMember) {
                    $defaultClassId = $classMember->active_class_id;
                }
            }
        } elseif ($user->userLevel->name === 'Guru') {
            $defaultView = 'teacher';
            $defaultTeacherId = $user->id;
        }

        // Fetch data (similar to ScheduleController but read-only optimization possible)
        $schedules = Schedule::where('academic_year_id', $activeYear->id)
            ->with([
                'activeClass.kelas',
                'activeClass.kelasParalel',
                'activeSubject.mapel',
                'activeSubject.activeClass.kelas',
                'activeSubject.activeClass.kelasParalel',
                'teacher',
                'day',
                'learningHour'
            ])
            ->get();

        $activeClasses = ActiveClass::where('academic_year_id', $activeYear->id)
            ->withCount('classMembers')
            ->with([
                'kelas.jenjang', 
                'kelasParalel', 
                'teacher',
                'activeSubjects.mapel',
                'activeSubjects.teacher',
                'activeSubjects.semesterSubjectTeachers.teacher',
                'activeSubjects.semesterSubjectTeachers.semester'
            ])
            ->get()
            ->sort(function ($a, $b) {
                $jenjangCmp = strnatcmp($a->kelas->jenjang->name ?? '', $b->kelas->jenjang->name ?? '');
                if ($jenjangCmp !== 0) return $jenjangCmp;
                
                $nameCmp = strnatcmp($a->kelas->name ?? '', $b->kelas->name ?? '');
                if ($nameCmp !== 0) return $nameCmp;

                return strnatcmp($a->kelasParalel->name ?? '', $b->kelasParalel->name ?? '');
            })
            ->values();

        $days = Day::where('is_active', true)->orderBy('order')->get();

        $activeSlots = DayLearningHour::where('is_active', true)
            ->with(['learningHour'])
            ->get()
            ->groupBy('day_id');

        $learningHours = LearningHour::orderBy('hour_number')->get();

        $teachers = User::whereHas('activeSubjects', function ($q) use ($activeYear) {
            $q->whereHas('activeClass', fn($sq) => $sq->where('academic_year_id', $activeYear->id));
        })->orderBy('name')->get();

        return Inertia::render('Settings/Education/Schedule/Workspace', [
            'activeYear' => $activeYear,
            'schoolInfo' => $schoolInfo,
            'schedules' => $schedules,
            'activeClasses' => $activeClasses,
            'days' => $days,
            'activeSlots' => $activeSlots,
            'learningHours' => $learningHours,
            'teachers' => $teachers,
            'mapels' => [],
            'kelasOptions' => [],
            'kelasParalels' => [],
            'semesters' => \App\Models\Semester::orderBy('id')->get(['id', 'name', 'is_active']),
            'teacherLoadSummaries' => [],
            'classAnalysis' => [],
            'summary' => [
                'total_classes' => 0,
                'incomplete_hours_count' => 0,
                'missing_teacher_count' => 0,
                'total_unallocated_hours' => 0,
            ],
            'unavailableByTeacher' => new \stdClass(),
            'defaultTab' => 'schedule',
            'initialScheduleView' => $defaultView,
            'initialClassId' => $defaultClassId,
            'initialTeacherId' => $defaultTeacherId,
            'canManageWorkspace' => false,
        ]);
    }
}
