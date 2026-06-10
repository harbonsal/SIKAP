<?php

namespace App\Http\Controllers;

use App\Models\ActiveKamar;
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
        // Date Range Logic
        // Date Range Logic
        $startDate = $request->input('start_date') ?: date('Y-m-d');
        $endDate = $request->input('end_date') ?: date('Y-m-d');

        // If legacy 'date' param is passed, override start/end
        if ($request->filled('date')) {
            $startDate = $request->input('date');
            $endDate = $request->input('date');
        }

        $query = StudentHealthRecord::with(['student.user', 'student.latestClassMember.activeClass.kelas', 'complaints', 'creator'])
            ->whereBetween('date', [$startDate, $endDate]);

        // Status Filter
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
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

        $records = $query->latest()
            ->paginate(20)
            ->withQueryString();

        // Statistics (Always Today for "Sakit Hari Ini" dashboard consistency, or filtered?)
        // Let's keep these statistics global for now (Today) as they are usually dashboard-like widgets
        $uniqueStudentsToday = StudentHealthRecord::whereDate('date', now())->where('status', 'Sakit')->distinct('student_id')->count();

        // Most common complaint (30 days)
        $mostCommon = HealthComplaint::withCount(['records' => function ($q) {
            $q->where('date', '>=', now()->subDays(30));
        }])->orderByDesc('records_count')->first();

        // Active Kamars for filter
        $activeKamars = ActiveKamar::with('kamar')->get();

        return Inertia::render('Care/Health/Index', [
            'records' => $records,
            'filters' => [
                'search' => $search,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $request->input('status'),
                'complaint_id' => $request->input('complaint_id'),
            ],
            'stats' => [
                'sick_today' => $uniqueStudentsToday,
                'most_common' => $mostCommon, // Return whole object to get ID
            ],
            'complaints' => HealthComplaint::orderBy('name')->get(),
            'descriptionTemplates' => HealthDescriptionTemplate::orderBy('message')->get(),
            'activeKamars' => $activeKamars,
        ]);
    }

    public function create()
    {
        return Inertia::render('Care/Health/Create', [
            'complaints' => HealthComplaint::orderBy('name')->get(),
            'descriptionTemplates' => HealthDescriptionTemplate::orderBy('message')->get(),
            'activeKamars' => ActiveKamar::with('kamar')->get(),
        ]);
    }

    public function toggleStatus(Request $request, StudentHealthRecord $record)
    {
        // Simple toggle: Sakit <-> Sembuh
        // If currently 'Istirahat' or others, user might want to move to 'Sembuh'
        $newStatus = ($record->status === 'Sembuh') ? 'Sakit' : 'Sembuh';

        // Optional: specific logic? User said "geser sembuh" implied a switch.
        // We can just set to Sembuh if not, otherwise Sakit.

        $record->update(['status' => $newStatus]);

        return redirect()->back()->with('success', "Status diperbarui menjadi $newStatus.");
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'date' => 'required|date',
            'complaint_ids' => 'required|array|min:1',
            'complaint_ids.*' => 'exists:health_complaints,id',
            'therapy' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $record = StudentHealthRecord::create([
            'student_id' => $validated['student_id'],
            'date' => $validated['date'],
            'therapy' => $validated['therapy'],
            'description' => $validated['description'],
            'status' => 'Sakit', // Default status
            'created_by' => Auth::id(),
        ]);

        $record->complaints()->sync($validated['complaint_ids']);

        return redirect()->back()->with('success', 'Data kesehatan berhasil disimpan.');
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
        $search = $request->query('query');
        $kamarId = $request->query('active_kamar_id');

        $query = Student::query();

        // 1. Filter by Kamar (if selected)
        if ($kamarId) {
            $query->whereHas('kamarMembers', function ($q) use ($kamarId) {
                $q->where('active_kamar_id', $kamarId);
            });
        }

        // 2. Search by Name (User)
        if ($search) {
            $query->whereHas('user', function ($u) use ($search) {
                $u->where('name', 'like', "%{$search}%")
                    ->orWhere('nomor_induk', 'like', "%{$search}%");
            });
        }

        return $query->with(['user', 'kamarMembers.activeKamar.kamar']) // Loaded Kamar for reverse lookup
            ->join('users', 'students.user_id', '=', 'users.id')
            ->orderBy('users.name')
            ->select('students.*') // Avoid column collision
            ->limit(20)
            ->get();
    }
}
