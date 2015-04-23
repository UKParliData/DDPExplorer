define(["knockout", "Scripts/modules/classes/generic", "Scripts/text!modules/endpointlist.html"], function (ko, genericClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.genericClass = new genericClass;
            
            self.apiViewers = ko.unwrap(params.apiViewers);
            self.allEndpoints = ko.unwrap(params.endpoints);
            self.endpoints = ko.utils.arrayFilter(self.allEndpoints, function (item) {
                return (item.ddpDatasetName != null) && (item.ddpIsMainEndpoint == true) && (item.endpointType == "ListEndpoint");
            });
            self.endpoints = ko.utils.arrayMap(self.endpoints, function (item, ix) {
                item.sortIndex = ix;                
                return item;
            });
            self.genericClass.sortArray(self.endpoints, "sortIndex", "ddpDatasetName");
            self.textQuery = ko.observable(null);
            self.filterEndpoints = ko.observableArray(ko.unwrap(self.endpoints));
            self.endpointUri = ko.observable(self.genericClass.endpointUri);            

            self.showMore = function (endpoint) {
                window.conductorVM.parameters({
                    ddpDatasetName: endpoint.ddpDatasetName
                });
                window.conductorVM.selectedComponent("dataset-api-help");
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