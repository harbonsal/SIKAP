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
        $activeYear = AcademicYear::where('is_active', true)->first();

        if (!$activeYear) {
            return redirect()->back()->with('error', 'Belum ada Tahun Ajaran aktif.');
        }

        $search = $request->search;
        $kelasId = $request->kelas_id;
        $jenjangId = $request->jenjang_id;

        $query = User::query()
            ->whereHas('activeSubjects', function ($q) use ($activeYear, $kelasId, $jenjangId) {
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
            })
            ->with(['activeSubjects' => function ($q) use ($activeYear, $kelasId, $jenjangId) {
                $q->whereHas('activeClass', function ($classQ) use ($activeYear, $kelasId, $jenjangId) {
                    $classQ->where('academic_year_id', $activeYear->id);
                    // Filter the subjects down so it only displays what exactly matches the user filter
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
            }]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('nomor_induk', 'like', "%{$search}%");
            });
        }

        $teachers = $query->orderBy('name')->paginate(30)->withQueryString();

        $teachers->getCollection()->transform(function ($teacher) {
            $teacher->total_jam = $teacher->activeSubjects->sum('jam');
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
