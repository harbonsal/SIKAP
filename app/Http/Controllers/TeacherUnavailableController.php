<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;

class TeacherUnavailableController extends Controller
{
    public function index(Request $request)
    {
        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        if (!$activeYear) {
            return redirect()->back()->with('error', 'Tahun pelajaran tidak ditemukan.');
        }

        $teachers = User::where('status', 'Aktif')
            ->whereHas('userLevel', function ($q) {
                $q->where('name', '!=', 'Santri');
            })
            ->withCount(['unavailableHours' => function ($query) use ($activeYear) {
                $query->where('academic_year_id', $activeYear->id);
            }])
            ->orderBy('name')
            ->get();

        $days = \App\Models\Day::where('is_active', true)->orderBy('order')->get();
        $learningHours = \App\Models\LearningHour::orderBy('hour_number')->get();

        $selectedTeacherId = $request->user_id;
        $unavailableHours = [];

        if ($selectedTeacherId) {
            $unavailableHours = \App\Models\TeacherUnavailableHour::where('user_id', $selectedTeacherId)
                ->where('academic_year_id', $activeYear->id)
                ->get()
                ->map(function ($item) {
                    return $item->day_id . '-' . $item->learning_hour_id;
                })
                ->toArray();
        }

        return Inertia::render('Settings/Teacher/Unavailable/Index', [
            'teachers' => $teachers,
            'days' => $days,
            'learningHours' => $learningHours,
            'unavailableHours' => $unavailableHours,
            'selectedTeacherId' => $selectedTeacherId,
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'unavailable_slots' => 'array', // Array of "day_id-learning_hour_id" strings
        ]);

        $activeYear = \App\Services\AcademicStateService::currentAcademicYear();
        if (!$activeYear) {
            return redirect()->back()->with('error', 'Tahun pelajaran tidak ditemukan.');
        }

        $teacherId = $request->user_id;
        $slots = $request->unavailable_slots ?? [];

        // Delete existing for this teacher and year
        \App\Models\TeacherUnavailableHour::where('user_id', $teacherId)
            ->where('academic_year_id', $activeYear->id)
            ->delete();

        // Insert new
        $dataToInsert = [];
        foreach ($slots as $slot) {
            [$dayId, $hourId] = explode('-', $slot);
            $dataToInsert[] = [
                'user_id' => $teacherId,
                'academic_year_id' => $activeYear->id,
                'day_id' => $dayId,
                'learning_hour_id' => $hourId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if (!empty($dataToInsert)) {
            \App\Models\TeacherUnavailableHour::insert($dataToInsert);
        }

        if ($request->boolean('from_workspace')) {
            return redirect()->back()->with('success', 'Jam off guru berhasil disimpan.');
        }

        return redirect()->route('settings.teacher.unavailable.index', ['user_id' => $teacherId])
            ->with('success', 'Jam off guru berhasil disimpan.');
    }
}
