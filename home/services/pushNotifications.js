angular.module('App')
  .factory ('pushNotifications', function ($rootScope) {
    const applicationServerKey = 'BDp0w78QW3zcmNKls3-GeSjXSmLQyWHEs7sxTY00LnONZ4u5_WDJOlSxLQdS_rfGo7L2uaynENhibULYm08-upA';
    var swRegistration = null;

    //helper function  to convert key to expected input of subscribe call (From Google Developers on Push Notifications)

    const urlB64ToUint8Array = function (base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);

      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    // // const registerWorker = function () { 
    // //   if ('serviceWorker' in navigator && 'PushManager' in window) {
    // //     console.log('Service Worker and Push is supported');

    // //     navigator.serviceWorker.register('sworker.js')
    // //       .then(function(swReg) {
    // //         console.log('Service Worker is registered', swReg);

    // //         swRegistration = swReg;
    // //       })
    // //       .catch(function(error) {
    // //         console.error('Service Worker Error', error);
    // //       });
    // //   } else {
    // //     console.warn('Push messaging is not supported');
    // //     pushButton.textContent = 'Push Not Supported';
    // //   }
    // // };
    // // // const askPermission = function () {
    // //   return new Promise(function(resolve, reject) {
    // //     const permissionResult = Notification.requestPermission(function(result) {
    // //       resolve(result);
    // //     });

    // //     if (permissionResult) {
    // //       permissionResult.then(resolve, reject);
    // //     }
    // //   })
    // //     .then(function(permissionResult) {
    // //       if (permissionResult !== 'granted') {
    // //         throw new Error('We weren\'t granted permission.');
    // //       }
    // //     });
    // // };
    const subscribeUserToPush = function () {
      const options = {
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(applicationServerKey)
      };
      return swRegistration.pushManager.subscribe(options)
        .then(function(pushSubscription) {
          console.log('Received Sub');
          
          return pushSubscription;
        });
    };
    const postSubscriptionToServer = function (subscription) {
      const data = { _id: $rootScope.userId, subscription};
      console.log(data);
      return fetch('/subs', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    };

    // Check to see if browser has Push and SW Support & register SW
    const setupSubscription = function () {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('supported');
        navigator.serviceWorker.register('sworker.js')
          .then(function(swReg) {
            console.log('SW is registered', swReg);
            swRegistration = swReg;
          })
          .then(subscribeUserToPush)
          .then(postSubscriptionToServer)
          .catch(function(error) {
            console.error('Service Worker Error', error);
          });
      } else {
        console.warn('Not supported');
      }
    };

  

    return {
      setupSubscription
    };
  });