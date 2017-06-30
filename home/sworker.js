// Placeholder using Google Developer template 



'use strict';

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);



  var title = 'hi';  
  var body = 'hi';  

 
  self.registration.showNotification(title, {  
    body: body,  
  });  
});


