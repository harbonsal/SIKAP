<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\ContentEncoding;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class WebPushService
{
    protected ?WebPush $webPush = null;

    public function __construct()
    {
        $subject = config('webpush.vapid.subject', 'mailto:admin@sikap.sinawang.my.id');
        $publicKey = config('webpush.vapid.public_key');
        $privateKey = config('webpush.vapid.private_key');

        if ($publicKey && $privateKey) {
            $auth = [
                'VAPID' => [
                    'subject' => $subject,
                    'publicKey' => $publicKey,
                    'privateKey' => $privateKey,
                ],
            ];

            try {
                $this->webPush = new WebPush($auth);
                $this->webPush->setAutomaticPadding(false);
            } catch (\Throwable $e) {
                Log::error('Failed to initialize WebPush service: ' . $e->getMessage());
            }
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
                'reason' => 'WebPush tidak terinisialisasi (periksa konfigurasi VAPID).',
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
