define(["knockout", "Scripts/modules/classes/generic", "Scripts/text!modules/datetimeedit.html"], function (ko, genericClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.value = params.value;
            self.dayValue = ko.observable();
            self.monthValue = ko.observable();
            self.yearValue = ko.observable();
            self.isHourValid = ko.observable(null);
            self.hourValue = ko.observable();
            self.minuteValue = ko.observable();
            self.secondValue = ko.observable();
            self.secondFractionValue = ko.observable();
            self.isValueValid = ko.observable(null);
            self.isMonthFocused = ko.observable(false);
            self.isYearFocused = ko.observable(false);
            self.isHourFocused = ko.observable(false);
            self.isMinuteFocused = ko.observable(false);
            self.isSecondFocused = ko.observable(false);
            self.isSecondFractionFocused = ko.observable(false);

            self.genericClass = new genericClass;

            self.checkDateTime = ko.computed(function () {
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
                        if ((self.isValueValid() == true) && (self.yearValue().length == 4))
                            self.isHourFocused(true);
                    }
                }

                if (self.isValueValid() == true) {
                    if (self.hourValue() != null)
                        self.isValueValid((self.genericClass.isIntegerPositive(self.hourValue()) == true) && (self.hourValue() <= 24));
                    if ((self.isValueValid() == true) && (self.hourValue() != null) && (self.hourValue().length == 2))
                        self.isMinuteFocused(true);
                    if ((self.isValueValid() == true) && (self.hourValue() != null)) {
                        if (self.minuteValue() != null)
                            self.isValueValid((self.genericClass.isIntegerPositive(self.minuteValue()) == true) && (self.minuteValue() <= 59));
                        if ((self.isValueValid() == true) && (self.minuteValue() != null) && (self.minuteValue().length == 2))
                            self.isSecondFocused(true);
                        if ((self.isValueValid() == true) && (self.minuteValue() != null)) {
                            if (self.secondValue() != null)
                                self.isValueValid((self.genericClass.isIntegerPositive(self.secondValue()) == true) && (self.secondValue() <= 59));
                            if ((self.isValueValid() == true) && (self.secondValue() != null) && (self.secondValue().length == 2))
                                self.isSecondFractionFocused(true);
                            if ((self.isValueValid() == true) && (self.secondValue() != null)) {
                                if (self.secondFractionValue() != null)
                                    self.isValueValid((self.genericClass.isIntegerPositive(self.secondFractionValue()) == true) && (self.secondFractionValue() <= 9999999));
                            }
                        }
                    }
                }

                if (self.isValueValid() == true){
                    var date = self.yearValue() + "-" + self.monthValue() + "-" + self.dayValue();                            
                    self.isValueValid(isNaN(Date.parse(date)) == false);
                    if (self.isValueValid() == true){
                        if ((self.hourValue() != null) && (self.minuteValue() != null) && (self.secondValue() != null) && (self.secondFractionValue() != null))
                            date+="T" + self.hourValue() + ":" + self.minuteValue() + ":" + self.secondValue() + "." + self.secondFractionValue() + "Z";
                        else
                            if ((self.hourValue() != null) && (self.minuteValue() != null) && (self.secondValue() != null) && (self.secondFractionValue() == null))
                                date+="T" + self.hourValue() + ":" + self.minuteValue() + ":" + self.secondValue();
                        self.value(date);
                    }
                }                
            });

            self.init = function () {                
                if ((self.value() != null) && (self.value() != "")) {
                    var arr;
                    var fullArr = self.value().split("T");
                    if (fullArr.length == 2) {
                        arr = fullArr[1].split(":");
                        self.hourValue(arr[0] * 1);
                        self.minuteValue(arr[1] * 1);
                        if (arr[2].indexOf(".") > 0) {
                            arr = arr[2].split(".");
                            self.secondValue(arr[0] * 1);
                            self.secondFractionValue(arr[1].replace("Z","") * 1);
                        }
                        else
                            self.secondValue(arr[2] * 1);
                    }
                    if (fullArr.length > 0) {
                        arr = fullArr[0].split("-");
                        self.dayValue(arr[2] * 1);
                        self.monthValue(arr[1] * 1);
                        self.yearValue(arr[0] * 1);
                    }
                }
            };

            self.dispose = function () {
                self.checkDateTime.dispose();
            };

            self.init();

        },
        template: htmlText
    }
});