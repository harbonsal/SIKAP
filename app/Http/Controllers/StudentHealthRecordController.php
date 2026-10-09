<?php

namespace App\Http\Controllers;

use App\Models\ActiveKamar;
use App\Services\AcademicStateService;
use App\Models\HealthComplaint;
use App\Models\HealthDescriptionTemplate;
use App\Models\Student;
use App\Models\StudentHealthRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StudentHealthRecordController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        // If legacy 'date' param is passed, override start/end
        if ($request->filled('date')) {
            $startDate = $request->input('date');
            $endDate   = $request->input('date');
        }

        $query = StudentHealthRecord::with([
            'student.user',
            'student.latestClassMember.activeClass.kelas',
            'student.latestKamarMember.activeKamar.kamar',
            'complaints',
            'creator',
        ]);

        if ($startDate && $endDate) {
            $query->whereBetween('date', [$startDate, $endDate]);
        } elseif ($startDate) {
            $query->where('date', '>=', $startDate);
        } elseif ($endDate) {
            $query->where('date', '<=', $endDate);
        }

        // Status Filter
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Kamar Filter
        if ($request->filled('active_kamar_id')) {
            $kamarId = $request->input('active_kamar_id');
            $query->whereHas('student.kamarMembers', function ($q) use ($kamarId) {
                $q->where('active_kamar_id', $kamarId);
            });
        }

        if ($search) {
            $query->whereHas('student.user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nomor_induk', 'like', "%{$search}%");
            });
        }

        if ($request->filled('complaint_id')) {
            $query->whereHas('complaints', function ($q) use ($request) {
                $q->where('health_complaints.id', $request->input('complaint_id'));
            });
        }

        $records = $query->latest()->paginate(20)->withQueryString();

        // ── Statistik ───────────────────────────────────────────────────────
        $uniqueStudentsToday = StudentHealthRecord::whereDate('date', now())
            ->where('status', 'Sakit')
            ->distinct('student_id')
            ->count();

        // Most common complaint (30 days)
        $mostCommon = HealthComplaint::withCount(['records' => function ($q) {
            $q->where('date', '>=', now()->subDays(30));
        }])->orderByDesc('records_count')->first();

        // ── Santri Masih Sakit ───────────────────────────────────────────────
        // Ambil semua record berstatus 'Sakit' yang belum di-toggle ke Sembuh.
        // Gunakan subquery untuk ambil ID record terbaru per santri, lalu filter status = Sakit.
        $latestRecordIds = StudentHealthRecord::selectRaw('MAX(id) as id')
            ->groupBy('student_id')
            ->pluck('id');

        $stillSick = StudentHealthRecord::with([
                'student.user',
                'student.latestKamarMember.activeKamar.kamar',
                'student.latestClassMember.activeClass.kelas',
                'complaints',
            ])
            ->whereIn('id', $latestRecordIds)
            ->where('status', 'Sakit')
            ->orderBy('date', 'asc') // terlama dulu (paling lama sakit di atas)
            ->get();

        // ── Rekap keluhan 30 hari ────────────────────────────────────────────
        $complaintStats = HealthComplaint::withCount(['records' => function ($q) {
            $q->where('date', '>=', now()->subDays(30));
        }])
        ->having('records_count', '>', 0)
        ->orderByDesc('records_count')
        ->limit(5)
        ->get();

        // Active Kamars for filter — hanya tahun ajaran aktif
        $activeYear   = AcademicStateService::currentAcademicYear();
        $activeKamars = ActiveKamar::with('kamar')
            ->when($activeYear, fn($q) => $q->where('academic_year_id', $activeYear->id))
            ->get();

        return Inertia::render('Care/Health/Index', [
            'records'              => $records,
            'stillSick'            => $stillSick,
            'filters'              => [
                'search'          => $search,
                'start_date'      => $startDate,
                'end_date'        => $endDate,
                'status'          => $request->input('status'),
                'complaint_id'    => $request->input('complaint_id'),
                'active_kamar_id' => $request->input('active_kamar_id'),
            ],
            'stats' => [
                'sick_today'      => $uniqueStudentsToday,
                'most_common'     => $mostCommon,
                'still_sick_count'=> $stillSick->count(),
                'complaint_stats' => $complaintStats,
            ],
            'complaints'            => HealthComplaint::orderBy('name')->get(),
            'descriptionTemplates'  => HealthDescriptionTemplate::orderBy('message')->get(),
            'activeKamars'          => $activeKamars,
        ]);
    }

    public function create()
    {
        $activeYear = AcademicStateService::currentAcademicYear();
        return Inertia::render('Care/Health/Create', [
            'complaints'           => HealthComplaint::orderBy('name')->get(),
            'descriptionTemplates' => HealthDescriptionTemplate::orderBy('message')->get(),
            'activeKamars'         => ActiveKamar::with('kamar')
                ->when($activeYear, fn($q) => $q->where('academic_year_id', $activeYear->id))
                ->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id'    => 'required|exists:students,id',
            'date'          => 'required|date',
            'complaint_ids' => 'required|array|min:1',
            'complaint_ids.*' => 'exists:health_complaints,id',
            'therapy'       => 'nullable|string',
            'description'   => 'nullable|string',
        ]);

        $record = StudentHealthRecord::create([
            'student_id'  => $validated['student_id'],
            'date'        => $validated['date'],
            'therapy'     => $validated['therapy'],
            'description' => $validated['description'],
            'status'      => 'Sakit',
            'created_by'  => Auth::id(),
        ]);

        $record->complaints()->sync($validated['complaint_ids']);

        return redirect()->back()->with('success', 'Data kesehatan berhasil disimpan.');
    }

    /**
     * Update the specified resource.
     */
    public function update(Request $request, StudentHealthRecord $record)
    {
        $validated = $request->validate([
            'date'          => 'required|date',
            'complaint_ids' => 'required|array|min:1',
            'complaint_ids.*' => 'exists:health_complaints,id',
            'therapy'       => 'nullable|string',
            'description'   => 'nullable|string',
            'status'        => 'required|in:Sakit,Sembuh,Istirahat',
        ]);

        $record->update([
            'date'        => $validated['date'],
            'therapy'     => $validated['therapy'],
            'description' => $validated['description'],
            'status'      => $validated['status'],
        ]);

        $record->complaints()->sync($validated['complaint_ids']);

        return redirect()->back()->with('success', 'Data kesehatan berhasil diperbarui.');
    }

    public function toggleStatus(Request $request, StudentHealthRecord $record)
    {
        $newStatus = ($record->status === 'Sembuh') ? 'Sakit' : 'Sembuh';
        $record->update(['status' => $newStatus]);
        return redirect()->back()->with('success', "Status diperbarui menjadi $newStatus.");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(StudentHealthRecord $record)
    {
        $record->delete();
        return redirect()->back()->with('success', 'Data kesehatan berhasil dihapus.');
    }

    /**
     * Search students for dropdown.
     */
    public function searchStudents(Request $request)
    {
        $search  = $request->query('query');
        $kamarId = $request->query('active_kamar_id');

        $query = Student::query();

        // Filter by Kamar (if selected)
        if ($kamarId) {
            $query->whereHas('kamarMembers', function ($q) use ($kamarId) {
                $q->where('active_kamar_id', $kamarId);
            });
        }

        // Search by Name (User)
        if ($search) {
            $query->whereHas('user', function ($u) use ($search) {
                $u->where('name', 'like', "%{$search}%")
                    ->orWhere('nomor_induk', 'like', "%{$search}%");
            });
        }

        return $query->with(['user', 'kamarMembers.activeKamar.kamar'])
            ->join('users', 'students.user_id', '=', 'users.id')
            ->orderBy('users.name')
            ->select('students.*')
            ->limit(20)
            ->get();
    }
}
