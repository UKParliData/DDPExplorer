define(["knockout", "Scripts/text!modules/booleanedit.html"], function (ko, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.noneText = params.noneText;
            self.trueText = params.trueText;
            self.falseText = params.falseText;
            self.value = params.value;

        },
        template: htmlText
    }
});