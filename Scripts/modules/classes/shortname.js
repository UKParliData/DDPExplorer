define(["knockout", "jquery",], function (ko, $) {
    var shortnameClass = function (endpoints) {
        var self = this;

        self.shortnameItem = function (uri, name, isMultivalued, isStructured, dataType) {
            var dt = null;
            var label = name;
            var itemEndpoint = null;

            if ((dataType != null) && (dataType.indexOf("#") > 0))
                dt = dataType.substring(dataType.indexOf("#") + 1).toLowerCase();
            if (dt == "resource")
                itemEndpoint = self.findEndpointForResource(name);
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
                label: label,
                isMultivalued: isMultivalued,
                isStructured: isStructured,
                dataType: dt,
                itemEndpoint: itemEndpoint,
                description: null,
                valuePattern: null
            }
        };

        self.findEndpointForResource = function (name) {
            var found=null;
            for (var i = 0; i < endpoints.length; i++) {
                found = ko.utils.arrayFirst(endpoints[i].ddpShortnameResources, function (item) { return item.label == name; });
                if (found != null)
                    return endpoints[i];
            }
            return null;
        }

        self.findLegendForShortname = function (shortname, legends, shortnameFullPath) {
            var result = {};

            $.extend(result, shortname);
            if (legends != null) {
                var found = ko.utils.arrayFirst(legends, function (item) { return (item.label._value || item.label) == shortnameFullPath; });
                if (found != null) {
                    result.description = found.comment;
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
                var description = null;
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
                        items[i].isMultivalued || items[i].multiValued,
                        items[i].isStructured || items[i].structured,
                        items[i].dataType || items[i].range));

                sessionStorage.setItem("shortnames", JSON.stringify(arr));
            }            
        };

    }
    return shortnameClass;
});