<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckApiKey
{
    /**
     * Handle an incoming request.
     * Validates the X-Api-Key header against the ORTU_API_KEY in .env
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-Api-Key');

        if (empty($apiKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. API Key tidak ditemukan pada header X-Api-Key.',
            ], 401);
        }

        // Cek di database
        $dbKey = \App\Models\ApiKey::where('key', $apiKey)->where('is_active', true)->first();

        if ($dbKey) {
            // Update last used
            $dbKey->update(['last_used_at' => now()]);
            return $next($request);
        }

        // Fallback: Cek di .env (Opsional jika migrasi awal belum ada key)
        $validKey = config('services.ortu_api_key');
        if ($validKey && $apiKey === $validKey) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Unauthorized. API key tidak valid.',
        ], 401);
    }
}
