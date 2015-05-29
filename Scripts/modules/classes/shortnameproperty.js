define(["knockout", "Scripts/modules/classes/generic"], function (ko, genericClass) {
    var shortnamePropertyClass = function () {
        var self = this;

        var genericUnit = new genericClass;

        self.shortnamePropertyItem = function (index, name, label, dataType, comment,
                valuePattern, isSelected, searchValue, minValue, maxValue, minExclusiveValue,
                maxExclusiveValue, existsValue) {

            var isSelectedKo = ko.observable(isSelected);
            var searchValueKo = ko.observable(searchValue);
            var minValueKo = ko.observable(minValue);
            var maxValueKo = ko.observable(maxValue);
            var minExclusiveValueKo = ko.observable(minExclusiveValue);
            var maxExclusiveValueKo = ko.observable(maxExclusiveValue);
            var existsValueKo = ko.observable(existsValue);
            var hasFilterKo = ko.observable(null);

            var filterDescriptionKo = ko.computed(function () {
                var arr = [];

                if ((searchValueKo() != null) && (searchValueKo() != ""))
                    arr.push("equals '" + searchValueKo() + "'");
                if ((maxValueKo() != null) && (maxValueKo() != ""))
                    arr.push("less than or equal '" + maxValueKo() + "'");
                if ((minValueKo() != null) && (minValueKo() != ""))
                    arr.push("more than or equal '" + minValueKo() + "'");
                if ((maxExclusiveValueKo() != null) && (maxExclusiveValueKo() != ""))
                    arr.push("less than '" + maxExclusiveValueKo() + "'");
                if ((minExclusiveValueKo() != null) && (minExclusiveValueKo() != ""))
                    arr.push("more than '" + minExclusiveValueKo() + "'");
                if (existsValueKo() == true)
                    arr.push("is present");
                if (existsValueKo() == false)
                    arr.push("is not present");

                if (arr.length > 0) {
                    hasFilterKo(true);
                    return arr.join(" and ");
                }
                else {
                    hasFilterKo(false);
                    return "has no filters";
                }
            });

            dispose = function () {
                filterDescriptionKo.dispose();
            };

            return {
                index: index,
                name: name,
                label: label,
                dataType: dataType,
                comment: comment,
                valuePattern: valuePattern,
                isSelected: isSelectedKo,
                searchValue: searchValueKo,
                minValue: minValueKo,
                maxValue: maxValueKo,
                minExclusiveValue: minExclusiveValueKo,
                maxExclusiveValue: maxExclusiveValueKo,
                existsValue: existsValueKo,
                filterDescription: filterDescriptionKo,
                hasFilter: hasFilterKo,
                isFilterOpen: ko.observable(false),
                canMultipleFilters: ko.observable((dataType == 'date') || (dataType == 'datetime') || (dataType == 'integer') || (dataType == 'decimal'))
            }
        };

        var assignFilter = function (shortnameProperty, valueName) {
            if ((shortnameProperty.dataType == "date") || (shortnameProperty.dataType == "datetime")) {
                dateValue = new Date(Date.UTC(shortnameProperty[valueName]().split("-")[0] * 1, (shortnameProperty[valueName]().split("-")[1] * 1) - 1, shortnameProperty[valueName]().split("-")[2] * 1));
                return genericUnit.formatDate(shortnameProperty.valuePattern, dateValue);
            }
            else
                return shortnameProperty[valueName]();
        }

        self.buildQueryString = function (shortnameProperties, textQuery) {
            var querystring = {};
            var includedPropertiesInView = [];
            var dateValue;

            includedPropertiesInView = ko.utils.arrayFilter(shortnameProperties, function (item) { return item.isSelected() == true; });
            if (includedPropertiesInView.length < shortnameProperties.length) {
                querystring._view = "basic";
                querystring._properties = ko.utils.arrayMap(includedPropertiesInView, function (item) { return item.name; }).join(",");
            }
            for (var i = 0; i < shortnameProperties.length; i++) {
                if ((shortnameProperties[i].searchValue() != null) && (shortnameProperties[i].searchValue() != "")) {
                    if ((shortnameProperties[i].dataType == "datetime") && (shortnameProperties[i].valuePattern != null) && (shortnameProperties[i].valuePattern.length > 10)) {
                        dateValue = new Date(Date.UTC(shortnameProperties[i].searchValue().split("-")[0] * 1, (shortnameProperties[i].searchValue().split("-")[1] * 1) - 1, shortnameProperties[i].searchValue().split("-")[2] * 1));
                        querystring["min-" + shortnameProperties[i].name] = genericUnit.formatDate(shortnameProperties[i].valuePattern, dateValue);
                        dateValue.setUTCDate(dateValue.getUTCDate() + 1);
                        querystring["maxEx-" + shortnameProperties[i].name] = genericUnit.formatDate(shortnameProperties[i].valuePattern, dateValue);
                    }
                    else
                        querystring[shortnameProperties[i].name] = assignFilter(shortnameProperties[i], "searchValue");
                }
                if ((shortnameProperties[i].maxExclusiveValue() != null) && (shortnameProperties[i].maxExclusiveValue() != ""))
                    querystring["maxEx-" + shortnameProperties[i].name] = assignFilter(shortnameProperties[i], "maxExclusiveValue");
                if ((shortnameProperties[i].minExclusiveValue() != null) && (shortnameProperties[i].minExclusiveValue() != ""))
                    querystring["minEx-" + shortnameProperties[i].name] = assignFilter(shortnameProperties[i], "minExclusiveValue");
                if ((shortnameProperties[i].maxValue() != null) && (shortnameProperties[i].maxValue() != "")) {
                    if ((shortnameProperties[i].dataType == "datetime") && (shortnameProperties[i].valuePattern != null) && (shortnameProperties[i].valuePattern.length > 10)) {
                        dateValue = new Date(Date.UTC(shortnameProperties[i].maxValue().split("-")[0] * 1, (shortnameProperties[i].maxValue().split("-")[1] * 1) - 1, shortnameProperties[i].maxValue().split("-")[2] * 1));
                        dateValue.setUTCDate(dateValue.getUTCDate() + 1);
                        querystring["max-" + shortnameProperties[i].name] = genericUnit.formatDate(shortnameProperties[i].valuePattern, dateValue);
                    }
                    else
                        querystring["max-" + shortnameProperties[i].name] = assignFilter(shortnameProperties[i], "maxValue");
                }
                if ((shortnameProperties[i].minValue() != null) && (shortnameProperties[i].minValue() != "")) {
                    if ((shortnameProperties[i].dataType == "datetime") && (shortnameProperties[i].valuePattern != null) && (shortnameProperties[i].valuePattern.length > 10)) {
                        dateValue = new Date(Date.UTC(shortnameProperties[i].minValue().split("-")[0] * 1, (shortnameProperties[i].minValue().split("-")[1] * 1) - 1, shortnameProperties[i].minValue().split("-")[2] * 1));
                        dateValue.setUTCDate(dateValue.getUTCDate() - 1);
                        querystring["min-" + shortnameProperties[i].name] = genericUnit.formatDate(shortnameProperties[i].valuePattern, dateValue);
                    }
                    else
                        querystring["min-" + shortnameProperties[i].name] = assignFilter(shortnameProperties[i], "minValue");
                }
                if (shortnameProperties[i].existsValue() != null)
                    querystring["exists-" + shortnameProperties[i].name] = shortnameProperties[i].existsValue();
            }
            if ((textQuery != null) && (textQuery != ""))
                querystring._search = textQuery;
            return querystring;
        };


        self.createShortnameProperties = function (shortnames, querystring, selectedArr) {
            var arr = [];
            var name;
            var label;
            var dataType;
            var comment;
            var valuePattern;            

            for (var i = 0; i < shortnames.length; i++) {
                if (Array.isArray(shortnames[i]) == true) {
                    name = ko.utils.arrayMap(shortnames[i], function (item) { return item.name; }).join(".");
                    label = ko.utils.arrayMap(shortnames[i], function (item) { return item.label; });
                    dataType = shortnames[i][shortnames[i].length - 1].dataType;
                    comment = shortnames[i][shortnames[i].length - 1].comment;
                    valuePattern = shortnames[i][shortnames[i].length - 1].valuePattern
                }
                else {
                    name = shortnames[i].name;
                    label = shortnames[i].label;
                    dataType = shortnames[i].dataType;
                    comment = shortnames[i].comment;
                    valuePattern = shortnames[i].valuePattern;
                }
                arr.push(self.shortnamePropertyItem(
                    i,
                    name,
                    label,
                    dataType,
                    comment,
                    valuePattern,
                    ko.utils.arrayFirst(selectedArr, function (item) { return item == name; }) != null,
                    querystring[name] || null,
                    querystring["min-" + name] || null,
                    querystring["max-" + name] || null,
                    querystring["minEx-" + name] || null,
                    querystring["maxEx-" + name] || null,
                    querystring["exists-" + name] || null
                ));
            }
            arr.sort(function (left, right) {
                return left.name === right.name ? left.index - right.index : left.name > right.name ? 1 : -1;
            });
            return arr;
        };

    }
    return shortnamePropertyClass;
});