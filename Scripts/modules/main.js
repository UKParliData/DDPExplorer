﻿require.config({
    baseUrl: "/",    
    urlArgs: "bust=v1",
    paths: {
        "jquery": "Scripts/jquery-2.1.3.min",
        "knockout": "Scripts/knockout-3.3.0",
        "d3": "Scripts/d3/d3.min"
    },
    waitSeconds: 30
});

define(["knockout", "jquery", "Scripts/modules/conductor"], function (ko, $, conductor) {
    ko.components.register("busy-indicator", { template: { require: "Scripts/text!modules/busyindicator.html" } });
    ko.components.register("search-header", { require: 'Scripts/modules/searchheader.js' });
    ko.components.register("search-result", { require: 'Scripts/modules/searchresult.js' });
    ko.components.register("shortname-name", { require: 'Scripts/modules/shortnamename.js' });
    ko.components.register("shortname-value", { require: 'Scripts/modules/shortnamevalue.js' });
    ko.components.register("resource-item", { require: 'Scripts/modules/resourceitem.js' });
    ko.components.register("endpoint-list", { require: 'Scripts/modules/endpointlist.js' });
    ko.components.register("advanced-search", { require: 'Scripts/modules/advancedsearch.js' });
    ko.components.register("filter-edit", { require: 'Scripts/modules/filteredit.js' });
    ko.components.register("date-edit", { require: 'Scripts/modules/dateedit.js' });
    ko.components.register("number-edit", { require: 'Scripts/modules/numberedit.js' });
    ko.components.register("boolean-edit", { require: 'Scripts/modules/booleanedit.js' });
    ko.components.register("data-distribution", { require: 'Scripts/modules/datadistribution.js' });
    ko.components.register("data-structure", { require: 'Scripts/modules/datastructure.js' });
    ko.components.register("viewer-field-list", { require: 'Scripts/modules/viewerfieldlist.js' });
    ko.components.register("dataset-stats", { require: 'Scripts/modules/datasetstats.js' });
    ko.components.register("dataset-api-help", { require: 'Scripts/modules/datasetapihelp.js' });

    $.support.cors = true;
    window.conductorVM = new conductor();
    ko.applyBindings(window.conductorVM);
});
