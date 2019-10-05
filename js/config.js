// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
require.config({
  baseUrl: '', // Add path URL here
  catchError: true,
  enforceDefine: false,
  wrapShim: true,
  paths: {
    // jQuery
    jquery: [
      "//ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min",
      "jquery.min"
    ],

    // jQuery-UI
    "jquery-ui": "//ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min",

    // Angular-JS & Plugins
    angular: [
      "node_modules/angular/angular.min",
      "node_modules/angular/angular"
    ],
    
    // Angular Animate
    "angular-animate": [
      "node_modules/angular-animate/angular-animate.min",
      "node_modules/angular-animate/angular-animate"      
    ],
    
    // Angular-UI
    ui: ["//cdnjs.cloudflare.com/ajax/libs/angular-ui/0.4.0/angular-ui.min"],
    
    // AngularAMD
    angularAMD: "angularAMD",

    // Angular-UI-Router
    "angular-ui-router": [
      "node_modules/angular-ui-router/release/angular-ui-router.min",
      "node_modules/angular-ui-router/release/angular-ui-router"
    ],

    // Moment JS
    moment: [
      "node_modules/moment/min/moment.min",
      "node_modules/moment/moment"
    ],

    // Angular-Moment
    "angular-moment": [
      "node_modules/angular-moment/angular-moment.min",
      "node_modules/angular-moment/angular-moment"
    ],

    // Google Place Auto-complete and Maps API
    vsGoogleAutocomplete: ["node_modules/vsGoogleAutocomplete/src/vs-google-autocomplete"]    
  },
  shim: {
    angular: {
      deps: ["jquery"],
      exports: "angular"
    },
    "jquery-ui": {
      deps: ["jquery"]
    },
    "angular-animate": {
      deps: ["jquery-ui", "angular"]
    },
    "angular-ui-router": {
      deps: ["angular"]
    },
    ui: { 
      deps: ["jquery-ui", "angular"]
    },
    ngload: {
      deps: ["jquery", "angular"]
    },
    vsGoogleAutocomplete: {
      deps: ["jquery", "angular"]
    },
    moment: { 
      deps: ["jquery"]
    },
    'angular-moment': {
      deps: ["angular", "moment"]
    }
  },
  waitSeconds: 30,
  deps: ['../app/module']
});

require(["../app/module", "../app/controller"], function(app) {
  app.init();
}, function(err) {
  // The errback, error callback
  // The error has a list of modules that failed
  var errors = err.requireModules && err.requireModules[0];
  if (errors == true || typeof(errors) == true) {
    console.log(err.requireType);
    console.log(errors);
  }
  console.log(err.requireType);
  console.log(errors);
  throw err;
});
