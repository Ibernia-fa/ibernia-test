/* Minimal service worker for Web Push - used when Angular SW is not active (e.g. dev mode) */
self.addEventListener('push', function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: { url: data.url || '/' }
      };
      event.waitUntil(self.registration.showNotification(data.title || 'Notification', options));
    } catch (e) {
      event.waitUntil(self.registration.showNotification('Notification', { body: event.data?.text() || '' }));
    }
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
