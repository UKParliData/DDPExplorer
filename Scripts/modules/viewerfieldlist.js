define(["knockout", "Scripts/text!modules/viewerfieldlist.html"], function (ko, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.apiViewers = ko.unwrap(params.apiViewers);
            self.ddpDatasetName = ko.unwrap(params.ddpDatasetName);
            self.viewer = ko.utils.arrayFirst(self.apiViewers, function (item) {
                return item.ddpDatasetName == self.ddpDatasetName;
            });

        },
        template: htmlText
    }
});