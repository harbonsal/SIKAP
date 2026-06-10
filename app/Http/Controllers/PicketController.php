<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PicketController extends Controller
{
    public function index()
    {
        return Inertia::render('Education/Picket/Index', [
            'title' => 'Jadwal Piket',
        ]);
    }

    public function create()
    {
        // Placeholder
    }

    public function store(Request $request)
    {
        // Placeholder
    }

    public function show($id)
    {
        // Placeholder
    }

    public function edit($id)
    {
        // Placeholder
    }

    public function update(Request $request, $id)
    {
        // Placeholder
    }

    public function destroy($id)
    {
        // Placeholder
    }
}
