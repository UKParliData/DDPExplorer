define(["knockout", "Scripts/text!modules/filteredit.html"], function (ko, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.noneText = params.noneText;
            self.trueText = params.trueText;
            self.falseText = params.falseText;
            self.dataType = params.dataType;
            self.value = params.value;
            self.isDisabled = params.isDisabled;

        },
        template: htmlText
    }
});