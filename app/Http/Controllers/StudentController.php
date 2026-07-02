<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\User;
use App\Models\UserLevel;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\StudentExport;
use App\Exports\StudentTemplateMissingExport;
use App\Exports\StudentUpdateTemplateExport;
use App\Imports\StudentImport;
use App\Imports\StudentUpdateImport;

class StudentController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view_students')->only(['index', 'show']);
        $this->middleware('permission:create_students')->only(['create', 'store']);
        $this->middleware('permission:edit_students')->only(['edit', 'update']);
        $this->middleware('permission:delete_students')->only(['destroy']);
    }

    public function index(Request $request)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();

        $query = Student::with([
            'user',
            'classMembers' => function ($q) use ($activeYear) {
                $q->whereHas('activeClass', function ($sq) use ($activeYear) {
                    $sq->where('academic_year_id', $activeYear->id);
                })->with(['activeClass.kelas', 'activeClass.kelasParalel']);
            },
            'kamarMembers' => function ($q) use ($activeYear) {
                $q->whereHas('activeKamar', function ($sq) use ($activeYear) {
                    $sq->where('academic_year_id', $activeYear->id);
                })->with(['activeKamar.kamar']);
            }
        ]);

        // Filter by Status (Default to 'Aktif')
        $status = $request->input('status', 'Aktif');
        if ($status !== 'Semua') {
            $query->whereHas('user', function ($q) use ($status) {
                $q->where('status', $status);
            });
        }

        if ($request->filled('search')) {
            $searchTerms = explode(' ', trim($request->search));
            $query->where(function ($q) use ($searchTerms) {
                foreach ($searchTerms as $term) {
                    if (trim($term) === '') continue;
                    $q->where(function ($subQ) use ($term) {
                        $subQ->whereHas('user', function ($u) use ($term) {
                            $u->where('name', 'like', '%' . $term . '%')
                              ->orWhereRaw('CAST(nomor_induk AS CHAR) LIKE ?', ['%' . $term . '%']);
                        })->orWhere('nisn', 'like', '%' . $term . '%')
                          ->orWhere('nik', 'like', '%' . $term . '%');
                    });
                }
            });
        }

        // Filter by Origin Region
        if ($request->filled('origin_region') && $request->origin_region !== 'Semua') {
            if ($request->origin_region === 'Belum Diisi') {
                $query->where(function ($q) {
                    $q->whereNull('origin_region')
                        ->orWhere('origin_region', '')
                        ->orWhere('origin_region', '-');
                });
            } else {
                $query->where('origin_region', $request->origin_region);
            }
        }

        // Filter by My Students (Teacher)
        if ($request->has('my_students') && $request->user()->hasRole('Guru')) {
            $userId = $request->user()->id;
            // Get active year
            $activeYearId = \App\Services\AcademicStateService::currentAcademicYear()->id ?? null;

            if ($activeYearId) {
                // Find classes where user teaches
                $myClassIds = \App\Models\ActiveClass::where('academic_year_id', $activeYearId)
                    ->where(function ($q) use ($userId) {
                        $q->where('teacher_id', $userId)
                            ->orWhereHas('activeSubjects', function ($subQ) use ($userId) {
                                $subQ->where('teacher_id', $userId);
                            });
                    })
                    ->pluck('id');

                $query->whereHas('classMembers', function ($q) use ($myClassIds) {
                    $q->whereIn('active_class_id', $myClassIds);
                });
            }
        }

        // Filter by Class
        if ($request->filled('class_id') && $request->class_id !== 'Semua') {
            $query->whereHas('classMembers', function($q) use ($request) {
                $q->where('active_class_id', $request->class_id);
            });
        }

        // Filter by Kamar
        if ($request->filled('kamar_id') && $request->kamar_id !== 'Semua') {
            $query->whereHas('kamarMembers', function($q) use ($request) {
                $q->where('active_kamar_id', $request->kamar_id);
            });
        }

        $students = $query->join('users', 'students.user_id', '=', 'users.id')
                          ->orderBy('users.nomor_induk', 'asc')
                          ->select('students.*')
                          ->paginate(10)->withQueryString();
        $total_count = Student::count();

        // Enhanced Search Stats (Only fetch if mode is search to optimize performance)
        $searchStats = [];
        $isSearchMode = $request->input('mode') === 'search';

        if ($isSearchMode && $activeYear) {
            // 1. Dorms Summary
            $searchStats['dorms_summary'] = \App\Models\ActiveKamar::where('academic_year_id', $activeYear->id)
                ->with(['kamar', 'musrif'])
                ->withCount('members')
                ->get()
                ->sortBy('kamar.name')
                ->values();

            // 2. Classes Summary
            $searchStats['classes_summary'] = \App\Models\ActiveClass::where('academic_year_id', $activeYear->id)
                ->with(['kelas', 'kelasParalel', 'teacher'])
                ->withCount('classMembers')
                ->get()
                ->sortBy(function ($q) {
                    return $q->kelas->level . $q->kelas->name . ($q->kelasParalel->name ?? '');
                })
                ->values();
        }

        $classes = [];
        $kamars = [];
        if ($activeYear) {
            $classes = \App\Models\ActiveClass::where('academic_year_id', $activeYear->id)
                ->with(['kelas', 'kelasParalel'])
                ->get()
                ->sortBy(function ($q) {
                    return $q->kelas->level . $q->kelas->name . ($q->kelasParalel->name ?? '');
                })
                ->values();

            $kamars = \App\Models\ActiveKamar::where('academic_year_id', $activeYear->id)
                ->with('kamar')
                ->get()
                ->sortBy('kamar.name')
                ->values();
        }

        return Inertia::render('Students/Index', [
            'students' => $students,
            'total_count' => $total_count,
            'filters' => array_merge($request->only(['search', 'origin_region', 'class_id', 'kamar_id']), ['status' => $status]),
            'mode' => $request->input('mode', 'management'), // Default to 'management' if not set
            'searchStats' => $isSearchMode ? $searchStats : null,
            'classes' => $classes,
            'kamars' => $kamars,
        ]);
    }

    public function showGroupMembers(Request $request, $type, $id)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();

        if (!$activeYear) {
            return response()->json(['error' => 'No active academic year'], 404);
        }

        $members = [];

        if ($type === 'kamar') {
            $activeKamar = \App\Models\ActiveKamar::with(['kamar', 'musrif'])->find($id);
            if ($activeKamar) {
                $query = \App\Models\KamarMember::where('active_kamar_id', $id)
                    ->with(['student.user'])
                    ->get();

                $members = $query->map(function ($member) {
                    return [
                        'id' => $member->student_id,
                        'name' => $member->student?->user?->name ?? 'User Terhapus',
                        'nomor_induk' => $member->student?->user?->nomor_induk ?? '-',
                        'nisn' => $member->student?->nisn ?? '-',
                        'status' => $member->student?->user?->status ?? 'Tidak Diketahui'
                    ];
                });

                return response()->json([
                    'title' => 'Anggota Kamar ' . ($activeKamar->kamar?->name ?? 'Tanpa Nama'),
                    'subtitle' => 'Musrif: ' . ($activeKamar->musrif?->name ?? '-'),
                    'members' => $members
                ]);
            }
        } elseif ($type === 'kelas') {
            $activeClass = \App\Models\ActiveClass::with(['kelas', 'kelasParalel', 'teacher'])->find($id);
            if ($activeClass) {
                $query = \App\Models\ClassMember::where('active_class_id', $id)
                    ->with(['student.user'])
                    ->get();

                $members = $query->map(function ($member) {
                    return [
                        'id' => $member->student_id,
                        'name' => $member->student?->user?->name ?? 'User Terhapus',
                        'nomor_induk' => $member->student?->user?->nomor_induk ?? '-',
                        'nisn' => $member->student?->nisn ?? '-',
                        'status' => $member->student?->user?->status ?? 'Tidak Diketahui'
                    ];
                });

                return response()->json([
                    'title' => 'Siswa Kelas ' . trim(($activeClass->kelas?->name ?? 'Kelas Tidak Ditemukan') . ' ' . ($activeClass->kelasParalel?->name ?? '')),
                    'subtitle' => 'Wali Kelas: ' . ($activeClass->teacher?->name ?? '-'),
                    'members' => $members
                ]);
            }
        }

        return response()->json(['error' => 'Not found'], 404);
    }

    public function create(Request $request)
    {
        $existingUser = null;
        if ($request->has('user_id')) {
            $existingUser = User::find($request->user_id);
            // Ensure no student profile exists for this user
            if ($existingUser && $existingUser->student) {
                return redirect()->route('students.edit', $existingUser->student->id)
                    ->with('message', 'User ini sudah memiliki data biodata.');
            }
        }

        return Inertia::render('Students/Create', [
            'existingUser' => $existingUser,
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            // User Data
            'name' => 'required|string|max:255',
            'nama_arab' => 'required|string|max:255', // Added
            'nomor_induk' => 'required|numeric', // Check uniqueness only if new user
            'email' => $request->has('user_id') ? 'nullable' : 'nullable|email|unique:users',
            'password' => $request->has('user_id') ? 'nullable' : 'nullable|string|min:8',

            // Student Data
            'nisn' => 'nullable|numeric|unique:students',
            'nik' => 'nullable|numeric|unique:students',
            'gender' => 'required|in:L,P',
            'birth_place' => 'required|string',
            'birth_place_ar' => 'nullable|string', // Added
            'birth_date' => 'required|date',
            'address' => 'nullable|string', // Main address field, can be optional if details are filled
            'origin_region' => 'nullable|string',
            'province' => 'nullable|string',
            'city' => 'nullable|string',
            'district' => 'nullable|string',
            'village' => 'nullable|string',
            'postal_code' => 'nullable|string',
            'address_details' => 'nullable|string',

            // Dapodik Fields
            'religion' => 'nullable|string',
            'citizenship' => 'nullable|string',
            'child_order' => 'nullable',
            'siblings_count' => 'nullable',
            'living_with' => 'nullable|string',
            'financial_sponsor' => 'nullable|string',
            'height' => 'nullable',
            'weight' => 'nullable',
            'blood_type' => 'nullable|string',

            // Parents & Guardian
            'parent_name' => 'required|string',
            'parent_phone' => 'nullable|string',

            'father_name' => 'nullable|string',
            'father_nik' => 'nullable|string',
            'father_birth_year' => 'nullable',
            'father_education' => 'nullable|string',
            'father_occupation' => 'nullable|string',
            'father_income' => 'nullable|string',

            'mother_name' => 'nullable|string',
            'mother_nik' => 'nullable|string',
            'mother_birth_year' => 'nullable',
            'mother_education' => 'nullable|string',
            'mother_occupation' => 'nullable|string',
            'mother_income' => 'nullable|string',

            'guardian_name' => 'nullable|string',
            'guardian_nik' => 'nullable|string',
            'guardian_birth_year' => 'nullable',
            'guardian_education' => 'nullable|string',
            'guardian_occupation' => 'nullable|string',
            'guardian_income' => 'nullable|string',
            'guardian_address' => 'nullable|string',
        ];

        if (!$request->has('user_id')) {
            $rules['nomor_induk'] = 'required|numeric|unique:users';
        }

        $request->validate($rules);

        // Find or Create 'Santri' User Level
        $studentLevel = UserLevel::firstOrCreate(['name' => 'Santri'], ['category' => 'Santri']);

        DB::beginTransaction();
        try {
            if ($request->has('user_id')) {
                // Link to existing user
                $user = User::findOrFail($request->user_id);
                // Also update User if data provided? Maybe not needed for existing user link, but let's assume we might want to update nama_arab if blank?
                // For now, let's keep it simple: if existing user, we don't overwrite Name/Nama Arab unless we want to.
                // But in Create form, fields might be read-only if existingUser. 
                // Wait, Create.jsx logic: name/nomor_induk are readOnly if existingUser. 
                // nama_arab is NEW field, so it might be editable even if existingUser?
                // Create.jsx: name/nomor_induk readOnly=!!existingUser. 
                // nama_arab should also be readOnly=!!existingUser? 
                // If existing user doesn't have nama_arab, we might want to fill it. 
                // But for now, let's just use what's passed if we created a new user.
            } else {
                // Create User first
                $user = User::create([
                    'name' => $request->name,
                    'nama_arab' => $request->nama_arab, // Added
                    'nomor_induk' => $request->nomor_induk,
                    'email' => $request->email,
                    'password' => Hash::make($request->password ?? $request->nomor_induk),
                    'user_level_id' => \App\Models\UserLevel::where('name', 'Santri')->value('id') ?? $studentLevel->id,
                ]);
            }

            // Create Student Profile
            Student::create([
                'user_id' => $user->id,
                'nisn' => $request->nisn,
                'nik' => $request->nik,
                'gender' => $request->gender,
                'birth_place' => $request->birth_place,
                'birth_place_ar' => $request->birth_place_ar, // Added
                'birth_date' => $request->birth_date,
                'address' => $request->address ?? '-',
                'origin_region' => $request->origin_region,
                'province' => $request->province,
                'city' => $request->city,
                'district' => $request->district,
                'village' => $request->village,
                'postal_code' => $request->postal_code,
                'address_details' => $request->address_details,
                'parent_name' => $request->parent_name,
                'parent_phone' => $request->parent_phone,

                // New Fields
                'religion' => $request->religion ?? 'Islam',
                'citizenship' => $request->citizenship ?? 'WNI',
                'child_order' => $request->child_order === '' ? null : $request->child_order,
                'siblings_count' => $request->siblings_count === '' ? null : $request->siblings_count,
                'living_with' => $request->living_with,
                'financial_sponsor' => $request->financial_sponsor,
                'height' => $request->height === '' ? null : $request->height,
                'weight' => $request->weight === '' ? null : $request->weight,
                'blood_type' => $request->blood_type,

                'father_name' => $request->father_name,
                'father_nik' => $request->father_nik,
                'father_birth_year' => $request->father_birth_year === '' ? null : $request->father_birth_year,
                'father_education' => $request->father_education,
                'father_occupation' => $request->father_occupation,
                'father_income' => $request->father_income,

                'mother_name' => $request->mother_name,
                'mother_nik' => $request->mother_nik,
                'mother_birth_year' => $request->mother_birth_year === '' ? null : $request->mother_birth_year,
                'mother_education' => $request->mother_education,
                'mother_occupation' => $request->mother_occupation,
                'mother_income' => $request->mother_income,

                'guardian_name' => $request->guardian_name,
                'guardian_nik' => $request->guardian_nik,
                'guardian_birth_year' => $request->guardian_birth_year === '' ? null : $request->guardian_birth_year,
                'guardian_education' => $request->guardian_education,
                'guardian_occupation' => $request->guardian_occupation,
                'guardian_income' => $request->guardian_income,
                'guardian_address' => $request->guardian_address,
            ]);

            DB::commit();

            return redirect()->route('students.index')->with('success', 'Data Siswa berhasil ditambahkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error creating student: ' . $e->getMessage());
        }
    }


    public function show(Student $student)
    {
        return Inertia::render('Students/Show', [
            'student' => $student->load([
                'user',
                'classMembers.activeClass.kelas',
                'classMembers.activeClass.kelasParalel',
                'kamarMembers.activeKamar.kamar'
            ]),
        ]);
    }

    public function myProfile()
    {
        $student = Student::where('user_id', auth()->id())->firstOrFail();
        return redirect()->route('students.show', $student->id);
    }

    public function edit(Student $student)
    {
        return Inertia::render('Students/Edit', [
            'student' => $student->load([
                'user',
                'classMembers.activeClass.kelas',
                'classMembers.activeClass.kelasParalel',
                'kamarMembers.activeKamar.kamar'
            ]),
        ]);
    }

    public function update(Request $request, Student $student)
    {
        $request->validate([
            // User Data
            'name' => 'required|string|max:255',
            'nomor_induk' => ['required', 'numeric', Rule::unique('users')->ignore($student->user_id)],
            'email' => ['nullable', 'email', Rule::unique('users')->ignore($student->user_id)],

            // Student Data
            'nisn' => ['nullable', 'numeric', Rule::unique('students')->ignore($student->id)],
            'nik' => ['nullable', 'numeric', Rule::unique('students')->ignore($student->id)],
            'gender' => 'required|in:L,P',
            'birth_place' => 'required|string',
            'birth_place_ar' => 'nullable|string', // Added Field
            'birth_date' => 'required|date',
            'address' => 'nullable|string',
            'origin_region' => 'nullable|string',
            'province' => 'nullable|string',
            'city' => 'nullable|string',
            'district' => 'nullable|string',
            'village' => 'nullable|string',
            'postal_code' => 'nullable|string',
            'address_details' => 'nullable|string',

            // Dapodik Fields
            'religion' => 'nullable|string',
            'citizenship' => 'nullable|string',
            'child_order' => 'nullable',
            'siblings_count' => 'nullable',
            'living_with' => 'nullable|string',
            'financial_sponsor' => 'nullable|string',
            'height' => 'nullable',
            'weight' => 'nullable',
            'blood_type' => 'nullable|string',

            // Parents & Guardian
            'parent_name' => 'nullable|string', // Used as generic parent name if needed
            'parent_phone' => 'nullable|string',

            'father_name' => 'nullable|string',
            'father_nik' => 'nullable|string',
            'father_birth_year' => 'nullable',
            'father_education' => 'nullable|string',
            'father_occupation' => 'nullable|string',
            'father_income' => 'nullable|string',

            'mother_name' => 'nullable|string',
            'mother_nik' => 'nullable|string',
            'mother_birth_year' => 'nullable',
            'mother_education' => 'nullable|string',
            'mother_occupation' => 'nullable|string',
            'mother_income' => 'nullable|string',

            'guardian_name' => 'nullable|string',
            'guardian_nik' => 'nullable|string',
            'guardian_birth_year' => 'nullable',
            'guardian_education' => 'nullable|string',
            'guardian_occupation' => 'nullable|string',
            'guardian_income' => 'nullable|string',
            'guardian_address' => 'nullable|string',
        ]);

        // Update User
        $student->user->update([
            'name' => $request->name,
            'nama_arab' => $request->nama_arab, // Added
            'nomor_induk' => $request->nomor_induk,
            'email' => $request->email,
        ]);

        if ($request->filled('password')) {
            $student->user->update([
                'password' => Hash::make($request->password),
            ]);
        }

        // Update Student
        $student->update([
            'nisn' => $request->nisn,
            'nik' => $request->nik,
            'gender' => $request->gender,
            'birth_place' => $request->birth_place,
            'birth_place_ar' => $request->birth_place_ar, // Added Field
            'birth_date' => $request->birth_date,
            'address' => $request->address ?? '-',
            'origin_region' => $request->origin_region,
            'province' => $request->province,
            'city' => $request->city,
            'district' => $request->district,
            'village' => $request->village,
            'postal_code' => $request->postal_code,
            'address_details' => $request->address_details,
            'parent_name' => $request->parent_name ?: ($request->father_name ?: ($request->mother_name ?: ($request->guardian_name ?: '-'))),
            'parent_phone' => $request->parent_phone,

            // New Fields
            'religion' => $request->religion ?? 'Islam',
            'citizenship' => $request->citizenship ?? 'WNI',
            'child_order' => $request->child_order === '' ? null : $request->child_order,
            'siblings_count' => $request->siblings_count === '' ? null : $request->siblings_count,
            'living_with' => $request->living_with,
            'financial_sponsor' => $request->financial_sponsor,
            'height' => $request->height === '' ? null : $request->height,
            'weight' => $request->weight === '' ? null : $request->weight,
            'blood_type' => $request->blood_type,

            'father_name' => $request->father_name,
            'father_nik' => $request->father_nik,
            'father_birth_year' => $request->father_birth_year === '' ? null : $request->father_birth_year,
            'father_education' => $request->father_education,
            'father_occupation' => $request->father_occupation,
            'father_income' => $request->father_income,

            'mother_name' => $request->mother_name,
            'mother_nik' => $request->mother_nik,
            'mother_birth_year' => $request->mother_birth_year === '' ? null : $request->mother_birth_year,
            'mother_education' => $request->mother_education,
            'mother_occupation' => $request->mother_occupation,
            'mother_income' => $request->mother_income,

            'guardian_name' => $request->guardian_name,
            'guardian_nik' => $request->guardian_nik,
            'guardian_birth_year' => $request->guardian_birth_year === '' ? null : $request->guardian_birth_year,
            'guardian_education' => $request->guardian_education,
            'guardian_occupation' => $request->guardian_occupation,
            'guardian_income' => $request->guardian_income,
            'guardian_address' => $request->guardian_address,
        ]);

        return redirect()->route('students.show', $student->id)->with('success', 'Data Siswa berhasil diperbarui.');
    }

    public function destroy(Student $student)
    {
        // Deleting the user will cascade delete the student profile due to foreign key constraint
        $student->user->delete();
        return back()->with('success', 'Data Siswa berhasil dihapus.');
    }

    public function graduation(Request $request)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        
        $classes = [];
        $students = [];

        if ($activeYear) {
            // Get all active classes
            $classes = \App\Models\ActiveClass::where('academic_year_id', $activeYear->id)
                ->with(['kelas', 'kelasParalel'])
                ->get()
                ->sortBy(function ($q) {
                    return $q->kelas->name . ($q->kelasParalel->name ?? '');
                })
                ->values();

            if ($request->filled('class_id')) {
                // Get active students in this class
                $students = Student::whereHas('classMembers', function($q) use ($request) {
                    $q->where('active_class_id', $request->class_id);
                })
                ->whereHas('user', function($q) {
                    $q->where('status', 'Aktif');
                })
                ->with(['user', 'classMembers' => function($q) use ($activeYear) {
                    $q->whereHas('activeClass', function($sq) use ($activeYear) {
                        $sq->where('academic_year_id', $activeYear->id);
                    })->with(['activeClass.kelas', 'activeClass.kelasParalel']);
                }])
                ->get()
                ->sortBy('user.name')
                ->values();
            }
        }

        return Inertia::render('Students/Graduation', [
            'classes' => $classes,
            'students' => $students,
            'filters' => $request->only(['class_id']),
        ]);
    }

    public function processGraduation(Request $request)
    {
        $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'graduation_date' => 'required|date',
            'note' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $students = Student::whereIn('id', $request->student_ids)->with('user')->get();
            $count = 0;

            foreach ($students as $student) {
                if ($student->user && $student->user->status === 'Aktif') {
                    $student->user->update([
                        'status' => 'Tidak Aktif',
                        'inactive_reason' => 'Lulus',
                        'inactive_date' => $request->graduation_date,
                        'inactive_note' => $request->note,
                    ]);
                    $count++;
                }
            }

            DB::commit();
            return back()->with('success', "Berhasil meluluskan {$count} santri.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal memproses kelulusan: ' . $e->getMessage());
        }
    }

    public function export(Request $request)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();

        $query = Student::with('user');

        // Filter by Status (Default to 'Aktif')
        $status = $request->input('status', 'Aktif');
        if ($status !== 'Semua') {
            $query->whereHas('user', function ($q) use ($status) {
                $q->where('status', $status);
            });
        }

        if ($request->filled('search')) {
            $searchTerms = explode(' ', trim($request->search));
            $query->where(function ($q) use ($searchTerms) {
                foreach ($searchTerms as $term) {
                    if (trim($term) === '') continue;
                    $q->where(function ($subQ) use ($term) {
                        $subQ->whereHas('user', function ($u) use ($term) {
                            $u->where('name', 'like', '%' . $term . '%')
                              ->orWhereRaw('CAST(nomor_induk AS CHAR) LIKE ?', ['%' . $term . '%']);
                        })->orWhere('nisn', 'like', '%' . $term . '%')
                          ->orWhere('nik', 'like', '%' . $term . '%');
                    });
                }
            });
        }

        // Filter by Origin Region
        if ($request->filled('origin_region') && $request->origin_region !== 'Semua') {
            if ($request->origin_region === 'Belum Diisi') {
                $query->where(function ($q) {
                    $q->whereNull('origin_region')
                        ->orWhere('origin_region', '')
                        ->orWhere('origin_region', '-');
                });
            } else {
                $query->where('origin_region', $request->origin_region);
            }
        }

        // Filter by My Students (Teacher)
        if ($request->has('my_students') && $request->user() && $request->user()->hasRole('Guru')) {
            $userId = $request->user()->id;
            $activeYearId = $activeYear->id ?? null;

            if ($activeYearId) {
                $myClassIds = \App\Models\ActiveClass::where('academic_year_id', $activeYearId)
                    ->where(function ($q) use ($userId) {
                        $q->where('teacher_id', $userId)
                            ->orWhereHas('activeSubjects', function ($subQ) use ($userId) {
                                $subQ->where('teacher_id', $userId);
                            });
                    })
                    ->pluck('id');

                $query->whereHas('classMembers', function ($q) use ($myClassIds) {
                    $q->whereIn('active_class_id', $myClassIds);
                });
            }
        }

        // Filter by Class
        if ($request->filled('class_id') && $request->class_id !== 'Semua') {
            $query->whereHas('classMembers', function($q) use ($request) {
                $q->where('active_class_id', $request->class_id);
            });
        }

        // Filter by Kamar
        if ($request->filled('kamar_id') && $request->kamar_id !== 'Semua') {
            $query->whereHas('kamarMembers', function($q) use ($request) {
                $q->where('active_kamar_id', $request->kamar_id);
            });
        }

        $students = $query->join('users', 'students.user_id', '=', 'users.id')
                          ->orderBy('users.nomor_induk', 'asc')
                          ->select('students.*')
                          ->get();

        $fileName = 'students_export_' . date('Y-m-d_H-i-s') . '.xlsx';
        return Excel::download(new StudentExport($students), $fileName);
    }

    public function exportTemplateMissingBiodata()
    {
        // Find users with 'Siswa' role (or similar) who do NOT have a student profile AND are Active
        $users = User::whereHas('userLevel', function ($query) {
            $query->whereIn('name', ['Siswa', 'Siswa Khusus', 'Siswa Dengan Catatan']);
        })
            ->where('status', 'Aktif')
            ->whereDoesntHave('student')
            ->get();

        $fileName = 'template_biodata_missing_' . date('Y-m-d_H-i-s') . '.xlsx';
        return Excel::download(new StudentTemplateMissingExport($users), $fileName);
    }

    public function import()
    {
        return Inertia::render('Students/Import');
    }

    public function processImport(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,txt|max:5120',
        ]);

        @set_time_limit(600);
        @ini_set('max_execution_time', 600);

        $import = new StudentImport();
        
        try {
            Excel::import($import, $request->file('file'));
        } catch (\Exception $e) {
            return redirect()->route('users.index')->with('error', 'Gagal membaca file Excel. Pastikan format sesuai template. Error: ' . $e->getMessage());
        }

        $successCount = $import->successCount;
        $errors = $import->errors;
        $message = "Import selesai. $successCount data berhasil ditambahkan.";
        if (count($errors) > 0) {
            $message .= " " . count($errors) . " data gagal.";
            return redirect()->route('users.index')->with('warning', $message)->with('errors_import', $errors);
        }

        return redirect()->route('users.index')->with('success', $message);
    }

    /**
     * Export template CSV berisi data santri yang sudah ada (untuk update massal)
     */
    public function exportUpdateTemplate(Request $request)
    {
        $students = Student::with('user')
            ->whereHas('user', fn($q) => $q->where('status', 'Aktif'))
            ->get();

        $fileName = 'template_update_biodata_' . date('Y-m-d_H-i-s') . '.xlsx';
        return Excel::download(new StudentUpdateTemplateExport($students), $fileName);
    }

    /**
     * Update biodata massal via CSV
     * Kolom [0] = NIS sebagai KEY pencarian
     */
    public function processImportUpdate(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,txt|max:5120',
        ]);

        @set_time_limit(600);
        @ini_set('max_execution_time', 600);

        $import = new StudentUpdateImport();

        try {
            Excel::import($import, $request->file('file'));
        } catch (\Exception $e) {
            return redirect()->route('students.import')
                ->with('error', 'Gagal membaca file Excel. Pastikan format sesuai template. Error: ' . $e->getMessage());
        }

        $successCount = $import->successCount;
        $skippedCount = $import->skippedCount;
        $errors = $import->errors;

        $message = "Update selesai. {$successCount} biodata berhasil diperbarui.";
        if ($skippedCount > 0) {
            $message .= " {$skippedCount} baris dilewati.";
        }

        if (!empty($errors)) {
            return redirect()->route('students.import')
                ->with('warning', $message)
                ->with('errors_import', $errors);
        }

        return redirect()->route('students.import')->with('success', $message);
    }
}
