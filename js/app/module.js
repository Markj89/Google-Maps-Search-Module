/**
 *
 *	Web App Modules
 *	Marcus Jackson, <marcusj98@gmail.com>
 *	Load Web App JavaScript Dependencies/Plugins
 *
**/
define(['jquery', 'angular', 'angular-animate', 'angularAMD', "angular-ui-router", 'vsGoogleAutocomplete', 'moment','angular-moment', 'ui'], function($, angular, angularAMD, moment) {
	'use strict';
	console.log("vendorApp initilization...");
	var app = angular.module("vendorApp", ["ui.router", "vsGoogleAutocomplete", "ngAnimate", "angularMoment", "ui"]);
	app.init = function() {
		angular.bootstrap(document, ["vendorApp"]);
	};
	return app;
});
