define(["knockout", "Scripts/text!modules/shortnamevalue.html"], function (ko, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.label = ko.unwrap(params.label);
          
        },
        template: htmlText
    }
});