const webpush = require('web-push');

webpush.setGCMAPIKey(FCM_SERVER_ID);
webpush.setVapidDetails (
  'mailto:jason@localhost'
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

exports.sendNotification = function (pushSub) {
  webpush.sendNotification (pushSub, 'Test Message');
}
