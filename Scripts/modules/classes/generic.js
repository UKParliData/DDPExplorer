define(["knockout", "jquery"], function (ko, $) {
    var genericClass = function () {
        var self = this;

        self.host = "http://lda.data.parliament.uk/";

        self.endpointUri = "endpoint/";

        self.getDataFromOwlim = function (endpoint, parameters, whenDone, whenError) {            
            $.ajax({
                url: self.host + endpoint + ".json",
                data: parameters,
                dataType: "jsonp",
                success: function () {
                },
                error: whenError
            }).done(whenDone);
        };

        self.closeAllPopups = function () {
            $(".btn-group").removeClass("open");
            return true;
        };

        self.isInteger = function (value) {
            return ((isNaN(value) == false) && (parseInt(Number(value)) == value));
        };

        self.isDecimal = function (value) {
            return ((isNaN(value) == false) && (parseFloat(Number(value)) == value));
        }

        self.isIntegerPositive = function (value) {
            return (self.isInteger(value) == true) && (value >= 0);
        }

        self.isIntegerAndGreaterThanZero = function (value) {
            return (self.isInteger(value) == true) && (value > 0);
        }
        
    }
    return genericClass;
});