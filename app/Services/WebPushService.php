<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Psr7\HttpFactory;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\ContentEncoding;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class WebPushService
{
    protected ?WebPush $webPush = null;
    protected ?string $initError = null;

    public function __construct()
    {
        $subject = config('webpush.vapid.subject') ?: 'mailto:admin@sikap.sinawang.my.id';
        $publicKey = config('webpush.vapid.public_key') 
            ?: (env('VAPID_PUBLIC_KEY') ?: 'BEhkKkxBnEBGsPHG9JotYMCqLp-MEJdboXXFVuea84QhBvtzl_7JmSzISgVCm5Z_G5uKqppYQDp_iJmvbVvKbtU');
        $privateKey = config('webpush.vapid.private_key') 
            ?: (env('VAPID_PRIVATE_KEY') ?: 'EjRfHcHH7gS3M2Z_2rqFXWaNc5t6Ol6xsgDTnJ7DYAM');

        if (!$publicKey || !$privateKey) {
            $this->initError = 'Kunci VAPID public/private belum terdefinisi.';
            Log::error($this->initError);
            return;
        }

        $auth = [
            'VAPID' => [
                'subject' => $subject,
                'publicKey' => $publicKey,
                'privateKey' => $privateKey,
            ],
        ];

        try {
            // Sediakan client Guzzle secara eksplisit untuk mencegah kegagalan PSR-18 discovery di lingkungan shared hosting cPanel
            $client = new GuzzleClient([
                'timeout' => 15,
                'connect_timeout' => 10,
                'verify' => true,
            ]);
            $httpFactory = new HttpFactory();

            $this->webPush = new WebPush($auth, [], $client, $httpFactory, $httpFactory);
            $this->webPush->setAutomaticPadding(false);
        } catch (\Throwable $e) {
            $this->initError = 'Inisialisasi WebPush gagal (' . get_class($e) . '): ' . $e->getMessage();
            Log::error($this->initError);
        }
    }

    /**
     * Send notification to a single user (all of their registered devices).
     */
    public function sendToUser($userOrId, string $title, string $body, string $url = '/dashboard', array $extra = []): array
    {
        $userId = $userOrId instanceof User ? $userOrId->id : $userOrId;
        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        return $this->dispatchNotifications($subscriptions, $title, $body, $url, $extra);
    }

    /**
     * Send notification to multiple users.
     */
    public function sendToUsers(array $userIds, string $title, string $body, string $url = '/dashboard', array $extra = []): array
    {
        $subscriptions = PushSubscription::whereIn('user_id', $userIds)->get();

        return $this->dispatchNotifications($subscriptions, $title, $body, $url, $extra);
    }

    /**
     * Send notification to a single PushSubscription model.
     * Returns array with 'success' (bool), 'reason' (string), and 'status_code' (int|null).
     */
    public function sendToSubscription(PushSubscription $subscription, string $title, string $body, string $url = '/dashboard', array $extra = []): array
    {
        return $this->dispatchSingleNotification($subscription, $title, $body, $url, $extra);
    }

    /**
     * Send notification to all registered subscriptions in the system.
     */
    public function sendToAllSubscriptions(string $title, string $body, string $url = '/dashboard', array $extra = []): array
    {
        $subscriptions = PushSubscription::all();
        return $this->dispatchNotifications($subscriptions, $title, $body, $url, $extra);
    }

    /**
     * Dispatch single notification with detailed reporting.
     */
    public function dispatchSingleNotification(PushSubscription $sub, string $title, string $body, string $url, array $extra = []): array
    {
        if (!$this->webPush) {
            return [
                'success' => false,
                'reason' => $this->initError ?: 'WebPush tidak terinisialisasi (periksa konfigurasi VAPID).',
                'status_code' => 500,
            ];
        }

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'icon' => $extra['icon'] ?? '/assets/icons/icon-192x192.png',
            'badge' => $extra['badge'] ?? '/assets/icons/icon-72x72.png',
            'url' => $url,
            'tag' => $extra['tag'] ?? 'sikap-' . uniqid(),
            'data' => [
                'url' => $url,
                'sent_at' => now()->toISOString(),
            ],
        ]);

        try {
            // Modern WebPush (Chrome, Safari, Firefox) menggunakan aes128gcm (RFC 8291)
            $encodingStr = $sub->content_encoding ?: 'aes128gcm';
            try {
                $contentEncoding = ContentEncoding::from($encodingStr);
            } catch (\Throwable $e) {
                $contentEncoding = ContentEncoding::aes128gcm;
            }

            $subscription = new Subscription(
                $sub->endpoint,
                $sub->public_key,
                $sub->auth_token,
                $contentEncoding
            );

            $report = $this->webPush->sendOneNotification($subscription, $payload);

            if ($report->isSuccess()) {
                return [
                    'success' => true,
                    'reason' => 'OK',
                    'status_code' => 200,
                ];
            }

            $statusCode = $report->getResponse()?->getStatusCode();
            $reason = $report->getReason() ?: ('HTTP ' . $statusCode);
            $respBody = $report->getResponseContent();
            if ($respBody) {
                $cleanBody = trim(substr(strip_tags($respBody), 0, 180));
                if ($cleanBody) {
                    $reason .= ' - ' . $cleanBody;
                }
            }

            // Jika 410 atau 404 (endpoint expired / uninstalled), hapus langganan usang
            if ($report->isSubscriptionExpired()) {
                $sub->delete();
                $reason .= ' [Langganan sudah kedaluwarsa & otomatis dihapus dari database]';
            }

            Log::warning("WebPush dispatch failed: [{$statusCode}] {$reason} for endpoint {$sub->endpoint}");

            return [
                'success' => false,
                'reason' => $reason,
                'status_code' => $statusCode,
            ];
        } catch (\Throwable $e) {
            Log::error('WebPush dispatch exception: ' . $e->getMessage());
            return [
                'success' => false,
                'reason' => $e->getMessage(),
                'status_code' => 500,
            ];
        }
    }

    /**
     * Dispatch notification payload to subscriptions list.
     */
    protected function dispatchNotifications($subscriptions, string $title, string $body, string $url, array $extra = []): array
    {
        if (!$this->webPush || $subscriptions->isEmpty()) {
            return [
                'total' => 0,
                'success' => 0,
                'failed' => 0,
                'reasons' => [],
            ];
        }

        $successCount = 0;
        $failedCount = 0;
        $reasons = [];

        foreach ($subscriptions as $sub) {
            $singleRes = $this->dispatchSingleNotification($sub, $title, $body, $url, $extra);
            if ($singleRes['success']) {
                $successCount++;
            } else {
                $failedCount++;
                $reasons[] = ($sub->device_name ?: 'Perangkat #' . $sub->id) . ': ' . $singleRes['reason'];
            }
        }

        return [
            'total' => $subscriptions->count(),
            'success' => $successCount,
            'failed' => $failedCount,
            'reasons' => $reasons,
        ];
    }
}
