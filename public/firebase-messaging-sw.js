// Service worker placeholder for browser push.
// The app uses the native Notification API in foreground (see useNotification hook),
// so this worker is only consulted by the platform when a real push event arrives.
// Kept here so the file path is reserved if FCM is wired up later.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { notification: { title: 'Chatroom', body: event.data?.text() || '' } };
  }
  const title = data.notification?.title || 'Chatroom';
  const body = data.notification?.body || '';
  event.waitUntil(self.registration.showNotification(title, { body, icon: '/favicon.svg' }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
      return null;
    }),
  );
});
