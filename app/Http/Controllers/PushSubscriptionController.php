<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use App\Services\WebPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PushSubscriptionController extends Controller
{
    protected WebPushService $pushService;

    public function __construct(WebPushService $pushService)
    {
        $this->pushService = $pushService;
    }

    /**
     * Store or update device push subscription.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint' => 'required|string',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
            'content_encoding' => 'nullable|string',
        ]);

        $userAgent = $request->header('User-Agent', '');
        $deviceName = $this->guessDeviceName($userAgent);

        $subscription = PushSubscription::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'endpoint' => $request->endpoint,
            ],
            [
                'public_key' => $request->input('keys.p256dh'),
                'auth_token' => $request->input('keys.auth'),
                'content_encoding' => $request->input('content_encoding', 'aesgcm'),
                'device_name' => $deviceName,
            ]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Perangkat ini berhasil didaftarkan untuk menerima pengingat langsung.',
            'device_name' => $deviceName,
            'subscription_id' => $subscription->id,
        ]);
    }

    /**
     * Unsubscribe device from push notifications.
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        PushSubscription::where('user_id', Auth::id())
            ->where('endpoint', $request->endpoint)
            ->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Notifikasi untuk perangkat ini telah dinonaktifkan.',
        ]);
    }

    /**
     * Get user active subscriptions status.
     */
    public function status(): JsonResponse
    {
        $subscriptions = PushSubscription::where('user_id', Auth::id())
            ->select('id', 'endpoint', 'device_name', 'created_at')
            ->get();

        return response()->json([
            'is_subscribed' => $subscriptions->isNotEmpty(),
            'subscriptions_count' => $subscriptions->count(),
            'devices' => $subscriptions->map(function ($sub) {
                return [
                    'id' => $sub->id,
                    'device_name' => $sub->device_name,
                    'created_at' => $sub->created_at->format('d M Y H:i'),
                ];
            }),
        ]);
    }

    /**
     * Send immediate test notification to current user.
     */
    public function testNotification(): JsonResponse
    {
        $user = Auth::user();
        $subsCount = PushSubscription::where('user_id', $user->id)->count();

        if ($subsCount === 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Belum ada perangkat HP yang terdaftar untuk akun ini. Aktifkan notifikasi di HP terlebih dahulu.',
            ], 422);
        }

        $result = $this->pushService->sendToUser(
            $user->id,
            '🔔 Pengingat SIKAP Berfungsi!',
            'Alhamdulillah, notifikasi HP aktif untuk akun ' . $user->name . '. Pengingat input nilai dan agenda akan muncul langsung di layar HP antum.',
            route('dashboard', [], false),
            ['tag' => 'sikap-test-' . time()]
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Sinyal tes pengingat telah dikirim ke ' . $result['success'] . ' perangkat!',
            'detail' => $result,
        ]);
    }

    /**
     * Simple helper to deduce device brand / platform from User-Agent.
     */
    protected function guessDeviceName(string $ua): string
    {
        if (preg_match('/iPhone/i', $ua)) {
            return 'iPhone (Safari Mobile)';
        }
        if (preg_match('/iPad/i', $ua)) {
            return 'iPad (Safari Mobile)';
        }
        if (preg_match('/Android.*Chrome\/[.0-9]* Mobile/i', $ua)) {
            return 'HP Android (Chrome)';
        }
        if (preg_match('/Android/i', $ua)) {
            return 'HP Android';
        }
        if (preg_match('/Windows NT/i', $ua)) {
            return 'Komputer / Laptop (Windows)';
        }
        if (preg_match('/Macintosh/i', $ua)) {
            return 'MacBook / Mac OS';
        }

        return 'Perangkat Web';
    }
}
