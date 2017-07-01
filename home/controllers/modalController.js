angular.module('App')
  .controller('CreateModal', function($scope, $mdDialog, $interval, $mdToast, userService, socket) {
    socket.on('addAlert', (alert)=>{ showSimpleToast(alert); });
    
    var last = {
      bottom: false,
      top: true,
      left: false,
      right: true
    };

    $scope.toastPosition = angular.extend({}, last);

    $scope.getToastPosition = function() {
      sanitizePosition();

      return Object.keys($scope.toastPosition)
        .filter(function(pos) { return $scope.toastPosition[pos]; })
        .join(' ');
    };

    function sanitizePosition() {
      var current = $scope.toastPosition;

      if ( current.bottom && last.top ) {current.top = false;}
      if ( current.top && last.bottom ) {current.bottom = false;}
      if ( current.right && last.left ) {current.left = false;}
      if ( current.left && last.right ) {current.right = false;}

      last = angular.extend({}, current);
    }

    const showSimpleToast = function(alert) {
      var pinTo = $scope.getToastPosition();

      $mdToast.show(
        $mdToast.simple()
          .textContent(`${alert.user} left a message on ${alert.eventName} event`)
          .position(pinTo )
          .hideDelay(3000)
      );
    };

    $scope.showAdvanced = function(ev) {
      $mdDialog.show({
        controller: DialogController,
        templateUrl: './templates/create.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose: true
      });
    };
    $scope.showAdvancedBid = function(ev) {
      $mdDialog.show({
        controller: BidControllerRender(ev),
        templateUrl: './templates/bids.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose: true
      });
    };
    function BidControllerRender(ev) {
      return function BidController($scope, $http, $mdDialog, mappingTools) {
        userService
          .authenticate()
          .then(function (user) { $scope.user = user; });

        $scope.topBidder = false;
        $scope.maxBid = null;
        $scope.event = ev;
        mappingTools.getUserBidInfo($scope.event._id)
          .then(function(data) {
            if (data) {
              $scope.topBidder = true;
              $scope.maxBid = data.maxBid;
              console.log(data);
            }
          });
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
      };

      // alert("test");
      $scope.cancel = function() {
        $mdDialog.cancel();
      };
    }

    function DialogController($scope, $http, $mdDialog) {
      userService
        .authenticate()
        .then(function (user) { $scope.user = user; });

      // alert("test");
      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.saveEvent = function() {

        var req = {
          method: 'POST',
          url: '/events',
          headers: {
            'Content-Type': 'application/json'
          },
          data: $scope.event
        };

        $http(req).then(function(success, error) {
          if (error) {
            console.log(error);
            return;
          }
          console.log(success);

          $mdDialog.cancel();

        });
      };
    }
  });