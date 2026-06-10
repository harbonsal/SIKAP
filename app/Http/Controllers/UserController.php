<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // dd('SYSTEM CHECK: BACKEND IS CONNECTED');

        $query = User::query()->with(['userLevel', 'additionalLevels']);

        if ($request->filled('search')) {
            $searchTerms = explode(' ', trim($request->search));
            $query->where(function ($q) use ($searchTerms) {
                foreach ($searchTerms as $term) {
                    if (trim($term) === '') continue;
                    $q->where(function ($subQ) use ($term) {
                        $subQ->where('name', 'like', '%' . $term . '%')
                             ->orWhere('email', 'like', '%' . $term . '%')
                             ->orWhereRaw('CAST(nomor_induk AS CHAR) LIKE ?', ['%' . $term . '%']);
                    });
                }
            });
        }

        if ($request->has('user_level_id') && $request->user_level_id) {
            $query->where('user_level_id', $request->user_level_id);
        }

        $status = $request->input('status', 'Aktif');
        if ($status !== 'Semua') {
            $query->where('status', $status);
        }

        if ($request->has('category') && $request->category) {
            if ($request->category === 'Siswa') {
                $query->whereHas('userLevel', function ($q) {
                    // Start of Selection
                    $q->whereIn('name', ['Siswa', 'Santri', 'Siswa Khusus', 'Siswa Dengan Catatan']);
                    // End of Selection
                });
            } elseif ($request->category === 'Askar') {
                $query->whereHas('userLevel', function ($q) {
                    // Start of Selection
                    $q->whereNotIn('name', ['Siswa', 'Santri', 'Siswa Khusus', 'Siswa Dengan Catatan']);
                    // End of Selection
                });
            }
        }

        if ($request->has('biodata_status') && $request->biodata_status) {
            if ($request->biodata_status === 'completed') {
                $query->whereHas('student');
            } elseif ($request->biodata_status === 'incomplete') {
                $query->whereDoesntHave('student');
            }
        }

        $users = $query->orderBy('nomor_induk', 'asc')->paginate(20)->withQueryString();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'total_count' => User::count(),
            'filters' => array_merge($request->only(['search', 'user_level_id', 'category', 'biodata_status']), ['status' => $status]),
            'userLevels' => \App\Models\UserLevel::all(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Users/Create', [
            'userLevels' => \App\Models\UserLevel::all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'nomor_induk' => 'required|regex:/^[0-9]+$/|max:255|unique:users',
            'nama_arab' => 'nullable|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            'user_level_id' => 'nullable|exists:user_levels,id',
            'additional_levels' => 'nullable|array',
            'additional_levels.*' => 'exists:user_levels,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'nomor_induk' => $request->nomor_induk,
            'nama_arab' => $request->nama_arab,
            'no_hp' => $request->no_hp,
            'user_level_id' => $request->user_level_id,
        ]);

        if ($request->has('additional_levels')) {
            $user->additionalLevels()->sync($request->additional_levels);
        }

        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, User $user)
    {
        return Inertia::render('Users/Edit', [
            'user' => $user->load(['student', 'additionalLevels']),
            'has_student_profile' => \App\Models\Student::where('user_id', $user->id)->exists(),
            'userLevels' => \App\Models\UserLevel::all(),
            'filters' => $request->all(), // Pass all query params (filters, page)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
            'nomor_induk' => 'required|regex:/^[0-9]+$/|max:255|unique:users,nomor_induk,' . $user->id,
            'nama_arab' => 'nullable|string|max:255',
            'no_hp' => 'nullable|string|max:20',
            'user_level_id' => 'nullable|exists:user_levels,id',
            'status' => 'required|in:Aktif,Tidak Aktif',
            'inactive_date' => 'nullable|required_if:status,Tidak Aktif|date',
            'inactive_reason' => 'nullable|required_if:status,Tidak Aktif|string|max:255',
            'inactive_note' => 'nullable|string',
            'additional_levels' => 'nullable|array',
            'additional_levels.*' => 'exists:user_levels,id',
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->nomor_induk = $request->nomor_induk;
        $user->nama_arab = $request->nama_arab;
        $user->no_hp = $request->no_hp;
        $user->user_level_id = $request->user_level_id;
        $user->status = $request->status;
        $user->inactive_date = $request->status === 'Tidak Aktif' ? $request->inactive_date : null;
        $user->inactive_reason = $request->status === 'Tidak Aktif' ? $request->inactive_reason : null;
        $user->inactive_note = $request->status === 'Tidak Aktif' ? $request->inactive_note : null;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        // CRM / SIKAP LOGIC: Cleanup Student Memberships if set to 'Tidak Aktif'
        if ($request->status === 'Tidak Aktif' && $user->student) {
            $this->cleanupStudentMemberships($user->student);
        }

        if ($request->has('additional_levels')) {
            $user->additionalLevels()->sync($request->additional_levels);
        }

        // Redirect back to index with preserved query parameters (filters, page)
        // Explicitly exclude fields that were part of the form submission but keep query params
        $queryParams = $request->query();

        return redirect()->route('users.index', $queryParams)->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        // Cleanup first before deleting
        if ($user->student) {
            $this->cleanupStudentMemberships($user->student);
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }

    /**
     * Private helper to remove student from active lists (Class, Kamar, Halaqoh).
     * Safe to call multiple times (idempotent).
     */
    private function cleanupStudentMemberships($student)
    {
        // 1. Remove from Active Classes
        \App\Models\ClassMember::where('student_id', $student->id)->delete();

        // 2. Remove from Active Dorms (Kamar)
        \App\Models\KamarMember::where('student_id', $student->id)->delete();

        // 3. Remove from Tahfidz Halaqoh
        \App\Models\TahfidzHalaqohMember::where('student_id', $student->id)->delete();
    }
    /**
     * Remove multiple resources from storage.
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id',
        ]);

        $users = User::with('student')->whereIn('id', $request->ids)->get();
        $count = 0;

        foreach ($users as $user) {
            if ($user->student) {
                $this->cleanupStudentMemberships($user->student);
            }
            $user->delete();
            $count++;
        }

        return back()->with('success', "Berhasil menghapus $count user.");
    }

    /**
     * Impersonate a user.
     */
    public function impersonate(User $user)
    {
        // Security Check: Only Administrator can impersonate
        $currentUser = auth()->user();

        // Ensure relation is loaded if not already
        if (!$currentUser->relationLoaded('userLevel')) {
            $currentUser->load('userLevel');
        }

        // Check: ID 1 OR Role Name 'Administrator'
        $isAdministrator = $currentUser->user_level_id === 1 ||
            ($currentUser->userLevel && $currentUser->userLevel->name === 'Administrator');

        if (!$isAdministrator) {
            abort(403, 'Hanya Administrator yang dapat menggunakan fitur ini.');
        }

        // Prevent impersonating yourself
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Anda sudah login sebagai akun ini.');
        }

        Auth::login($user);

        return redirect()->route('dashboard')->with('success', "Berhasil login sebagai {$user->name}.");
    }
}
