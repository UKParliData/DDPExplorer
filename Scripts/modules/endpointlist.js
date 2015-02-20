define(["knockout", "Scripts/modules/classes/generic", "Scripts/text!modules/endpointlist.html"], function (ko, genericClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.textQuery = ko.observable(null);           
            self.endpoints = ko.utils.arrayFilter(params.endpoints, function (item) { return item.endpointType == "ListEndpoint"; });
            self.filterEndpoints = ko.observableArray(ko.unwrap(self.endpoints));
            self.sizeList = [];

            self.genericClass = new genericClass;

            self.endpointUri = ko.observable(self.genericClass.endpointUri);            

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