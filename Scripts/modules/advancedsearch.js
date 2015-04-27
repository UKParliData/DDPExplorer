define(["knockout", "jquery", "Scripts/modules/classes/generic", "Scripts/modules/classes/endpoint", "Scripts/modules/classes/shortname", "Scripts/text!modules/advancedsearch.html"], function (ko, $, genericClass, endpointClass, shortnameClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.endpointUrl = params.endpointUrl;
            self.endpoint = params.endpoint;
            self.shortnames = params.shortnames;
            self.textQuery = params.textQuery;
            self.querystring = ko.unwrap(params.querystring);
            self.shortnameProperties = ko.observableArray(ko.unwrap(params.shortnameProperties) || []);
            self.isAllSelected = ko.observable(null);
            self.selectedView = ko.observable(params.viewerName);
            self.isFiltersShown = ko.observable(true);
            self.isFieldsShown = ko.observable(false);
            self.filterSearchText = ko.observable(null);
            self.isFilterSearchFocused = ko.observable(true);
            self.matchingFilters = ko.observableArray([]);

            self.genericClass = new genericClass;
            self.endpointClass = new endpointClass;
            self.shortnameClass = new shortnameClass(self.endpointClass.getAllEndpoints());

            self.showFiltersTab = function () {
                self.isFiltersShown(true);
                self.isFieldsShown(false);
            };

            self.showFieldsTab = function () {
                self.isFiltersShown(false);
                self.isFieldsShown(true);
            };
            
            self.showMenu = function (vm, e) {
                var hasClass = $(e.target).parent(".btn-group").hasClass("open");

                self.genericClass.closeAllPopups();
                if (hasClass == false)
                    $(e.target).parent(".btn-group").addClass("open");
                e.stopPropagation();
            };

            self.selectViewer = function (viewer) {                
                self.selectedView(viewer.name);
                self.shortnames(self.shortnameClass.findShortnamesForViewer(viewer));
                self.shortnameProperties([]);
                self.init();
            };

            self.toggleSelect = function () {
                var isAllSelected=!self.isAllSelected();
                self.isAllSelected(isAllSelected);
                ko.utils.arrayForEach(self.shortnameProperties(), function (item) { item.isSelected(isAllSelected); });
            };

            self.selectPropertyForView = function (shortnameProperty) {
                shortnameProperty.isSelected(!shortnameProperty.isSelected());
                var found = ko.utils.arrayFirst(self.shortnameProperties(), function (item) { return item.isSelected() == false; });
                self.isAllSelected(found == null);
            };

            self.addFilter = function (vm) {                
                vm.isFilterOpen(true);
            };            

            self.searchFilters = ko.computed(function () {
                if ((self.isFilterSearchFocused() == true) && (self.shortnameProperties().length>0)) {
                    var arr = [];
                    var textSearch = (self.filterSearchText() || "").toUpperCase();

                    arr = ko.utils.arrayFilter(self.shortnameProperties(), function (item) {
                        return ((item.hasFilter()==false) && (item.isFilterOpen()==false)) &&
                            ((textSearch == "") ||
                            ((Array.isArray(item.label) == true) && (item.label.join(" ").toUpperCase().indexOf(textSearch) >= 0)) ||
                            ((Array.isArray(item.label) == false) && (item.label.toUpperCase().indexOf(textSearch) >= 0)));
                    });

                    self.matchingFilters(arr);
                }
            });

            self.showFilter = function (vm, e) {
                vm.isFilterOpen(true);
            };

            self.hideFilter = function (vm, e) {
                vm.isFilterOpen(false);
            };

            self.clearFilter = function (vm, e) {
                vm.searchValue(null);
                vm.minValue(null);
                vm.maxValue(null);
                vm.minExclusiveValue(null);
                vm.maxExclusiveValue(null);
                vm.existsValue(null);
            };

            self.cancel = function () {
                window.conductorVM.parameters({
                    endpointUrl: self.endpointUrl,
                    querystring: self.querystring,
                    endpoint: self.endpoint,
                    viewerName: params.viewerName,
                    shortnames: params.shortnames,
                    shortnameProperties: params.shortnameProperties
                });
                window.conductorVM.selectedComponent("search-result");
            };

            self.submit = function () {
                var querystring = self.buildQueryString();
                window.conductorVM.parameters({
                    endpointUrl: self.endpoint().uriTemplate.fullUri,
                    querystring: querystring,
                    endpoint: self.endpoint,
                    viewerName: self.selectedView(),
                    shortnames: self.shortnames,
                    shortnameProperties: self.shortnameProperties
                });
                window.conductorVM.selectedComponent("search-result");
            };

            self.filterCount = ko.computed(function () {
                return ko.utils.arrayFilter(self.shortnameProperties(), function (item) {
                    return item.hasFilter() == true;
                }).length;
            });

            self.assignFilter = function (shortnameProperty, valueName) {
                if ((shortnameProperty.dataType == "date") || (shortnameProperty.dataType == "datetime")) {
                    dateValue = new Date(Date.UTC(shortnameProperty[valueName]().split("-")[0] * 1, (shortnameProperty[valueName]().split("-")[1] * 1) - 1, shortnameProperty[valueName]().split("-")[2] * 1));
                    return self.genericClass.formatDate(shortnameProperty.valuePattern, dateValue);
                }
                else
                    return shortnameProperty[valueName]();
            }

            self.buildQueryString = function () {
                var querystring = {};
                var includedPropertiesInView = [];
                var shortnameProperties = self.shortnameProperties();
                var dateValue;

                includedPropertiesInView = ko.utils.arrayFilter(shortnameProperties, function (item) { return item.isSelected() == true; });
                if (includedPropertiesInView.length < shortnameProperties.length) {
                    querystring._view = "basic";
                    querystring._properties = ko.utils.arrayMap(includedPropertiesInView, function(item){ return item.name; }).join(",");
                }
                for (var i = 0; i < shortnameProperties.length; i++) {
                    if ((shortnameProperties[i].searchValue() != null) && (shortnameProperties[i].searchValue() != "")) {
                        if ((shortnameProperties[i].dataType == "datetime") && (shortnameProperties[i].valuePattern!=null) && (shortnameProperties[i].valuePattern.length > 10)) {
                            dateValue = new Date(Date.UTC(shortnameProperties[i].searchValue().split("-")[0] * 1, (shortnameProperties[i].searchValue().split("-")[1] * 1) - 1, shortnameProperties[i].searchValue().split("-")[2] * 1));
                            querystring["min-" + shortnameProperties[i].name] = self.genericClass.formatDate(shortnameProperties[i].valuePattern, dateValue);
                            dateValue.setUTCDate(dateValue.getUTCDate() + 1);
                            querystring["maxEx-" + shortnameProperties[i].name] = self.genericClass.formatDate(shortnameProperties[i].valuePattern, dateValue);
                        }
                        else
                            querystring[shortnameProperties[i].name] = self.assignFilter(shortnameProperties[i], "searchValue");
                    }
                    if ((shortnameProperties[i].maxExclusiveValue() != null) && (shortnameProperties[i].maxExclusiveValue() != ""))
                        querystring["maxEx-" + shortnameProperties[i].name] = self.assignFilter(shortnameProperties[i], "maxExclusiveValue");
                    if ((shortnameProperties[i].minExclusiveValue() != null) && (shortnameProperties[i].minExclusiveValue() != ""))
                        querystring["minEx-" + shortnameProperties[i].name] = self.assignFilter(shortnameProperties[i], "minExclusiveValue");
                    if ((shortnameProperties[i].maxValue() != null) && (shortnameProperties[i].maxValue() != "")) {
                        if ((shortnameProperties[i].dataType == "datetime") && (shortnameProperties[i].valuePattern != null) && (shortnameProperties[i].valuePattern.length > 10)) {
                            dateValue = new Date(Date.UTC(shortnameProperties[i].maxValue().split("-")[0] * 1, (shortnameProperties[i].maxValue().split("-")[1] * 1) - 1, shortnameProperties[i].maxValue().split("-")[2] * 1));
                            dateValue.setUTCDate(dateValue.getUTCDate() + 1);
                            querystring["max-" + shortnameProperties[i].name] = self.genericClass.formatDate(shortnameProperties[i].valuePattern, dateValue);
                        }
                        else
                            querystring["max-" + shortnameProperties[i].name] = self.assignFilter(shortnameProperties[i], "maxValue");
                    }
                    if ((shortnameProperties[i].minValue() != null) && (shortnameProperties[i].minValue() != "")) {
                        if ((shortnameProperties[i].dataType == "datetime") && (shortnameProperties[i].valuePattern != null) && (shortnameProperties[i].valuePattern.length > 10)) {
                            dateValue = new Date(Date.UTC(shortnameProperties[i].minValue().split("-")[0] * 1, (shortnameProperties[i].minValue().split("-")[1] * 1) - 1, shortnameProperties[i].minValue().split("-")[2] * 1));
                            dateValue.setUTCDate(dateValue.getUTCDate() - 1);
                            querystring["min-" + shortnameProperties[i].name] = self.genericClass.formatDate(shortnameProperties[i].valuePattern, dateValue);
                        }
                        else
                            querystring["min-" + shortnameProperties[i].name] = self.assignFilter(shortnameProperties[i], "minValue");
                    }
                    if (shortnameProperties[i].existsValue() != null)
                        querystring["exists-" + shortnameProperties[i].name] = shortnameProperties[i].existsValue();
                }
                if ((self.textQuery() != null) && (self.textQuery() != ""))
                    querystring._search = self.textQuery();
                return querystring;
            };            

            self.shortnameProperty = function (index, name, label, dataType, comment,
                valuePattern, isSelected, searchValue, minValue, maxValue, minExclusiveValue,
                maxExclusiveValue, existsValue) {
                
                var isSelectedKo= ko.observable(isSelected);
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
                        arr.push("equals '" + searchValueKo()+"'");
                    if ((maxValueKo() != null) && (maxValueKo() != ""))
                        arr.push("less than or equal '" + maxValueKo()+"'");
                    if ((minValueKo() != null) && (minValueKo() != ""))
                        arr.push("more than or equal '" + minValueKo()+"'");
                    if ((maxExclusiveValueKo() != null) && (maxExclusiveValueKo() != ""))
                        arr.push("less than '" + maxExclusiveValueKo()+"'");
                    if ((minExclusiveValueKo() != null) && (minExclusiveValueKo() != ""))
                        arr.push("more than '" + minExclusiveValueKo()+"'");
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

            self.createShortnameProperty = function (selectedArr) {
                var arr = [];
                var name;
                var label;
                var dataType;
                var comment;
                var valuePattern;
                var shortnames = self.shortnames();

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
                    arr.push(self.shortnameProperty(
                        i,
                        name,
                        label,
                        dataType,
                        comment,
                        valuePattern,
                        ko.utils.arrayFirst(selectedArr, function (item) { return item == name; }) != null,
                        self.querystring[name] || null,
                        self.querystring["min-" + name] || null,
                        self.querystring["max-" + name] || null,
                        self.querystring["minEx-" + name] || null,
                        self.querystring["maxEx-" + name] || null,
                        self.querystring["exists-" + name] || null
                    ));
                }
                arr.sort(function (left, right) {
                    return left.name === right.name ? left.index - right.index : left.name > right.name ? 1 : -1;
                });
                return arr;
            };

            self.createFilters = function (shortnameProperties) {                
                var filter;
                var arr=[];

                for (var i = 0; i < shortnameProperties.length; i++) {
                    filter = shortnameProperties[i];
                    if ((self.querystring[shortnameProperties[i]] != null) && (self.querystring[shortnameProperties[i]] != ""))
                        filter.searchValue(self.querystring[shortnameProperties[i]]);
                    if ((self.querystring["min-" + shortnameProperties[i]] != null) && (self.querystring["min-" + shortnameProperties[i]] != ""))
                        filter.minValue(self.querystring["min-" + shortnameProperties[i]]);
                    if ((self.querystring["max-" + shortnameProperties[i]] != null) && (self.querystring["max-" + shortnameProperties[i]] != ""))
                        filter.maxValue(self.querystring["max-" + shortnameProperties[i]]);
                    if ((self.querystring["minEx-" + shortnameProperties[i]] != null) && (self.querystring["minEx-" + shortnameProperties[i]] != ""))
                        filter.minExclusiveValue(self.querystring["minEx-" + shortnameProperties[i]]);
                    if ((self.querystring["maxEx-" + shortnameProperties[i]] != null) && (self.querystring["maxEx-" + shortnameProperties[i]] != ""))
                        filter.maxExclusiveValue(self.querystring["maxEx-" + shortnameProperties[i]]);
                    if ((self.querystring["exists-" + shortnameProperties[i]] != null) && (self.querystring["exists-" + shortnameProperties[i]] != ""))
                        filter.existsValue(self.querystring["exists-" + shortnameProperties[i]]);
                    arr.push(filter);
                }
                return arr;
            };            

            self.init = function () {
                var selectedArr = [];
                var name;
                var label;
                var dataType;
                var arr;
                var shortnames = self.shortnames();
                
                if (self.querystring._view == "basic") {
                    if (self.querystring._properties != null)
                        selectedArr = self.querystring._properties.split(",");
                }
                else
                    selectedArr = ko.utils.arrayMap(shortnames, function (item) {
                        if (Array.isArray(item) == true)
                            return ko.utils.arrayMap(item, function (subItem) { return subItem.name; }).join(".");
                        else
                            return item.name;
                    });
                if (self.shortnameProperties().length == 0) {
                    arr = self.createShortnameProperty(selectedArr);
                    arr = self.createFilters(arr);
                    self.shortnameProperties(arr);
                }
                else
                    arr = self.shortnameProperties();
                for (var i = 0; i < arr.length; i++)
                    arr[i].isFilterOpen(false);
                self.isAllSelected(selectedArr.length == arr.length);
            };

            self.init();

            self.dispose = function () {
                self.searchFilters.dispose();
                self.filterCount.dispose();
            };

        },
        template: htmlText
    }
});