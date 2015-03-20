define(["knockout", "Scripts/modules/classes/generic", "Scripts/text!modules/numberedit.html"], function (ko, genericClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.number = params.value;
            self.dataType = params.dataType;
            self.value = ko.observable();
            self.isValueValid = ko.observable(null);
            self.isDisabled = params.isDisabled;
            self.isReadyToCheck = ko.observable(false);

            self.genericClass = new genericClass;

            self.checkValue = ko.computed(function () {
                if (self.isReadyToCheck() == false)
                    return;
                if (self.value() != null) {
                    if (self.dataType == "integer")
                        self.isValueValid(self.genericClass.isInteger(self.value()) == true);
                    if (self.dataType == "decimal")
                        self.isValueValid(self.genericClass.isDecimal(self.value()) == true);
                }
                if ((self.isValueValid() == true) && (self.value()!=null) && (self.value()!=""))
                    self.number(self.value());
                if ((self.value() == null) || (self.value() == ""))
                    self.number(null);
            });

            self.init = function () {
                if ((self.number() != null) && (self.number() != ""))
                    self.value(self.number());
                self.isReadyToCheck(true);
            };

            self.dispose = function () {
                self.checkValue.dispose();
            };

            self.init();

        },
        template: htmlText
    }
});