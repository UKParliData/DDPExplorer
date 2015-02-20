define(["knockout", "Scripts/text!modules/resourceitem.html"], function (ko, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;
            
            self.resource = ko.observable(ko.unwrap(params.resource));
            self.properties = ko.observableArray(ko.unwrap(params.properties));
            self.isItemEndpoint = ko.observable(ko.unwrap(params.isItemEndpoint));
            self.deepLevel = ko.observable(ko.unwrap(params.deepLevel));

            self.toggleResource = function (vm, e) {
                vm.resource().isVisible(!vm.resource().isVisible());
            };
        },
        template: htmlText
    }
});