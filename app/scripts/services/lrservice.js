'use strict';

/**
 * @ngdoc service
 * @name lrwebApp.userservice
 * @description
 * # userservice
 * Service in the lrwebApp.
 */
angular.module('lrwebApp')
  .service('lrService', ['$rootScope', '$http', '$q', '$log', '$timeout', '$cacheFactory','userService', function ($rootScope, $http, $q, $log, $timeout, $cacheFactory, userService) {
    // AngularJS will instantiate a singleton by calling "new" on this function

    var _defResult = {
           'sts' : false,
           'code': 0,
           'msg': 'Unexpected error.'
    };

    var lr          = {};
    var transaction = {};
    var cache = $cacheFactory('consignerSearchData')

    function _parseErrorResponse(o) {
      //parse error response and return in expected format
      var ret = _defResult, err = {};

       if(angular.isUndefined(o) || o === null) {
        return ret;
      }  

      if(o.code) {
        ret.code = o.code;
      }
      if(angular.isUndefined(o.error)){
        return ret;
      }
      
      if(angular.isObject(o.error) && o.error.message){
        ret.msg = o.error.message;
      } else if(angular.isString(o.error)){
        ret.msg = o.error;
        try {
          err = angular.fromJson(o.error);
          if(err && (err.message||err.errorCode)) {
            ret.msg = (err.message || err.errorCode);
          }
        }catch(e){}
      }

      return ret;
    }

    function _updateLRInfo(LR) {
      
      lr.lrNo         = LR.id;
      lr.lrDate       = LR.lrDate;
      lr.transid      = LR.transid || '';
      lr.status       = LR.status;
      lr.vehicleNo    = LR.vehicleNo;
      lr.vehicleOwner = LR.vehicleOwner;
      lr.consigner    = LR.consigner;
      lr.consignee    = LR.consignee;     
      lr.billingParty = LR.billingParty;    
      
      lr.poNo         = LR.poNo;
      lr.doNo         = LR.doNo;
      lr.billingname  = LR.billingname;
      lr.multiLoad    = LR.multiLoad;      
    }

    function _updateLRExpenditureInfo(LR) {

      lr.freightToBroker    = LR.freightToBroker || 0;
      lr.extraPayToBroker   = LR.extraPayToBroker || 0;
      lr.advance            = LR.advance || 0;
      lr.balanceFreight     = LR.balanceFreight || 0;
      lr.loadingCharges     = LR.loadingCharges;
      lr.unloadingCharges   = LR.unloadingCharges;
      lr.loadingDetBroker   = LR.loadingDetBroker;   
      lr.unloadingDetBroker = LR.unloadingDetBroker;      
    }

    function _updateLRIncomeInfo(LR) {      

      lr.freightToBrokerBilling    = LR.freightToBroker;
      //lr.extraPayToBrokerBilling   = LR.extraPayToBroker;
      lr.loadingChargesBilling     = LR.loadingCharges;
      lr.unloadingChargesBilling   = LR.unloadingCharges;
      lr.loadingDetBrokerBilling   = LR.loadingDetBroker;   
      lr.unloadingDetBrokerBilling = LR.unloadingDetBroker;       
    }

    function _updateLROtherExpenditureList(LROtherExpenditure) {
      lr.otherExpenditures  = LROtherExpenditure;
    }

    function _updateLROtherIncomeList(LROtherIncome) {      

      lr.otherIncomes  = LROtherIncome;      
    }
    
    function _updateLRList(LRList) {
      lr.LRList  = LRList;      
    }
    
    function _updateLRChalanDetails(LRChalan) {
      lr.chalan  = LRChalan; 
      lr.chalan.chalanDetails  =  JSON.parse(LRChalan.chalanDetails);   
    }

    function _updateLRBillDetails(LRBill) {
      lr.bill  = LRBill; 
      lr.bill.billDetails =   JSON.parse(LRBill.billDetails);     
    }

    function _createLR(lrData) {     
      var vehileNo     = lrData.vehicleNo || '';
      var vehicleOwner = lrData.vehicleOwner || '';
      var consignerId  =  '';
      var consigneeId  =  '';      
      var billingParty = lrData.billingParty || '';
      var poNo         = lrData.poNo || '';
      var doNo         = lrData.doNo || '';
      var billignameId = '';
      var status       = 'Open';

      var multiLoad = 'false';
      if(lrData.multiLoad) {
        multiLoad = 'true';
      }


      if(angular.isObject(lrData.consigner)) {
        consignerId = lrData.consigner.id || '';
      }

      if(angular.isObject(lrData.consignee)) {
        consigneeId = lrData.consignee.id || '';  
      }

      if(angular.isObject(lrData.billingname)) {
        billignameId = lrData.billingname.id || '';  
      }

      var ret = _defResult, d = $q.defer();

      //set progress
      $timeout(function() {
        d.notify('On progress..');
      }, 0);
      
      var data = 'vehileNo='       +  vehileNo                    +
                 '&vehicleOwner='  +  vehicleOwner                +
                 '&consignerId='   +  consignerId                 +
                 '&consigneeId='   +  consigneeId                 +                 
                 '&billingParty='  +  billingParty                +
                 '&poNo='          +  poNo                        +
                 '&doNo='          +  doNo                        +
                 '&billingnameId=' +  billignameId                +
                 '&multiLoad='     +  multiLoad                   +
                 '&userName='      +  userService.getUser().name  +
                 '&status='        +  status                      ;

      console.log("data for create LR "+data);

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/newlr', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LR Info + ' + JSON.stringify(data));

        var result = data.data;

        if(result.code !== 1) {
          d.reject(ret);
          return;
        }
        
        /*Update LR info*/
        _updateLRInfo(result.lr);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });

      return d.promise;
    }

    function _createExpenditure(lrData) {     
      var lrNo               = lrData.lrNo || '';
      var freightToBroker    = lrData.freightToBroker || '';
      var extraPayToBroker   = lrData.extraPayToBroker || '';
      var advance            = lrData.advance || '';
      var balanceFreight     = lrData.balanceFreight || '';
      var loadingCharges     = lrData.loadingCharges || '';     
      var unloadingCharges   = lrData.unloadingCharges || '';
      var loadingDetBroker   = lrData.loadingDetBroker || '';
      var unloadingDetBroker = lrData.unloadingDetBroker || '';
      
      var ret = _defResult, d = $q.defer();     
      
      var data = 'lrNo=' +  lrNo +
                 '&freightToBroker=' + freightToBroker +
                 '&extraPayToBroker=' + extraPayToBroker +
                 '&advance=' + advance +
                 '&balanceFreight=' + balanceFreight +
                 '&loadingCharges=' + loadingCharges +
                 '&unloadingCharges=' + unloadingCharges +
                 '&loadingDetBroker=' + loadingDetBroker +
                 '&unloadingDetBroker=' + unloadingDetBroker ;

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/addlrexpenditure', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LR Info + ' + JSON.stringify(data));

        var result = data.data;

        if(result.code !== 1) {
          d.reject(ret);
          return;
        }        
        
        _updateLRExpenditureInfo(result.lrExpenditure);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });

      return d.promise;
    }

    function _createIncome(lrData) {      
      var lrNo                      = lrData.lrNo || '';
      var freightToBrokerBilling    = lrData.freightToBrokerBilling || '';
      var extraPayToBrokerBilling   = lrData.extraPayToBrokerBilling || '';      
      var loadingChargesBilling     = lrData.loadingChargesBilling || '';     
      var unloadingChargesBilling   = lrData.unloadingChargesBilling || '';
      var loadingDetBrokerBilling   = lrData.loadingDetBrokerBilling || '';
      var unloadingDetBrokerBilling = lrData.unloadingDetBrokerBilling || '';    

      var ret = _defResult, d = $q.defer();     
      
      var data = 'lrNo=' +  lrNo +
                 '&freightToBrokerBilling=' + freightToBrokerBilling +
                 '&extraPayToBrokerBilling=' + extraPayToBrokerBilling +                 
                 '&loadingChargesBilling=' + loadingChargesBilling +
                 '&unloadingChargesBilling=' + unloadingChargesBilling +
                 '&loadingDetBrokerBilling=' + loadingDetBrokerBilling +
                 '&unloadingDetBrokerBilling=' + unloadingDetBrokerBilling ;


      console.log(data);

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/addlrincome', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LR Info + ' + JSON.stringify(data));

        var result = data.data;

        if(result.code !== 1) { 
          d.reject(ret);
          return;
        }        

        _updateLRIncomeInfo(result.lrIncome);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });

      return d.promise;
    }

    function _createOtherExpenditure(lrData) {
      var lrNo         = lrData.lrNo || '';
      var otherAmount  = lrData.otherAmount || '';
      var otherRemarks = lrData.otherRemarks || '';
    
      var ret = _defResult, d = $q.defer();
      
      var data = 'lrNo=' +  lrNo +
                 '&amount=' + otherAmount +
                 '&remarks=' + otherRemarks ;

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/addlrothers', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LR Info + ' + JSON.stringify(data));

        var result = data.data;

        $log.debug(result);
        $log.debug(result.code);

        if(result.code !== 1) {
          d.reject(ret);
          return;
        }     

        _updateLROtherExpenditureList(result.lrOthers);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }

    function _removeOtherExpenditure(lrOtherExpenditureId,lrNo) {
      var ret = _defResult, d = $q.defer();
      
      var data = 'lrOtherExpenditureId=' +  lrOtherExpenditureId +
                 '&lrNo=' + lrNo;

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/removelrothers', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LR Info + ' + JSON.stringify(data));

        var result = data.data;

        if(result.code !== 1) {
          //some error
          d.reject(ret);
          return;
        }     

        _updateLROtherExpenditureList(result.lrOthers);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }


    function _createOtherIncome(lrData) {
      var lrNo         = lrData.lrNo || '';
      var otherAmount  = lrData.otherAmountBilling || '';
      var otherRemarks = lrData.otherRemarksBilling || '';
    
      var ret = _defResult, d = $q.defer();
      
      var data = 'lrNo=' +  lrNo +
                 '&amount=' + otherAmount +
                 '&remarks=' + otherRemarks ;

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/addlrotherincome', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LRIncome Info + ' + JSON.stringify(data));

        var result = data.data;

        if(result.code !== 1) { 
          d.reject(ret);
          return;
        }     

        _updateLROtherIncomeList(result.lrOtherIncome);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }

    function _removeOtherIncome(lrOtherIncomeId,lrNo) {
      var ret = _defResult, d = $q.defer();
      
      var data = 'lrOtherIncomeId=' +  lrOtherIncomeId +
                 '&lrNo=' + lrNo;

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/removelrotherincome', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LR Info + ' + JSON.stringify(data));

        var result = data.data;

        $log.debug(result);
        $log.debug(result.code);

        if(result.code !== 1) {
          d.reject(ret);
          return;
        }     

        _updateLROtherIncomeList(result.lrOtherIncome);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }
  
    function _getLRList(filter) {
      var ret = _defResult, d = $q.defer();

      var lrDate       = '';
      var multiLoad    = '';
      var status       = '';
      var isLRAttached = '';

      if (filter) {
        if (filter.date && filter.date.length) {
          lrDate = filter.date;
        }
        
        if (filter.multiLoad && filter.multiLoad.length) {
          multiLoad = filter.multiLoad;  
        }
        if (filter.status && filter.status.length)  {
          status = filter.status;  
        }
        if (filter.isLRAttached && filter.isLRAttached.length)  {
          isLRAttached = filter.isLRAttached;  
        }        
      }

      
      if(lrDate && lrDate.length > 0) {
        //date = new Date(frmdate.replace(pattern,'$3-$2-$1'));
        var date = new Date(lrDate);
        if (isNaN(date.valueOf())) {          
          ret.msg = 'Date is not valid';
          d.reject(ret);
          return d.promise;
        }
      }    
      
      var data = 'lrDate='     +  lrDate    +
                 '&multiLoad=' +  multiLoad +
                 '&status='    +  status    +
                 '&isLRAttached='   +  isLRAttached ;

      console.log(data);
      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/list', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LR LIST Info + ' + JSON.stringify(data));

        var result = data.data;

        $log.debug(result);
        $log.debug(result.code);

        /*if(result.code !== 1) {
          some error
          d.reject(ret);
          return;
        }*/

        d.resolve(result.lrs);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }

    function _updateLR(lrData) {

      var lrNo = lrData.lrNo || '';
      var vehileNo = lrData.vehicleNo || '';
      var vehicleOwner = lrData.vehicleOwner || '';
      var consignerId =  '';
      var consigneeId =  '';      
      var billingParty = lrData.billingParty || '';
      var poNo         = lrData.poNo || '';
      var doNo         = lrData.doNo || '';
      var billingnameId =  ''; 
      var multiLoad = 'false';

      if(lrData.multiLoad.length && lrData.multiLoad === "true") {
        multiLoad = 'true';
      }

      if(angular.isObject(lrData.consigner)) {
        consignerId = lrData.consigner.id || '';
      }

       if(angular.isObject(lrData.consignee)) {
        consigneeId = lrData.consignee.id || '';  
      }

      if(angular.isObject(lrData.billingname)) {
        billingnameId = lrData.billingname.id || '';  
      }             

      var ret = _defResult, d = $q.defer();
     
      var data = 'lrNo=' +  lrNo + 
                 '&vehileNo=' +  vehileNo +
                 '&vehicleOwner=' + vehicleOwner +
                 '&consignerId=' + consignerId +
                 '&consigneeId=' + consigneeId +                
                 '&billingParty=' + billingParty +
                 '&poNo='         + poNo +
                 '&doNo='         + doNo +
                 '&billingnameId='+ billingnameId +
                 '&multiLoad='    + multiLoad+
                 '&userName='     + userService.getUser().name;
      console.log(data);
      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/updatelr', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LR Info + ' + JSON.stringify(data));

        var result = data.data;

        $log.debug(result);
        $log.debug(result.code);

        if(result.code !== 1) {
          d.reject(ret);
          return;
        }
        
        _updateLRInfo(result.lr);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });

      return d.promise;
    }

    var _getConsignerList = function(handleConsignerSuccess, handleConsignerError) {      
      var searchData = cache.get('consignerSearchData');
      if(searchData) {        
        handleConsignerSuccess(searchData);
        return;
      }

      $http({
        method: 'GET',
        url:'http://localhost:8080/LRService/v1/listconsinors',
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' : userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).success(function (data, status){        
        var processedData = data.consigners; //may be we can use a process function        
        cache.put('consignerSearchData', processedData);
        handleConsignerSuccess(processedData);
      }).error(function (data, status){
        handleError(data);
      });

    };

    var _getConsigneeList = function(handleConsigneeSuccess, handleConsigneeError) {      
      var searchData = cache.get('consigneeSearchData');
      if(searchData) {      
        handleConsigneeSuccess(searchData);
        return;
      }

      $http({
        method: 'GET',
        url:'http://localhost:8080/LRService/v1/listconsinees',
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' : userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).success(function (data, status){        
        var processedData = data.consignees; //may be we can use a process function
        console.log("consignee data"+JSON.stringify(processedData));
        cache.put('consigneeSearchData', processedData);
        handleConsigneeSuccess(processedData);
      }).error(function (data, status){
        handleConsigneeError(data);
      });

    };

    var _getBillingnameList = function(handleBillingnameSuccess, handleBillingnameError) {      
      var searchData = cache.get('billingnameearchData');
      if(searchData) {
        $log.debug("Got billingname list from cache");
        handleBillingnameSuccess(searchData);
        return;
      }

      $http({
        method: 'GET',
        url:'http://localhost:8080/LRService/v1/listbillingnames',
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' : userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).success(function (data, status){        
        var processedData = data.billingnames; //may be we can use a process function        
        cache.put('billingnameSearchData', processedData);
        handleBillingnameSuccess(processedData);

      }).error(function (data, status){
        handleBillingnameError(data);
      });

    };

    function _searchLR(lrData) {    
      var lrNo = lrData.lrNo || '';

      var ret = _defResult, d = $q.defer();

      if(!lrNo.length) {
        ret.msg = 'Invalid input!';
        d.reject(ret);
      }

      var data = 'lrNo=' +  lrNo

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/searchlr', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('Searched LR Data + ' + JSON.stringify(data));

        var result = data.data;

        if(result.code !== 1) {
          d.reject(ret);
          return;
        }

        if(!angular.isUndefined(result.lr) && result.lr != null) { _updateLRInfo(result.lr); }
        if(!angular.isUndefined(result.lrExpenditure) && result.lrExpenditure != null) { _updateLRExpenditureInfo(result.lrExpenditure); }
        if(!angular.isUndefined(result.lrOthers) && result.lrOthers != null ) {  _updateLROtherExpenditureList(result.lrOthers); }
       
        if(!angular.isUndefined(result.lrIncome) && result.lrIncome != null) {  _updateLRIncomeInfo(result.lrIncome); }
        if(!angular.isUndefined(result.lrOtherIncome) && result.lrOtherIncome != null) {  _updateLROtherIncomeList(result.lrOtherIncome); }
        if(!angular.isUndefined(result.lrChalan) && result.lrChalan != null) {  _updateLRChalanDetails(result.lrChalan); }
        if(!angular.isUndefined(result.lrBill) && result.lrBill != null) {  _updateLRBillDetails(result.lrBill);}

        ret.sts = true;
        d.resolve(ret);     

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;

    };
    
    function _showLR(lrData) {       
        lrData.lrNo = lrData.id;      
        lr = lrData;
        if(!angular.isUndefined(lrData.chalan) && lrData.chalan != null) {  _updateLRChalanDetails(lrData.chalan); }
        if(!angular.isUndefined(lrData.bill) && lrData.bill != null) {  _updateLRBillDetails(lrData.bill); }
        if(!angular.isUndefined(lrData.lrOthers) && lrData.lrOthers != null) {  _updateLROtherExpenditureList(lrData.lrOthers); }
        if(!angular.isUndefined(lrData.lrOtherIncome) && lrData.lrOtherIncome != null) {  _updateLROtherIncomeList(lrData.lrOtherIncome); }

     };

    function _createChalan(lrNos,expenditureColumn,otherExpenditureColumn) {
      var columns = expenditureColumn;

      if(!angular.isUndefined(otherExpenditureColumn) && otherExpenditureColumn != null) {
        columns = columns.concat(otherExpenditureColumn);
      }
      
      var jsonData=angular.toJson(columns);      
    
      var ret = _defResult, d = $q.defer();

      var data = 'lrNos='           +  lrNos   +
                 '&chalanDetails='  +  jsonData;     
      
      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/createChalan', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LRChalan Info + ' + JSON.stringify(data));

        var result = data.data;

        $log.debug(result);
        $log.debug(result.code);

        if(result.code !== 1) {
          d.reject(ret);
          return;
        }     

        _updateLRChalanDetails(result.lrChalan);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }

    function _createBill(lrNos,billingColumn,otherBillingColumn) {    
      var columns = billingColumn;

      if(!angular.isUndefined(otherBillingColumn) && otherBillingColumn != null) {
        columns = columns.concat(otherBillingColumn);
      } 
      
      var jsonData=angular.toJson(columns);      
    
      var ret = _defResult, d = $q.defer();

      var data = 'lrNos='         +  lrNos   +
                 '&billDetails='  +  jsonData;     

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/createBill', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LRBill Info + ' + JSON.stringify(data));

        var result = data.data;

        if(result.code !== 1) {
          d.reject(ret);
          return;
        }     

        _updateLRBillDetails(result.lrBill);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }


    function _updateTransaction(trans) {
      //transaction = trans;       
      /*var lrIds = [];
      $.each(trans.lrs, function(i, lr) {
        lrIds.push(lr.id);
      });
      transaction.lrIds = lrIds.join();*/
      transaction.id                 = trans.id;
      transaction.lrs                = trans.lrs;
      transaction.status             = trans.status;
      transaction.createDate         = trans.createDate;

      transaction.freightToBroker    = trans.freightToBroker;
      transaction.extraPayToBroker   = trans.extraPayToBroker;
      transaction.advance            = trans.advance;
      transaction.balanceFreight     = trans.balanceFreight;
      transaction.loadingCharges     = trans.loadingCharges;
      transaction.unloadingCharges   = trans.unloadingCharges;
      transaction.loadingDetBroker   = trans.loadingDetBroker;   
      transaction.unloadingDetBroker = trans.unloadingDetBroker;
      transaction.multiLoadCharge    = trans.multiLoadCharge;

      transaction.freightToBrokerBilling    = trans.freightToBroker;
      transaction.extraPayToBrokerBilling   = trans.extraPayToBroker;
      transaction.loadingChargesBilling     = trans.loadingCharges;
      transaction.unloadingChargesBilling   = trans.unloadingCharges;
      transaction.loadingDetBrokerBilling   = trans.loadingDetBroker;   
      transaction.unloadingDetBrokerBilling = trans.unloadingDetBroker; 
      transaction.multiLoadChargeBilling    = trans.multiLoadChargeBilling;
      transaction.billingname               = transaction.billingname;
      

    }

    function _createTransaction(checkedLRIdList) {      
      var ret = _defResult, d = $q.defer();      
            
      //input validation       
      if (!checkedLRIdList || checkedLRIdList.length <= 1) 
      {
        ret.msg = 'Please select at least 2 lr ids to create a multi lr';
        d.reject(ret);
      }

      var data = 'lrIds='   +  checkedLRIdList.join() + 
                 '&status='  +  'Open';
      console.log(data);

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/createtransaction', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('Transaction Data + ' + JSON.stringify(data));

        var result = data.data;        

        /*if(result.code !== 1) {
          //some error
          d.reject(ret);
          return;
        }*/
        
        _updateTransaction(result.transaction);
        d.resolve(result.transaction);

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;

    };

    function _editTransaction(transaction) {
      var id                        = transaction.id                        || '';
      var multiLoadCharge           = transaction.multiLoadCharge           || '';
      var freightToBroker           = transaction.freightToBroker           || '';
      var extraPayToBroker          = transaction.extraPayToBroker          || '';
      var advance                   = transaction.advance                   || '';
      var loadingCharges            = transaction.balanceFreight            || '';
      var loadingCharges            = transaction.loadingCharges            || '';     
      var unloadingCharges          = transaction.unloadingCharges          || '';
      var loadingDetBroker          = transaction.loadingDetBroker          || '';
      var unloadingDetBroker        = transaction.unloadingDetBroker        || '';
      var multiLoadChargeBilling    = transaction.multiLoadChargeBilling    || '';
      var freightToBrokerBilling    = transaction.freightToBrokerBilling    || '';
      var loadingChargesBilling     = transaction.loadingChargesBilling     || '';
      var unloadingChargesBilling   = transaction.unloadingChargesBilling   || '';
      var loadingDetBrokerBilling   = transaction.loadingDetBrokerBilling   || '';
      var unloadingDetBrokerBilling = transaction.unloadingDetBrokerBilling || '';   
      var billignameId =  '';

      if(angular.isObject(transaction.billingname)) {
        billignameId = transaction.billingname.id || '';  
      }  
      
      
      var ret = _defResult, d = $q.defer();     
      
      var data = 'id=' +  id +
                 '&multiLoadCharge='           + multiLoadCharge         +
                 '&freightToBroker='           + freightToBroker         +
                 '&extraPayToBroker='          + extraPayToBroker        +
                 '&advance='                   + advance                 +
                 '&balanceFreight='            + balanceFreight          +
                 '&loadingCharges='            + loadingCharges          +
                 '&unloadingCharges='          + unloadingCharges        +
                 '&loadingDetBroker='          + loadingDetBroker        +
                 '&unloadingDetBroker='        + unloadingDetBroker      +
                 '&multiLoadChargeBilling='    + multiLoadChargeBilling  +
                 '&freightToBrokerBilling='    + freightToBrokerBilling  +
                 '&loadingChargesBilling='     + loadingChargesBilling   +
                 '&unloadingChargesBilling='   + unloadingChargesBilling +
                 '&loadingDetBrokerBilling='   + loadingDetBrokerBilling +
                 '&unloadingDetBrokerBilling=' + unloadingDetBrokerBilling +
                 '&billingnameId='             + billignameId ;

      console.log(data);

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/edittransaction', data, config);

      $promise.then(function(data, status, headers, config) {        

        var result = data.data;

        /*
        if(result.code !== 1) {
          d.reject(ret);
          return;
        }*/

        $log.debug('Edit Transaction info + ' + JSON.stringify(result));
        

       _updateTransaction(result.transaction);
        d.resolve(result.transaction);

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });

      return d.promise;
    };

    
	function _updateStatusInLRList(checkedLRIdList,status,filter) {      
	  $log.debug("checkedLRIdList : " + checkedLRIdList)
	  var ret = _defResult, d = $q.defer();      
	        
	  //input validation       
	  if (!checkedLRIdList || checkedLRIdList.length <= 0) 
	  {
	    ret.msg = 'Please select at least 1 lr id to update status';
	    d.reject(ret);
	  }
	
	  var lrDate       = '';
	  var multiLoad    = '';      
	  var isLRAttached = '';
	
	  if (filter) {
	    if (filter.date && filter.date.length) {
	      lrDate = filter.date;
	    }
	    
	    if (filter.multiLoad && filter.multiLoad.length) {
	      multiLoad = filter.multiLoad;  
	    }        
	    if (filter.isLRAttached && filter.isLRAttached.length)  {
	      isLRAttached = filter.isLRAttached;  
	    }        
	  }
	
	  
	  if(lrDate && lrDate.length > 0) {
	    //date = new Date(frmdate.replace(pattern,'$3-$2-$1'));
	    var date = new Date(lrDate);
	    if (isNaN(date.valueOf())) {          
	      ret.msg = 'Date is not valid';
	      d.reject(ret);
	      return d.promise;
	    }
	  }    
	  
	  var data = 'lrDate='     +  lrDate    +
	             '&multiLoad=' +  multiLoad +
	             '&status='    +  status    +
	             '&isLRAttached='   +  isLRAttached +
	             '&lrIds='   +  checkedLRIdList.join(); 
	             
	
	  console.log(data);
	
	  var config = { 
	    headers: {
	      'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
	      'auth_token' :  userService.getAuthToken(),
	      'Content-Type': 'application/x-www-form-urlencoded'
	    }
	  };
	
	  var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/updateStatusInLRList', data, config);
	
	  $promise.then(function(data, status, headers, config) {
	    $log.debug('LRList data after update status + ' + JSON.stringify(data));
	
	    var result = data.data;       
	    
	
	    /*if(result.code !== 1) {
	      //some error
	      d.reject(ret);
	      return;
	    }*/
	    
	    d.resolve(result.lrs);
	
	  }, function(r) {
	    $log.debug('Error Info + ' + JSON.stringify(r.data));
	    ret = _parseErrorResponse(r.data);
	    d.reject(ret);
	  });
	  
	  return d.promise;
	
	};

   function _createTransOtherExpenditure(transaction) {
      var transId      = transaction.id || '';
      var otherAmount  = transaction.otherAmount || '';
      var otherRemarks = transaction.otherRemarks || '';
    
      var ret = _defResult, d = $q.defer();
      
      var data = 'transId=' +  transId +
                 '&amount=' + otherAmount +
                 '&remarks=' + otherRemarks ;

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/addLRTransOtherExp', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LRTransation Other Expenditure Info + ' + JSON.stringify(data));

        var result = data.data;

        $log.debug(result);
        $log.debug(result.code);

        if(result.code !== 1) {
          d.reject(ret);
          return;
        }     

        _updateLRTransOtherExpenditureList(result.lrTransOtherExp);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }

    function _updateLRTransOtherExpenditureList(LRTransOtherExpenditure) {
      transaction.otherExpenditures  = LRTransOtherExpenditure;
    }

    function _removeTransOtherExpenditure(lrTransOtherExpenditureId,transId) {
      var ret = _defResult, d = $q.defer();
      
      var data = 'lrTransOtherExpenditureId=' +  lrTransOtherExpenditureId +
                 '&transId=' + transId;

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/removeLRTransOtherExp', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LRTransOtherExpenditure Info + ' + JSON.stringify(data));

        var result = data.data;

        if(result.code !== 1) {
          //some error
          d.reject(ret);
          return;
        }     

        _updateLRTransOtherExpenditureList(result.lrTransOtherExp);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }

    function _createTransOtherIncome(transaction) {
      var transId      = transaction.id || '';
      var otherAmount  = transaction.otherAmountBilling || '';
      var otherRemarks = transaction.otherRemarksBilling || '';
    
      var ret = _defResult, d = $q.defer();
      
      var data = 'transId=' +  transId +
                 '&amount=' + otherAmount +
                 '&remarks=' + otherRemarks ;

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/addLRTransOtherIncome', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LRTransIncome Info + ' + JSON.stringify(data));

        var result = data.data;

        if(result.code !== 1) { 
          d.reject(ret);
          return;
        }     

        _updateLRTransOtherIncomeList(result.lrTransOtherIncome);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }

    function _updateLRTransOtherIncomeList(LRTransOtherIncome) {      

      transaction.otherIncomes  = LRTransOtherIncome;      
    }

    function _removeTransOtherIncome(lrTransOtherIncomeId,transId) {
      var ret = _defResult, d = $q.defer();
      
      var data = 'lrTransOtherIncomeId=' +  lrTransOtherIncomeId +
                 '&transId=' + transId;

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/removeLRTransOtherIncome', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LRTransIncome Info + ' + JSON.stringify(data));

        var result = data.data;

        $log.debug(result);
        $log.debug(result.code);

        if(result.code !== 1) {
          d.reject(ret);
          return;
        }     

        _updateLRTransOtherIncomeList(result.lrTransOtherIncome);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }

    function _createTransChalan(lrNos,expenditureColumn,otherExpenditureColumn,transId) {
      var columns = expenditureColumn;

      if(!angular.isUndefined(otherExpenditureColumn) && otherExpenditureColumn != null) {
        columns = columns.concat(otherExpenditureColumn);
      }
      
      var jsonData=angular.toJson(columns);      
    
      var ret = _defResult, d = $q.defer();

      var data = 'lrNos='           +  lrNos   +
                 '&chalanDetails='  +  jsonData+
                 '&transId='        +  transId;
      console.log(data);     
      
      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/createChalan', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LRChalan Info + ' + JSON.stringify(data));

        var result = data.data;

        $log.debug(result);
        $log.debug(result.code);

        if(result.code !== 1) {
          d.reject(ret);
          return;
        }     

        _updateLRTransChalanDetails(result.lrChalan);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }

    function _updateLRTransChalanDetails(LRTransChalan) {
      transaction.chalan  = LRTransChalan; 
      transaction.chalan.chalanDetails  =  JSON.parse(LRTransChalan.chalanDetails);   
    }

    function _createTransBill(lrNos,billingColumn,otherBillingColumn,transId) {    
      var columns = billingColumn;

      if(!angular.isUndefined(otherBillingColumn) && otherBillingColumn != null) {
        columns = columns.concat(otherBillingColumn);
      } 
      
      var jsonData=angular.toJson(columns);      
    
      var ret = _defResult, d = $q.defer();

      var data = 'lrNos='         +  lrNos   +
                 '&billDetails='  +  jsonData+
                 '&transId='      +   transId;     

      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/createBill', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LRBill Info + ' + JSON.stringify(data));

        var result = data.data;

        if(result.code !== 1) {
          d.reject(ret);
          return;
        }     

        _updateLRBillDetails(result.lrBill);
        ret.sts = true;
        d.resolve(ret);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }

    function _updateLRTransBillDetails(LRTransBill) {
      transaction.bill  = LRTransBill; 
      transaction.bill.billDetails =   JSON.parse(LRTransBill.billDetails);     
    }

    function _getTransactions(filter) {
      var ret = _defResult, d = $q.defer();

      var lrTransDate       = '';      
      var status       = '';      

      if (filter) {
        if (filter.date && filter.date.length) {
          lrTransDate = filter.date;
        }        
        if (filter.status && filter.status.length)  {
          status = filter.status;  
        }               
      }

      
      if(lrTransDate && lrTransDate.length > 0) {
        //date = new Date(frmdate.replace(pattern,'$3-$2-$1'));
        var date = new Date(lrTransDate);
        if (isNaN(date.valueOf())) {          
          ret.msg = 'Date is not valid';
          d.reject(ret);
          return d.promise;
        }
      }    
      
      var data = 'lrTransDate='     +  lrTransDate +                 
                 '&status='         +  status ;                 

      console.log(data);
      var config = { 
        headers: {
          'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
          'auth_token' :  userService.getAuthToken(),
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/listTransactions', data, config);

      $promise.then(function(data, status, headers, config) {
        $log.debug('LRTransaction LIST Info + ' + JSON.stringify(data));

        var result = data.data;

        $log.debug(result);
        $log.debug(result.code);

        /*if(result.code !== 1) {
          some error
          d.reject(ret);
          return;
        }*/

        d.resolve(result.lrTransactions);      

      }, function(r) {
        $log.debug('Error Info + ' + JSON.stringify(r.data));
        ret = _parseErrorResponse(r.data);
        d.reject(ret);
      });
      
      return d.promise;
    }

    function _showLRTransaction(lrTransData) {
        transaction = lrTransData;
        if(!angular.isUndefined(lrTransData.chalan) && lrTransData.chalan != null) {  _updateLRTransChalanDetails(lrTransData.chalan); }
        if(!angular.isUndefined(lrTransData.bill) && lrTransData.bill != null) {  _updateLRTransBillDetails(lrTransData.bill); }
        if(!angular.isUndefined(lrTransData.lrTransOtherExp) && lrTransData.lrTransOtherExp != null) {  _updateLRTransOtherExpenditureList(lrTransData.lrTransOtherExp); }
        if(!angular.isUndefined(lrTransData.lrTransOtherIncome) && lrTransData.lrTransOtherIncome != null) {  _updateLRTransOtherIncomeList(lrTransData.lrTransOtherIncome); }

     };

    function _updateStatusInLRTransList(checkedLRTransIdList,status,filter) {      
    $log.debug("checkedLRTransIdList : " + checkedLRTransIdList)
    var ret = _defResult, d = $q.defer();      
          
    //input validation       
    if (!checkedLRTransIdList || !checkedLRTransIdList.length) 
    {
      ret.msg = 'Please select at least 1 record to update status';
      d.reject(ret);
    }
  
    var lrTransDate = '';    
  
    if (filter) {
      if (filter.date && filter.date.length) {
        lrTransDate = filter.date;
      }             
    }
  
    
    if(lrTransDate && lrTransDate.length > 0) {
      //date = new Date(frmdate.replace(pattern,'$3-$2-$1'));
      var date = new Date(lrTransDate);
      if (isNaN(date.valueOf())) {          
        ret.msg = 'Date is not valid';
        d.reject(ret);
        return d.promise;
      }
    }    
    
    var data = 'lrTransDate='     +  lrTransDate    +              
               '&status='    +  status    +               
               '&lrTransIds='   +  checkedLRTransIdList.join(); 
               
  
    console.log(data);
  
    var config = { 
      headers: {
        'service_key': '824bb1e8-de0c-401c-9f83-8b1d18a0ca9d',
        'auth_token' :  userService.getAuthToken(),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
  
    var $promise = $http.post('http://localhost:8080/LRService/v1/lr-service/updateStatusInLRTransList', data, config);
  
    $promise.then(function(data, status, headers, config) {
      $log.debug('LRTransList data after update status + ' + JSON.stringify(data));
  
      var result = data.data;       
      
  
      /*if(result.code !== 1) {
        //some error
        d.reject(ret);
        return;
      }*/
      
      d.resolve(result.lrTransactions);
  
    }, function(r) {
      $log.debug('Error Info + ' + JSON.stringify(r.data));
      ret = _parseErrorResponse(r.data);
      d.reject(ret);
    });
    
    return d.promise;
  
  };

    return { 
      createLR: _createLR,
      createExpenditure: _createExpenditure,
      createOtherExpenditure: _createOtherExpenditure,
      createOtherIncome:_createOtherIncome,
      updateLR:_updateLR,
      createIncome:_createIncome,
      getConsignerList: _getConsignerList,
      getConsigneeList: _getConsigneeList,
      getBillingnameList:_getBillingnameList,
      getLR: function() {return lr;},
      getTransaction: function() {return transaction;},
      removeOtherExpenditure:_removeOtherExpenditure,
      removeOtherIncome:_removeOtherIncome,      
      getLRList:_getLRList, 
      createChalan:_createChalan,
      createBill:_createBill,
      searchLR: _searchLR,
      createTransaction: _createTransaction,
      editTransaction: _editTransaction,
      updateStatusInLRList:_updateStatusInLRList,
      getTransaction: function() {return transaction;},
      showLR: _showLR,
      createTransChalan:_createTransChalan,
      createTransBill:_createTransBill,
      removeTransOtherIncome:_removeTransOtherIncome,
      createTransOtherIncome:_createTransOtherIncome,
      removeTransOtherExpenditure:_removeTransOtherExpenditure,
      createTransOtherExpenditure:_createTransOtherExpenditure,
      getTransactions:_getTransactions,
      showLRTransaction:_showLRTransaction,
      updateStatusInLRTransList:_updateStatusInLRTransList,
      showLRTransaction:_showLRTransaction

    };

  }]);