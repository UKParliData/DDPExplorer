define(["knockout", "jquery", "Scripts/modules/classes/generic", "Scripts/modules/classes/routing", "Scripts/modules/classes/endpoint", "Scripts/text!modules/statuslist.html"], function (ko, $, genericClass, routingClass, endpointClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            var genericUnit = new genericClass;
            var routingUnit = new routingClass;
            var endpointUnit = new endpointClass;

            self.datasets = ko.observableArray([]);
            self.statusType = {
                waiting: 7,
                error: 1,
                warning: 2,
                normal: 3,
                unknown: 4,
                manual: 5,
                automatic: 6
            };

            self.goExplore = function (endpoint) {
                routingUnit.searchResult(false, endpoint.uriTemplate.fullUri, endpoint.defaultViewer.name, null, null);
            };

            var retriveDate = function (data) {
                if ((data != null) && (data.result != null))
                    for (var i = 0; i < self.datasets().length; i++)
                        if ((self.datasets()[i].lastUpdatedResource() == null) &&
                            (data.result._about.toUpperCase().indexOf("/" + self.datasets()[i].listEndpointUri.fullUri.toUpperCase() + ".JSON") > 0)) {
                            if ((data.result.items != null) && (data.result.items.length == 1) &&
                                (data.result.items[0].ddpModified != null))
                                self.datasets()[i].lastUpdatedResource(data.result.items[0].ddpModified._value || data.result.items[0].ddpModified);
                            else
                                self.datasets()[i].lastUpdatedResource("");
                        }
                self.datasets().sort(function (left, right) {
                    return left.status() === right.status() ? left.sortIndex - right.sortIndex : left.status() > right.status() ? 1 : -1;
                });
                self.datasets.valueHasMutated();
            };

            var checkAllDatasets = function () {
                var parameters = {
                    _view: "basic",
                    _properties: "ddpModified",
                    _pageSize: 1,
                    _page: 0,
                    "exists-ddpModified": true
                };
                for (var i = 0; i < self.datasets().length; i++)
                    genericUnit.getDataFromOwlim(self.datasets()[i].listEndpointUri.fullUri, parameters, retriveDate, genericUnit.errorOnLoad, self.datasets()[i].ddpDatasetName);
            };

            var assignDatasetStatus = function () {
                var item = this;

                if (item.lastUpdatedResource() == null)
                    return self.statusType.waiting;
                else {
                    var updated = new Date(item.lastUpdatedResource());
                    var updatedUtc = new Date(Date.UTC(updated.getUTCFullYear(), updated.getUTCMonth(), updated.getUTCDate(),
                        updated.getUTCHours(), updated.getUTCMinutes(), updated.getUTCSeconds()));
                    var nowUtc = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(),
                        new Date().getUTCHours(), new Date().getUTCMinutes(), new Date().getUTCSeconds()));

                    if (isNaN(updated.getFullYear()))
                        return self.statusType.unknown;
                    else
                        if (item.isUpdateNotScheduled) {
                            if (item.ddpDatasetRefreshUpdateTimeSpan == null)
                                return self.statusType.manual;
                            else
                                return self.statusType.automatic;
                        }
                        else {
                            var totalHours = item.ddpDatasetRefreshUpdateTimeSpan * 1;

                            if (((nowUtc - updatedUtc) / (1000 * 3600)) >= totalHours * 2)
                                return self.statusType.error;
                            else
                                if (((nowUtc - updatedUtc) / (1000 * 3600)) > totalHours)
                                    return self.statusType.warning;
                                else
                                    return self.statusType.normal;
                        }
                }
            };

            var convertDateToText = function () {
                var item = this;

                var pad = function (number) {
                    if (number < 10)
                        return "0" + number.toString();
                    else
                        return number.toString();
                }

                if ((item.lastUpdatedResource() == null) || (item.lastUpdatedResource() == ""))
                    return "Unknown";
                else {
                    var updated = new Date(item.lastUpdatedResource());

                    return updated.getUTCFullYear().toString() + " " + genericUnit.months[updated.getUTCMonth()] + " " + updated.getUTCDate() + " " +
                        pad(updated.getUTCHours()) + ":" + pad(updated.getUTCMinutes()) + ":" + pad(updated.getUTCSeconds());
                }
            };

            var getTextForTimeSpanUpdate = function (ddpDatasetRefreshUpdateTimeSpan) {
                if (ddpDatasetRefreshUpdateTimeSpan == null)
                    return "Manual update";
                else
                    if (ddpDatasetRefreshUpdateTimeSpan == 0)
                        return "Automatic update";
                    else {
                        var totalHours = ddpDatasetRefreshUpdateTimeSpan * 1;
                        if (totalHours < 0.017)
                            return (60 * totalHours).toFixed(0) + " second(s)";
                        else
                            if (totalHours < 1)
                                return (60 * totalHours).toFixed(0) + " minute(s)";
                            else
                                if (totalHours < 24)
                                    return totalHours + " hour(s)";
                                else
                                    if (totalHours < 168)
                                        return (totalHours / 24.0).toFixed(1) + " day(s)";
                                    else
                                        return (totalHours / 168.0).toFixed(1) + " week(s)";
                    }
            };

            var init = function () {
                var datasets = endpointUnit.getAllDatasets();

                ko.utils.arrayForEach(datasets, function (item, ix) {
                    item.lastUpdatedResource = ko.observable(null);
                    item.isUpdateNotScheduled = (item.ddpDatasetRefreshUpdateTimeSpan == null) || (item.ddpDatasetRefreshUpdateTimeSpan == 0);
                    item.status = ko.pureComputed(assignDatasetStatus, item);
                    item.sortIndex = ix;
                    item.lastUpdatedResourceText = ko.pureComputed(convertDateToText, item);
                    item.refreshUpdateText = getTextForTimeSpanUpdate(item.ddpDatasetRefreshUpdateTimeSpan);                    
                });
                self.datasets(datasets);
                checkAllDatasets();
                window.conductorVM.isPageLoading(false);
            };

            init();

        },
        template: htmlText
    }
});