angular.module('App')
  .controller('eventController', function ($scope, $stateParams, userService, $state, mappingTools, $http, socket) {
    userService
      .authenticate()
      .then(function (user) { 
        $scope.user = user; 
      });
    $scope.id = $stateParams.eventId;
    //$scope.event = $state.params.event
    $scope.event = {};
    $scope.messages = [];
    $scope.topBidder = false;
    $scope.maxBid = null;
    $scope.todaysDate = new Date();
    $scope.dateCheck = false;

    $scope.checkDate = function() {
      console.log('todays date ', $scope.todaysDate.getTime());
      console.log('event date is ', $scope.event.time.getTime())
      console.log($scope.todaysDate - $scope.event.time);
      if ($scope.todaysDate - $scope.event.time < 0) {
        return true;
      }
      return false;
    };
      
    mappingTools.getEvent($scope.id).then(function(data) {
      $scope.event = data;
    });
    mappingTools.getUserBidInfo($scope.id)
      .then(function(data) {
        if (data) {
          $scope.topBidder = true;
          $scope.maxBid = data.maxBid;
        }
      });

    mappingTools.getMessages($scope.id).then(function(data) {
      $scope.messages = data;
      console.log(data);
    });
      
    $scope.save = function() {
      mappingTools.saveEvent($scope.event, $scope.id).then(function() {
        alert('TEST SAVE');
      });
    };
      

    $scope.saveMessage = function() {
      console.log($scope.user.data.user.picture);
      $http.post('/message', {event: $scope.id, user: '', text: $scope.message.text, picture: $scope.user.data.user.picture}, {contentType: 'application/json'})
        .then(function (response) {
          console.log('Post Successful: ', response);  
        })
        .then(() =>{
          socket.emit('postComment', {
            id: $scope.id,
            user: $scope.user.data.user,
            eventName: $scope.event.name
          });
        })
        .catch(function (err) {
          console.error('Post Failed: ', err);
        });
    };
    $scope.makeBid = function() {
      const bid = $scope.bid ? $scope.bid.text : 0;
      const event = $scope.id;

      $http.post('/bid', {event, bid}, {contentType: 'application/json'})
        .then(function (response) {
          $scope.event = response.data;
          console.log('Post Successful: ', response); 
          $scope.bid.text = ''; 
          mappingTools.getUserBidInfo($scope.id)
            .then(function(data) {
              if (data) {
                $scope.topBidder = true;
                $scope.maxBid = data.maxBid;
              }
            });
        })
        .catch(function (err) {
          console.error('Post Failed: ', err);
        });
    };

    $scope.saveRating = function() {
      $http.put('/events/' + $scope.id, {event: $scope.id, user: '', rating: $scope.rating}, {contentType: 'application/json'})
        .then(function (response) {
          console.log('Rating Successful: ', response);
          $scope.event = response.data;
          if (response.status === 200) {
            alert('Thanks for rating this event!');
          } else if (response.status === 400) {
            alert('You already rated this event');
          }
          else if (response.status === 401) {
            alert('Only confirmed users can rate this !');
          }
        })
        .catch(function(err) {
          console.error('Post Failed: ', err);
        });
    };

    $scope.showData = function(eventId, participantName ) {
      console.log('dnwbuiy');
      $http.put('/confirmParticipant', {eventId: eventId, participantName: participantName}, {contentType: 'application/json'})
        .then(function (response) {
          console.log('Put Successful: ', response);
        })
        .catch(function (err) {
          console.error('Post Failed: ', err);
        });
    };
  });