
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

    .when('/settings', {
      controller: 'settingsCtrl',
      templateUrl: 'settings.html'
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
         planet.description.toLowerCase().indexOf(query.toLowerCase()) != -1 ||
         planet.tags.join().toLowerCase().indexOf(query.toLowerCase()) != -1) {
        result.push(planet);
      }
    });
    return result;
  };
})

/*
.filter('secFilter', function(orderPlanets) {
  return function(input) {
    var f = orderPlanets.settings;
    var result = [];
    angular.forEach(input, function(planet) {
      if(!f.alphaFilter && planet.sector == "alpha") result.push(planet);
      else if(!f.betaFilter && planet.sector == "beta") result.push(planet);
      else if(!f.gammaFilter && planet.sector == "gamma") result.push(planet);
      else if(!f.deltaFilter && planet.sector == "delta") result.push(planet);
      else if(!f.xFilter && planet.sector == "x") result.push(planet);

      if(f.autoFilter && planet.auto) result.pop(planet);
    });
    return result;
  };
})
*/

.filter('secFilter', function(knownSectors, orderPlanets) {
  return function(input) {
    var f = knownSectors.sectors;
    var other = orderPlanets.settings;
    var result = [];
    f.forEach(function(sector, index, arr) {
      angular.forEach(input, function(planet) {
        // Compare planet.sector to sector.
        if( (sector.name === planet.sector) && sector.stat) result.push(planet);
        if(other.autoFilter && planet.auto) result.pop(planet);
      });
    });
    return result;
  };
})

