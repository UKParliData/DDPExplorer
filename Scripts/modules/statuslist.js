define(["knockout", "jquery", "Scripts/modules/classes/generic", "Scripts/modules/classes/endpoint", "Scripts/text!modules/statuslist.html"], function (ko, $, genericClass, endpointClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            var genericUnit = new genericClass;
            var endpointUnit = new endpointClass;

            self.datasets = ko.observableArray([]);
            self.statusType = {
                waiting: 5,
                error: 1,
                warning: 3,
                normal: 4,
                unknown: 2
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
                    if (((nowUtc - updated) / (1000 * 3600)) >= 24 * 7)
                        return self.statusType.error;
                    else
                        if (((nowUtc - updated) / (1000 * 3600)) >= 24)
                            return self.statusType.warning;
                        else
                            if (isNaN(updated.getFullYear()))
                                return self.statusType.unknown;
                            else
                                return self.statusType.normal;
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

            var init = function () {
                var datasets = endpointUnit.getAllDatasets();

                ko.utils.arrayForEach(datasets, function (item, ix) {
                    item.lastUpdatedResource = ko.observable(null);
                    item.status = ko.pureComputed(assignDatasetStatus, item);
                    item.sortIndex = ix;
                    item.lastUpdatedResourceText = ko.pureComputed(convertDateToText, item);
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