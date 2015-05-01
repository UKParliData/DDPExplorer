define(["knockout", "Scripts/modules/classes/generic", "Scripts/text!modules/datasetstats.html"], function (ko, genericClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.endpoint = ko.unwrap(params.endpoint);
            self.resourceNumber = ko.observable(null);
            self.firstCreated = ko.observable(null);
            self.lastModified = ko.observable(null);            
            self.isModifiedResourceExists = params.isModifiedResourceExists;

            self.genericClass = new genericClass;

            self.doneLoadNumber = function (data) {
                if ((data != null) && (data.result != null) &&
                    (data.result.items != null) && (data.result.items.length > 0)) 
                    self.resourceNumber(data.result.totalResults * 1);
                else 
                    self.resourceNumber(0);
            };

            self.doneLoadCreated = function (data) {
                if ((data != null) && (data.result != null) &&
                    (data.result.items != null) && (data.result.items.length > 0) && (data.result.items[0].ddpCreated != null)) {
                    self.resourceNumber(data.result.totalResults * 1);
                    self.firstCreated(data.result.items[0].ddpCreated._value || data.result.items[0].ddpCreated);
                }
                else {
                    self.firstCreated(null);
                    self.resourceNumber(0);
                }
            };

            self.doneLoadModified = function (data) {
                if ((data != null) && (data.result != null) &&
                    (data.result.items != null) && (data.result.items.length > 0) && (data.result.items[0].ddpModified != null)) {
                    self.isModifiedResourceExists(true);
                    self.lastModified(data.result.items[0].ddpModified._value || data.result.items[0].ddpModified);
                }
                else {
                    self.lastModified(null);
                    self.isModifiedResourceExists(false);
                }
            };

            self.isLoading = ko.computed(function () {
                return (self.resourceNumber() == null) || (self.firstCreated() == null) || (self.lastModified() == null);
            });

            self.init = function () {
                var querystring = {
                    _pageSize: 1,
                    _view: "basic",
                    _page: 0                    
                };
                self.genericClass.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, querystring, self.doneLoadNumber, self.genericClass.errorOnLoad);
                querystring._properties = "ddpCreated";
                querystring._sort = "-ddpCreated";
                querystring["exists-ddpCreated"] = true;
                self.genericClass.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, querystring, self.doneLoadCreated, self.genericClass.errorOnLoad);
                querystring._properties = "ddpModified";
                querystring._sort = "-ddpModified";
                delete querystring["exists-ddpCreated"];
                querystring["exists-ddpModified"]=true;
                self.genericClass.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, querystring, self.doneLoadModified, self.genericClass.errorOnLoad);
            };

            self.dispose = function () {
                self.isLoading.dispose();
            };

            self.init();            

        },
        template: htmlText
    }
});