  angular.module('lrwebApp')
    .controller('HeaderCtrl', ['$scope', '$log', '$location', 'userService', function ($scope, $log, $location, userService) {

       $scope.isLoggedIn = userService.isLoggedIn();
       $scope.isAdmin = userService.isAdmin();     

       var user = userService.getUser();    
       $scope.username = user.firstName || user.name;    

        $scope.signout = function(){
          //signout the user
          userService.signout().finally(function() {            
            $log.debug('After logging out ' + JSON.stringify(userService.getUser()));
            $location.path('/');
          });
          return false;
        };

        $scope.$on('user:updated', function() {
          var u = userService.getUser();
          $scope.isLoggedIn = u.isLoggedIn;
          $scope.username = u.firstName || u.name;
          $scope.profilePic = user.profilePic;
          $scope.initials = user.initials;
          $scope.isLoggedIn = userService.isLoggedIn();
          $scope.isAdmin = userService.isAdmin();
      });

     
    }]);
            
    






   