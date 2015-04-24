define(["knockout", "Scripts/text!modules/shortnamevalue.html"], function (ko, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.value = ko.unwrap(params.value);
            self.uri = ko.unwrap(params.uri);
          
        },
        template: htmlText
    }
});