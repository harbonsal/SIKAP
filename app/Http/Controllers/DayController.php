<?php

namespace App\Http\Controllers;

use App\Models\Day;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DayController extends Controller
{
    public function index()
    {
        $days = Day::orderBy('order')->get();

        return Inertia::render('Settings/Master/Day/Index', [
            'days' => $days,
        ]);
    }

    public function update(Request $request, Day $day)
    {
        $request->validate([
            'total_hours' => 'required|integer|min:0',
            'is_active' => 'required|boolean',
        ]);

        $day->update($request->only(['total_hours', 'is_active']));

        return redirect()->back()->with('success', 'Data hari berhasil diperbarui.');
    }
}
