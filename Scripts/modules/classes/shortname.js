define(["knockout", "jquery",], function (ko, $) {
    var shortnameClass = function (endpoints) {
        var self = this;

        self.shortnameItem = function (uri, name, comment, isMultivalued, isStructured, dataType) {
            var dt = null;
            var label = name;
            
            if ((dataType != null) && (dataType.indexOf("#") > 0))
                dt = dataType.substring(dataType.indexOf("#") + 1).toLowerCase();
            if (name.length > 1) {
                label = name[0];
                for (var i = 1; i < name.length; i++) {
                    if (name[i] == name[i].toUpperCase())
                        label += " ";
                    label += name[i];
                }
            }
            label = label.toLowerCase();
            return {
                uri: uri,
                name: name,
                comment: comment,
                label: label,
                isMultivalued: isMultivalued,
                isStructured: isStructured,
                dataType: dt,                
                valuePattern: null
            }
        };

        self.findLegendForShortname = function (shortname, legends, shortnameFullPath) {
            var result = {};

            $.extend(result, shortname);
            if (legends != null) {
                var found = ko.utils.arrayFirst(legends, function (item) { return (item.label._value || item.label) == shortnameFullPath; });
                if (found != null) {
                    result.comment = found.comment;
                    result.valuePattern = found.valuePattern;
                }
            }
            return result;
        };

        self.findShortnamesForViewer = function (viewer) {
            var result = null;
            var shortnames = JSON.parse(sessionStorage.getItem("shortnames"));

            if ((viewer != null) && (viewer.properties != null)) {
                var found = null;                
                var shortnameFullPath = "";
                var complexPropertyArr;
                var complexShortname;
                var shortname;

                result = [];

                for (var i = 0; i < viewer.properties.length; i++) {
                    if (viewer.properties[i].indexOf(".") > 0) {
                        complexPropertyArr = viewer.properties[i].split(".");
                        complexShortname = [];
                        
                        for (var j = 0; j < complexPropertyArr.length; j++) {
                            shortnameFullPath = complexPropertyArr.slice(0, j + 1).join(".");
                            found = ko.utils.arrayFirst(shortnames, function (item) { return item.name == complexPropertyArr[j]; });                            
                            if (found != null) {
                                found = self.findLegendForShortname(found, viewer.legends, shortnameFullPath);
                                complexShortname.push(found);
                            }
                            else
                                break;
                        }
                        if (complexShortname.length == complexPropertyArr.length)
                            result.push(complexShortname);
                    }
                    else {
                        found = ko.utils.arrayFirst(viewer.properties, function (item) { return item.indexOf(viewer.properties[i] + ".") == 0; });
                        if (found == null) {
                            found = ko.utils.arrayFirst(shortnames, function (item) { return item.name == viewer.properties[i]; });
                            if (found != null) {
                                found = self.findLegendForShortname(found, viewer.legends, found.name);
                                result.push(found);
                            }
                        }
                    }
                }
                if (result.length == 0)
                    result = null;
            }

            return result;
        };

        self.readShortnames = function (data) {
            var arr = [];

            if ((data != null) && (data.result != null) && (data.result.items != null)) {
                var items = data.result.items;
                for (var i = 0; i < items.length; i++)
                    arr.push(self.shortnameItem(
                        items[i]._about,
                        items[i].propertyName || items[i].label,
                        items[i].note || items[i].comment,
                        items[i].isMultivalued || items[i].multiValued,
                        items[i].isStructured || items[i].structured,
                        items[i].dataType || items[i].range));

                sessionStorage.setItem("shortnames", JSON.stringify(arr));
            }

            return arr;
        };

        self.getAllShortnames = function () {
            var shortnames = sessionStorage.getItem("shortnames");

            if (shortnames != null)
                return JSON.parse(shortnames);
            else
                return null;
        };

    }
    return shortnameClass;
});