define(["knockout", "Scripts/modules/classes/generic", "Scripts/modules/classes/endpoint", "Scripts/modules/classes/apiviewer", "Scripts/text!modules/datasetapihelp.html"], function (ko, genericClass, endpointClass, apiViewerClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.genericClass = new genericClass;
            self.endpointClass = new endpointClass;
            self.apiViewerClass = new apiViewerClass([]);
            
            self.ddpDatasetName = ko.unwrap(params.ddpDatasetName);
            self.apiViewers = self.apiViewerClass.getAllAPIViewers();
            self.endpoints = self.endpointClass.getAllEndpoints();            
            self.endpoint = ko.utils.arrayFirst(self.endpoints, function (item) {
                return (item.ddpDatasetName == self.ddpDatasetName) && (item.ddpIsMainEndpoint == true) && (item.endpointType == "ListEndpoint");
            });
            self.isShowDataDistribution = ko.observable(false);
            self.endpointUri = self.genericClass.endpointUri;
            self.hostUri = self.genericClass.host;
            self.datasetEndpoints = ko.utils.arrayFilter(self.endpoints, function (item) {
                return item.ddpDatasetName == self.endpoint.ddpDatasetName;
            });

            self.showDataDistribution = function () {
                self.isShowDataDistribution(true);
            };
            
        },
        template: htmlText
    }
});