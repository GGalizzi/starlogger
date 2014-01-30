
var fs = require('fs');
var gui = require('nw.gui');
var win = gui.Window.get();
function saveToJson(planets) {
  var jfile = JSON.stringify(planets);
  fs.writeFileSync("planets.json", jfile);
}

function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
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
      controller: 'planetEditCtrl',
      templateUrl: 'planetForm.html'
    })

    .otherwise({
      redirectTo: '/'
    });
})

.filter('withName', function() {
  return function(input, query) {
    if(!query) return input;
    var result= [];

    angular.forEach(input, function(planet) {
      if(planet.name.toLowerCase().indexOf(query.toLowerCase()) != -1 ||
         planet.description.toLowerCase().indexOf(query.toLowerCase()) != -1) {
        result.push(planet);
      }
    });
    return result;
  };
})



.factory('tags', function() {
  var t;
  t = fs.readFileSync('tags', 'utf8');
  t = t.replace(/\n/, '');
  t = t.split(',');
  return {tagList: {list: t} };
})

.service('tagList', function(tags) {

  this.addTags = function(newTags) {
    this.t = tags.tagList.list;
    this.newT = this.t.concat(newTags);
    this.newT = this.newT.filter(onlyUnique);
    console.log("Writing to tags file...\n"+this.newT);
    fs.writeFileSync('tags', this.newT);
    tags.tagList.list = this.newT;
  };

})

.factory('search', function() {
  return {sharedSearch: {data: null} }
})

.controller('sidebarCtrl', function($scope, tags) {
  $scope.tags = tags.tagList
})

.controller('planetListCtrl', function($scope, $localStorage, search) {


  // copy local storage to the $storage service.
  $scope.$storage = $localStorage;

  $scope.$storage.planetList = JSON.parse(fs.readFileSync('planets.json'));
  $scope.search = search.sharedSearch;


  // Check if the storage.planetList is empty or unexistant.
  // If so, make it an empty array.
  
  
  if ($scope.$storage.planetList == 0 || $scope.$storage.planetList == undefined) {
    $scope.planets = $scope.$storage.planetList = {};
  }
  // If not, assign it to the planets variable.
  else {
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

.controller('planetEditCtrl', function($scope, $localStorage, $routeParams, $location, tagList, tags) {
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
    console.debug("newPlanet.tags: "+$scope.newPlanet.tags);
    if($scope.newPlanet.tags instanceof Array) {
      $scope.newPlanet.tags = $scope.newPlanet.tags.join();
    }
    tagList.addTags($scope.newPlanet.tags.toLowerCase().split(/,\s|,/));
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

.controller('titlebarCtrl', function($scope, search) {
  $scope.search = search.sharedSearch;

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
