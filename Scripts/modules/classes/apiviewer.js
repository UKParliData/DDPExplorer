define(["knockout"], function (ko) {
    var apiViewerClass = function (shortnames) {
        var self = this;

        self.apiViewerItem = function (ddpDatasetName, properties, legends) {
            var arr = [];

            for (var i = 0; i < properties.length; i++) {
                arr.push({
                    name: properties[i],
                    shortname: ko.utils.arrayFirst(shortnames, function (item) {
                        return item.name == properties[i]
                    }),
                    legend: ko.utils.arrayFirst(legends, function (item) {
                        return (item.label._value || item.label) == properties[i];
                    })
                });
            }

            return {
                ddpDatasetName: ddpDatasetName,
                properties: arr
            }
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