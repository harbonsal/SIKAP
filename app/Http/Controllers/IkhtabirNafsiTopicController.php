<?php

namespace App\Http\Controllers;

use App\Models\IkhtabirNafsiTopic;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;

class IkhtabirNafsiTopicController extends Controller
{
    public function index()
    {
        // Only Admin/Manager
        // Ideally use Policy/Gate. For now, simple role check or rely on route middleware.

        $topics = IkhtabirNafsiTopic::orderBy('active', 'desc')
            ->orderBy('id', 'asc')
            ->get();

        return Inertia::render('Teacher/IkhtabirNafsi/Topics/Index', [
            'topics' => $topics
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'text_ar' => 'required|string',
            'active' => 'boolean'
        ]);

        IkhtabirNafsiTopic::create($request->only(['text_ar', 'active']));

        return redirect()->back()->with('success', 'Topik berhasil ditambahkan.');
    }

    public function update(Request $request, IkhtabirNafsiTopic $topic)
    {
        $request->validate([
            'text_ar' => 'required|string',
            'active' => 'boolean'
        ]);

        $topic->update($request->only(['text_ar', 'active']));

        return redirect()->back()->with('success', 'Topik berhasil diperbarui.');
    }

    public function destroy(IkhtabirNafsiTopic $topic)
    {
        $topic->delete();

        return redirect()->back()->with('success', 'Topik berhasil dihapus.');
    }

    public function toggle(IkhtabirNafsiTopic $topic)
    {
        $topic->update(['active' => !$topic->active]);
        return redirect()->back()->with('success', 'Status topik diubah.');
    }
}
