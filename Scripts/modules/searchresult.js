define(["knockout", "jquery", "Scripts/modules/classes/generic", "Scripts/modules/classes/routing", "Scripts/modules/classes/endpoint", "Scripts/modules/classes/shortname", "Scripts/modules/classes/resource", "Scripts/modules/classes/apiviewer", "Scripts/modules/classes/shortnameproperty", "Scripts/text!modules/searchresult.html"], function (ko, $, genericClass, routingClass, endpointClass, shortnameClass, resourceClass, apiViewerClass, shortnamePropertyClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;
          
            var genericUnit = new genericClass;
            var routingUnit = new routingClass;
            var endpointUnit = new endpointClass;
            var shortnameUnit = new shortnameClass(endpointUnit.getAllEndpoints());
            var resourceUnit = null;
            var apiViewerUnit = new apiViewerClass([], []);
            var shortnamePropertyUnit = new shortnamePropertyClass;

            self.textQuery = ko.observable(ko.unwrap(params.textQuery));
            self.viewerName = ko.unwrap(params.viewerName);
            self.shortnameProperties = ko.observableArray(ko.unwrap(params.shortnameProperties) || []);

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
            self.canApiUrlShow = ko.observable(false);
            self.endpointUrl = genericUnit.parseUrl().endpoint;
            self.shortnames = ko.observable(null);
            self.querystring = ko.observable(null);
            self.endpoint = ko.observable(endpointUnit.findEndpointForUrl(self.endpointUrl));                        
            self.isRequestValid = ko.observable(false);

            self.sortBy = function (shortname, isAscending) {                
                var sorting = "";
                var querystring = {};

                $.extend(querystring, self.querystring());
                $(".btn-group").removeClass("open");
                if (Array.isArray(shortname))
                    sorting = ko.utils.arrayMap(shortname, function (item) {
                        return item.name;
                    }).join('.');
                else
                    sorting = shortname.name;
                querystring._sort = (isAscending ? "" : "-") + sorting;
                self.querystring(querystring);
                self.currentPage(0);
                self.resultItems([]);
                self.load();
            };

            self.getUrl = function (pageSize) {
                var url = genericUnit.host
                var querystring = {};

                if (self.endpoint() == null)
                    return "";

                if (self.endpoint().endpointType == "ListEndpoint") {
                    $.extend(querystring, self.querystring());
                    url += self.endpoint().uriTemplate.fullUri;
                    url += "{0}";
                    querystring._pageSize = pageSize;
                    querystring._page = 0;
                    if (querystring != null)
                        url += "?" + $.param(querystring);
                }
                else
                    url += self.endpointUrl + "{0}";
                return url;
            };

            self.apiUrl = ko.computed(function () {
                var url = self.getUrl(self.pageSize() * (self.currentPage() + 1));

                url = url.replace("{0}", ".json");
                return url;
            });

            self.showApiUrl = function () {
                self.canApiUrlShow(!self.canApiUrlShow());
            };

            self.download = function () {
                routingUnit.downloadList(false, self.endpoint().uriTemplate.fullUri, self.querystring());
            };

            self.outputTo = function (format) {
                var pageSize = self.pageSize() * (self.currentPage() + 1);
                var url = self.getUrl(self.totalItemIndex() > self.endpoint().maxPageSize ? self.endpoint().maxPageSize : self.totalItemIndex());

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
                self.shortnameProperties([]);
                self.filters([]);
                self.currentPage(0);
                self.resultItems([]);
                self.querystring({});
                self.load();
            }

            self.showMenu = function (vm, e) {
                var hasClass = $(e.target).parent(".btn-group").hasClass("open");

                genericUnit.closeAllPopups();
                if (hasClass == false)
                    $(e.target).parent(".btn-group").addClass("open");
                e.stopPropagation();
            };

            self.nextPageSize = ko.pureComputed(function () {                
                if ((2 + self.currentPage()) * self.pageSize() <= self.totalItemIndex())
                    return self.pageSize();
                else
                    return self.totalItemIndex() - ((1 + self.currentPage()) * self.pageSize());
            });

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
                if (self.endpoint().endpointType == "ListEndpoint")
                    routingUnit.advancedSearch(false, self.endpoint().uriTemplate.fullUri, self.viewerName, self.textQuery, self.shortnameProperties);
            };

            self.learnMore = function () {
                routingUnit.datasetAPIHelp(false, self.endpoint().ddpDatasetName);
            };

            self.fullList = function () {
                routingUnit.searchResult(false, self.endpoint().listEndpointUri.fullUri, null, null, null);
            };
            
            self.readResult = function (result) {
                var arr = [];
                var resource;
                var apiViewers = apiViewerUnit.getAllAPIViewers();
                var apiViewer = ko.utils.arrayFirst(apiViewers, function (item) {
                    return item.ddpDatasetName == self.endpoint().ddpDatasetName;
                });
                
                resourceUnit = new resourceClass(self.endpoint(), apiViewer);
                if (self.endpoint().endpointType == "ListEndpoint") {
                    for (var i = 0; i < result.items.length; i++) {
                        resource = resourceUnit.resourceItem(result.items[i], self.shortnames(), null, "");
                        resource.properties = resourceUnit.mergeProperties(resource.properties);
                        arr.push(resource);
                    }
                }
                else {                    
                    resource = resourceUnit.resourceItem(result.primaryTopic, self.shortnames(), null, "");                    
                    resource.properties = resourceUnit.mergeProperties(resource.properties);                    
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
                            var sortShortname = ko.utils.arrayFirst(self.shortnames(), function (item) {
                                if (Array.isArray(item) == true) {
                                    var fullName= ko.utils.arrayMap(item, function (arrayItem) {
                                        return arrayItem.name;
                                    }).join('.');
                                    return (fullName == sortField) || ("-" + fullName == sortField);
                                }
                                else
                                    return (item.name == sortField) || ("-" + item.name == sortField);
                            });
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
                self.querystring(querystring);
                loading();
            };

            var loading = function () {
                var querystring = {};

                $.extend(querystring, self.querystring());
                if (self.isLoadingMore() == false)
                    window.conductorVM.isAppBusy(true);
                if (((self.querystring()._properties != null) && (self.querystring()._properties != "")) ||
                    ((self.querystring()._view!=null) &&(self.querystring()._view=="basic")))
                    querystring._view = "basic";
                else
                    querystring._view = self.viewerName;
                if ((querystring._pageSize == null) && (self.endpoint().endpointType == "ListEndpoint"))
                    querystring._pageSize = self.pageSize();
                self.querystring(querystring);
                genericUnit.getDataFromOwlim(self.endpointUrl, self.querystring(), self.doneLoad, genericUnit.errorOnLoad, self.endpoint().ddpDatasetName);
                window.conductorVM.isPageLoading(false);
            };

            var checkIfValidRequest = function () {
                if (self.endpoint() != null)
                    return true;
                else {
                    genericUnit.customError("Whoops! Something went wrong. Please check url.")
                    return false;
                }
            };

            var init = function () {
                var viewer = null;
                var shortnames = [];

                self.isRequestValid(checkIfValidRequest());
                if (self.isRequestValid() == false)
                    return;
                self.querystring(shortnamePropertyUnit.buildQueryString(self.shortnameProperties(), self.textQuery()));
                if (self.viewerName == null)
                    self.viewerName=self.endpoint().defaultViewer.name;
                viewer = ko.utils.arrayFirst(self.endpoint().viewers, function (item) {
                    return item.name == self.viewerName;
                });
                shortnames = shortnameUnit.findShortnamesForViewer(viewer);
                ko.utils.arrayForEach(shortnames, function (item, index) {
                    item.sortIndex = index;
                });
                genericUnit.sortArray(shortnames, "sortIndex", "label");
                self.shortnames(shortnames);

                loading();
            };

            init();

            self.dispose = function () {
                self.apiUrl.dispose();                
            };

        },
        template: htmlText
    }
});