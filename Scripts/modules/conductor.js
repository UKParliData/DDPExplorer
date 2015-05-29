define(["knockout", "jquery", "Scripts/modules/classes/generic", "Scripts/modules/classes/routing", "Scripts/modules/classes/endpoint", "Scripts/modules/classes/shortname", "Scripts/modules/classes/apiviewer", "Scripts/text!Scripts/modules/releaseddatasets.json"], function (ko, $, genericClass, routingClass, endpointClass, shortnameClass, apiViewerClass, releasedDatasets) {
    var conductorVM = function () {
        var self = this;

        self.genericUnit = new genericClass;
        var routingUnit = new routingClass;
        var endpointUnit = new endpointClass;
        var shortnameUnit = null;
        var apiViewerUnit = null;

        self.selectedComponent = ko.observable(null);
        self.parameters = ko.observable(null);
        self.isAppBusy = ko.observable(true);
        self.endpoints = ko.observableArray([]);
        self.apiViewers = ko.observableArray([]);
        self.shortnames = ko.observableArray([]);
        self.hasError = ko.observable(false);
        self.hasInfo = ko.observable(false);
        self.errorText = ko.observableArray([]);
        self.infoText = ko.observableArray([]);        

        self.toggleNavbar = function (vm, e) {
            var isShown = $(e.target).parent().next(".navbar-collapse").hasClass("in");

            if (isShown)
                $(e.target).parent().next(".navbar-collapse").removeClass("in");
            else
                $(e.target).parent().next(".navbar-collapse").addClass("in");
        };

        self.showError = function (message) {
            self.errorText.push(message);
            self.hasError(true);
        }

        self.showInfo = function (message) {
            self.infoText.push(message);
            self.hasInfo(true);
        }

        self.continueWhenFinishReadMetadata = ko.computed(function () {
            if (self.endpoints().length > 0) {
                if (self.shortnames().length == 0) {
                    shortnameUnit = new shortnameClass(self.endpoints());

                    var shortnames = shortnameUnit.getAllShortnames();
                    if (shortnames == null)
                        self.genericUnit.getDataFromOwlim("shortnames", { _pageSize: 10000 }, self.getDataForShortnames, self.genericUnit.errorOnLoad);
                    else
                        self.shortnames(shortnames);
                }
                if ((self.shortnames().length > 0) && (self.apiViewers().length == 0)) {
                    apiViewerUnit = new apiViewerClass(self.shortnames(), self.endpoints());

                    var apiViewers = apiViewerUnit.getAllAPIViewers();
                    if (apiViewers == null)
                        self.genericUnit.getDataFromOwlim("apiviewers", { _pageSize: 10000 }, self.getDataForApiViewers, self.genericUnit.errorOnLoad);
                    else
                        self.apiViewers(apiViewers);
                }
            }
            if ((self.endpoints().length > 0) && (self.shortnames().length > 0) && (self.apiViewers().length > 0)) {
                self.isAppBusy(false);
                setTimeout(routingUnit.loadComponentOnPageLoad, 500);
            }
        });

        self.getDataForApiViewers = function (data) {
            var arr = apiViewerUnit.readAPIViewers(data);
            self.apiViewers(arr);
        };

        self.getDataForEndpoints = function (data) {
            var arr = endpointUnit.readEndpoints(data, releasedDatasets);
            self.endpoints(arr);
        };

        self.getDataForShortnames = function (data) {
            var arr = shortnameUnit.readShortnames(data);
            self.shortnames(arr);
        };

        self.init = function () {
            if (sessionStorage) {
                var endpoints = endpointUnit.getAllEndpoints();
                if (endpoints == null)
                    self.genericUnit.getDataFromOwlim("endpoints", { _pageSize: 10000 }, self.getDataForEndpoints, self.genericUnit.errorOnLoad);
                else
                    self.endpoints(endpoints);
                window.onpopstate = routingUnit.loadComponentOnPageLoad;
            }            
        };

        self.dispose = function () {
            self.continueWhenFinishReadMetadata.dispose();
            window.onpopstate = null;
        };

        self.init();

    }
    return conductorVM;
});