define(["knockout", "jquery", "Scripts/modules/classes/generic", "Scripts/modules/classes/endpoint", "Scripts/modules/classes/shortname"], function (ko, $, genericClass, endpointClass, shortnameClass) {
    var conductorVM = function () {
        var self = this;

        self.selectedComponent = ko.observable(null);
        self.parameters = ko.observable(null);
        self.isAppBusy = ko.observable(true);
        self.endpoints = ko.observableArray([]);
        self.hasShortnames = ko.observable(false);
        self.hasError = ko.observable(false);
        self.hasInfo = ko.observable(false);
        self.errorText = ko.observableArray([]);
        self.infoText = ko.observableArray([]);        

        self.genericClass = new genericClass;
        self.endpointClass = new endpointClass;
        self.shortnameClass = null;

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
                self.shortnameClass = new shortnameClass(self.endpoints());
                self.hasShortnames(sessionStorage.getItem("shortnames")!=null);
                if (self.hasShortnames()==false)
                    self.genericClass.getDataFromOwlim("shortnames", { _pageSize: 10000 }, self.getDataForShortnames, self.errorOnLoad);                
            }
            if ((self.endpoints().length > 0) && (self.hasShortnames()==true)) {
                var parameters = self.endpointClass.getEndpointNameFromUrl();
                if (parameters.endpoint == null) {
                    self.parameters({
                        endpoints: self.endpoints()
                    });
                    self.selectedComponent("endpoint-list");
                }
                else {
                    var endpoint = null;
                    var endpoints = self.endpoints();

                    for (var i = 0; i < endpoints.length; i++)
                        if (self.endpointClass.isEndpointUrlMatching(parameters.endpoint, endpoints[i].uriTemplate)) {
                            endpoint = endpoints[i];
                            break;
                        }
                    if (endpoint != null) {
                        var viewer = endpoint.defaultViewer;

                        if ((parameters.querystring != null) && (parameters.querystring._view != null) && (parameters.querystring._view != "basic")) {
                            for (var i = 0; i < endpoint.viewer.length; i++)
                                if (endpoint.viewer[i].name == parameters.querystring._view) {
                                    viewer = endpoint.viewer[i];
                                    break;
                                }
                        }
                        var shortnames = self.shortnameClass.findShortnamesForViewer(viewer);
                        if (shortnames != null) {
                            self.parameters({
                                endpointUrl: parameters.endpoint,
                                querystring: parameters.querystring,
                                endpoint: endpoint,
                                viewerName: endpoint.defaultViewer.name,
                                shortnames: shortnames
                            });
                            self.selectedComponent("search-result");
                        }
                        else 
                            self.showError("No shortnames found");
                    }
                    else 
                        self.showError("No matching endpoint found");
                }
                self.isAppBusy(false);
            }
        });

        self.getDataForEndpoints = function (data) {
            var arr = self.endpointClass.readEndpoints(data);
            self.endpoints(arr);
        };

        self.getDataForShortnames = function (data) {
            self.shortnameClass.readShortnames(data);
            self.hasShortnames(true);
        };

        self.errorOnLoad = function () {
            self.showError("Error while loading data");
            self.isAppBusy(false);
        }

        self.init = function () {
            if (sessionStorage) {
                var endpoints = self.endpointClass.getAllEndpoints();
                if (endpoints == null)
                    self.genericClass.getDataFromOwlim("endpoints", { _pageSize: 10000 }, self.getDataForEndpoints, self.errorOnLoad);
                else
                    self.endpoints(endpoints);
            }
        };

        self.dispose = function () {
            self.continueWhenFinishReadMetadata.dispose();
        };

        self.init();

    }
    return conductorVM;
});