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
            'child_order' => 'nullable|integer',
            'siblings_count' => 'nullable|integer',
            'living_with' => 'nullable|string',
            'financial_sponsor' => 'nullable|string',
            'height' => 'nullable|integer',
            'weight' => 'nullable|integer',
            'blood_type' => 'nullable|string',

            // Parents & Guardian
            'parent_name' => 'required|string',
            'parent_phone' => 'nullable|string',

            'father_name' => 'nullable|string',
            'father_nik' => 'nullable|string',
            'father_birth_year' => 'nullable|integer',
            'father_education' => 'nullable|string',
            'father_occupation' => 'nullable|string',
            'father_income' => 'nullable|string',

            'mother_name' => 'nullable|string',
            'mother_nik' => 'nullable|string',
            'mother_birth_year' => 'nullable|integer',
            'mother_education' => 'nullable|string',
            'mother_occupation' => 'nullable|string',
            'mother_income' => 'nullable|string',

            'guardian_name' => 'nullable|string',
            'guardian_nik' => 'nullable|string',
            'guardian_birth_year' => 'nullable|integer',
            'guardian_education' => 'nullable|string',
            'guardian_occupation' => 'nullable|string',
            'guardian_income' => 'nullable|string',
            'guardian_address' => 'nullable|string',
        ];

        if (!$request->has('user_id')) {
            $rules['nomor_induk'] = 'required|numeric|unique:users';
        }

        $request->validate($rules);

        // Find or Create 'Siswa' User Level
        $studentLevel = UserLevel::firstOrCreate(['name' => 'Siswa']);

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
                'child_order' => $request->child_order,
                'siblings_count' => $request->siblings_count,
                'living_with' => $request->living_with,
                'financial_sponsor' => $request->financial_sponsor,
                'height' => $request->height,
                'weight' => $request->weight,
                'blood_type' => $request->blood_type,

                'father_name' => $request->father_name,
                'father_nik' => $request->father_nik,
                'father_birth_year' => $request->father_birth_year,
                'father_education' => $request->father_education,
                'father_occupation' => $request->father_occupation,
                'father_income' => $request->father_income,

                'mother_name' => $request->mother_name,
                'mother_nik' => $request->mother_nik,
                'mother_birth_year' => $request->mother_birth_year,
                'mother_education' => $request->mother_education,
                'mother_occupation' => $request->mother_occupation,
                'mother_income' => $request->mother_income,

                'guardian_name' => $request->guardian_name,
                'guardian_nik' => $request->guardian_nik,
                'guardian_birth_year' => $request->guardian_birth_year,
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
            'child_order' => 'nullable|integer',
            'siblings_count' => 'nullable|integer',
            'living_with' => 'nullable|string',
            'financial_sponsor' => 'nullable|string',
            'height' => 'nullable|integer',
            'weight' => 'nullable|integer',
            'blood_type' => 'nullable|string',

            // Parents & Guardian
            'parent_name' => 'required|string', // Used as generic parent name if needed
            'parent_phone' => 'nullable|string',

            'father_name' => 'nullable|string',
            'father_nik' => 'nullable|string',
            'father_birth_year' => 'nullable|integer',
            'father_education' => 'nullable|string',
            'father_occupation' => 'nullable|string',
            'father_income' => 'nullable|string',

            'mother_name' => 'nullable|string',
            'mother_nik' => 'nullable|string',
            'mother_birth_year' => 'nullable|integer',
            'mother_education' => 'nullable|string',
            'mother_occupation' => 'nullable|string',
            'mother_income' => 'nullable|string',

            'guardian_name' => 'nullable|string',
            'guardian_nik' => 'nullable|string',
            'guardian_birth_year' => 'nullable|integer',
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
            'parent_name' => $request->parent_name,
            'parent_phone' => $request->parent_phone,

            // New Fields
            'religion' => $request->religion ?? 'Islam',
            'citizenship' => $request->citizenship ?? 'WNI',
            'child_order' => $request->child_order,
            'siblings_count' => $request->siblings_count,
            'living_with' => $request->living_with,
            'financial_sponsor' => $request->financial_sponsor,
            'height' => $request->height,
            'weight' => $request->weight,
            'blood_type' => $request->blood_type,

            'father_name' => $request->father_name,
            'father_nik' => $request->father_nik,
            'father_birth_year' => $request->father_birth_year,
            'father_education' => $request->father_education,
            'father_occupation' => $request->father_occupation,
            'father_income' => $request->father_income,

            'mother_name' => $request->mother_name,
            'mother_nik' => $request->mother_nik,
            'mother_birth_year' => $request->mother_birth_year,
            'mother_education' => $request->mother_education,
            'mother_occupation' => $request->mother_occupation,
            'mother_income' => $request->mother_income,

            'guardian_name' => $request->guardian_name,
            'guardian_nik' => $request->guardian_nik,
            'guardian_birth_year' => $request->guardian_birth_year,
            'guardian_education' => $request->guardian_education,
            'guardian_occupation' => $request->guardian_occupation,
            'guardian_income' => $request->guardian_income,
            'guardian_address' => $request->guardian_address,
        ]);

        return redirect()->route('students.index', $request->query())->with('success', 'Data Siswa berhasil diperbarui.');
    }

    public function destroy(Student $student)
    {
        // Deleting the user will cascade delete the student profile due to foreign key constraint
        $student->user->delete();
        return back()->with('success', 'Data Siswa berhasil dihapus.');
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

        $csvFileName = 'students_export_' . date('Y-m-d_H-i-s') . '.csv';

        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$csvFileName",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $columns = [
            'Nama',
            'NIS',
            'NISN',
            'NIK',
            'Jenis Kelamin',
            'Tempat Lahir',
            'Tanggal Lahir',
            'Alamat',
            'Provinsi',
            'Kota/Kab',
            'Kecamatan',
            'Kelurahan',
            'Kode Pos',
            'Detail Alamat',
            'Agama',
            'Asal Daerah',
            'Kewarganegaraan',
            'Anak Ke',
            'Jml Saudara',
            'Tinggal Bersama',
            'Penanggung Biaya',
            'Tinggi (cm)',
            'Berat (kg)',
            'Gol. Darah',
            'Nama Ayah',
            'NIK Ayah',
            'Tahun Lahir Ayah',
            'Pendidikan Ayah',
            'Pekerjaan Ayah',
            'Penghasilan Ayah',
            'Nama Ibu',
            'NIK Ibu',
            'Tahun Lahir Ibu',
            'Pendidikan Ibu',
            'Pekerjaan Ibu',
            'Penghasilan Ibu',
            'Nama Wali',
            'NIK Wali',
            'Tahun Lahir Wali',
            'Pendidikan Wali',
            'Pekerjaan Wali',
            'Penghasilan Wali',
            'Alamat Wali'
        ];

        $callback = function () use ($students, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($students as $student) {
                $row = [
                    $student->user->name,
                    $student->user->nomor_induk,
                    $student->nisn,
                    $student->nik,
                    $student->gender,
                    $student->birth_place,
                    $student->birth_date,
                    $student->address,
                    $student->province,
                    $student->city,
                    $student->district,
                    $student->village,
                    $student->postal_code,
                    $student->address_details,
                    $student->religion,
                    $student->origin_region,
                    $student->citizenship,
                    $student->child_order,
                    $student->siblings_count,
                    $student->living_with,
                    $student->financial_sponsor,
                    $student->height,
                    $student->weight,
                    $student->blood_type,
                    $student->father_name,
                    $student->father_nik,
                    $student->father_birth_year,
                    $student->father_education,
                    $student->father_occupation,
                    $student->father_income,
                    $student->mother_name,
                    $student->mother_nik,
                    $student->mother_birth_year,
                    $student->mother_education,
                    $student->mother_occupation,
                    $student->mother_income,
                    $student->guardian_name,
                    $student->guardian_nik,
                    $student->guardian_birth_year,
                    $student->guardian_education,
                    $student->guardian_occupation,
                    $student->guardian_income,
                    $student->guardian_address,
                ];

                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
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

        $csvFileName = 'template_biodata_missing_' . date('Y-m-d_H-i-s') . '.csv';

        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$csvFileName",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $columns = [
            'Nama',
            'NIS',
            'NISN',
            'NIK',
            'Jenis Kelamin',
            'Tempat Lahir',
            'Tanggal Lahir',
            'Alamat',
            'Provinsi',
            'Kota/Kab',
            'Kecamatan',
            'Kelurahan',
            'Kode Pos',
            'Detail Alamat',
            'Agama',
            'Asal Daerah',
            'Kewarganegaraan',
            'Anak Ke',
            'Jml Saudara',
            'Tinggal Bersama',
            'Penanggung Biaya',
            'Tinggi (cm)',
            'Berat (kg)',
            'Gol. Darah',
            'Nama Ayah',
            'NIK Ayah',
            'Tahun Lahir Ayah',
            'Pendidikan Ayah',
            'Pekerjaan Ayah',
            'Penghasilan Ayah',
            'Nama Ibu',
            'NIK Ibu',
            'Tahun Lahir Ibu',
            'Pendidikan Ibu',
            'Pekerjaan Ibu',
            'Penghasilan Ibu',
            'Nama Wali',
            'NIK Wali',
            'Tahun Lahir Wali',
            'Pendidikan Wali',
            'Pekerjaan Wali',
            'Penghasilan Wali',
            'Alamat Wali'
        ];

        $callback = function () use ($users, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($users as $user) {
                // Prepare row with User data (Name, NIS) and empty fields for others
                $row = array_fill(0, count($columns), null);
                $row[0] = $user->name;
                $row[1] = $user->nomor_induk;

                // Set default/placeholder values if needed, otherwise leave null
                // Example: $row[4] = 'L'; // Default Gender

                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function import()
    {
        return Inertia::render('Students/Import');
    }

    public function processImport(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        @set_time_limit(600);
        @ini_set('max_execution_time', 600);

        $file = $request->file('file');
        $path = $file->getRealPath();

        // Find or Create 'Siswa' User Level
        $studentLevel = UserLevel::firstOrCreate(['name' => 'Siswa']);

        $successCount = 0;
        $errors = [];

        if (($handle = fopen($path, 'r')) !== false) {
            // Remove header
            $header = fgetcsv($handle);
            if ($header && isset($header[0])) {
                $header[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $header[0]);
            }

            $index = 0;
            while (($row = fgetcsv($handle)) !== false) {
                $index++;
            // Expected columns: 43 columns matching Export format
            if (count($row) < 43) {
                // Let's be lenient and check minimum required fields (first 8)
                if (count($row) < 8) {
                    $errors[] = "Baris " . ($index + 2) . ": Format kolom tidak sesuai (kurang dari 8 kolom utama).";
                    continue;
                }
            }

            try {
                $name = $row[0];
                $nis = $row[1];
                $nisn = $row[2] ?? null;
                if ($nisn !== null) {
                    $cleanNisn = preg_replace('/[^0-9]/', '', $nisn);
                    if ($cleanNisn === '' || intval($cleanNisn) === 0) {
                        $nisn = null;
                    }
                }
                $nik = $row[3] ?? null;
                if ($nik !== null) {
                    $cleanNik = preg_replace('/[^0-9]/', '', $nik);
                    if ($cleanNik === '' || intval($cleanNik) === 0) {
                        $nik = null;
                    }
                }
                $gender = strtoupper($row[4] ?? 'L');
                $birthPlace = $row[5] ?? '';
                $birthDate = $row[6] ?? null; // YYYY-MM-DD
                if ($birthDate === null || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $birthDate)) {
                    $birthDate = '2010-01-01';
                }
                $address = $row[7] ?? '';

                // Address Details
                $province = $row[8] ?? null;
                $city = $row[9] ?? null;
                $district = $row[10] ?? null;
                $village = $row[11] ?? null;
                $postalCode = $row[12] ?? null;
                $addressDetails = $row[13] ?? null;

                // New Fields
                $religion = $row[14] ?? 'Islam';
                $originRegion = $row[15] ?? 'Jawa';
                $citizenship = $row[16] ?? 'WNI';
                
                $childOrder = isset($row[17]) && preg_replace('/[^0-9]/', '', $row[17]) !== '' ? intval(preg_replace('/[^0-9]/', '', $row[17])) : null;
                $siblingsCount = isset($row[18]) && preg_replace('/[^0-9]/', '', $row[18]) !== '' ? intval(preg_replace('/[^0-9]/', '', $row[18])) : null;
                $livingWith = $row[19] ?? null;
                $financialSponsor = $row[20] ?? null;
                
                $height = isset($row[21]) && preg_replace('/[^0-9]/', '', $row[21]) !== '' ? intval(preg_replace('/[^0-9]/', '', $row[21])) : null;
                $weight = isset($row[22]) && preg_replace('/[^0-9]/', '', $row[22]) !== '' ? intval(preg_replace('/[^0-9]/', '', $row[22])) : null;
                $bloodType = $row[23] ?? null;

                // Parents
                $fatherName = $row[24] ?? null;
                $fatherNik = $row[25] ?? null;
                $fatherBirthYear = isset($row[26]) && preg_replace('/[^0-9]/', '', $row[26]) !== '' ? intval(preg_replace('/[^0-9]/', '', $row[26])) : null;
                $fatherEducation = $row[27] ?? null;
                $fatherOccupation = $row[28] ?? null;
                $fatherIncome = $row[29] ?? null;

                $motherName = $row[30] ?? null;
                $motherNik = $row[31] ?? null;
                $motherBirthYear = isset($row[32]) && preg_replace('/[^0-9]/', '', $row[32]) !== '' ? intval(preg_replace('/[^0-9]/', '', $row[32])) : null;
                $motherEducation = $row[33] ?? null;
                $motherOccupation = $row[34] ?? null;
                $motherIncome = $row[35] ?? null;

                // Guardian
                $guardianName = $row[36] ?? null;
                $guardianNik = $row[37] ?? null;
                $guardianBirthYear = isset($row[38]) && preg_replace('/[^0-9]/', '', $row[38]) !== '' ? intval(preg_replace('/[^0-9]/', '', $row[38])) : null;
                $guardianEducation = $row[39] ?? null;
                $guardianOccupation = $row[40] ?? null;
                $guardianIncome = $row[41] ?? null;
                $guardianAddress = $row[42] ?? null;

                // Generic parent name for display if not set
                $parentName = $fatherName ?: ($motherName ?: ($guardianName ?: '-'));
                $parentPhone = null;

                // Check if User exists
                $existingUser = User::where('nomor_induk', $nis)->first();
                $userId = null;

                if ($existingUser) {
                    if (Student::where('user_id', $existingUser->id)->exists()) {
                        $errors[] = "Baris " . ($index + 2) . ": User $nis sudah memiliki data siswa.";
                        continue;
                    }
                    $userId = $existingUser->id;
                } else {
                    // Create User
                    $user = User::create([
                        'name' => $name,
                        'nomor_induk' => $nis,
                        'email' => null, // Optional in CSV
                        'password' => Hash::make($nis), // Default password = NIS
                        'user_level_id' => $studentLevel->id,
                    ]);
                    $userId = $user->id;
                }

                // Create Student
                Student::create([
                    'user_id' => $userId,
                    'nisn' => $nisn,
                    'nik' => $nik,
                    'gender' => in_array($gender, ['L', 'P']) ? $gender : 'L',
                    'birth_place' => $birthPlace,
                    'birth_date' => $birthDate,
                    'address' => $address,

                    'province' => $province,
                    'city' => $city,
                    'district' => $district,
                    'village' => $village,
                    'postal_code' => $postalCode,
                    'address_details' => $addressDetails,

                    'parent_name' => $parentName,
                    'parent_phone' => $parentPhone,

                    // Dapodik Fields
                    'religion' => $religion,
                    'origin_region' => $originRegion,
                    'citizenship' => $citizenship,
                    'child_order' => $childOrder,
                    'siblings_count' => $siblingsCount,
                    'living_with' => $livingWith,
                    'financial_sponsor' => $financialSponsor,
                    'height' => $height,
                    'weight' => $weight,
                    'blood_type' => $bloodType,

                    'father_name' => $fatherName,
                    'father_nik' => $fatherNik,
                    'father_birth_year' => $fatherBirthYear,
                    'father_education' => $fatherEducation,
                    'father_occupation' => $fatherOccupation,
                    'father_income' => $fatherIncome,

                    'mother_name' => $motherName,
                    'mother_nik' => $motherNik,
                    'mother_birth_year' => $motherBirthYear,
                    'mother_education' => $motherEducation,
                    'mother_occupation' => $motherOccupation,
                    'mother_income' => $motherIncome,

                    'guardian_name' => $guardianName,
                    'guardian_nik' => $guardianNik,
                    'guardian_birth_year' => $guardianBirthYear,
                    'guardian_education' => $guardianEducation,
                    'guardian_occupation' => $guardianOccupation,
                    'guardian_income' => $guardianIncome,
                    'guardian_address' => $guardianAddress,
                ]);

                $successCount++;
            } catch (\Exception $e) {
                $errors[] = "Baris " . ($index + 1) . ": " . $e->getMessage();
            }
        }
        fclose($handle);
    }

        $message = "Import selesai. $successCount data berhasil ditambahkan.";
        if (count($errors) > 0) {
            $message .= " " . count($errors) . " data gagal.";
            return redirect()->route('students.index')->with('warning', $message)->with('errors_import', $errors);
        }

        return redirect()->route('students.index')->with('success', $message);
    }

    /**
     * Export template CSV berisi data santri yang sudah ada (untuk update massal)
     */
    public function exportUpdateTemplate(Request $request)
    {
        $students = Student::with('user')
            ->whereHas('user', fn($q) => $q->where('status', 'Aktif'))
            ->get();

        $csvFileName = 'template_update_biodata_' . date('Y-m-d_H-i-s') . '.csv';
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$csvFileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0",
        ];

        $columns = [
            'NIS',          // [0] KEY - tidak boleh diubah
            'Nama',         // [1]
            'NISN',         // [2]
            'NIK',          // [3]
            'Jenis Kelamin (L/P)', // [4]
            'Tempat Lahir', // [5]
            'Tanggal Lahir (YYYY-MM-DD)', // [6]
            'Agama',        // [7]
            'Asal Daerah',  // [8]
            'Kewarganegaraan', // [9]
            'Anak Ke',      // [10]
            'Jml Saudara',  // [11]
            'Tinggal Bersama', // [12]
            'Penanggung Biaya', // [13]
            'Tinggi (cm)',  // [14]
            'Berat (kg)',   // [15]
            'Gol Darah',    // [16]
            'Provinsi',     // [17]
            'Kota/Kab',     // [18]
            'Kecamatan',    // [19]
            'Kelurahan',    // [20]
            'Kode Pos',     // [21]
            'Detail Alamat', // [22]
            'Nama Ayah',    // [23]
            'NIK Ayah',     // [24]
            'Thn Lahir Ayah', // [25]
            'Pendidikan Ayah', // [26]
            'Pekerjaan Ayah', // [27]
            'Penghasilan Ayah', // [28]
            'Nama Ibu',     // [29]
            'NIK Ibu',      // [30]
            'Thn Lahir Ibu', // [31]
            'Pendidikan Ibu', // [32]
            'Pekerjaan Ibu', // [33]
            'Penghasilan Ibu', // [34]
            'Nama Wali',    // [35]
            'NIK Wali',     // [36]
            'Thn Lahir Wali', // [37]
            'Pendidikan Wali', // [38]
            'Pekerjaan Wali', // [39]
            'Penghasilan Wali', // [40]
            'Alamat Wali',  // [41]
        ];

        $callback = function () use ($students, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            foreach ($students as $student) {
                fputcsv($file, [
                    $student->user->nomor_induk,
                    $student->user->name,
                    $student->nisn,
                    $student->nik,
                    $student->gender,
                    $student->birth_place,
                    $student->birth_date,
                    $student->religion,
                    $student->origin_region,
                    $student->citizenship,
                    $student->child_order,
                    $student->siblings_count,
                    $student->living_with,
                    $student->financial_sponsor,
                    $student->height,
                    $student->weight,
                    $student->blood_type,
                    $student->province,
                    $student->city,
                    $student->district,
                    $student->village,
                    $student->postal_code,
                    $student->address_details,
                    $student->father_name,
                    $student->father_nik,
                    $student->father_birth_year,
                    $student->father_education,
                    $student->father_occupation,
                    $student->father_income,
                    $student->mother_name,
                    $student->mother_nik,
                    $student->mother_birth_year,
                    $student->mother_education,
                    $student->mother_occupation,
                    $student->mother_income,
                    $student->guardian_name,
                    $student->guardian_nik,
                    $student->guardian_birth_year,
                    $student->guardian_education,
                    $student->guardian_occupation,
                    $student->guardian_income,
                    $student->guardian_address,
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Update biodata massal via CSV
     * Kolom [0] = NIS sebagai KEY pencarian
     */
    public function processImportUpdate(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        @set_time_limit(600);
        @ini_set('max_execution_time', 600);

        $file = $request->file('file');
        $path = $file->getRealPath();

        $successCount = 0;
        $skippedCount = 0;
        $errors = [];

        if (($handle = fopen($path, 'r')) !== false) {
            // Hapus header
            $header = fgetcsv($handle);
            if ($header && isset($header[0])) {
                $header[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $header[0]);
            }

            $index = 0;
            while (($row = fgetcsv($handle)) !== false) {
                $rowNum = $index + 2;
                $index++;

                if (count($row) < 1 || empty(trim($row[0]))) {
                    continue; // Skip baris kosong
                }

                $nis = trim($row[0]);

                // Cari user by NIS
                $user = User::where('nomor_induk', $nis)->first();
                if (!$user) {
                    $errors[] = "Baris {$rowNum}: NIS '{$nis}' tidak ditemukan.";
                    $skippedCount++;
                    continue;
                }

                // Cari student profile
                $student = Student::where('user_id', $user->id)->first();
                if (!$student) {
                    $errors[] = "Baris {$rowNum}: NIS '{$nis}' belum memiliki profil biodata.";
                    $skippedCount++;
                    continue;
                }

                try {
                    // Hanya update field yang tidak kosong di CSV
                    $updateData = [];

                    $fieldMap = [
                        2  => 'nisn',
                        3  => 'nik',
                        4  => 'gender',
                        5  => 'birth_place',
                        6  => 'birth_date',
                        7  => 'religion',
                        8  => 'origin_region',
                        9  => 'citizenship',
                        10 => 'child_order',
                        11 => 'siblings_count',
                        12 => 'living_with',
                        13 => 'financial_sponsor',
                        14 => 'height',
                        15 => 'weight',
                        16 => 'blood_type',
                        17 => 'province',
                        18 => 'city',
                        19 => 'district',
                        20 => 'village',
                        21 => 'postal_code',
                        22 => 'address_details',
                        23 => 'father_name',
                        24 => 'father_nik',
                        25 => 'father_birth_year',
                        26 => 'father_education',
                        27 => 'father_occupation',
                        28 => 'father_income',
                        29 => 'mother_name',
                        30 => 'mother_nik',
                        31 => 'mother_birth_year',
                        32 => 'mother_education',
                        33 => 'mother_occupation',
                        34 => 'mother_income',
                        35 => 'guardian_name',
                        36 => 'guardian_nik',
                        37 => 'guardian_birth_year',
                        38 => 'guardian_education',
                        39 => 'guardian_occupation',
                        40 => 'guardian_income',
                        41 => 'guardian_address',
                    ];

                    foreach ($fieldMap as $colIndex => $field) {
                        if (isset($row[$colIndex]) && trim($row[$colIndex]) !== '') {
                            $val = trim($row[$colIndex]);
                            if ($field === 'nisn' || $field === 'nik') {
                                $cleanVal = preg_replace('/[^0-9]/', '', $val);
                                if ($cleanVal === '' || intval($cleanVal) === 0) {
                                    $updateData[$field] = null;
                                    continue;
                                }
                            }
                            
                            $intFields = [
                                'child_order', 'siblings_count', 'height', 'weight',
                                'father_birth_year', 'mother_birth_year', 'guardian_birth_year'
                            ];
                            if (in_array($field, $intFields)) {
                                $cleanVal = preg_replace('/[^0-9]/', '', $val);
                                if ($cleanVal === '') {
                                    $updateData[$field] = null;
                                    continue;
                                }
                                $val = intval($cleanVal);
                            }

                            if ($field === 'birth_date') {
                                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $val)) {
                                    continue;
                                }
                            }

                            // Normalize gender
                            if ($field === 'gender') $val = strtoupper($val);
                            $updateData[$field] = $val;
                        }
                    }

                    // Update nama di kolom [1] jika ada
                    if (isset($row[1]) && trim($row[1]) !== '') {
                        $user->update(['name' => trim($row[1])]);
                    }

                    // Update address gabungan
                    if (!empty($updateData)) {
                        $province = $updateData['province'] ?? $student->province ?? '';
                        $city = $updateData['city'] ?? $student->city ?? '';
                        $district = $updateData['district'] ?? $student->district ?? '';
                        $village = $updateData['village'] ?? $student->village ?? '';
                        $postalCode = $updateData['postal_code'] ?? $student->postal_code ?? '';
                        $addressDetails = $updateData['address_details'] ?? $student->address_details ?? '';
                        $parts = array_filter([$addressDetails, $village, $district, $city, $province, $postalCode]);
                        if (!empty($parts)) {
                            $updateData['address'] = implode(', ', $parts);
                        }

                        // Update parent_name dari father/mother
                        $fatherName = $updateData['father_name'] ?? $student->father_name ?? '';
                        $motherName = $updateData['mother_name'] ?? $student->mother_name ?? '';
                        if ($fatherName || $motherName) {
                            $updateData['parent_name'] = $fatherName ?: $motherName;
                        }

                        try {
                            $student->update($updateData);
                        } catch (\Illuminate\Database\QueryException $ex) {
                            if ($ex->errorInfo[1] == 1062) {
                                unset($updateData['nisn']);
                                unset($updateData['nik']);
                                if (!empty($updateData)) {
                                    $freshStudent = Student::find($student->id);
                                    if ($freshStudent) {
                                        $freshStudent->update($updateData);
                                    }
                                }
                                $errors[] = "Baris {$rowNum} (NIS: {$nis}): NISN/NIK duplikat terdeteksi. Sisa biodata berhasil diperbarui.";
                            } else {
                                throw $ex;
                            }
                        }
                    }

                    $successCount++;
                } catch (\Exception $e) {
                    $errors[] = "Baris {$rowNum} (NIS: {$nis}): " . $e->getMessage();
                    $skippedCount++;
                }
            }
            fclose($handle);
        }

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
