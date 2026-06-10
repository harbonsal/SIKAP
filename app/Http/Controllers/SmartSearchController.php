<?php

namespace App\Http\Controllers;

use App\Services\SmartSearchService;
use Illuminate\Http\Request;

class SmartSearchController extends Controller
{
    protected $searchService;

    public function __construct(SmartSearchService $searchService)
    {
        $this->searchService = $searchService;
    }

    public function search(Request $request)
    {
        $request->validate([
            'q' => 'required|string|min:2|max:200',
        ]);

        $query = trim($request->input('q'));
        $user  = auth()->user();

        try {
            $result = $this->searchService->search($query, $user);
            return response()->json($result);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('SmartSearch error: ' . $e->getMessage());
            return response()->json([
                'type'    => 'error',
                'results' => [],
                'summary' => 'Terjadi kesalahan saat pencarian. Silakan coba lagi.',
            ], 500);
        }
    }
}
