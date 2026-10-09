<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Student;
use App\Models\MusyrifTarbiyahPlotting;
use App\Services\AcademicStateService;
use Illuminate\Support\Facades\DB;

class MusyrifTarbiyahPlottingController extends Controller
{
    public function index()
    {
        try {
            $activeAcademic = AcademicStateService::currentAcademicYear();
        if (!$activeAcademic) {
            return back()->with('error', 'Tahun ajaran aktif belum diatur.');
        }

        // Get all users who can be Musyrif (e.g. Guru, Pegawai, Musrif, Wali Kelas)
        $musyrifs = User::active()->where(function($query) {
            $query->whereHas('userLevel', function($q) {
                $q->whereIn('name', ['Guru', 'Wali Kelas', 'Pegawai', 'Administrator', 'Musrif']);
            })->orWhereHas('additionalLevels', function($q) {
                $q->whereIn('name', ['Guru', 'Wali Kelas', 'Pegawai', 'Administrator', 'Musrif']);
            });
        })->orderBy('name', 'asc')->get(['id', 'name']);

        // Get current plottings
        $plottings = MusyrifTarbiyahPlotting::with(['musyrif:id,name', 'student.user:id,name,nomor_induk'])
            ->where('academic_year_id', $activeAcademic->id)
            ->get()
            ->groupBy('user_id');

        // Map plottings for frontend
        $mappedPlottings = [];
        foreach ($plottings as $musyrifId => $group) {
            $musyrif = $group->first()->musyrif;
            $mappedPlottings[] = [
                'musyrif_id' => $musyrifId,
                'musyrif_name' => $musyrif->name,
                'total_students' => $group->count(),
                'students' => $group->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'student_id' => $item->student_id,
                        'student_name' => $item->student->name,
                        'nis' => $item->student->nis,
                    ];
                })
            ];
        }

            return Inertia::render('Settings/Pengasuhan/MusyrifTarbiyah/Plotting', [
                'musyrifs' => $musyrifs,
                'plottings' => $mappedPlottings,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Musyrif Plotting Error: " . $e->getMessage());
            return back()->with('error', 'System Error: ' . $e->getMessage() . ' di file ' . basename($e->getFile()) . ' baris ' . $e->getLine());
        }
    }

    public function bulkStore(Request $request)
    {
        $request->validate([
            'musyrif_id' => 'required|exists:users,id',
            'nis_list' => 'required|string'
        ]);

        $activeAcademic = AcademicStateService::currentAcademicYear();
        if (!$activeAcademic) {
            return back()->with('error', 'Tahun ajaran aktif belum diatur.');
        }

        // Parse NIS list (comma separated, newline separated, etc)
        $nisList = preg_split('/[\s,]+/', $request->nis_list, -1, PREG_SPLIT_NO_EMPTY);
        
        $added = 0;
        $failed = [];

        DB::beginTransaction();
        try {
            foreach ($nisList as $nis) {
                // Find student by NIS
                $student = Student::whereHas('user', function($q) use ($nis) {
                    $q->where('nomor_induk', $nis);
                })->first();

                if ($student) {
                    // Check if already plotted this year
                    $exists = MusyrifTarbiyahPlotting::where('student_id', $student->id)
                        ->where('academic_year_id', $activeAcademic->id)
                        ->first();

                    if (!$exists) {
                        MusyrifTarbiyahPlotting::create([
                            'user_id' => $request->musyrif_id,
                            'student_id' => $student->id,
                            'academic_year_id' => $activeAcademic->id
                        ]);
                        $added++;
                    } else {
                        $failed[] = "$nis (Sudah diplot ke Musyrif lain)";
                    }
                } else {
                    $failed[] = "$nis (Santri tidak ditemukan)";
                }
            }
            DB::commit();

            $msg = "$added santri berhasil diplot.";
            if (count($failed) > 0) {
                $msg .= " Beberapa gagal: " . implode(", ", array_slice($failed, 0, 5)) . (count($failed) > 5 ? "..." : "");
                return back()->with('warning', $msg);
            }

            return back()->with('success', $msg);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Terjadi kesalahan sistem: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        $plotting = MusyrifTarbiyahPlotting::findOrFail($id);
        $plotting->delete();
        return back()->with('success', 'Plotting berhasil dihapus.');
    }
}
