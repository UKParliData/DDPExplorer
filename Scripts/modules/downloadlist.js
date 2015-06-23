define(["knockout", "jquery", "Scripts/modules/classes/generic", "Scripts/modules/classes/routing", "Scripts/modules/classes/endpoint", "Scripts/modules/classes/shortname", "Scripts/text!modules/downloadlist.html"], function (ko, $, genericClass, routingClass, endpointClass, shortnameClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            var genericUnit = new genericClass;
            var routingUnit = new routingClass;
            var endpointUnit = new endpointClass;
            var shortnameUnit = new shortnameClass(endpointUnit.getAllEndpoints());

            var endpointUrl = genericUnit.parseUrl().endpoint;

            self.querystring = params.querystring;
            
            self.endpoint = endpointUnit.findEndpointForUrl(endpointUrl);
            self.resourceNumber = ko.observable(null);
            self.allResourceNumber = ko.observable(null);
            self.pages = ko.observableArray([]);
            self.allPages = ko.observableArray([]);
            self.sortShortname = ko.observable(null);
            self.allSortShortname = ko.observable(null);

            self.downloadResult = function (page) {
                var url = genericUnit.host
                var querystring = {};

                $.extend(querystring, self.querystring);                
                querystring._pageSize = self.endpoint.maxPageSize;
                querystring._page = page;

                url += self.endpoint.uriTemplate.fullUri;
                url += ".csv";
                url += "?" + $.param(querystring);
                
                window.open(url, "formatOutput");
            };

            self.downloadAll = function (page) {
                var url = genericUnit.host
                var querystring = {};

                querystring._pageSize = self.endpoint.maxPageSize;
                querystring._page = page;

                url += self.endpoint.uriTemplate.fullUri;
                url += ".csv";
                url += "?" + $.param(querystring);

                window.open(url, "formatOutput");
            };

            self.learnMore = function () {
                routingUnit.datasetAPIHelp(false, self.endpoint.ddpDatasetName);
            };

            self.goExplore = function () {
                routingUnit.searchResult(false, self.endpoint.uriTemplate.fullUri, self.endpoint.defaultViewer.name, null, null);
            };

            var generateDownloadItems = function (size, pages) {
                var arr = [];
                var page = 0;

                while ((page * self.endpoint.maxPageSize) < size) {
                    arr.push({
                        page: page,
                        start: (page * self.endpoint.maxPageSize) + 1,
                        end: (page + 1) * self.endpoint.maxPageSize > size ? size : (page + 1) * self.endpoint.maxPageSize
                    });
                    page++;
                }
                pages(arr);
            };

            var getSortShortname = function (viewerName, sortShortname, sortField) {
                var shortnames = shortnameUnit.findShortnamesForViewer(self.endpoint.defaultViewer);
                var sortItem = ko.utils.arrayFirst(shortnames, function (item) {
                    if (Array.isArray(item) == true) {
                        var fullName = ko.utils.arrayMap(item, function (arrayItem) {
                            return arrayItem.name;
                        }).join('.');
                        return (fullName == sortField) || ("-" + fullName == sortField);
                    }
                    else
                        return (item.name == sortField) || ("-" + item.name == sortField);
                });
                if (sortItem != null)
                    sortShortname({
                        shortname: sortItem,
                        isAscending: sortField[0] != "-"
                    });
            };

            var doneLoad = function (data, numberHolder) {
                if ((data != null) && (data.result != null) &&
                    (data.result.items != null) && (data.result.items.length > 0))
                    numberHolder(data.result.totalResults * 1);
                else
                    numberHolder(0);
            };

            self.doneLoadNumberQS = function (data) {
                var viewer = self.endpoint.defaultViewer;
                var sortField = self.endpoint.sparqlSort;

                if (self.querystring._sort!=null)
                    sortField = self.querystring._sort;
                if (self.querystring._view != null)
                    viewer = ko.utils.arrayFirst(self.endpoint.viewers, function (item) {
                        return item.name == self.querystring._view;
                    });
                doneLoad(data, self.resourceNumber);
                generateDownloadItems(self.resourceNumber(), self.pages);
                getSortShortname(viewer, self.sortShortname, sortField);
                window.conductorVM.isPageLoading(false);
            };

            self.doneLoadNumberAll = function (data) {
                doneLoad(data, self.allResourceNumber);
                generateDownloadItems(self.allResourceNumber(), self.allPages);                
                getSortShortname(self.endpoint.defaultViewer, self.allSortShortname, self.endpoint.sparqlSort);
                if (self.querystring != null) {
                    self.querystring._pageSize = 1;
                    self.querystring._page = 0;
                    genericUnit.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, self.querystring, self.doneLoadNumberQS, genericUnit.errorOnLoad, "Dataset download information");
                }
                else {
                    self.resourceNumber(self.allResourceNumber());
                    window.conductorVM.isPageLoading(false);
                }
            };            
            
            self.init = function () {
                var querystring = {
                    _pageSize: 1,
                    _view: "basic",
                    _page: 0
                };
                genericUnit.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, querystring, self.doneLoadNumberAll, genericUnit.errorOnLoad, "Dataset download information");                
            };

            self.init();

            self.dispose = function () {
            
            };

        },
        template: htmlText
    }
});