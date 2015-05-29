define(["knockout", "Scripts/modules/classes/generic", "Scripts/modules/classes/routing", "Scripts/modules/classes/endpoint", "Scripts/modules/classes/apiviewer", "Scripts/text!modules/endpointlist.html"], function (ko, genericClass, routingClass, endpointClass, apiViewerClass, htmlText) {
    return {
        viewModel: function () {
            var self = this;

            var genericUnit = new genericClass;
            var routingUnit = new routingClass;
            var endpointUnit = new endpointClass();
            var apiViewerUnit = new apiViewerClass([], []);

            self.allEndpoints = endpointUnit.getAllEndpoints();
            self.apiViewers = apiViewerUnit.getAllAPIViewers();
            self.endpoints = ko.utils.arrayFilter(self.allEndpoints, function (item) {
                return (item.ddpDatasetName != null) && (item.ddpIsMainEndpoint == true) && (item.endpointType == "ListEndpoint") && (item.isDatasetReleased == true);
            });
            self.endpoints = ko.utils.arrayMap(self.endpoints, function (item, ix) {
                item.sortIndex = ix;
                return item;
            });
            genericUnit.sortArray(self.endpoints, "sortIndex", "ddpDatasetName");
            self.textQuery = ko.observable(null);
            self.filterEndpoints = ko.observableArray(ko.unwrap(self.endpoints));            

            self.learnMore = function (endpoint) {
                routingUnit.datasetAPIHelp(false, endpoint.ddpDatasetName);                
            };

            self.goExplore = function (endpoint) {
                routingUnit.searchResult(false, endpoint.uriTemplate.fullUri, endpoint.defaultViewer.name, null, null);
            };

            self.showDataDistribution = function (endpoint) {
                endpoint.isShowDataDistribution(true);
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