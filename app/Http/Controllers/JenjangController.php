<?php

namespace App\Http\Controllers;

use App\Models\Jenjang;
use Illuminate\Http\Request;
use Inertia\Inertia;

class JenjangController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view_jenjangs')->only(['index', 'show']);
        $this->middleware('permission:create_jenjangs')->only(['create', 'store']);
        $this->middleware('permission:edit_jenjangs')->only(['edit', 'update']);
        $this->middleware('permission:delete_jenjangs')->only(['destroy']);
    }

    public function index()
    {
        $jenjangs = Jenjang::with('headmaster')->latest()->paginate(10);
        return Inertia::render('Master/Jenjang/Index', [
            'jenjangs' => $jenjangs,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $staffUsers = \App\Models\User::where('user_level_id', '!=', 5)->orderBy('name')->get(['id', 'name']);
        return Inertia::render('Master/Jenjang/Create', ['staffUsers' => $staffUsers]);
    }

    // ... store method ...

    public function edit(Jenjang $jenjang)
    {
        $staffUsers = \App\Models\User::where('user_level_id', '!=', 5)->orderBy('name')->get(['id', 'name']);
        return Inertia::render('Master/Jenjang/Edit', [
            'jenjang' => $jenjang,
            'staffUsers' => $staffUsers,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Jenjang $jenjang)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:jenjangs,name,' . $jenjang->id,
            'description' => 'nullable|string|max:255',
            'headmaster_user_id' => 'nullable|exists:users,id',
            'headmaster_title' => 'nullable|string|max:255',
        ]);

        $jenjang->update($request->all());

        return redirect()->route('jenjangs.index')->with('success', 'Jenjang berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Jenjang $jenjang)
    {
        $jenjang->delete();
        return redirect()->route('jenjangs.index')->with('success', 'Jenjang berhasil dihapus.');
    }
}
