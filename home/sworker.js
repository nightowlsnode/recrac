self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');

  const title = 'New Event';
  const options = {
    body: event.data.text(),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

