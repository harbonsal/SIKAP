<?php

namespace App\Http\Controllers;

use App\Models\Mapel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MapelController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view_mapels')->only(['index', 'show']);
        $this->middleware('permission:create_mapels')->only(['create', 'store']);
        $this->middleware('permission:edit_mapels')->only(['edit', 'update']);
        $this->middleware('permission:delete_mapels')->only(['destroy']);
    }

    public function index()
    {
        $mapels = Mapel::latest()->paginate(10);
        return Inertia::render('Master/Mapel/Index', [
            'mapels' => $mapels,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Master/Mapel/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nama_arab' => 'nullable|string|max:255',
            'code' => 'required|string|max:255|unique:mapels',
            'description' => 'nullable|string|max:255',
        ]);

        Mapel::create($request->all());

        return redirect()->route('mapels.index')->with('success', 'Mata Pelajaran berhasil ditambahkan.');
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
    public function edit(Mapel $mapel)
    {
        return Inertia::render('Master/Mapel/Edit', [
            'mapel' => $mapel,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Mapel $mapel)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nama_arab' => 'nullable|string|max:255',
            'code' => 'required|string|max:255|unique:mapels,code,' . $mapel->id,
            'description' => 'nullable|string|max:255',
        ]);

        $mapel->update($request->all());

        return redirect()->route('mapels.index')->with('success', 'Mata Pelajaran berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Mapel $mapel)
    {
        $mapel->delete();
        return redirect()->route('mapels.index')->with('success', 'Mata Pelajaran berhasil dihapus.');
    }
}
