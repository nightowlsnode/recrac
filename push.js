
const webpush = require('web-push');
const User = require('./models/user');

webpush.setGCMAPIKey(process.env.FCM_SERVER_ID);
webpush.setVapidDetails (
  'mailto:jason@localhost',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
exports.sendNotification = function (text) {
  console.log('received');
  //User.findById('5953c0d3b878af1340fa090f')
  User.find({ pushSub: { $ne: null } })  
    .then(users => {        
      users.map(user => webpush.sendNotification(user.pushSub, text));
    });
  //.then(pushSub => webpush.sendNotification (pushSub, text));
};
