<?php

namespace App\Http\Controllers;

use App\Models\KelasParalel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KelasParalelController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view_kelas_paralel')->only(['index', 'show']);
        $this->middleware('permission:create_kelas_paralel')->only(['create', 'store']);
        $this->middleware('permission:edit_kelas_paralel')->only(['edit', 'update']);
        $this->middleware('permission:delete_kelas_paralel')->only(['destroy']);
    }

    public function index()
    {
        $kelasParalels = KelasParalel::latest()->paginate(10);
        return Inertia::render('Master/KelasParalel/Index', [
            'kelasParalels' => $kelasParalels,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Master/KelasParalel/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:kelas_paralels',
        ]);

        KelasParalel::create($request->all());

        return redirect()->route('kelas-paralel.index')->with('success', 'Kelas Paralel berhasil ditambahkan.');
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
    public function edit(KelasParalel $kelasParalel)
    {
        return Inertia::render('Master/KelasParalel/Edit', [
            'kelasParalel' => $kelasParalel,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, KelasParalel $kelasParalel)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:kelas_paralels,name,' . $kelasParalel->id,
        ]);

        $kelasParalel->update($request->all());

        return redirect()->route('kelas-paralel.index')->with('success', 'Kelas Paralel berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(KelasParalel $kelasParalel)
    {
        $kelasParalel->delete();
        return redirect()->route('kelas-paralel.index')->with('success', 'Kelas Paralel berhasil dihapus.');
    }
}
