
const webpush = require('web-push');
const User = require('./models/user');

webpush.setGCMAPIKey(process.env.FCM_SERVER_ID);
webpush.setVapidDetails (
  'mailto:jason@localhost',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
exports.sendNotification = function () {
  console.log('received')
  User.findById('5953c0d3b878af1340fa090f')  
    .then(user => {
      return user.pushSub;
    })
    .then(pushSub => webpush.sendNotification (pushSub, 'Test Message'));
};
