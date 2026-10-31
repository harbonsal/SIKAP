<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;
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
     * Dispatch notification payload to subscriptions list.
     */
    protected function dispatchNotifications($subscriptions, string $title, string $body, string $url, array $extra = []): array
    {
        if (!$this->webPush || $subscriptions->isEmpty()) {
            return [
                'total' => 0,
                'success' => 0,
                'failed' => 0,
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

        $successCount = 0;
        $failedCount = 0;

        foreach ($subscriptions as $sub) {
            try {
                $subscription = new Subscription(
                    $sub->endpoint,
                    $sub->public_key,
                    $sub->auth_token,
                    $sub->content_encoding ?: 'aesgcm'
                );

                $report = $this->webPush->sendOneNotification($subscription, $payload);

                if ($report->isSuccess()) {
                    $successCount++;
                } else {
                    $failedCount++;
                    Log::warning('Push notification failed for endpoint: ' . $sub->endpoint . ' - Reason: ' . $report->getReason());

                    // Hapus langganan yang kadaluarsa/tidak valid lagi
                    if ($report->isSubscriptionExpired()) {
                        $sub->delete();
                    }
                }
            } catch (\Throwable $e) {
                $failedCount++;
                Log::error('WebPush dispatch exception: ' . $e->getMessage());
            }
        }

        return [
            'total' => $subscriptions->count(),
            'success' => $successCount,
            'failed' => $failedCount,
        ];
    }
}