.filter('orderObjectBy', function() {
  return function(items, field, reverse, query) {
    var filtered = [];
    angular.forEach(items, function(planet) {
      console.debug(query);
      if(!query) filtered.push(planet);
      else if(planet.name.toLowerCase().indexOf(query.toLowerCase()) != -1 ||
         planet.description.toLowerCase().indexOf(query.toLowerCase()) != -1 ||
         planet.tags.join().toLowerCase().indexOf(query.toLowerCase()) != -1) {
      filtered.push(planet);
      }
    });
    filtered.sort(function (a,b) {
      return (a[field] > b[field]);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
})

.filter('toArray', function () {
  'use strict';

  return function (obj) {
    if (!(obj instanceof Object)) {
      return obj;
    }

    return Object.keys(obj).map(function (key) {
      return Object.defineProperty(obj[key], '$key', {__proto__: null, value: key});
    });
  }
})

.factory('search', function() {
  return {sharedSearch: {data: null} }
})

.factory('settings', function() {
  var obj = {universePath: null};
  obj.universePath = fs.readFileSync('universe', 'utf8');
  obj.universePath = obj.universePath.replace(/\n/, '');

  return obj;
})

.service('tagSearch', function($location, search) {
  this.forTag = function(query) {
    search.sharedSearch.data = query;
    $location.path('/');
  };
})

.factory('orderPlanets', function() {
  //True means hide on filters.

  return {settings: {predicate: "date", reverse: true, order: "Descending",
  alphaFilter: false, betaFilter: false, gammaFilter: false, deltaFilter: false,
  xFilter: false, autoFilter:false}};
})

.factory('knownSectors', function() {
  var sectors = [];
  try { 
    var planetList = JSON.parse(fs.readFileSync('planets.json'));
  } catch (e) {
    var planetList= {};
  }
  var check = [];
  for (var key in planetList) {
    var planet = planetList[key];
    if ( check.indexOf(planet.sector) == -1 ) { 
      sectors.push({name: planet.sector, stat: true});
      check.push(planet.sector);
    }
  }
  console.log(sectors);
  return {sectors: sectors};
})

.controller('planetListCtrl', function($scope, $localStorage, search, tagSearch, settings, orderPlanets, knownSectors) {


  $localStorage.$reset();
  // copy local storage to the $storage service.
  $scope.$storage = $localStorage;

  try {
    $scope.$storage.planetList = JSON.parse(fs.readFileSync('planets.json'));
  } catch (e) {
    console.log('Error.', e);
    saveToJson({});
  }
  $scope.search = search.sharedSearch;
  $scope.tagSearch = tagSearch;

  //OrderBy
  /*
  $scope.predicate = orderPlanets.predicate;
  $scope.reverse = orderPlanets.reverse;
  $scope.order = orderPlanets.order;
  */
  $scope.orderOptions = orderPlanets.settings;

  $scope.switchOrder = function() {
    if($scope.orderOptions.reverse == false) {
      $scope.orderOptions.reverse = true;
      $scope.orderOptions.order = "Descending";
    }
    else {
      $scope.orderOptions.reverse = false;
      $scope.orderOptions.order = "Ascending";
    }
  };


  /* Universe reading logic */
  $scope.readUniverse = settings.universePath; 
  console.log($scope.readUniverse);
  if($scope.readUniverse) {
    var cont = true;
    try {
      $scope.knownWorlds = fs.readdirSync($scope.readUniverse);
    } catch (e) {
      console.log('Error.', e);
      cont = false;

    }
    if(cont) {
      $scope.knownWorlds.forEach(function(val, index, arr) {
        var fileExt = val.split('.');
        if (fileExt[fileExt.length-1] == "world") {
          var arrsp = val.split("_");
          if (arrsp[0] == "sectorx") {
            arrsp[0] = "x";
          }
          var lastsp = "0"
          if(arrsp[5]) { lastsp = arrsp[5].split('.')[0]; }
          else { lastsp = arrsp[4].split('.')[0]; }
          var pln = arrsp[0].charAt(0).toUpperCase()+arrsp[0].slice(1)+" "+arrsp[1]+" "+arrsp[2]+"_"+arrsp[3]+lastsp;
          var coords = arrsp[1]+" "+arrsp[2];
          var alreadyExists = false;
          for(var planet in $scope.$storage.planetList) {
            var otherCoords = $scope.$storage.planetList[planet].x+" "+$scope.$storage.planetList[planet].y;
            if (pln === $scope.$storage.planetList[planet].byAuto) {
              alreadyExists = true;
              break;
            }
          }

          if(!alreadyExists) {
            var planet = $scope.$storage.planetList[pln] = {};
            planet.name = pln;
            planet.x = arrsp[1];
            planet.y = arrsp[2];
            planet.sector = arrsp[0];
            planet.description = "No description";
            planet.tags = ["Added via Universe Folder"];
            planet.auto = true;
            planet.byAuto = pln;
            planet.date = Date.now();
            saveToJson($scope.$storage.planetList);

            // Check if sector is new one, if so add it to knownSectors.
            var known = false;
            knownSectors.sectors.forEach(function(val, index, arr) {
              if (planet.sector == val.name) known = true;
            });
            if (!known) {
              knownSectors.sectors.push({name: planet.sector, stat: true});
            }

          }

        }
      });
    }
  }


  /* All sectors filters logic */

  $scope.knownSectors = knownSectors;



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

.controller('planetDetailsCtrl', function($scope, $localStorage, $routeParams, $location, search, tagSearch) {
  $scope.$storage = $localStorage;
  $scope.planet = $scope.$storage.planetList[$routeParams.planetName];

  $scope.deletePlanet = function() {
    var planet = $scope.planet;
    console.debug("deletePlanet("+planet.name+")");
    delete $scope.$storage.planetList[$routeParams.planetName];
    saveToJson($scope.$storage.planetList);
    $location.path('#/');
  }

  $scope.tagSearch = tagSearch;

})

.controller('planetEditCtrl', function($scope, $localStorage, $routeParams, $location, knownSectors) {
  $scope.$storage = $localStorage;
  var planet = $scope.planet = $scope.$storage.planetList[$routeParams.planetName];
  $scope.newPlanet = planet;

  $scope.save = function() {
    console.log("Saving sector name...");
    $scope.newPlanet.sector =
      $scope.newPlanet.name.split(" ")[0].toLowerCase();

    $scope.newPlanet.auto = false;
    $scope.newPlanet.date = Date.now();
    console.log("Sector saved as:"+$scope.newPlanet.sector);
    console.debug($scope.newPlanet.tags);
    console.debug($scope.newPlanet.tags instanceof Array);
    if($scope.newPlanet.tags && !($scope.newPlanet.tags instanceof Array)) {
      $scope.newPlanet.tags = $scope.newPlanet.tags.split(/,| ,|, | , /);
      console.debug($scope.newPlanet.tags);
    }
    $scope.planet = $scope.newPlanet;

    delete $scope.$storage.planetList[$routeParams.planetName];

    console.log("Saving to storage...");
    $scope.$storage.planetList[$scope.planet.name] = $scope.planet;
    console.log("Saved to storage:\n"+$scope.$storage.planetList[$scope.planet.name]);
    saveToJson($scope.$storage.planetList);

    // Check if sector is new one, if so add it to knownSectors.
    var known = false;
    knownSectors.sectors.forEach(function(val, index, arr) {
      if ($scope.planet.sector == val.name) known = true;
    });
    if (!known) {
      knownSectors.sectors.push({name: $scope.planet.sector, stat: true});
    }
  $location.path('/details/'+$scope.planet.name.replace(/\s+/g, "%20"));

  }
})


.controller('titlebarCtrl', function($scope, search, orderPlanets, knownSectors) {
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
  $scope.orderOptions = orderPlanets.settings;

  $scope.knownSectors = knownSectors;


  $scope.switchFilter = function(sector) {
    sector.stat ? sector.stat = false : sector.stat = true;
  };

  $scope.switchOrder = function() {
    if($scope.orderOptions.reverse == false) {
      $scope.orderOptions.reverse = true;
      $scope.orderOptions.order = "Descending";
    }
    else {
      $scope.orderOptions.reverse = false;
      $scope.orderOptions.order = "Ascending";
    }
  };
})

.controller('sidebarCtrl', function($scope, orderPlanets, search) {
  $scope.orderOptions = orderPlanets.settings;
  $scope.search = search.sharedSearch;
})

.controller('settingsCtrl', function($scope, $location, settings) {
  $scope.universePath = fs.readFileSync('universe', 'utf8');

  $scope.save = function() {
    settings.universePath = $scope.universePath;
    fs.writeFile('universe', $scope.universePath, 'utf8');
    $location.path('/');
  };

  $scope.showHelp = false;
  $scope.togglePathHelp = function() {
    $scope.showHelp = $scope.showHelp == false ? true : false;
  };
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
