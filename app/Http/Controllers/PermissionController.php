<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\ActiveKamar;
use App\Models\PermissionGroup;
use App\Models\StudentPermission;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\DB;

class PermissionController extends Controller
{
    private function syncLateStatuses($permissionGroupIds)
    {
        $permissions = StudentPermission::with('permissionGroup')
            ->whereIn('permission_group_id', (array)$permissionGroupIds)
            ->where('status', 'Returned')
            ->get();

        foreach ($permissions as $sp) {
            if (!$sp->return_at || !$sp->permissionGroup) continue;

            $isLate = $sp->return_at->gt($sp->permissionGroup->end_time);
            $isSystemNote = $sp->keterangan && str_starts_with($sp->keterangan, 'Terlambat ');

            if ($isLate) {
                $newNote = 'Terlambat ' . $sp->permissionGroup->end_time->diffForHumans($sp->return_at, true);
                $noteToSave = ($isSystemNote || !$sp->keterangan) ? $newNote : $sp->keterangan;
            } else {
                $noteToSave = $isSystemNote ? null : $sp->keterangan;
            }

            $sp->update([
                'is_late' => $isLate,
                'keterangan' => $noteToSave
            ]);
        }
    }

    private function allowedRoles(): array
    {
        return [
            'Administrator', 'Admin', 'Sekertaris Divisi', 'Sekretaris Divisi', 'Kepala Sekolah', 'Manager', 
            'Manager Pengasuhan', 'Musrif', 'Musyrif', 'Musrif Asrama', 
            'Guru', 'Guru Kelas', 'Wali Kelas', 'Pengajar', 'Staf Pendidikan', 'Kurikulum'
        ];
    }

    public function index(Request $request)
    {
        $user = auth()->user()->load(['userLevel', 'additionalLevels']);
        
        if (!$user->hasRole($this->allowedRoles())) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengatur perizinan.');
        }

        $canSeeAllKamars = $user->hasRole([
            'Administrator', 'Admin', 'Sekertaris Divisi', 'Sekretaris Divisi', 'Kepala Sekolah', 'Manager', 
            'Manager Pengasuhan', 'Guru', 'Guru Kelas', 'Wali Kelas', 'Pengajar', 'Staf Pendidikan', 'Kurikulum'
        ]);

        $academicYear = \App\Services\AcademicStateService::currentAcademicYear() ?? \App\Services\AcademicStateService::currentAcademicYear();

        // Kamar Filter Options
        $kamarQuery = ActiveKamar::where('academic_year_id', $academicYear->id)
            ->with(['kamar', 'musrif']);

