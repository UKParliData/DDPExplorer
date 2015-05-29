define(["knockout", "jquery", "Scripts/modules/classes/generic", "Scripts/modules/classes/routing", "Scripts/modules/classes/endpoint", "Scripts/modules/classes/shortname", "Scripts/modules/classes/shortnameproperty", "Scripts/text!modules/advancedsearch.html"], function (ko, $, genericClass, routingClass, endpointClass, shortnameClass, shortnamePropertyClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            var genericUnit = new genericClass;
            var routingUnit = new routingClass;
            var endpointUnit = new endpointClass;
            var shortnameUnit = new shortnameClass(endpointUnit.getAllEndpoints());
            var shortnamePropertyUnit = new shortnamePropertyClass;

            self.textQuery = params.textQuery;
            self.querystring = {};
            self.shortnameProperties = ko.observableArray(ko.unwrap(params.shortnameProperties) || []);
            self.selectedView = ko.observable(params.viewerName);

            self.isAllSelected = ko.observable(null);
            self.endpointUrl = genericUnit.parseUrl().endpoint;
            self.endpoint = ko.observable(endpointUnit.findEndpointForUrl(self.endpointUrl));
            self.isFiltersShown = ko.observable(true);
            self.isFieldsShown = ko.observable(false);
            self.filterSearchText = ko.observable(null);
            self.isFilterSearchFocused = ko.observable(true);
            self.matchingFilters = ko.observableArray([]);
            
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

                genericUnit.closeAllPopups();
                if (hasClass == false)
                    $(e.target).parent(".btn-group").addClass("open");
                e.stopPropagation();
            };

            self.selectViewer = function (viewer) {                
                self.selectedView(viewer.name);                
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
                routingUnit.searchResult(false, self.endpointUrl, params.viewerName, params.textQuery, params.shortnameProperties);                
            };

            self.submit = function () {
                routingUnit.searchResult(false, self.endpointUrl, self.selectedView, self.textQuery, self.shortnameProperties);                
            };

            self.filterCount = ko.computed(function () {
                return ko.utils.arrayFilter(self.shortnameProperties(), function (item) {
                    return item.hasFilter() == true;
                }).length;
            });                                  

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
                var shortnames = [];
                var viewer = null;

                if (self.selectedView() == null)
                    self.selectedView(self.endpoint().defaultViewer.name);
                viewer = ko.utils.arrayFirst(self.endpoint().viewers, function (item) {
                    return item.name == self.selectedView();
                });
                shortnames = shortnameUnit.findShortnamesForViewer(viewer);
                
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
                    arr = shortnamePropertyUnit.createShortnameProperties(shortnames, self.querystring, selectedArr);
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