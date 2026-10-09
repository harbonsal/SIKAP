<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\TarbiyahGroupLog;
use App\Models\TarbiyahGroupAttendance;
use App\Services\AcademicStateService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MusyrifTarbiyahGroupLogController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $activeAcademic = AcademicStateService::currentAcademicYear();
        
        if (!$activeAcademic) {
            return back()->with('error', 'Tahun ajaran aktif belum diatur.');
        }

        // Determine if admin
        $isAdmin = $user->hasRole(['Administrator', 'Manager', 'Manager Pengasuhan']);

        $query = TarbiyahGroupLog::with(['attendances.student.user'])
                    ->orderBy('date', 'desc');
        
        if (!$isAdmin) {
            $query->where('user_id', $user->id);
        }

        $logs = $query->get();

        return Inertia::render('Settings/Pengasuhan/MusyrifTarbiyah/GroupLog', [
            'logs' => $logs,
            'isAdmin' => $isAdmin,
            'currentUserId' => $user->id,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'location' => 'nullable|string',
            'topic' => 'nullable|string',
            'notes' => 'nullable|string',
            'students' => 'nullable|array', // array of student IDs that attended (nullable since UI is not ready)
        ]);

        DB::beginTransaction();
        try {
            $log = TarbiyahGroupLog::create([
                'user_id' => Auth::id(),
                'date' => $request->date,
                'location' => $request->location,
                'topic' => $request->topic,
                'notes' => $request->notes,
            ]);

            if ($request->has('students') && is_array($request->students)) {
                foreach ($request->students as $student_id) {
                    TarbiyahGroupAttendance::create([
                        'tarbiyah_group_log_id' => $log->id,
                        'student_id' => $student_id,
                    ]);
                }
            }
            DB::commit();

            return back()->with('success', 'Catatan Halaqoh (Kelompok) berhasil disimpan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menyimpan catatan: ' . $e->getMessage());
        }
    }

    public function update(Request $request, TarbiyahGroupLog $groupLog)
    {
        $user = Auth::user();
        $isAdmin = $user->hasRole(['Administrator', 'Manager', 'Manager Pengasuhan']);

        // Hanya penginput atau admin yang boleh edit
        if (!$isAdmin && (int) $groupLog->user_id !== (int) $user->id) {
            abort(403, 'Anda tidak memiliki izin untuk mengedit catatan ini.');
        }

        $request->validate([
            'date'     => 'required|date',
            'location' => 'nullable|string',
            'topic'    => 'nullable|string',
            'notes'    => 'nullable|string',
        ]);

        $groupLog->update([
            'date'     => $request->date,
            'location' => $request->location,
            'topic'    => $request->topic,
            'notes'    => $request->notes,
        ]);

        return back()->with('success', 'Catatan Halaqoh (Kelompok) berhasil diperbarui.');
    }

    public function destroy(TarbiyahGroupLog $groupLog)
    {
        $user = Auth::user();
        $isAdmin = $user->hasRole(['Administrator', 'Manager', 'Manager Pengasuhan']);

        if (!$isAdmin && (int) $groupLog->user_id !== (int) $user->id) {
            abort(403, 'Anda tidak memiliki izin untuk menghapus catatan ini.');
        }

        $groupLog->delete();

        return back()->with('success', 'Catatan Halaqoh (Kelompok) berhasil dihapus.');
    }
}
