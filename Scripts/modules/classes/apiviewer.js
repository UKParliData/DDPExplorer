﻿define(["knockout"], function (ko) {
    var apiViewerClass = function (shortnames, endpoints) {
        var self = this;

        self.apiViewerItem = function (ddpDatasetName, properties, legends) {
            var arr = [];
            var name = null;
            var found = null;
            var legend = null;
            var itemEndpoint = null;
            var shortname = null;
            for (var i = 0; i < properties.length; i++) {
                name = properties[i].split(".")[0];
                found = ko.utils.arrayFirst(arr, function (item) { return item.name == name; });
                legend = null;
                itemEndpoint = null;
                shortname = null;
                if (found == null) {
                    shortname=ko.utils.arrayFirst(shortnames, function (item) {
                        return item.name == name
                    })
                    legend = ko.utils.arrayFirst(legends || [], function (item) {
                        return (item.label._value || item.label) == name;
                    });
                    if ((legend != null) && (legend.endpoint != null)) {
                        if (legend.comment == null)
                            legend.comment = shortname.comment;
                        itemEndpoint = ko.utils.arrayFirst(endpoints, function (item) {
                            return item.id == legend.endpoint;
                        });
                    }
                    else
                        if ((legend == null) && (shortname!=null) && (shortname.comment != null))
                            legend = { comment: shortname.comment };
                    arr.push({
                        name: name,
                        shortname: shortname,
                        legend: legend,
                        itemEndpoint: itemEndpoint
                    });
                }
            }

            return {
                ddpDatasetName: ddpDatasetName,
                properties: arr
            }
        };

        self.convertViewerToAPIViewer = function (ddpDatasetName, viewer) {
            return self.apiViewerItem(ddpDatasetName, viewer.properties, viewer.legends);
        };

        self.readAPIViewers = function (data) {
            var arr = [];

            if ((data != null) && (data.result != null) && (data.result.items != null)) {
                var items = data.result.items;
                for (var i = 0; i < items.length; i++)
                    arr.push(self.apiViewerItem(                        
                            items[i].ddpDatasetName,
                            items[i].properties || [],
                            items[i].ddpPropertyLegends || []));

                sessionStorage.setItem("apiviewers", JSON.stringify(arr));
            }
            return arr;
        };

        self.getAllAPIViewers = function () {
            var apiviewers = sessionStorage.getItem("apiviewers");

            if (apiviewers != null)
                return JSON.parse(apiviewers);
            else
                return null;
        };

    }
    return apiViewerClass;
});