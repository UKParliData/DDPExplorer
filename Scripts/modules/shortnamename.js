define(["knockout", "Scripts/text!modules/shortnamename.html"], function (ko, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            if (ko.isComputed(params.label))
                self.label = params.label;
            else
                self.label = ko.observable(params.label);

        },
        template: htmlText
    }
});