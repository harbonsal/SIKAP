<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ApiKeyTesterController extends Controller
{
    /**
     * Tampilkan halaman utama tester API Key.
     */
    public function index()
    {
        // Ambil daftar API Key untuk kemudahan testing
        $apiKeys = \App\Models\ApiKey::orderBy('name')->get();
        $defaultInternalUrl = url('/api/v1/ping');
        
        return Inertia::render('Settings/System/ApiKey/Tester', [
            'apiKeys' => $apiKeys,
            'defaultInternalUrl' => $defaultInternalUrl,
        ]);
    }

    /**
     * Jalankan pengetesan API Key.
     */
    public function runTest(Request $request)
    {
        $request->validate([
            'api_key' => 'required|string',
            'endpoint' => 'required|url',
            'method' => 'required|in:GET,POST,PUT,PATCH,DELETE',
            'headers' => 'nullable|array',
            'body' => 'nullable|array',
        ]);

        $apiKey = $request->input('api_key');
        $endpoint = $request->input('endpoint');
        $method = $request->input('method');
        $headers = $request->input('headers', []);
        $body = $request->input('body', []);

        // Auto-attach API key when user has not provided auth header manually.
        // This keeps tester usable for internal and external endpoints that rely on X-Api-Key.
        $hasApiKeyHeader = array_key_exists('X-Api-Key', $headers) || array_key_exists('x-api-key', $headers);
        $hasAuthorizationHeader = array_key_exists('Authorization', $headers) || array_key_exists('authorization', $headers);
        if (!$hasApiKeyHeader && !$hasAuthorizationHeader) {
            $headers['X-Api-Key'] = $apiKey;
        }

        try {
            $startTime = microtime(true);

            try {
                $response = Http::withHeaders($headers)
                    ->send($method, $endpoint, [
                        'json' => $body
                    ]);
            } catch (\Exception $sslException) {
                // Dev-friendly fallback for self-signed/incomplete CA chains.
                if (str_contains($sslException->getMessage(), 'cURL error 60')) {
                    $response = Http::withoutVerifying()
                        ->withHeaders($headers)
                        ->send($method, $endpoint, [
                            'json' => $body
                        ]);
                } else {
                    throw $sslException;
                }
            }

            $duration = round((microtime(true) - $startTime) * 1000, 2); // ms

            return response()->json([
                'status' => $response->status(),
                'status_text' => $response->reason(),
                'duration' => $duration . ' ms',
                'headers' => $response->headers(),
                'body' => $response->json() ?? $response->body(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 500,
                'status_text' => 'Error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
