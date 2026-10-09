<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\User;
use App\Models\Jenjang;
use App\Models\Kelas;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DaftarPengajarController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            $user = auth()->user();
            // Izinkan jika punya permission menu_academic atau jika dia Askar
            if (!$user->can('menu_academic') && stripos($user->userLevel->name ?? '', 'Askar') === false) {
                abort(403, 'Anda tidak memiliki kewenangan mengakses halaman ini.');
            }
            return $next($request);
        })->only(['index']);
    }

    public function index(Request $request)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();

        if (!$activeYear) {
            return redirect()->back()->with('error', 'Belum ada Tahun Ajaran aktif.');
        }

        $activeSemester = \App\Services\AcademicStateService::currentSemester();

        $search = $request->search;
        $kelasId = $request->kelas_id;
        $jenjangId = $request->jenjang_id;

        $query = User::query()
            ->where(function ($userQ) use ($activeYear, $kelasId, $jenjangId, $activeSemester) {
                $userQ->whereHas('activeSubjects', function ($q) use ($activeYear, $kelasId, $jenjangId) {
                    $q->whereHas('activeClass', function ($classQ) use ($activeYear, $kelasId, $jenjangId) {
                        $classQ->where('academic_year_id', $activeYear->id);
                        if ($kelasId) {
                            $classQ->where('kelas_id', $kelasId);
                        }
                        if ($jenjangId) {
                            $classQ->whereHas('kelas', function ($kq) use ($jenjangId) {
                                $kq->where('jenjang_id', $jenjangId);
                            });
                        }
                    });
                })->orWhereHas('semesterSubjectTeachers', function ($sstQ) use ($activeYear, $kelasId, $jenjangId, $activeSemester) {
                    if ($activeSemester) {
                        $sstQ->where('semester_id', $activeSemester->id);
                    }
                    $sstQ->whereHas('activeSubject.activeClass', function ($classQ) use ($activeYear, $kelasId, $jenjangId) {
                        $classQ->where('academic_year_id', $activeYear->id);
                        if ($kelasId) {
                            $classQ->where('kelas_id', $kelasId);
                        }
                        if ($jenjangId) {
                            $classQ->whereHas('kelas', function ($kq) use ($jenjangId) {
                                $kq->where('jenjang_id', $jenjangId);
                            });
                        }
                    });
                });
            })
            ->with(['activeSubjects' => function ($q) use ($activeYear, $kelasId, $jenjangId) {
                $q->whereHas('activeClass', function ($classQ) use ($activeYear, $kelasId, $jenjangId) {
                    $classQ->where('academic_year_id', $activeYear->id);
                    if ($kelasId) {
                        $classQ->where('kelas_id', $kelasId);
                    }
                    if ($jenjangId) {
                        $classQ->whereHas('kelas', function ($kq) use ($jenjangId) {
                            $kq->where('jenjang_id', $jenjangId);
                        });
                    }
                });
                $q->with(['mapel', 'activeClass.kelas.jenjang', 'activeClass.kelasParalel']);
            }])
            ->with(['semesterSubjectTeachers' => function ($sstQ) use ($activeSemester, $activeYear, $kelasId, $jenjangId) {
                if ($activeSemester) {
                    $sstQ->where('semester_id', $activeSemester->id);
                }
                $sstQ->whereHas('activeSubject.activeClass', function ($classQ) use ($activeYear, $kelasId, $jenjangId) {
                    $classQ->where('academic_year_id', $activeYear->id);
                    if ($kelasId) {
                        $classQ->where('kelas_id', $kelasId);
                    }
                    if ($jenjangId) {
                        $classQ->whereHas('kelas', function ($kq) use ($jenjangId) {
                            $kq->where('jenjang_id', $jenjangId);
                        });
                    }
                });
                $sstQ->with(['activeSubject.mapel', 'activeSubject.activeClass.kelas.jenjang', 'activeSubject.activeClass.kelasParalel']);
            }]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nomor_induk', 'like', "%{$search}%");
            });
        }

        $teachers = $query->orderBy('name')->paginate(30)->withQueryString();

        $teachers->getCollection()->transform(function ($teacher) {
            $jamFromActiveSubjects = $teacher->activeSubjects->sum('jam');
            $jamFromSemesterSubjects = $teacher->semesterSubjectTeachers->map(function ($sst) {
                return $sst->activeSubject->jam ?? 0;
            })->sum();

            $teacher->total_jam = $jamFromActiveSubjects + $jamFromSemesterSubjects;

            // Masukkan mapel dari semester_subject_teachers ke property activeSubjects supaya dirender frontend
            foreach ($teacher->semesterSubjectTeachers as $sst) {
                if ($sst->activeSubject) {
                    if (!$teacher->activeSubjects->contains('id', $sst->active_subject_id)) {
                        $teacher->activeSubjects->push($sst->activeSubject);
                    }
                }
            }
            return $teacher;
        });

        $jenjangs = Jenjang::orderBy('id')->get();
        $kelasOptions = Kelas::with('jenjang')->orderBy('jenjang_id')->orderBy('name')->get();

        return Inertia::render('Academic/DaftarPengajar/Index', [
            'teachers' => $teachers,
            'jenjangs' => $jenjangs,
            'kelasOptions' => $kelasOptions,
            'filters' => [
                'search' => $search ?? '',
                'kelas_id' => $kelasId ?? '',
                'jenjang_id' => $jenjangId ?? '',
            ]
        ]);
    }
}

