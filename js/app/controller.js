/**
 *  Vendor Search Web Application
 *  Marcus Jackson, <marcusj98@gmail.com>
 *  Generates Google maps markers along a google.maps.DirectionsRoute with form serialization along with filter applications
 *  app angular.module google.maps.DirectionsRoute
**/

define(['../app/module'], function(app) {
  var moment = require('moment');
  moment().format();

  app.filter('unique', function() {
    return function(collection, keyname) {
      var keys = [],
        output = [];

        angular.forEach(collection, function(directions) {
          var key = directions[keyname];
          if (keys.indexOf(key) === -1) {
            keys.push(key);
            output.push(directions);
          }
        });
        return output;
      };
    });

    // Capitalize Format
    app.filter('capitalize', function() {
      return function(input, all) {
        var reg = (all) ? /([^\W_]+[^\s-]*) */g : /([^\W_]+[^\s-]*)/;
        return (!!input) ? input.replace(reg, function(txt) {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }) : '';
      }
    });

    app.filter('special', function() {
      $scope.trustedHtml = [{
        '&#36;':   '$', // Dollar Sign Quote
        '&lsquo;': "‘", // Left single quote
        '&rsquo;': "’", // Right single quote
        '&ldquo;': '“', // Left double quotes
        '&rdquo;': '”', // Right double quotes
        '&quot;':  '"', // Double quotation mark
        '&amp;':   '&', // Ampersand
        '&#64;':   '@'  // At symbol
      }];
      return function(mystring) {
        return mystring.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
      }
    });

    app.config(function($stateProvider, $urlRouterProvider) {
      $urlRouterProvider.otherwise('/');
      $stateProvider.state('filter', {
        url: '',
        templateUrl: 'pages/filter.html'
      });
    });

    app.controller('mapController', ['$scope', '$http', '$filter', 'filterFilter', '$templateCache', function($scope, $http, $filter, filterFilter, $templateCache) {
      // All Variables
      var objs = [],
        map = null,
        markers = [],
        marker = null,
        formatUrl = null,
        selected = null,
        infoWindow = new google.maps.InfoWindow(),
        resultsDiv = document.getElementById("results"),
        mileageDiv = document.getElementById("mileage"),
        distanceDiv = document.getElementById("distance"),
        distancesDiv = document.getElementById("distances");

      // Markers
      var bbmarker = "img/main-marker.png", // Regular Marker
        lancermarker = "img/lancer-marker.png", // Lancer Marker
        schoomarker = "img/school-bus-marker.png", // School bus Marker
        imgUrl = "https://chart.googleapis.com/chart?cht=mm&chs=24x32&chco=%27+%27FFFFFF,008CFF,000000&ext=.png"; // Default Marker

      var geocoder = new google.maps.Geocoder(); // GMAPS GEOCODER
      var service = new google.maps.DistanceMatrixService(); // Distance Matrix
      var bounds = null; // GMAPS BOUNDS
      var directionsDisplay = new google.maps.DirectionsRenderer(); // GMAPS DIRECTIONS DISPLAY
      var directionsService = new google.maps.DirectionsService(); // GMAPS DIRECTIONS SERVICE
      var defaultBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(-90, -180),
        new google.maps.LatLng(90, 180)
      );

      // Vendor Scopes
      $scope.routes = true;
      $scope.directions = [{}];

      // Dynamic Buttons
      $scope.addbutton = true;
      $scope.removeButton = false;

      // Data Scopes
      $scope.items = [],
      $scope.filter = '',
      $scope.vendors = [],
      $scope.response = [],
      $scope.waypoints = [],
      $scope.selected = [],
      $scope.pageSize = '5',
      $scope.currentPage = 0,
      $scope.currentTemplate = null;

      // Page size
      $scope.pageSize = {
        model: "10",
        availableOptions: [
          { id: "5", name: "5" },
          { id: "10", name: "10" },
          { id: "15", name: "15" },
          { id: "20", name: "20" }
        ]
      };

      // Tiers
      $scope.tiers = [
        { name: 'Tier 1', selected: true },
        { name: 'Tier 2', selected: true },
        { name: 'Tier 3 ', selected: true },
        { name: 'Tier 4', selected: true },
        { name: 'Tier 5 ', selected: true }
      ];

      $scope.busTypes = {
        model: null,
        availableOptions: [
          { name: "All", id: 'all', selected: true },
          { name: "Motor Coach", id: 'motor_coach' },
          { name: "School Bus", id: 'school_bus' },
          { name: "Mini Bus", id: 'mini_bus' }
        ]
      };
      $scope.selectedItem = $scope.busTypes.availableOptions[0];
      $scope.selectedId = '0';

      // Google Autocomplete
      $scope.autocompleteOptions = {
        bounds: defaultBounds,
        types: ['(cities)', 'geocode', 'establishment'],
        componentRestrictions: { country: ["us", "ca"] }
      };

      // Add Metros Dynamically
      $scope.addField = function() {
        $scope.removeButton = true;
        if ($scope.directions.length > 0) {
          $scope.directions.push({});
        }
      };

      // Delete Metros Dynamically
      $scope.deleteField = function(index) {
        $scope.directions.splice(index, 1);
        if ($scope.directions.length === 1) {
          $scope.removeButton = false;
        } else {
          $scope.removeButton = true;
        }
      };

      $scope.highlight = function(index) {
        if ($scope.directions[index].location === 1) {
          $scope.directions[index].location == 0;
        } else {
          $scope.directions[index].location == 1;
        }
      };

      // Ui-Sortable
      $scope.sortableOptions = {
        'ui-floating': true,
        handle: '#locationField > .handle',
        axis: "y",
        cursor: 'move',
        forceHelperSize: true,
        update: function() {
          $scope.$apply();
        },
      };

      function initialize() {
        var customMapType = new google.maps.StyledMapType([{
          "featureType": "administrative.country",
          "elementType": "geometry",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "administrative.country",
          "elementType": "labels.text",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "administrative.land_parcel",
          "elementType": "labels",
          "stylers": [{"visibility": "off"}]
        }, {
          "featureType": "administrative.neighborhood",
          "elementType": "geometry",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "administrative.neighborhood",
          "elementType": "labels.text",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "landscape.man_made",
          "elementType": "labels.text",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "landscape.man_made",
          "elementType": "labels.text.fill",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "landscape.man_made",
          "elementType": "labels.text.stroke",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "landscape.natural",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "landscape.natural",
          "elementType": "geometry",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "landscape.natural.landcover",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "landscape.natural.terrain",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "landscape.natural.terrain",
          "elementType": "geometry",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "poi.business",
          "stylers": [{"visibility": "off"}]
        }, {
          "featureType": "poi.park",
          "elementType": "labels.text",
          "stylers": [{"visibility": "off"}]
        }, {
          "featureType": "road.arterial",
          "elementType": "labels",
          "stylers": [{"visibility": "off"}]
        }, {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [{"visibility": "on"}]
        }, {
          "featureType": "road.highway",
          "elementType": "geometry.fill",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "road.highway",
          "elementType": "labels",
          "stylers": [{"visibility": "off"}]
        }, {
          "featureType": "road.highway.controlled_access",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "road.local",
          "stylers": [{"visibility": "off"}]
        }, {
          "featureType": "road.local",
          "elementType": "labels",
          "stylers": [{"visibility": "off"}]
        }, {
          "featureType": "transit.line",
          "stylers": [{"visibility": "off"}]
        }, {
          "featureType": "transit.station",
          "stylers": [{"visibility": "off"}]
        }, {
          "featureType": "transit.station.airport",
          "stylers": [{"visibility": "simplified"}]
        }, {
          "featureType": "transit.station.bus",
          "stylers": [{ "visibility": "off" }]
        }, {
          "featureType": "transit.station.rail",
          "stylers": [{ "visibility": "off" }]
        }, {
          "featureType": "water",
          "stylers": [
            { "color": "#6dc6ff" },
            { "visibility": "simplified" }
          ]
        }]);
        var customMapTypeId = 'my_custom_style';

        // GMAP options
        var options = {
          center: new google.maps.LatLng(37.09024, -100.712891),
          zoom: 4,
          mapTypeControlOptions: { mapTypeIds: [google.maps.MapTypeId.ROADMAP] },
          panControl: false,
          panControlOptions: { position: google.maps.ControlPosition.BOTTOM_LEFT },
          zoomControl: true,
          disableDefaultUI: true,
          zoomControlOptions: {
            style: google.maps.ZoomControlStyle.LARGE,
            position: google.maps.ControlPosition.RIGHT_CENTER
          },
          scaleControl: false
        };
        map = new google.maps.Map(document.getElementById("map"), options);
        map.mapTypes.set(customMapTypeId, customMapType);
        map.setMapTypeId(customMapTypeId);

        google.maps.event.addDomListener(document.getElementById('form'), 'submit', function() {
          getLocations();
          e.preventDefault();
          return false;
        });
        directionsDisplay.setMap(null);

        // Marker
        marker = new google.maps.Marker({
          map: map,
          animation: google.maps.Animation.DROP
        });

        // Get the bounds of the polyline
        google.maps.Polyline.prototype.getBounds = function(startBounds) {
          if (startBounds) {
            bounds = startBounds;
          } else {
            bounds = new google.maps.LatLngBounds();
          }
          this.getPath().forEach(function(item, index) {
            bounds.extend( new google.maps.LatLng( item.lat(), item.lng() ) );
          });
          return bounds;
        };
      }

      $http({
        method: "GET",
        cache: true,
        url: "json/vendor.json"
      }).then(function success(response) {
        // No Tier 6
        var inBusiness = response.data.filter(function(sixth) {
          return sixth.name_value_list[5].value !== "Tier 6";
        });

        // Filter html link
        var noUrl = response.data.filter(function(link) {
          return link.name_value_list[11].value == 'http:\/\/' ? 'No Link' : '<a href=' + link.name_value_list[11].value + '>Website</a>';
        });

        $.each(inBusiness, function(keys, values) {
          // Get list of icons
          function getIcons(iconValue) {
            if (values.name_value_list[10].value >= 1) {
              return schoomarker; // School Bus Marker
            } else if (values.name_value_list[5].value == 'Tier 1') {
              return lancermarker; // Lancer Marker
            } else {
              return bbmarker; // BusBank Marker
            }
          }

          // No Broken Link
          function format_Url(linkValue) {
            // Format Value
            var formatUrl = values.name_value_list[11].value.replace(/\\n/g, "\\n").replace(/\\'/g, "\\'").replace(/\\"/g, '\\"').replace(/\\&/g, "\\&").replace(/\\r/g, "\\r").replace(/\\t/g, "\\t").replace(/\\b/g, "\\b").replace(/\\f/g, "\\f");
            if (formatUrl == 'http://' || typeof(formatUrl) == '') {
              return '';
            } else {
              return '<a href="'+ formatUrl +'" target="_blank">Website</a>';
            }
          }

          // Set markers
          $scope.vendor = new google.maps.Marker({
            icon: getIcons(values),
            position: null,
            map: map,
            title: values.name_value_list[1].value,
            html: '<div class="marker">' + '<h1>\n'
            + values.name_value_list[1].value + '</h1>\n'
            + '<a href="mailto:' + values.name_value_list[2].value + '">' + values.name_value_list[2].value + '</a>\
            <br>' + '<a href="tel:' + values.name_value_list[4].value + '">' + values.name_value_list[4].value + '</a><br>' + '<p>Motor Coach: ' + values.name_value_list[9].value + ' Mini Bus: ' + values.name_value_list[8].value + ' School Bus: ' + values.name_value_list[10].value + '</p>' + values.name_value_list[5].value + '  ' + format_Url(values) + '</div>',
            name: values.name_value_list[1].value,
            email: values.name_value_list[2].value,
            phone: values.name_value_list[4].value,
            tier: values.name_value_list[5].value,
            lng: values.name_value_list[6].value,
            lat: values.name_value_list[7].value,
            mini_bus: values.name_value_list[8].value,
            motor_coach: values.name_value_list[9].value,
            school_bus: values.name_value_list[10].value,
            website: format_Url(values)
          });
          $scope.vendors.push($scope.vendor);
        });
        return $scope.vendors;
      }, function error(response) {
        resultsDiv.innerHtml = "There was an issue processing your request, please try again.";
      });

      function getLocations() {
        // Variables
        var steps = 1,
          route = null,
          request = {},
          waypoints = [],
          durations = [],
          distance = null,
          allWaypoints = null,
          destinations = [],
          allDurations = null;

        if ($scope.directions.length > 1) {
          // If more than one location is added
          angular.forEach($scope.directions, function(metro_values, metro_key) {
            waypoints.push({
              location: metro_values.location,
              stopover: true,
            });
          });

          if (waypoints.length > 2) { // If there are more than two waypoints, (eg. A > B > C > D)
            // Get Origin and Destination and Waypoints
            for (var i = 0; i < waypoints.length; i++) {
              destinations.push(waypoints[i]);
            }

            // Get Origin and Destination and Waypoints
            var originAddress = destinations.shift(),
              destinationAddress = destinations.pop(),
              allWaypoints = destinations;

            request = {
              origin: originAddress.location,
              destination: destinationAddress.location,
              waypoints: allWaypoints,
              optimizeWaypoints: false,
              travelMode: google.maps.DirectionsTravelMode.DRIVING
            };
            calcMultipleRoutes(request);

            for (var i = 0; i < allWaypoints.length; i++) {
              allWaypoints[i].stopover = false;
            }
            var changeWaypoints = allWaypoints;
            var otherRequest = {
              origin: originAddress.location,
              destination: destinationAddress.location,
              waypoints: changeWaypoints,
              optimizeWaypoints: false,
              travelMode: google.maps.DirectionsTravelMode.DRIVING
            };
            callback(otherRequest);
          } else if (waypoints.length == 2) {
            // Get Origin and Destination
            var originAddress = waypoints[0].location,
              destinationAddress = waypoints[1].location;

            request = {
              origin: originAddress,
              destination: destinationAddress,
              optimizeWaypoints: false,
              travelMode: 'DRIVING'
            };
            calcTwoRoute(request);
          }
        } else {
          // If more than one location is added
          angular.forEach($scope.directions, function(metro_values, metro_key) {
            waypoints.push({
              location: metro_values.location,
              stopover: false
            });
          });
          request = { // Just one point of origin (eg. A)
            origin: waypoints[0].location,
            destination: false,
            optimizeWaypoints: false
          };
          showLocation(request);
        }
      }

      function showLocation(location) {
        marker.setVisible(false);
        geocoder.geocode({
          'address': location.origin
        }, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            mileageDiv.innerHTML = "<p>No mileage needed</p>";
            distanceDiv.innerHTML = "<p>No distance time needed</p>";
            document.getElementById("distances").innerHTML = "";
            bounds = new google.maps.LatLngBounds();

            // In this case it creates a marker, but you can get the lat and lng from the location.LatLng
            map.setCenter(results[0].geometry.location);
            var pos = {
              lng: results[0].geometry.location.lng(),
              lat: results[0].geometry.location.lat()
            };
            marker.setPosition(results[0].geometry.location);
            marker.setVisible(true);
            map.fitBounds(results[0].geometry.viewport);
            $scope.setMarkers(pos);
          } else {
            resultsDiv.innerHTML = "<p>Geocode was not successful for the following reason: " + status + "</p>";
          }
          directionsDisplay.setMap(null);
        });
      }

      function calcTwoRoute(stop) {
        var steps = 1,
          durations = [],
          totalDur = null,
          totalDist = null;

        marker.setVisible(false);
        directionsService.route(stop, function(response, status) {
          switch (status) {
            // Not Found
            case 'NOT_FOUND':
            mileageDiv.innerHTML = "<p>No mileage needed</p>";
            distanceDiv.innerHTML = "<p>No distance time needed</p>";
            break;

            // Error
            case 'UNKNOWN_ERROR':
            mileageDiv.innerHTML = "<p>We had an issue calculating your request, please try again.</p>";
            break;

            // Maximum elements & dimensions exceeded
            case 'MAX_ELEMENTS_EXCEEDED':
            case 'MAX_DIMENSIONS_EXCEEDED':
            mileageDiv.innerHTML = "<p>You have exceeded your destination limit, the limit of destinations is only 25</p>";
            break;

            // Zero Results
            case 'ZERO_RESULTS':
            mileageDiv.innerHTML = "<p>Unable to find the distance via road.</p>";
            break;

            // Invalid Requests
            case 'INVALID_REQUEST':
            mileageDiv.innerHTML = "<p>This route cannot be calculated</p>";
            break;

            // Request Denied
            case 'REQUEST_DENIED':
            mileageDiv.innerHTML = "<p>Request denied, please try different route</p>";
            break;

            // OK
            case 'OK':
            bounds = new google.maps.LatLngBounds();
            directionsDisplay.setMap(null);
            document.getElementById("distances").innerHTML = "";

            directionsDisplay = new google.maps.DirectionsRenderer({
              preserveViewport: false,
              suppressMarkers: false,
              map: map
            });
            directionsDisplay.setMap(map);
            directionsDisplay.setDirections(response);

            for (var i in response.routes) {
              var pos = response.routes[i].overview_path;
              $scope.setMarkers(pos);
            }
            route = response.routes[0];

            // Distance
            totalDur = route.legs[0].duration.text;
            totalDist = route.legs[0].distance.text;
            distanceDiv.innerHTML = "<p id='duration-text'>Total Duration: " + totalDur + "</p>"; // Duration
            mileageDiv.innerHTML = "<p id='distance-text'>Total Distance: " + totalDist + "</p>"; // Mileage
            break;
          }
        });
      }

      function callback(locations) {
        var totalDist = 0,
          totalDur = null,
          allLocations = null,
          totalDuration = null,
          changeStopover = null;

        // Get all Cities/Metros
        $(totalDist).empty();
        $(totalDur).empty();

        directionsService.route(locations, function(response, status) {
          switch (status) {
            // OK
            case 'OK':
            route = response.routes[0];
            totalDur = route.legs[0].duration.text;
            totalDist = route.legs[0].distance.text;
            distanceDiv.innerHTML = "<p id='duration-text'>Total Duration: " + totalDur + "</p>"; // Duration
            mileageDiv.innerHTML = "<p id='distance-text'>Total Distance: " + totalDist + " miles</p>"; // Mileage
            break;
          }
        });
      }

      function calcMultipleRoutes(stops) {
        var steps = 1,
          route = null,
          miles = null,
          durations = [],
          mileage = null,
          distance = null,
          duration = null;

        directionsDisplay.setMap(null);
        document.getElementById("distances").innerHTML = "";

        // Get listed durations and distances
        directionsService.route(stops, function(response, status) {
          switch (status) {
            case 'NOT_FOUND': // Not Found
            mileageDiv.innerHTML = "<p>No mileage needed</p>";
            distanceDiv.innerHTML = "<p>No distance time needed</p>";
            directionsDisplay.setMap(null);
            break;

            case 'OK': // OK
            bounds = new google.maps.LatLngBounds();
            directionsDisplay = new google.maps.DirectionsRenderer({
              preserveViewport: false,
              suppressMarkers: false,
              map: map
            });
            directionsDisplay.setMap(map);
            for (var i in response.routes) {
              var pos = response.routes[i].overview_path;
              directionsDisplay.setDirections(response);
              $scope.setMarkers(pos);
            }
            route = response.routes[0];

            // Distance
            for (var t = 0; t < route.legs.length; t++) {
              duration = route.legs[t].duration;
              durationList  = "<li>" + steps++ + ": " + duration.text + "</li>";
              document.getElementById("distances").innerHTML += durationList;
              durations.push(duration);
            }
            break;
          }
        });
      }

      // Filter Marker by Tier
      $scope.setVendors = function(Tier) {
        if (document.getElementById(Tier).checked == false) { // hide the marker
          $.each($scope.vendors, function(tier_key, tier_value) {
            if (tier_value.tier == Tier) {
              $scope.hideMarkers(tier_value);
            }
          });
        } else {
          $.each($scope.vendors, function(tier_key, tier_value) {
            if (tier_value.tier == Tier) {
              $scope.showMarkers(tier_value);
            }
          });
        }
      };

      $scope.checkBusType = function(bus) {
        if (bus.id) {
          for (var i = 0; i < $scope.vendors.length; i++) {
            var selectedBusType = $scope.vendors[i];
            if ( selectedBusType[bus.id] == 1) {
              $scope.showMarkers(selectedBusType);
            } else if (bus.id === 'all') {
              $scope.showMarkers(selectedBusType);
            } else {
              $scope.hideMarkers(selectedBusType);
            }
          }
        }
      };

      // Check location
      $scope.markerInBounds = function(marker_value) {
        return map.getBounds().contains(marker_value.getPosition());
      };

      // Check location
      $scope.markerNotInBounds = function(hidden_marker_value) {
        return !map.getBounds().contains(hidden_marker_value.getPosition());
      };

      // Show Markers
      $scope.showMarkers = function(show_value) {
        // Using parameters set above. Adding click event to the markers
        google.maps.event.addListener(show_value, 'click', function() {
          infoWindow.setContent(show_value.html);
          infoWindow.open(map, show_value);
        });

        // Long/Lat components
        latitude  = show_value.lat,
        longitude = show_value.lng;

        // Set Long/Lat components
        var myLatlng = new google.maps.LatLng(latitude, longitude);
        show_value.position = myLatlng;
        show_value.setVisible(true);
      };

      // Hide Markers
      $scope.hideMarkers = function(hide_value) {
        hide_value.setVisible(false);
      };

      // Set markers on map
      $scope.setMarkers = function(pos) {
        $.each($scope.vendors, function(json_key, json_value) {
          $scope.showMarkers(json_value);
        });
      };
      initialize();
    }]);
    return app;
});