        if (!$canSeeAllKamars) {
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
            ->where(function ($query) use ($academicYear) {
                $query->whereHas('activeKamar', function ($q) use ($academicYear) {
                    $q->where('academic_year_id', $academicYear->id);
                })
                ->orWhereHas('studentPermissions', function ($q) {
                    $q->whereIn('status', ['Out', 'Pending']);
                });
            })
            ->latest();

        if ($request->active_kamar_id) {
            $permissionsQuery->where('active_kamar_id', $request->active_kamar_id);
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

    public function monitor(Request $request)
    {
        $user = auth()->user()->load('userLevel');
        $isAdmin = $user->userLevel && $user->userLevel->name === 'Administrator';
        $academicYear = \App\Services\AcademicStateService::currentAcademicYear() ?? \App\Services\AcademicStateService::currentAcademicYear();

        // Ambil data santri yang masih "Out" (di luar) atau "Returned" tapi "is_late = true" pada hari ini atau yang masih menggantung.
        $now = Carbon::now();

        $query = StudentPermission::with(['student.user', 'permissionGroup.activeKamar.kamar'])
            ->whereHas('student.user', function($q) {
                $q->where('status', 'Aktif');
            });

        // Filter: 
        $today = Carbon::today();

        $pendingPermissions = (clone $query)->where('status', 'Pending')
            ->whereHas('permissionGroup', function($q) use ($today) {
                $q->whereDate('start_time', '<=', Carbon::now())
                  ->whereDate('end_time', '>=', $today);
            })
            ->get();

        $activePermissions = (clone $query)->where('status', 'Out')->latest('exit_at')->get();
        
        $returnedPermissions = (clone $query)->where('status', 'Returned')
            ->where('return_at', '>=', Carbon::now()->subDays(7)->startOfDay())
            ->latest('return_at')
            ->get();

        $lateReturns = $returnedPermissions->where('is_late', true)->values();

        $mapPermission = function ($p) {
            return [
                'id' => $p->id,
                'student_name' => $p->student->name,
                'kamar' => $p->permissionGroup->activeKamar->kamar->name,
                'group_name' => $p->permissionGroup->name,
                'exit_at' => $p->exit_at ? $p->exit_at->format('H:i') : '-',
                'return_at' => $p->return_at ? $p->return_at->format('H:i') : '-',
                'end_time' => $p->permissionGroup->end_time->format('H:i'),
                'is_overdue' => Carbon::now()->greaterThan($p->permissionGroup->end_time),
                'keterangan' => $p->keterangan,
                'uang_saku' => $p->uang_saku,
                'barang_titipan' => $p->barang_titipan,
            ];
        };

        return Inertia::render('Care/Permission/Monitor', [
            'pending_permissions' => $pendingPermissions->map($mapPermission),
            'active_permissions' => $activePermissions->map($mapPermission),
            'returned_permissions' => $returnedPermissions->map($mapPermission),
            'late_returns' => $lateReturns->map($mapPermission),
            'summary' => [
                'total_uang_saku' => $returnedPermissions->where('uang_saku', '>', 0)->sum('uang_saku'),
            ]
        ]);
    }

    public function exportTitipan(Request $request)
    {
        $user = auth()->user()->load('userLevel');
        $allowedRoles = ['Administrator', 'Sekertaris Divisi', 'Kepala Sekolah', 'Manager', 'Musrif', 'Musyrif', 'Musrif Asrama'];
        
        if (!$user->hasRole($allowedRoles)) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengunduh laporan ini.');
        }

        return Excel::download(new \App\Exports\PermissionTitipanExport(), 'Laporan_Titipan_Uang_Barang.xlsx');
    }

    public function manualUpdate(Request $request, StudentPermission $studentPermission)
    {
        $user = auth()->user()->load(['userLevel', 'additionalLevels']);
        $allowedRoles = ['Administrator', 'Sekertaris Divisi', 'Kepala Sekolah', 'Manager', 'Musrif', 'Musyrif', 'Musrif Asrama'];
        
        if (!$user->hasRole($allowedRoles)) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengubah status secara manual.');
        }

        $action = $request->input('action');

        if ($action === 'keluar' && $studentPermission->status === 'Pending') {
            $studentPermission->status = 'Out';
            $studentPermission->exit_at = Carbon::now();
            $studentPermission->save();
            return redirect()->back()->with('success', 'Status santri berhasil diubah menjadi KELUAR.');
        }

        if ($action === 'kembali' && $studentPermission->status === 'Out') {
            $studentPermission->status = 'Returned';
            $studentPermission->return_at = Carbon::now();
            
            // Cek apakah terlambat
            $endTime = $studentPermission->permissionGroup->end_time;
            if (Carbon::now()->greaterThan($endTime)) {
                $studentPermission->is_late = true;
            }
            
            $studentPermission->save();
            return redirect()->back()->with('success', 'Status santri berhasil diubah menjadi KEMBALI.');
        }

        return redirect()->back()->withErrors(['error' => 'Tindakan tidak valid atau status tidak sesuai.']);
    }

    public function updateDetails(Request $request, StudentPermission $studentPermission)
    {
        $user = auth()->user()->load(['userLevel', 'additionalLevels']);
        $allowedRoles = ['Administrator', 'Sekertaris Divisi', 'Kepala Sekolah', 'Manager', 'Musrif', 'Musyrif', 'Musrif Asrama'];
        
        if (!$user->hasRole($allowedRoles)) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengubah data.');
        }

