﻿define(["knockout", "jquery"], function (ko, $) {
    var genericClass = function () {
        var self = this;
        
        self.host = "http://lda.data.parliament.uk/";

        self.endpointQueryString = "endpoint";

        self.getDataFromOwlim = function (endpoint, parameters, whenDone, whenError, dataToLoadDescription) {
            $.ajax({
                timeout: 65 *1000,
                url: self.host + endpoint + ".json",
                data: parameters,
                dataType: "jsonp",
                success: function () {
                },
                error: function () {
                    whenError(dataToLoadDescription);
                }
            }).done(whenDone);
        };

        self.parseUrl = function () {
            var search = window.location.search.replace("?", "");
            var divider = search.indexOf("&");
            var endpoint = null;
            var querystring = null;
            var learnMore = null;

            if (search.toUpperCase().indexOf(self.endpointQueryString.toUpperCase()+"=") == 0) {
                if (divider > 0) {
                    endpoint = search.substring(search.indexOf("/") + 1, divider);
                    var params = search.substring(search.indexOf("&") + 1).split("&");
                    querystring = {};
                    for (var i = 0; i < params.length; i++)
                        querystring[decodeURIComponent(params[i].split("=")[0])] = decodeURIComponent(params[i].split("=")[1]);
                }
                else
                    endpoint = search.substring(search.indexOf("=") + 1);
                if (endpoint.toUpperCase().indexOf("ENDPOINT/") == 0)
                    endpoint = endpoint.substring(9);
            }
            else
                if (search.toUpperCase().indexOf("LEARNMORE=") == 0)
                    learnMore = decodeURIComponent(search.split("=")[1]);
            return {
                endpoint: endpoint,
                querystring: querystring,
                learnMore: learnMore,
                hash: window.location.hash
            }
        };

        self.closeAllPopups = function () {
            $(".btn-group").removeClass("open");
            $(".input-group").removeClass("open");
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

        self.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        self.dateFormatType={
            year:1,
            month:2,
            day:3,
            hour:4,
            minute:5,
            second:6,            
            fraction:7,
            dateTimeSeparator:8,
            timeZone:9,
            zuluTime:10
        };

        self.formatDate = function (textFormat, date) {            
            var year = date.getUTCFullYear();
            var month = date.getUTCMonth() + 1
            var day = date.getUTCDate();
            var result = "";
            var dateSplit = "";
            var timeSplit = "";
            var fractionSplit = "";
            var sequence = [];
            var len = 0;

            textFormat = textFormat || "yyyy-MM-dd";

            while (len < textFormat.length) {
                if (textFormat.substring(len, len + 4) == "yyyy") {
                    if ((sequence.length > 0) && (dateSplit == "") &&
                        ((sequence[sequence.length - 1] == self.dateFormatType.month) || (sequence[sequence.length - 1] == self.dateFormatType.day)))
                        dateSplit = textFormat.substring(len - 1, len);
                    sequence.push(self.dateFormatType.year);
                    len+=4;
                }
                else
                    if (textFormat.substring(len, len + 2) == "MM") {
                        if ((sequence.length > 0) && (dateSplit == "") &&
                            ((sequence[sequence.length - 1] == self.dateFormatType.year) || (sequence[sequence.length - 1] == self.dateFormatType.day)))
                            dateSplit = textFormat.substring(len - 1, len);
                        sequence.push(self.dateFormatType.month);
                        len+=2;
                    }
                    else
                        if (textFormat.substring(len, len + 2) == "dd") {
                            if ((sequence.length > 0) && (dateSplit == "") &&
                                ((sequence[sequence.length - 1] == self.dateFormatType.month) || (sequence[sequence.length - 1] == self.dateFormatType.year)))
                                dateSplit = textFormat.substring(len - 1, len);
                            sequence.push(self.dateFormatType.day);
                            len+=2;
                        }
                        else 
                            if (textFormat.substring(len, len + 1) == "T") {
                                sequence.push(self.dateFormatType.dateTimeSeparator);
                                len+=1;
                            }
                            else
                                if (textFormat.substring(len, len + 1) == "Z") {
                                    sequence.push(self.dateFormatType.zuluTime);
                                    len+=1;
                                }
                                else
                                    if (textFormat.substring(len, len + 2) == "HH") {
                                        if ((sequence.length > 0) && (timeSplit == "") &&
                                            ((sequence[sequence.length - 1] == self.dateFormatType.minute) || (sequence[sequence.length - 1] == self.dateFormatType.second)))
                                            timeSplit = textFormat.substring(len - 1, len);
                                        sequence.push(self.dateFormatType.hour);
                                        len+=2;
                                    }
                                    else 
                                        if (textFormat.substring(len, len + 2) == "mm") {
                                            if ((sequence.length > 0) && (timeSplit == "") &&
                                                ((sequence[sequence.length - 1] == self.dateFormatType.hour) || (sequence[sequence.length - 1] == self.dateFormatType.second)))
                                                timeSplit = textFormat.substring(len - 1, len);
                                            sequence.push(self.dateFormatType.minute);
                                            len+=2;
                                        }
                                        else 
                                            if (textFormat.substring(len, len + 2) == "ss") {
                                                if ((sequence.length > 0) && (timeSplit == "") &&
                                                    ((sequence[sequence.length - 1] == self.dateFormatType.minute) || (sequence[sequence.length - 1] == self.dateFormatType.hour)))
                                                    timeSplit = textFormat.substring(len - 1, len);
                                                sequence.push(self.dateFormatType.second);
                                                len+=2;
                                            }
                                            else
                                                if (textFormat.substring(len, len + 7) == "fffffff") {
                                                    if (len > 0)
                                                        fractionSplit = textFormat.substring(len - 1, len);
                                                    sequence.push(self.dateFormatType.fraction);
                                                    len+=7;
                                                }
                                                else
                                                    if (textFormat.substring(len, len + 6) == "+HH:mm") {
                                                        sequence.push(self.dateFormatType.timeZone);
                                                        len+=6;
                                                    }
                                                    else
                                                        len++;
            }
                                                                        
            for (var i = 0; i < sequence.length; i++)
                switch (sequence[i]) {
                    case self.dateFormatType.year:
                        if (i == 0)
                            result += year;
                        else
                            result += dateSplit + year;
                        break;
                    case self.dateFormatType.month:
                        if (month < 10)
                            month = "0" + month.toString();
                        if (i == 0)
                            result += month;
                        else
                            result += dateSplit + month;
                        break;
                    case self.dateFormatType.day:
                        if (day < 10)
                            day = "0" + day.toString();
                        if (i == 0)
                            result += day;
                        else
                            result += dateSplit + day;
                        break;
                    case self.dateFormatType.dateTimeSeparator:
                        result += "T";
                        break;
                    case self.dateFormatType.hour:
                    case self.dateFormatType.minute:
                    case self.dateFormatType.second:
                        if ((i == 0) || ((i > 0) && (sequence[i - 1] == self.dateFormatType.dateTimeSeparator)))
                            result += "00";
                        else
                            result += timeSplit + "00";
                        break;
                    case self.dateFormatType.fraction:
                        result += fractionSplit + "0000000";
                        break;
                    case self.dateFormatType.zuluTime:
                        result += "Z";
                        break;
                    case self.dateFormatType.timeZone:
                        result += "+00:00";
                        break;
                }
            return result;
        };

        self.sortArray = function (arrayToSort, indexFieldName, sortFieldName) {
            arrayToSort.sort(function (left, right) {
                if (Array.isArray(left))
                    return 1;
                if (Array.isArray(right))
                    return -1;
                return left[sortFieldName] === right[sortFieldName] ? left[indexFieldName] - right[indexFieldName] : left[sortFieldName] > right[sortFieldName] ? 1 : -1;
            });
        }

        self.errorOnLoad = function (dataToLoadDescription) {
            self.customError("Whoops! Something went wrong when looking for " + dataToLoadDescription + ". Please try again in a few moments.");
        };

        self.customError = function (text) {
            window.conductorVM.showError(text);
            window.conductorVM.isAppBusy(false);
            window.conductorVM.isPageLoading(false);
        };
        
    }
    return genericClass;
});