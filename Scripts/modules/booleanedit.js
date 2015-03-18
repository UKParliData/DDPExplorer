define(["knockout", "Scripts/text!modules/booleanedit.html"], function (ko, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.noneText = params.noneText;
            self.trueText = params.trueText;
            self.falseText = params.falseText;
            self.value = params.value;
            self.isDisabled = params.isDisabled;
            
            self.isDisabledChanged = ko.computed(function () {
                if (self.isDisabled() == true)
                    self.value(true);
                else
                    self.value(null);
            });

            self.dispose = function () {
                self.isDisabledChanged.dispose();
            };
        },
        template: htmlText
    }
});