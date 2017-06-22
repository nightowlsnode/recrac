angular.module('App').
controller('HomeController', ['$scope', '$rootScope', 'userService', 'mappingTools', 'Data',
function ($scope, $rootScope, userService, mappingTools, Data) {
  var markers = {};
  userService //authentication
    .authenticate()
    .then(function (user) { $scope.user = user });

  $scope.tiles = mappingTools.defaultTile; //map set up tiles from mapbox
  $scope.defaults = { scrollWheelZoom: false
                      } //map set up turn off scroll wheel zoom.
  $scope.currentLoc = mappingTools.defaultLoc; //map set up deault location.


  mappingTools //get current loc from browser
    .getCurrentPosition().then((position) => {
      $scope.currentLoc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                zoom: 12
            } 
      markers['curr'] = { //put a marker down at the curr loc't
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        message: "You are here!",
        icon: {type: 'awesomeMarker',
                    icon: 'star',
                    markerColor: 'white'},

        focus: true
      }         
        });

  var markers = mappingTools.eventToMarker(Data); //get markers from database
 
  $scope.markers = markers; //add them to the scope

}]);
            