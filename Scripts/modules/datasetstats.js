define(["knockout", "Scripts/modules/classes/generic", "Scripts/text!modules/datasetstats.html"], function (ko, genericClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            var genericUnit = new genericClass;

            self.endpoint = ko.unwrap(params.endpoint);

            self.resourceNumber = ko.observable(null);
            self.firstCreated = ko.observable(null);
            self.lastModified = ko.observable(null);            
            self.isModifiedResourceExists = params.isModifiedResourceExists;            

            self.doneLoadNumber = function (data) {
                if ((data != null) && (data.result != null) &&
                    (data.result.items != null) && (data.result.items.length > 0)) 
                    self.resourceNumber(data.result.totalResults * 1);
                else 
                    self.resourceNumber(0);
            };

            self.doneLoadCreated = function (data) {
                if ((data != null) && (data.result != null) &&
                    (data.result.items != null) && (data.result.items.length > 0) && (data.result.items[0].ddpCreated != null))
                    self.firstCreated(data.result.items[0].ddpCreated._value || data.result.items[0].ddpCreated);
                else
                    self.firstCreated("");
            };

            self.doneLoadModified = function (data) {
                if ((data != null) && (data.result != null) &&
                    (data.result.items != null) && (data.result.items.length > 0) && (data.result.items[0].ddpModified != null)) {
                    self.isModifiedResourceExists(true);
                    self.lastModified(data.result.items[0].ddpModified._value || data.result.items[0].ddpModified);
                }
                else {
                    self.lastModified("");
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
                genericUnit.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, querystring, self.doneLoadNumber, genericUnit.errorOnLoad, "Dataset statistics");
                querystring._properties = "ddpCreated";
                querystring._sort = "ddpCreated";
                querystring["exists-ddpCreated"] = true;
                genericUnit.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, querystring, self.doneLoadCreated, genericUnit.errorOnLoad, "Dataset statistics");
                querystring._properties = "ddpModified";
                querystring._sort = "-ddpModified";
                delete querystring["exists-ddpCreated"];
                querystring["exists-ddpModified"]=true;
                genericUnit.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, querystring, self.doneLoadModified, genericUnit.errorOnLoad, "Dataset statistics");
            };

            self.dispose = function () {
                self.isLoading.dispose();
            };

            self.init();            

        },
        template: htmlText
    }
});