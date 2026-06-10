<?php

namespace App\Http\Controllers;

use App\Models\ActiveClass;
use App\Models\ActiveSubject;
use App\Models\AcademicYear;
use App\Models\Mapel;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TeachingDistributionSyncController extends Controller
{
    public function sync(Request $request)
    {
        // 1. Get SIKAP Active Year
        $activeYear = AcademicYear::where('is_active', true)->first();
        if (!$activeYear) {
            return back()->with('error', 'Tidak ada tahun ajaran aktif di SIKAP.');
        }

        // 2. Identify Legacy TP ID
        $targetTp = null;

        // Priority check for 2025/2026 -> 20252026
        if ($activeYear->name == '2025/2026') {
            $targetTp = 20252026;
        } else {
            // Try to find matching TP in legacy
            $legacyTp = DB::connection('mysql_legacy')->table('tp')
                ->where('TP', 'LIKE', '%' . $activeYear->name . '%')
                ->first();
            if ($legacyTp) {
                $targetTp = $legacyTp->Kode_TP;
            }
        }

        if (!$targetTp) {
            return back()->with('error', 'Tahun Ajaran ' . $activeYear->name . ' tidak ditemukan di database lama (Target Kode: 20252026).');
        }

        DB::beginTransaction();
        try {
            // 3. Fetch Legacy Data with CORRECT JOINS
            // user: joined on Kode_User (not ID_User)
            // kelas: joined on Kode_Kelas (not ID_Kelas)
            // mapel: select Mata_Pelajaran as Nama_Mapel
            $legacyAssignments = DB::connection('mysql_legacy')->table('guru_mapel')
                ->join('kelas', 'guru_mapel.Kode_Kelas', '=', 'kelas.Kode_Kelas')
                ->join('mapel', 'guru_mapel.Kode_Mapel', '=', 'mapel.Kode_Mapel')
                ->leftJoin('user', 'guru_mapel.Kode_Guru', '=', 'user.Kode_User')
                ->where('guru_mapel.Kode_TP', $targetTp)
                ->where('guru_mapel.Aktif', 'Y')
                ->select(
                    'guru_mapel.Jml_Jam',
                    'kelas.Kelas as Nama_Kelas',
                    'mapel.Mata_Pelajaran as Nama_Mapel',
                    'mapel.Kode_Mapel',
                    'user.Kode_User as NIP_Guru',
                    'user.Nama as Nama_Guru'
                )
                ->get();

            $syncedCount = 0;
            $errors = [];

            // Cache SIKAP Data for performance
            $activeClasses = ActiveClass::where('academic_year_id', $activeYear->id)
                ->with(['kelas', 'kelasParalel'])
                ->get();

            $sikapMapels = Mapel::all();
            $sikapUsers = User::all();

            foreach ($legacyAssignments as $legacy) {
                // A. Find SIKAP Active Class using Fuzzy Name Matching
                $targetClass = $activeClasses->filter(function ($ac) use ($legacy) {
                    $sikapName = $ac->kelas->name . ($ac->kelasParalel ? ' ' . $ac->kelasParalel->name : '');
                    $normSikap = $this->normalizeName($sikapName);
                    $normLegacy = $this->normalizeName($legacy->Nama_Kelas);
                    return $normSikap === $normLegacy;
                })->first();

                if (!$targetClass) {
                    continue;
                }

                // B. Find SIKAP Mapel
                $targetMapel = $sikapMapels->first(function ($m) use ($legacy) {
                    return $m->code === $legacy->Kode_Mapel || strtolower($m->name) === strtolower($legacy->Nama_Mapel);
                });

                if (!$targetMapel) {
                    continue;
                }

                // C. Find SIKAP Teacher (User)
                // Match by nomor_induk
                $targetTeacher = $sikapUsers->firstWhere('nomor_induk', $legacy->NIP_Guru);

                // D. Update Active Subject
                if ($targetTeacher && $targetClass && $targetMapel) {
                    $activeSubject = ActiveSubject::where('active_class_id', $targetClass->id)
                        ->where('mapel_id', $targetMapel->id)
                        ->first();

                    // DEFAULT VALUE LOGIC
                    $jam = $legacy->Jml_Jam > 0 ? $legacy->Jml_Jam : 2;

                    if ($activeSubject) {
                        $activeSubject->update([
                            'teacher_id' => $targetTeacher->id,
                            'jam' => $jam,
                        ]);
                        $syncedCount++;
                    } else {
                        // Create if missing
                        ActiveSubject::create([
                            'active_class_id' => $targetClass->id,
                            'mapel_id' => $targetMapel->id,
                            'teacher_id' => $targetTeacher->id,
                            'jam' => $jam,
                        ]);
                        $syncedCount++;
                    }
                }
            }

            DB::commit();
            return back()->with('success', "Sinkronisasi berhasil. $syncedCount data diperbarui.");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    private function normalizeName($name)
    {
        $lower = strtolower($name);
        // Replace 1A with 1 A
        $spaced = preg_replace('/(\d+)([a-z])/', '$1 $2', $lower);
        // Remove special chars except space and alphanumeric
        $clean = preg_replace('/[^a-z0-9\s]/', '', $spaced);
        // Split, sort, join
        $parts = explode(' ', $clean);
        $parts = array_filter($parts, function ($v) {
            return trim($v) !== '';
        });
        sort($parts);
        return implode(' ', $parts);
    }
}
