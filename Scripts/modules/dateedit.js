define(["knockout", "Scripts/modules/classes/generic", "Scripts/text!modules/dateedit.html"], function (ko, genericClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.value = params.value;
            self.dayValue = ko.observable();
            self.monthValue = ko.observable();
            self.yearValue = ko.observable();
            self.isValueValid = ko.observable(null);
            self.isMonthFocused = ko.observable(false);
            self.isYearFocused = ko.observable(false);

            self.genericClass = new genericClass;

            self.checkDate = ko.computed(function () {                
                if (self.dayValue() != null)
                    self.isValueValid((self.genericClass.isIntegerAndGreaterThanZero(self.dayValue()) == true) && (self.dayValue() <= 31));
                else
                    self.isValueValid(null);
                if ((self.isValueValid() == true) && (self.dayValue().length == 2))
                    self.isMonthFocused(true);
                if (self.isValueValid() == true) {
                    if (self.monthValue() != null)
                        self.isValueValid((self.genericClass.isIntegerAndGreaterThanZero(self.monthValue()) == true) && (self.monthValue() <= 12));
                    else
                        self.isValueValid(null);
                    if ((self.isValueValid() == true) && (self.monthValue().length == 2))
                        self.isYearFocused(true);
                    if (self.isValueValid() == true) {
                        if (self.yearValue() != null)
                            self.isValueValid((self.genericClass.isIntegerAndGreaterThanZero(self.yearValue()) == true) && (self.yearValue() <= 2099));
                        else
                            self.isValueValid(null);
                        if (self.isValueValid() == true) {
                            var date = self.yearValue() + "-" + self.monthValue() + "-" + self.dayValue();
                            self.isValueValid(isNaN(Date.parse(date)) == false);
                            if (self.isValueValid() == true)
                                self.value(date);
                        }
                    }
                }                
            });

            self.init = ko.computed(function () {
                if ((self.value() != null) && (self.value() != "")) {
                    var arr = self.value().split("-");
                    if (arr.length == 3) {
                        self.dayValue(arr[2] * 1);
                        self.monthValue(arr[1] * 1);
                        self.yearValue(arr[0] * 1);
                    }
                }
                else {
                    self.dayValue(null);
                    self.monthValue(null);
                    self.yearValue(null);
                }
            });

            self.dispose = function () {                
                self.checkDate.dispose();
                self.init.dispose();
            };

            self.init();

        },
        template: htmlText
    }
});