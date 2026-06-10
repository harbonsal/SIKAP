<?php

namespace App\Http\Controllers;

use App\Models\Kelas;
use App\Models\Jenjang;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KelasController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view_kelas')->only(['index', 'show']);
        $this->middleware('permission:create_kelas')->only(['create', 'store']);
        $this->middleware('permission:edit_kelas')->only(['edit', 'update']);
        $this->middleware('permission:delete_kelas')->only(['destroy']);
    }

    public function index()
    {
        $kelas = Kelas::with('jenjang')->latest()->paginate(10);
        return Inertia::render('Master/Kelas/Index', [
            'kelas' => $kelas,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Master/Kelas/Create', [
            'jenjangs' => Jenjang::all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'jenjang_id' => 'required|exists:jenjangs,id',
        ]);

        Kelas::create($request->all());

        return redirect()->route('kelas.index')->with('success', 'Kelas berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Kelas $kela)
    {
        return Inertia::render('Master/Kelas/Edit', [
            'kelas' => $kela,
            'jenjangs' => Jenjang::all(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Kelas $kela)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'jenjang_id' => 'required|exists:jenjangs,id',
        ]);

        $kela->update($request->all());

        return back()->with('success', 'Kelas berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Kelas $kela)
    {
        $kela->delete();
        return back()->with('success', 'Kelas berhasil dihapus.');
    }
}
