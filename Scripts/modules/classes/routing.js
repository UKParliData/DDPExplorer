define(["Scripts/modules/classes/generic"], function (genericClass) {
    var routingClass = function () {
        var self = this;

        var genericUnit = new genericClass;

        self.endpointList = function (isRedirect) {
            if (isRedirect == false)
                history.pushState({}, "", "/");
            window.conductorVM.parameters({});
            window.conductorVM.selectedComponent("endpoint-list");
        };

        self.datasetAPIHelp = function (isRedirect, ddpDatasetName) {
            if (isRedirect == false)
                history.pushState({}, "", "?learnmore=" + ddpDatasetName);
            window.conductorVM.parameters({});
            window.conductorVM.selectedComponent("dataset-api-help");
        };

        self.searchResult = function (isRedirect, endpointUri, viewerName, textQuery, shortnameProperties) {
            if (isRedirect == false)
                history.pushState({}, "", "?" + genericUnit.endpointQueryString + "=" + endpointUri);
            window.conductorVM.parameters({
                viewerName: viewerName,
                textQuery: textQuery,
                shortnameProperties: shortnameProperties
            });
            window.conductorVM.selectedComponent("search-result");
        };

        self.advancedSearch = function (isRedirect, endpointUri, viewerName, textQuery, shortnameProperties) {
            if (isRedirect == false)
                history.pushState({}, "", "?" + genericUnit.endpointQueryString + "=" + endpointUri + "#advanced-search");
            window.conductorVM.parameters({
                viewerName: viewerName,
                textQuery: textQuery,
                shortnameProperties: shortnameProperties
            });
            window.conductorVM.selectedComponent("advanced-search");
        };

        self.loadComponentOnPageLoad = function (e) {
            var parameters = genericUnit.parseUrl();

            if (parameters.learnMore != null)
                self.datasetAPIHelp(true, null);
            else
                if (parameters.endpoint == null)
                    self.endpointList(true);
                else
                    if (parameters.endpoint != null) {
                        if (parameters.hash == "#advanced-search")
                            self.advancedSearch(true, null, null, null, null);
                        else
                            self.searchResult(true, null, null, null, null);
                    }
        };        

    }
    return routingClass;
});