'use strict';

/**
 * @ngdoc function
 * @name lrwebApp.controller:LrhomeCtrl
 * @description
 * # LrhomeCtrl
 * Controller of the lrwebApp
 */
angular.module('lrwebApp')
  .controller('LrhomeCtrl',['$scope', '$log', '$location', 'userService', 'lrService',
    function ($scope, $log, $location, userService, lrService){
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];    

    $scope.msg = "";
    $scope.filter = {};
    $scope.statusList = [ "Open", "Approved", "Rejected"];
    $scope.checkedLRIdList = [];

    $scope.isAdmin = userService.isAdmin();


    $scope.searchLR = function() {
      $scope.msg = "";
      lrService.searchLR($scope.lr).then(function(u) {
        $scope.lr = lrService.getLR();       
        $location.path('/editlr');
      }, function(res) {      
        $log.debug('Issue while getting LR data' + JSON.stringify(res));
        $scope.msg = res.msg;
      });

      return false;
    };

    $scope.getLRByDate = function() {
      $scope.msg = "";
      $scope.filter.multiLoad = "false";
      $scope.filter.isLRAttached = "false";
      $scope.LRList = null;

      lrService.getLRList($scope.filter).then(function(u) {
        if(u && u.length > 0) {
          $log.debug('Got LR List');
          $scope.msg = "";
          $scope.LRList = u;          
        } else {
          $scope.msg = "No data found"          
        }
        
      }, function(res) {
        $log.debug('Issue while getting LR data' + JSON.stringify(res));
        $scope.msg = res.msg;
      });

      return false;
    };
    
    $scope.setLR = function(lrData) {          
        lrService.showLR(lrData);
        $location.path('/editlr');   
        return false;
     };

     $scope.updateStatusInLRList = function(status) {
      $scope.msg = "";
      $scope.filter.multiLoad = "false";
      $scope.filter.isLRAttached = "false";
      $scope.LRList = null;
      lrService.updateStatusInLRList($scope.checkedLRIdList,status,$scope.filter).then(function(u) {
        if(u && u.length > 0) {
          $log.debug('Got LR List');
          
          $scope.msg = "";
          $scope.msg = u.message;
          $scope.LRList = u; 
        } else {
          $scope.msg = "No data found"
        }
        
      }, function(res) {
        $log.debug('Issue while getting LR data' + JSON.stringify(res));
        $scope.msg = res.msg;    
      });
      $scope.checkedLRIdList = [];
      return false;
    };

    $scope.toggleCheck = function (lrId) {
      if ($scope.checkedLRIdList.indexOf(lrId) === -1) {
          $scope.checkedLRIdList.push(lrId);
      } else {
          $scope.checkedLRIdList.splice($scope.checkedLRIdList.indexOf(lrId), 1);
      }
    };

    $scope.sort = function(keyname){
      $scope.sortKey = keyname;   //set the sortKey to the param passed
      $scope.reverse = !$scope.reverse; //if true make it false and vice versa      
    };


  }]);

