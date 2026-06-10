<?php

namespace App\Http\Controllers;

use App\Models\UserLevel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserLevelController extends Controller
{
    public function index(Request $request)
    {
        $query = UserLevel::query();

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $userLevels = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Master/UserLevels/Index', [
            'userLevels' => $userLevels,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Master/UserLevels/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:user_levels,name',
            'category' => 'required|in:Santri,Ustadz,Lainnya',
            'dashboard_type' => 'nullable|string|in:Admin,Teacher,Student,Default',
            'widgets' => 'nullable|array',
        ]);

        UserLevel::create($request->all());

        return redirect()->route('user-levels.index')
            ->with('success', 'User Level berhasil ditambahkan.');
    }

    public function edit(UserLevel $userLevel)
    {
        return Inertia::render('Master/UserLevels/Edit', [
            'userLevel' => $userLevel,
        ]);
    }

    public function update(Request $request, UserLevel $userLevel)
    {
        $request->validate([
            'name' => 'required|string|unique:user_levels,name,' . $userLevel->id,
            'category' => 'required|in:Santri,Ustadz,Lainnya',
            'dashboard_type' => 'nullable|string|in:Admin,Teacher,Student,Default',
            'widgets' => 'nullable|array',
        ]);

        $userLevel->update($request->all());

        return redirect()->route('user-levels.index')
            ->with('success', 'User Level berhasil diperbarui.');
    }

    public function destroy(UserLevel $userLevel)
    {
        $userLevel->delete();

        return redirect()->route('user-levels.index')
            ->with('success', 'User Level berhasil dihapus.');
    }
}
