<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\ActiveKamar;
use App\Models\PermissionGroup;
use App\Models\StudentPermission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PermissionController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user()->load('userLevel');
        $isAdmin = $user->userLevel && $user->userLevel->name === 'Administrator';

        $academicYear = AcademicYear::where('is_active', true)->first();

        // Kamar Filter Options
        $kamarQuery = ActiveKamar::where('academic_year_id', $academicYear->id)
            ->with(['kamar', 'musrif']);

        if (!$isAdmin) {
            $kamarQuery->where('musrif_id', $user->id);
        }

        $kamars = $kamarQuery->get()->map(function ($ak) {
            return [
                'id' => $ak->id,
                'name' => $ak->kamar->name,
                'musrif' => $ak->musrif ? $ak->musrif->name : '-',
            ];
        });

        // Permissions List
        $permissionsQuery = PermissionGroup::with(['activeKamar.kamar', 'creator'])
            ->whereHas('activeKamar', function ($q) use ($academicYear) {
                $q->where('academic_year_id', $academicYear->id);
            })
            ->latest();

        if ($request->active_kamar_id) {
            $permissionsQuery->where('active_kamar_id', $request->active_kamar_id);
        } elseif (!$isAdmin) {
            // If not admin and no specific filter, show only creator's or assigned kamar's permissions?
            // Let's safe filter by Kamar managed by Musrif
            $managedKamarIds = $kamars->pluck('id');
            $permissionsQuery->whereIn('active_kamar_id', $managedKamarIds);
        }

        $permissions = $permissionsQuery->paginate(20)
            ->through(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'kamar' => $p->activeKamar->kamar->name,
                    'start_time' => $p->start_time->format('d M Y H:i'),
                    'end_time' => $p->end_time->format('d M Y H:i'),
                    'student_count' => $p->studentPermissions()->count(),
                    'creator' => $p->creator->name,
                ];
            });

        return Inertia::render('Care/Permission/Index', [
            'kamars' => $kamars,
            'permissions' => $permissions,
            'filters' => ['active_kamar_id' => $request->active_kamar_id],
        ]);
    }

    public function create(Request $request)
    {
        // Reuse Kamar logic or similar
        // For 'Create', we need list of available Kamars and Students in them (ajax loaded?)
        // Let's pass kamars first.

        $user = auth()->user()->load('userLevel');
        $isAdmin = $user->userLevel && $user->userLevel->name === 'Administrator';
        $academicYear = AcademicYear::where('is_active', true)->first();

        $kamarQuery = ActiveKamar::where('academic_year_id', $academicYear->id)
            ->with(['kamar']);

        if (!$isAdmin) {
            $kamarQuery->where('musrif_id', $user->id);
        }

        $kamars = $kamarQuery->get()->map(fn($ak) => [
            'id' => $ak->id,
            'name' => $ak->kamar->name
        ]);

        return Inertia::render('Care/Permission/Create', [
            'kamars' => $kamars
        ]);
    }

    // Helper to get students by Kamar (via API for Create Form)
    public function getStudents(ActiveKamar $activeKamar)
    {
        $students = $activeKamar->members()
            ->with(['student.user'])
            ->get()
            ->map(fn($m) => [
                'id' => $m->student->id,
                'name' => $m->student->name,
                'nis' => $m->student->nomor_induk
            ]);

        return response()->json($students);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'active_kamar_id' => 'required|exists:active_kamars,id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'student_ids' => 'array', // If empty, assume ALL? Let's make explicit 'select_all'
            'select_all' => 'boolean'
        ]);

        DB::beginTransaction();
        try {
            $group = PermissionGroup::create([
                'name' => $request->name,
                'active_kamar_id' => $request->active_kamar_id,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'description' => $request->description,
                'created_by' => auth()->id(),
            ]);

            $studentIds = $request->student_ids ?? [];

            if ($request->select_all) {
                // Fetch all students from kamar
                $activeKamar = ActiveKamar::find($request->active_kamar_id);
                $studentIds = $activeKamar->members()->pluck('student_id')->toArray();
            }

            foreach ($studentIds as $sId) {
                StudentPermission::create([
                    'permission_group_id' => $group->id,
                    'student_id' => $sId,
                    'status' => 'Pending'
                ]);
            }

            DB::commit();
            return redirect()->route('care.permissions.index')->with('success', 'Kelompok Perizinan berhasil dibuat.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function show(PermissionGroup $permission)
    {
        $permission->load(['activeKamar.kamar', 'studentPermissions.student']);

        $students = $permission->studentPermissions->map(function ($sp) {
            return [
                'id' => $sp->id,
                'student_name' => $sp->student->name,
                'status' => $sp->status,
                'exit_at' => $sp->exit_at ? $sp->exit_at->format('H:i') : '-',
                'return_at' => $sp->return_at ? $sp->return_at->format('H:i') : '-',
                'is_late' => $sp->is_late,
                'keterangan' => $sp->keterangan
            ];
        });

        return Inertia::render('Care/Permission/Show', [
            'permission' => [
                'id' => $permission->id,
                'name' => $permission->name,
                'kamar' => $permission->activeKamar->kamar->name,
                'time_range' => $permission->start_time->format('d M H:i') . ' - ' . $permission->end_time->format('d M H:i'),
                'description' => $permission->description
            ],
            'students' => $students
        ]);
    }
}
