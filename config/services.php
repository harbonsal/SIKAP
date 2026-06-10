<?php

// Helper to manually read .env if env() returns null (Shared Hosting Fix)
$geminiKey = env('GEMINI_API_KEY');
$openaiKey = env('OPENAI_API_KEY');
$litellmBaseUrl = env('LITELLM_BASE_URL');
$litellmKey = env('LITELLM_API_KEY');
$ortuApiKey = env('ORTU_API_KEY');

// Manual Fallback
if ((empty($geminiKey) || empty($openaiKey) || empty($litellmKey)) && file_exists(base_path('.env'))) {
    $lines = file(base_path('.env'), FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (strpos($line, '#') === 0) continue; // Skip comments

        if (strpos($line, 'GEMINI_API_KEY=') === 0) {
            $parts = explode('=', $line, 2);
            $geminiKey = trim($parts[1] ?? '');
        }
        if (strpos($line, 'OPENAI_API_KEY=') === 0) {
            $parts = explode('=', $line, 2);
            $openaiKey = trim($parts[1] ?? '');
        }
        if (strpos($line, 'LITELLM_BASE_URL=') === 0) {
            $parts = explode('=', $line, 2);
            $litellmBaseUrl = trim($parts[1] ?? '');
        }
        if (strpos($line, 'LITELLM_API_KEY=') === 0) {
            $parts = explode('=', $line, 2);
            $litellmKey = trim($parts[1] ?? '');
        }
        if (strpos($line, 'ORTU_API_KEY=') === 0) {
            $parts = explode('=', $line, 2);
            $ortuApiKey = trim($parts[1] ?? '');
        }
    }
}

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'gemini' => [
        'api_key' => $geminiKey,
    ],

    'openai' => [
        'api_key' => $openaiKey,
    ],

    'litellm' => [
        'base_url' => $litellmBaseUrl ?: 'https://litellm.koboi2026.biz.id/v1',
        'api_key' => $litellmKey,
    ],

    'ortu_api_key' => $ortuApiKey,

];
