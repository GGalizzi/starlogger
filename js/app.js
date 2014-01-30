
var fs = require('fs');
var gui = require('nw.gui');
var win = gui.Window.get();
function saveToJson(planets) {
  var jfile = JSON.stringify(planets);
  fs.writeFileSync("planets.json", jfile);
}

var starloggerApp = angular.module('starloggerApp', ['ngStorage', 'ngRoute'])

.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      controller: 'planetListCtrl',
      templateUrl: 'planetList.html'
    })
    
    .when('/details/:planetName', {
      controller: 'planetDetailsCtrl',
      templateUrl: 'planetDetail.html'
    })

    .when('/edit/:planetName', {
      controller: 'planetEditCtrl',
      templateUrl: 'planetForm.html'
    })

    .when('/add-planet', {
      controller: 'planetAddCtrl',
      templateUrl: 'planetForm.html'
    })

    .otherwise({
      redirectTo: '/'
    });
})

.service('tagList', function() {
  
  this.getTags = function() {
    this.t = fs.readFileSync('tags', 'utf8');
    console.debug(this.t);
    return this.t.split(',');
  };

})

.controller('sidebarCtrl', function($scope, tagList) {
  $scope.tags = tagList.getTags();
})

.controller('planetListCtrl', function($scope, $localStorage, tagList) {


  // copy local storage to the $storage service.
  $scope.$storage = $localStorage;
  /*
  fs.readFile("planets.json", function(err, data) {
    if(err) {
      console.error("Error reading file planets.json");
    }
    else if (data == "undefined") {
      console.debug("Data from planets.json is undefined");
      $scope.planets={};
    }
    else {
      console.log("Data loaded from planets.json");
      $scope.$storage.planetList = JSON.parse(data);
    }
  });
  */

  $scope.$storage.planetList = JSON.parse(fs.readFileSync('planets.json'));


  // Check if the storage.planetList is empty or unexistant.
  // If so, make it an empty array.
  
  
  if ($scope.$storage.planetList == 0 || $scope.$storage.planetList == undefined) {
    console.debug("planetList should be empty");
    $scope.planets = $scope.$storage.planetList = {};
  }
  // If not, assign it to the planets variable.
  else {
    console.debug("planetList seems to already have content");
    $scope.planets = $scope.$storage.planetList
  }

  $scope.deleteAll = function() {
    $localStorage.$reset();
    $scope.$storage = $localStorage;
    $scope.planets = {};
  }

  // Save the modifications donde to planets into the storage.
  $scope.$storage.planetList = $scope.planets;
  saveToJson($scope.planets);
})

.controller('planetDetailsCtrl', function($scope, $localStorage, $routeParams, $location) {
  $scope.$storage = $localStorage;
  $scope.planet = $scope.$storage.planetList[$routeParams.planetName];

  if($scope.planet.tags && !($scope.planet.tags instanceof Array)) {
    $scope.planet.tags = $scope.planet.tags.split(/[ ,]+/);
  } else if (!($scope.planet.tags instanceof Array)) {
    $scope.planet.tags = ["No tags set"];
  }

  $scope.deletePlanet = function() {
    var planet = $scope.planet;
    console.debug("deletePlanet("+planet.name+")");
    delete $scope.$storage.planetList[$routeParams.planetName];
    saveToJson($scope.$storage.planetList);
    $location.path('#/');
  }
})

.controller('planetEditCtrl', function($scope, $localStorage, $routeParams, $location) {
  $scope.$storage = $localStorage;
  var planet = $scope.planet = $scope.$storage.planetList[$routeParams.planetName];
  $scope.newPlanet = planet;

  $scope.save = function() {
    console.log("Saving sector name...");
    $scope.newPlanet.sector =
      $scope.newPlanet.name.split(" ")[0].toLowerCase();
    console.log("Sector saved as:"+$scope.newPlanet.sector);
    $scope.planet = $scope.newPlanet;

    delete $scope.$storage.planetList[$routeParams.planetName];

    console.log("Saving to storage...");
    $scope.$storage.planetList[$scope.planet.name] = $scope.planet;
    console.log("Saved to storage:\n"+$scope.$storage.planetList[$scope.planet.name]);
    saveToJson($scope.$storage.planetList);
    $location.path('#/details/'+$scope.planet.name);
  }
})

.controller('planetAddCtrl', function($scope, $localStorage, $location) {
  $scope.$storage = $localStorage;

  $scope.save = function() {
    $scope.newPlanet.sector =
      $scope.newPlanet.name.split(" ")[0].toLowerCase();
    $scope.$storage.planetList[$scope.newPlanet.name] = $scope.newPlanet;
    saveToJson($scope.$storage.planetList);

    $location.path('#/');
  }

})

.controller('titlebarCtrl', function($scope) {
  $scope.closeApp = function() {
    win.close(true);
  }

  $scope.minimizeApp = function() {
    win.minimize();
  }

  $scope.debugApp = function() {
    win.showDevTools();
  }
})

.directive('slPlanets', function() {
  return {
    replace: true,
    restrict: 'E',
    templateUrl: 'templates/planets.html'
  };
})

.directive('slPlanet', function() {
  return {
    transclude: true,
    restrict: 'E',
    templateUrl: 'templates/planet.html'
  };
})

.directive('slTitlebar', function() {
  return {
    replace: true,
    restrict: 'E',
    templateUrl: 'templates/sl-titlebar.html'
  };
})


.directive('slSidebar', function() {
  return {
    replace: true,
    restrict: 'E',
    templateUrl: 'templates/sidebar.html'
  };
});
