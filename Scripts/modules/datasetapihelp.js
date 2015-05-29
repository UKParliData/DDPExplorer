define(["knockout", "Scripts/modules/classes/generic", "Scripts/modules/classes/routing", "Scripts/modules/classes/endpoint", "Scripts/modules/classes/apiviewer", "Scripts/text!modules/datasetapihelp.html"], function (ko, genericClass, routingClass, endpointClass, apiViewerClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            var genericUnit = new genericClass;
            var routingUnit = new routingClass;
            var endpointUnit = new endpointClass;
            var apiViewerUnit = new apiViewerClass([], []);
            
            self.ddpDatasetName = genericUnit.parseUrl().learnMore;
            self.apiViewers = apiViewerUnit.getAllAPIViewers();
            self.endpoints = endpointUnit.getAllEndpoints();            
            self.endpoint = ko.utils.arrayFirst(self.endpoints, function (item) {
                return (item.ddpDatasetName == self.ddpDatasetName) && (item.ddpIsMainEndpoint == true) && (item.endpointType == "ListEndpoint");
            });
            self.isShowDataDistribution = ko.observable(false);
            self.hostUri = genericUnit.host;
            self.datasetEndpoints = ko.utils.arrayFilter(self.endpoints, function (item) {
                return item.ddpDatasetName == self.endpoint.ddpDatasetName;
            });
            self.isModifiedResourceExists = ko.observable(false);

            self.goHome = function () {
                routingUnit.endpointList(false);
            };

            self.goExplore = function (endpoint) {
                routingUnit.searchResult(false, endpoint.uriTemplate.fullUri, endpoint.defaultViewer.name, null, null);
            };

            self.showDataDistribution = function () {
                self.isShowDataDistribution(true);
            };            
            
        },
        template: htmlText
    }
});