        $request->validate([
            'uang_saku' => 'nullable|numeric',
            'barang_titipan' => 'nullable|string|max:500',
            'keterangan' => 'nullable|string|max:500'
        ]);

        $studentPermission->update([
            'uang_saku' => $request->uang_saku,
            'barang_titipan' => $request->barang_titipan,
            'keterangan' => $request->keterangan
        ]);

        return redirect()->back()->with('success', 'Catatan perizinan berhasil diperbarui.');
    }

    public function create(Request $request)
    {
        $user = auth()->user()->load(['userLevel', 'additionalLevels']);
        
        if (!$user->hasRole($this->allowedRoles())) {
            abort(403, 'Anda tidak memiliki hak akses untuk membuat perizinan.');
        }

        $canSeeAllKamars = $user->hasRole([
            'Administrator', 'Admin', 'Sekertaris Divisi', 'Sekretaris Divisi', 'Kepala Sekolah', 'Manager', 
            'Manager Pengasuhan', 'Guru', 'Guru Kelas', 'Wali Kelas', 'Pengajar', 'Staf Pendidikan', 'Kurikulum'
        ]);
        $academicYear = \App\Services\AcademicStateService::currentAcademicYear() ?? \App\Services\AcademicStateService::currentAcademicYear();

        $kamarQuery = ActiveKamar::where('academic_year_id', $academicYear->id)
            ->with(['kamar']);

        if (!$canSeeAllKamars) {
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
        $user = auth()->user()->load(['userLevel', 'additionalLevels']);
        
        if (!$user->hasRole($this->allowedRoles())) {
            abort(403, 'Anda tidak memiliki hak akses untuk menyimpan perizinan.');
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'active_kamar_id' => 'required', // Can be 'all'
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'student_ids' => 'array',
            'select_all' => 'boolean'
        ]);

        DB::beginTransaction();
        try {
            $kamarIds = [];
            $academicYear = \App\Services\AcademicStateService::currentAcademicYear() ?? \App\Services\AcademicStateService::currentAcademicYear();
            $canSeeAllKamars = $user->hasRole([
                'Administrator', 'Admin', 'Sekertaris Divisi', 'Sekretaris Divisi', 'Kepala Sekolah', 'Manager', 
                'Manager Pengasuhan', 'Guru', 'Guru Kelas', 'Wali Kelas', 'Pengajar', 'Staf Pendidikan', 'Kurikulum'
            ]);

            if ($request->active_kamar_id === 'all') {
                $kamarQuery = ActiveKamar::where('academic_year_id', $academicYear->id);
                if (!$canSeeAllKamars) {
                    $kamarQuery->where('musrif_id', $user->id);
                }
                $kamarIds = $kamarQuery->pluck('id')->toArray();
            } else {
                $kamarIds = [$request->active_kamar_id];
            }

            foreach ($kamarIds as $kId) {
                $group = PermissionGroup::create([
                    'name' => $request->name,
                    'active_kamar_id' => $kId,
                    'start_time' => $request->start_time,
                    'end_time' => $request->end_time,
                    'description' => $request->description,
                    'created_by' => auth()->id(),
                ]);

                $studentIds = [];
                if ($request->select_all || $request->active_kamar_id === 'all') {
                    $activeKamar = ActiveKamar::find($kId);
                    $studentIds = $activeKamar->members()->pluck('student_id')->toArray();
                } else {
                    $studentIds = $request->student_ids ?? [];
                }

                foreach ($studentIds as $sId) {
                    StudentPermission::create([
                        'permission_group_id' => $group->id,
                        'student_id' => $sId,
                        'status' => 'Pending'
                    ]);
                }
            }

            DB::commit();
            return redirect()->route('permissions.index')->with('success', 'Kelompok Perizinan berhasil dibuat.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy(PermissionGroup $permission)
    {
        $user = auth()->user()->load(['userLevel', 'additionalLevels']);
        
        if (!$user->hasRole($this->allowedRoles())) {
            abort(403, 'Anda tidak memiliki hak akses untuk menghapus perizinan.');
        }

        DB::beginTransaction();
        try {
            StudentPermission::where('permission_group_id', $permission->id)->delete();
            $permission->delete();
            DB::commit();
            return redirect()->route('permissions.index')->with('success', 'Perizinan berhasil dihapus.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menghapus perizinan: ' . $e->getMessage()]);
        }
    }

    public function bulkUpdateTime(Request $request)
    {
        $user = auth()->user()->load(['userLevel', 'additionalLevels']);
        
        if (!$user->hasRole($this->allowedRoles())) {
            return back()->withErrors(['error' => 'Anda tidak memiliki akses untuk mengubah perizinan.']);
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:permission_groups,id',
            'end_time' => 'required|date',
        ]);

        DB::beginTransaction();
        try {
            PermissionGroup::whereIn('id', $request->ids)->update([
                'end_time' => $request->end_time
            ]);
            $this->syncLateStatuses($request->ids);
            DB::commit();
            return back()->with('success', count($request->ids) . ' Jadwal kedatangan berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal mengubah perizinan: ' . $e->getMessage()]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $user = auth()->user()->load(['userLevel', 'additionalLevels']);
        
        if (!$user->hasRole($this->allowedRoles())) {
            abort(403, 'Anda tidak memiliki hak akses untuk menghapus perizinan.');
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:permission_groups,id'
        ]);

        DB::beginTransaction();
        try {
            StudentPermission::whereIn('permission_group_id', $request->ids)->delete();
            PermissionGroup::whereIn('id', $request->ids)->delete();
            DB::commit();
            return redirect()->route('permissions.index')->with('success', count($request->ids) . ' Perizinan berhasil dihapus.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal menghapus perizinan: ' . $e->getMessage()]);
        }
    }

    public function updateTime(Request $request, PermissionGroup $permission)
    {
        $user = auth()->user()->load(['userLevel', 'additionalLevels']);
        
        if (!$user->hasRole($this->allowedRoles())) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengubah waktu perizinan.');
        }

        $request->validate([
            'end_time' => 'required|date'
        ]);
        DB::beginTransaction();
        try {
            $permission->update(['end_time' => $request->end_time]);
            $this->syncLateStatuses([$permission->id]);
            DB::commit();
            return back()->with('success', 'Batas waktu kedatangan berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Gagal mengubah perizinan: ' . $e->getMessage()]);
        }
    }

    public function show(PermissionGroup $permission)
    {
        $user = auth()->user()->load(['userLevel', 'additionalLevels']);
        
        if (!$user->hasRole($this->allowedRoles())) {
            abort(403, 'Anda tidak memiliki hak akses untuk melihat detail perizinan ini.');
        }

        $permission->load(['activeKamar.kamar', 'studentPermissions.student']);

        $students = $permission->studentPermissions->map(function ($sp) {
            return [
                'id' => $sp->id,
                'student_name' => $sp->student->name,
                'status' => $sp->status,
                'exit_at' => $sp->exit_at ? $sp->exit_at->format('H:i') : '-',
                'return_at' => $sp->return_at ? $sp->return_at->format('H:i') : '-',
                'is_late' => $sp->is_late,
                'keterangan' => $sp->keterangan,
                'uang_saku' => $sp->uang_saku,
                'barang_titipan' => $sp->barang_titipan
            ];
        });

        return Inertia::render('Care/Permission/Show', [
            'permission' => [
                'id' => $permission->id,
                'name' => $permission->name,
                'kamar' => $permission->activeKamar->kamar->name,
                'time_range' => $permission->start_time->format('d M H:i') . ' - ' . $permission->end_time->format('d M H:i'),
                'raw_end_time' => $permission->end_time->format('Y-m-d\TH:i'),
                'description' => $permission->description
            ],
            'students' => $students
        ]);
    }
}

