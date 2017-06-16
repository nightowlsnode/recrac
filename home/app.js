angular.module('App', ['ui.router'])
.config(function($stateProvider) {
  $stateProvider
    .state({
      name: 'history',
      url: '/history',
      template: '<history-directive ></history-directive>',
      // messages="$resolve.messages"
      //resolve: {
      //  // messages: function (FetchService) {
      //  //  return FetchService.getMessages();
      // }
    }
  })
  .state({
    name: 'login',
    url: '/login',
    template:'./templates/login.html'

  })
  .state({
    name: 'home',
    url: '/',
    template: './templates/index.html'
  })
})
