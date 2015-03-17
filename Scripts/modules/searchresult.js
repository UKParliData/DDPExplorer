﻿define(["knockout", "jquery", "Scripts/modules/classes/generic", "Scripts/modules/classes/resource", "Scripts/text!modules/searchresult.html"], function (ko, $, genericClass, resourceClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.querystring = ko.observable(ko.unwrap(params.querystring || {}));
            self.endpointUrl = ko.unwrap(params.endpointUrl);
            self.endpoint = ko.observable(ko.unwrap(params.endpoint));
            self.shortnames = ko.observable(ko.unwrap(params.shortnames));
            self.viewerName = ko.unwrap(params.viewerName);
            self.shortnameProperties = params.shortnameProperties || ko.observableArray([]);
            self.filters = ko.observableArray(ko.utils.arrayFilter(self.shortnameProperties(), function (item) { return item.hasFilter() == true; }));
            self.firstItemIndex = ko.observable(null);
            self.lastItemIndex = ko.observable(null);
            self.totalItemIndex = ko.observable(null);
            self.currentPage = ko.observable(0);
            self.resultItems = ko.observableArray([]);
            self.isLoadingMore = ko.observable(false);
            self.sortByProperty = ko.observable(null);
            self.outputToName = ko.observable("HTML");
            self.pageSize = ko.observable(10);
            self.textQuery = ko.observable(self.querystring()._search);
            self.canApiUrlShow = ko.observable(false);            
            self.genericClass = new genericClass;
            self.resourceClass = null;

            self.endpointUri = ko.observable(self.genericClass.endpointUri);

            self.sortBy = function (shortname, isAscending) {                
                var sorting = "";
                var querystring = {};

                $.extend(querystring, self.querystring());
                $(".btn-group").removeClass("open");
                if (Array.isArray(shortname)) {
                    sorting = shortname[0].name;
                    if (shortname.length > 1)
                        for (var i = 1; i < shortname.length; i++)
                            sorting += "." + shortname[i].name;
                }
                else
                    sorting = shortname.name;
                querystring._sort = (isAscending ? "" : "-") + sorting;
                self.querystring(querystring);
                self.currentPage(0);
                self.resultItems([]);
                self.load();
            };

            self.getUrl = function () {
                var url = self.genericClass.host
                var querystring = {};

                if (self.endpoint().endpointType == "ListEndpoint") {
                    $.extend(querystring, self.querystring());
                    url += self.endpoint().uriTemplate.fullUri;
                    url += "{0}";
                    querystring._pageSize = self.pageSize() * (self.currentPage() + 1);
                    querystring._page = 0;
                    if (querystring != null)
                        url += "&" + $.param(querystring);
                }
                else
                    url += self.endpointUrl;
                return url;
            }

            self.apiUrl = ko.computed(function () {
                var url = self.getUrl();

                url = url.replace("{0}", "");                
                return url;
            });

            self.showApiUrl = function () {
                self.canApiUrlShow(!self.canApiUrlShow());
            };

            self.outputTo = function (format) {
                var url = self.getUrl();

                $(".btn-group").removeClass("open");
                url = url.replace("{0}","." + format.toLowerCase());                
                window.open(url, "formatOutput");
            };

            self.changePageSize = function (pageSize) {
                var querystring = {};
                $.extend(querystring, self.querystring());
                
                self.pageSize(pageSize * 1);
                querystring._pageSize = self.pageSize();
                self.querystring(querystring);
                self.currentPage(0);
                self.resultItems([]);
                self.load();
            };

            self.clearFilter = function () {
                var querystring = {};
                $.extend(querystring, self.querystring());

                self.shortnameProperties([]);
                self.filters([]);
                self.currentPage(0);
                self.resultItems([]);
                querystring._properties = {};
                querystring._view = self.viewerName;
                querystring._search = null;
                self.querystring(querystring);
                self.load();
            }

            self.showMenu = function (vm, e) {
                var hasClass = $(e.target).parent(".btn-group").hasClass("open");

                self.genericClass.closeAllPopups();
                if (hasClass == false)
                    $(e.target).parent(".btn-group").addClass("open");
                e.stopPropagation();
            };

            self.loadMore = function () {
                self.isLoadingMore(true);
                self.currentPage(self.currentPage() + 1);
                self.load();
            };

            self.searchText = function () {
                if (((self.textQuery() != null) && (self.textQuery() != "")) ||
                    ((self.textQuery() == "") && (self.querystring()._search != ""))) {
                    var querystring=self.querystring();

                    self.currentPage(0);
                    querystring._search = self.textQuery();
                    self.querystring(querystring);
                    self.resultItems([]);
                    self.load();
                }
            };

            self.showAdvancedSearch = function () {
                window.conductorVM.parameters({
                    endpointUrl: self.endpointUrl,
                    viewerName: self.viewerName,
                    endpoint: self.endpoint,
                    shortnames: self.shortnames,
                    textQuery: self.textQuery,
                    querystring: self.querystring(),
                    shortnameProperties: self.shortnameProperties
                });
                window.conductorVM.selectedComponent("advanced-search");
            };

            self.readResult = function (result) {
                var arr = [];
                var resource;

                self.resourceClass = new resourceClass(self.endpoint());
                if (self.endpoint().endpointType == "ListEndpoint") {
                    for (var i = 0; i < result.items.length; i++) {
                        resource = self.resourceClass.resourceItem(result.items[i], self.shortnames(), null, "");
                        resource.properties = self.resourceClass.mergeProperties(resource.properties);
                        arr.push(resource);
                    }
                }
                else {                    
                    resource = self.resourceClass.resourceItem(result.primaryTopic, self.shortnames(), null, "");                    
                    resource.properties = self.resourceClass.mergeProperties(resource.properties);                    
                    arr.push(resource);
                }
                if (self.endpoint().endpointType == "ListEndpoint") {
                    self.firstItemIndex(result.startIndex);
                    self.lastItemIndex((result.startIndex - 1) + result.items.length);
                    self.totalItemIndex(result.totalResults);
                    self.currentPage(result.page);
                }
                var originArr = self.resultItems() || [];
                arr = originArr.concat(arr);
                self.resultItems(arr);
            };

            self.errorOnLoad = function () {
                window.conductorVM.showError("Error while loading data");
                window.conductorVM.isAppBusy(false);
            };

            self.doneLoad = function (data) {
                if ((data != null) && (data.result != null) &&
                    ((data.result.items != null) && (self.endpoint().endpointType == "ListEndpoint")) ||
                    ((data.result.primaryTopic != null) && (self.endpoint().endpointType == "ItemEndpoint"))) {
                    self.readResult(data.result);
                    if (self.isLoadingMore() == false) {
                        var sortField = self.endpoint().sparqlSort;
                        if (self.querystring()._sort)
                            sortField = self.querystring()._sort;
                        if (sortField != null) {
                            if (sortField.indexOf(",") > 0)
                                sortField = sortField.split(",")[0];
                            var sortShortname = ko.utils.arrayFirst(self.shortnames(), function (item) { return (item.name == sortField) || ("-" + item.name == sortField); });
                            if (sortShortname != null)
                                self.sortByProperty({
                                    shortname: sortShortname,
                                    isAscending: sortField[0] != "-"
                                });
                        }
                    }
                }
                else
                    window.conductorVM.showInfo("No data available");
                window.conductorVM.isAppBusy(false);
                self.isLoadingMore(false);
            };            

            self.load = function () {
                var querystring = {};
                $.extend(querystring, self.querystring());

                self.totalItemIndex(null);
                querystring._page = self.currentPage();
                querystring._pageSize = self.pageSize();
                self.querystring(querystring);
                self.init();
            };

            self.init = function () {
                var querystring = {};

                $.extend(querystring, self.querystring());
                if (self.isLoadingMore() == false)
                    window.conductorVM.isAppBusy(true);
                if ((self.querystring()._properties != null) && (self.querystring()._properties != ""))
                    querystring._view = "basic";
                else
                    querystring._view = self.viewerName;
                if ((querystring._pageSize == null) && (self.endpoint().endpointType == "ListEndpoint"))
                    querystring._pageSize = self.pageSize();
                self.querystring(querystring);
                self.genericClass.getDataFromOwlim(self.endpointUrl, self.querystring(), self.doneLoad, self.errorOnLoad);                
            };

            self.init();

            self.dispose = function () {
                self.apiUrl.dispose();
            };

        },
        template: htmlText
    }
});