<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\TahfidzHalaqohSession;
use App\Models\TahfidzHalaqohOfficer;
use App\Models\TahfidzMusyrif;
use App\Models\User;
use App\Models\Student;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TahfidzHalaqohSettingsController extends Controller
{
    public function index(Request $request)
    {
        $sessions = TahfidzHalaqohSession::all();

        // Filter officers by month/year, default to current month
        $month = $request->input('month', Carbon::now()->format('Y-m'));
        $startDate = Carbon::parse($month)->startOfMonth();
        $endDate = Carbon::parse($month)->endOfMonth();

        $officers = TahfidzHalaqohOfficer::with(['user', 'session'])
            ->whereBetween('assigned_date', [$startDate, $endDate])
            ->orderBy('assigned_date')
            ->orderBy('session_id')
            ->get();

        $musyrifs = TahfidzMusyrif::with([
            'student.user',
            'student.classMembers.activeClass',
            'members.student.user',
            'members.student.classMembers.activeClass'
        ])->where('is_active', true)->get();

        // Data for dropdowns
        $users = User::whereHas('userLevel', function ($q) {
            $q->whereIn('name', ['Administrator', 'Guru', 'Kepala Sekolah', 'Manager Tahfidz']);
        })->get();

        // Get active students (status is on User model)
        $activeStudents = Student::with(['user', 'classMembers.activeClass'])
            ->whereHas('user', function ($q) {
                $q->where('status', 'Aktif');
            })
            ->get()
            ->sortBy(function ($student) {
                return $student->user->name ?? '';
            })
            ->values();

        return Inertia::render('Settings/Tahfidz/Halaqoh/Index', [
            'sessions' => $sessions,
            'officers' => $officers,
            'musyrifs' => $musyrifs,
            'users' => $users,
            'students' => $activeStudents,
            'filters' => ['month' => $month],
        ]);
    }

    public function storeSession(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'start_time' => 'required',
            'end_time' => 'required',
        ]);

        TahfidzHalaqohSession::create($request->all());

        return redirect()->back()->with('success', 'Sesi berhasil ditambahkan.');
    }

    public function updateSession(Request $request, TahfidzHalaqohSession $session)
    {
        $request->validate([
            'name' => 'required|string',
            'start_time' => 'required',
            'end_time' => 'required',
        ]);

        $session->update($request->all());

        return redirect()->back()->with('success', 'Sesi berhasil diperbarui.');
    }

    public function storeOfficer(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'session_id' => 'required|exists:tahfidz_halaqoh_sessions,id',
            'assigned_date' => 'required|date',
        ]);

        // Check duplicate
        $exists = TahfidzHalaqohOfficer::where('user_id', $request->user_id)
            ->where('session_id', $request->session_id)
            ->where('assigned_date', $request->assigned_date)
            ->exists();

        if ($exists) {
            return redirect()->back()->with('error', 'Petugas sudah terdaftar pada jadwal ini.');
        }

        TahfidzHalaqohOfficer::create($request->all());

        return redirect()->back()->with('success', 'Petugas berhasil ditambahkan.');
    }

    public function destroyOfficer(TahfidzHalaqohOfficer $officer)
    {
        $officer->delete();
        return redirect()->back()->with('success', 'Petugas berhasil dihapus.');
    }

    public function storeMusyrif(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        $exists = TahfidzMusyrif::where('student_id', $request->student_id)->exists();

        if ($exists) {
            // activate if inactive
            TahfidzMusyrif::where('student_id', $request->student_id)->update(['is_active' => true]);
        } else {
            TahfidzMusyrif::create(['student_id' => $request->student_id, 'is_active' => true]);
        }

        return redirect()->back()->with('success', 'Musyrif berhasil ditambahkan.');
    }

    public function destroyMusyrif(TahfidzMusyrif $musyrif)
    {
        $musyrif->delete();
        return redirect()->back()->with('success', 'Musyrif berhasil dihapus.');
    }

    // --- Member Management (Anggota Halaqoh) ---

    public function storeMember(Request $request)
    {
        $request->validate([
            'musyrif_id' => 'required|exists:tahfidz_musyrifs,id',
            'student_id' => 'required_without:nis_list',
            'nis_list' => 'required_without:student_id',
        ]);

        if ($request->has('student_id') && $request->student_id) {
            // Single Add
            \App\Models\TahfidzHalaqohMember::firstOrCreate([
                'musyrif_id' => $request->musyrif_id,
                'student_id' => $request->student_id
            ]);
        }

        if ($request->has('nis_list') && $request->nis_list) {
            // Bulk Add via Text
            $text = preg_replace('/[,\s]+/', "\n", $request->nis_list);
            $lines = explode("\n", $text);

            $addedCount = 0;
            DB::transaction(function () use ($lines, $request, &$addedCount) {
                foreach ($lines as $nis) {
                    $nis = trim($nis);
                    if (empty($nis)) continue;

                    $student = Student::whereHas('user', function ($q) use ($nis) {
                        $q->where('nomor_induk', $nis); // Assuming exact match
                    })->first();

                    if ($student) {
                        \App\Models\TahfidzHalaqohMember::firstOrCreate([
                            'musyrif_id' => $request->musyrif_id,
                            'student_id' => $student->id
                        ]);
                        $addedCount++;
                    }
                }
            });

            return redirect()->back()->with('success', "$addedCount anggota berhasil ditambahkan.");
        }

        return redirect()->back()->with('success', 'Anggota berhasil ditambahkan.');
    }

    public function destroyMember($id)
    {
        $member = \App\Models\TahfidzHalaqohMember::findOrFail($id);
        $member->delete();
        return redirect()->back()->with('success', 'Anggota berhasil dihapus.');
    }
}
