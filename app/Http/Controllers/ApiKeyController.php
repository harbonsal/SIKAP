<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class ApiKeyController extends Controller
{
    public function index()
    {
        $keys = ApiKey::orderBy('created_at', 'desc')->get();
        return Inertia::render('Settings/System/ApiKey/Index', [
            'apiKeys' => $keys
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $newKey = 'SKP_' . Str::random(32);

        ApiKey::create([
            'name' => $request->name,
            'key' => $newKey,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'API Key berhasil dibuat: ' . $newKey);
    }

    public function update(Request $request, ApiKey $apiKey)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'is_active' => 'required|boolean',
        ]);

        $apiKey->update([
            'name' => $request->name,
            'is_active' => $request->is_active,
        ]);

        return redirect()->back()->with('success', 'API Key berhasil diupdate.');
    }

    public function destroy(ApiKey $apiKey)
    {
        $apiKey->delete();
        return redirect()->back()->with('success', 'API Key berhasil dihapus.');
    }
}
