const CACHE_NAME = 'sikap-pwa-v5';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Hanya tangani GET request HTTP/HTTPS
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Network-first dengan fallback ke cache agar rute dinamis Laravel selalu terbarui
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// ==========================================
// PWA WEB PUSH NOTIFICATIONS
// ==========================================
self.addEventListener('push', function (event) {
  let data = {
    title: 'SIKAP Pesantren',
    body: 'Ada pengingat baru dari sistem SIKAP.',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    url: '/dashboard'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = Object.assign(data, parsed);
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/assets/icons/icon-192x192.png',
    badge: data.badge || '/assets/icons/icon-72x72.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || (data.data && data.data.url) || '/dashboard',
    },
    tag: data.tag || 'sikap-notif-' + Date.now(),
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
