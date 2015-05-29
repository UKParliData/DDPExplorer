define(["knockout", "Scripts/modules/classes/routing", "Scripts/text!modules/viewerfieldlist.html"], function (ko, routingClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            var routingUnit = new routingClass;

            self.apiViewers = ko.unwrap(params.apiViewers);
            self.ddpDatasetName = ko.unwrap(params.ddpDatasetName);

            self.viewer = ko.utils.arrayFirst(self.apiViewers, function (item) {
                return item.ddpDatasetName == self.ddpDatasetName;
            });
            
            self.showAPIHelp = function (property) {
                routingUnit.datasetAPIHelp(false, property.itemEndpoint.ddpDatasetName);                
            };
        },
        template: htmlText
    }
});