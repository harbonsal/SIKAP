<?php

namespace App\Http\Controllers;

use App\Models\LearningHour;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LearningHourController extends Controller
{
    public function index()
    {
        $learningHours = LearningHour::orderBy('hour_number')->get();

        return Inertia::render('Settings/Education/LearningHour/Index', [
            'learningHours' => $learningHours,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'hour_number' => 'required|integer|unique:learning_hours,hour_number',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        LearningHour::create($request->all());

        return redirect()->back()->with('success', 'Jam belajar berhasil ditambahkan.');
    }

    public function update(Request $request, LearningHour $learningHour)
    {
        $request->validate([
            'hour_number' => 'required|integer|unique:learning_hours,hour_number,' . $learningHour->id,
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        $learningHour->update($request->all());

        return redirect()->back()->with('success', 'Jam belajar berhasil diperbarui.');
    }

    public function destroy(LearningHour $learningHour)
    {
        $learningHour->delete();

        return redirect()->back()->with('success', 'Jam belajar berhasil dihapus.');
    }
}
