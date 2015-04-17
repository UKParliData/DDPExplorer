define(["knockout", "Scripts/modules/classes/generic", "Scripts/text!modules/endpointlist.html"], function (ko, genericClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.genericClass = new genericClass;
            
            self.apiViewers = ko.unwrap(params.apiViewers);
            self.shortnames = ko.unwrap(params.shortnames);
            self.endpoints = ko.utils.arrayFilter(params.endpoints, function (item) {
                    return (item.ddpDatasetName != null) && (item.endpointType == "ListEndpoint");
                });
            self.endpoints = ko.utils.arrayMap(self.endpoints, function (item, ix) {
                    item.sortIndex = ix;
                    item.isShowMore = ko.observable(false);
                    item.resourceNumber = ko.observable(null);
                    item.lastModified = ko.observable(null);
                    item.firstCreated = ko.observable(null);
                    return item;
                });
            self.genericClass.sortArray(self.endpoints, "sortIndex", "ddpDatasetName");
            self.textQuery = ko.observable(null);
            self.filterEndpoints = ko.observableArray(ko.unwrap(self.endpoints));
            self.endpointUri = ko.observable(self.genericClass.endpointUri);

            self.doneLoadCreated = function (data) {
                if ((data != null) && (data.result != null)) {
                    
                }
            };

            self.doneLoadModified = function (data) {
                if ((data != null) && (data.result != null)) {

                }
            };

            self.showMore = function (endpoint) {
                ko.utils.arrayForEach(self.endpoints, function (item) {
                    return item.isShowMore(false);
                });
                if (endpoint.resourceNumber() == null) {
                    var querystring = {
                        _pageSize: 1,
                        _view: "basic",
                        _properties: "ddpCreated",
                        _sort: "ddpCreated",
                        _page: 0
                    };
                    //https://api.jquery.com/deferred.then/
                    self.genericClass.getDataFromOwlim(endpoint.uriTemplate.fullUri, querystring, self.doneLoadCreated, self.genericClass.errorOnLoad);
                    querystring._properties = "ddpModified";
                    querystring._sort = "-ddpModified";
                    self.genericClass.getDataFromOwlim(endpoint.uriTemplate.fullUri, querystring, self.doneLoadModified, self.genericClass.errorOnLoad);
                }
                endpoint.isShowMore(true);
            };

            self.searchText = ko.computed(function() {
                var textQuery=self.textQuery();
                if ((textQuery == null) || (textQuery == ""))
                    self.filterEndpoints(self.endpoints);
                else {
                    textQuery = textQuery.toLowerCase();
                    self.filterEndpoints(
                        ko.utils.arrayFilter(self.endpoints, function (item) {
                            return ((item.ddpDatasetName.toLowerCase().indexOf(textQuery) >= 0) || (item.comment.toLowerCase().indexOf(textQuery) >= 0));
                        })
                    );
                }
            });

            self.dispose = function () {
                self.searchText.dispose();
            };


        },
        template: htmlText
    }
});