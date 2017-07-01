self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');

  const title = 'Events';
  const options = {
    body: 'new event for you',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

