define(["knockout"], function (ko) {
    var endpointClass = function () {
        var self = this;

        self.viewerItem = function (name, properties, legends) {
            return {
                name: name,
                properties: properties,
                legends: legends
            }
        };

        self.uriTemplateItem = function (uriTemplate) {
            var fullUri = uriTemplate;
            var restUri = null;
            var queryStringParameters = null;

            if (fullUri.indexOf("/") == 0)
                fullUri = fullUri.substring(1);

            var paramIndex = fullUri.indexOf("?");
            if (fullUri.indexOf("{") > 0) {
                restUri = fullUri.substring(0, paramIndex > 0 ? paramIndex : fullUri.length).replace(/\{([^}]*)\}/g, " ¬").replace(/\//g, " ").split(" ");
                restUri = restUri.filter(function (t) { return t != ""; });
            }

            if (paramIndex > 0) {
                var qs = fullUri.substring(paramIndex + 1).split("&");
                queryStringParameters = [];
                for (var i = 0; i < qs.length; i++)
                    queryStringParameters.push(qs[i].split("=")[0]);
            }

            return {
                fullUri: fullUri,
                restUri: restUri,
                queryStringParameters: queryStringParameters
            }
        };

        self.endpointItem = function (id, name, comment, ddpDatasetName, ddpIsMainEndpoint, uriTemplate,
            uriExample, endpointType, textQueryProperty, maxPageSize, defaultViewer, viewers, selector, isDatasetReleased) {
            var arr = [];

            if ((viewers != null) && (viewers.length > 0))
                for (var i = 0; i < viewers.length; i++)
                    arr.push(self.viewerItem(viewers[i].moniker || viewers[i].name, viewers[i].propertyNames || viewers[i].properties, viewers[i].ddpPropertyLegends));                
            var found = ko.utils.arrayFirst(arr, function (item) { return item.name == (defaultViewer.moniker || defaultViewer.name); });
            if (found == null)
                arr.push(self.viewerItem(defaultViewer.moniker || defaultViewer.name, defaultViewer.propertyNames || defaultViewer.properties, defaultViewer.ddpPropertyLegends));
            selector = selector || {};

            return {
                id: id,
                name: name,
                comment: comment,
                ddpDatasetName: ddpDatasetName,
                isDatasetReleased: isDatasetReleased,
                ddpIsMainEndpoint: ddpIsMainEndpoint,                
                uriTemplate: self.uriTemplateItem(uriTemplate),
                uriExample: uriExample,
                endpointType: endpointType.substring(endpointType.indexOf("#") + 1),
                textQueryProperty: textQueryProperty,
                maxPageSize: maxPageSize || 500,
                defaultViewer: self.viewerItem(defaultViewer.moniker || defaultViewer.name, defaultViewer.propertyNames || defaultViewer.properties, defaultViewer.ddpPropertyLegends),
                viewers: arr,
                sparqlWhere: selector.sparqlWhere || selector.where,
                sparqlSort: selector.sparqlSort || selector.sort,
                itemEndpointUri: null,
                listEndpointUri: null
            }
        };

        self.findEndpointForUrl = function (endpointUrl) {
            var endpoints = self.getAllEndpoints();
            var result = null;

            for (var i = 0; i < endpoints.length; i++)
                if ((endpoints[i].ddpIsMainEndpoint == true) && (self.isEndpointUrlMatching(endpointUrl, endpoints[i].uriTemplate))) {
                    result = endpoints[i];
                    break;
                }
            if (result == null)
                for (var i = 0; i < endpoints.length; i++)
                    if ((endpoints[i].ddpIsMainEndpoint == false) && (self.isEndpointUrlMatching(endpointUrl, endpoints[i].uriTemplate))) {
                        result = endpoints[i];
                        break;
                    }
            return result;
        };

        self.isEndpointUrlMatching = function (endpoint, template) {
            if (endpoint == template.fullUri)
                return true;
            
            var paramIndex = endpoint.indexOf("?");

            if (template.restUri != null) {
                var matchEndpoint = endpoint.substring(0, paramIndex > 0 ? paramIndex : endpoint.length).split("/");
                if (matchEndpoint.length != template.restUri.length)
                    return false;
                for (var i = 0; i < template.restUri.length; i++)
                    if ((template.restUri[i] != "¬") && (matchEndpoint[i] != template.restUri[i]))
                        return false;
            }
            else
                if (template.queryStringParameters > 0) {
                    if (paramIndex < 0)
                        return false;
                    matchEndpoint = endpoint.substring(paramIndex + 1).split("&");
                    var queryEndpoint = [];
                    for (var i = 0; i < matchEndpoint.length; i++)
                        queryEndpoint.push(matchEndpoint[i].split("=")[0]);
                    var isFound;
                    for (var i = 0; template.queryStringParameters.length; i++) {
                        isFound = false;
                        for (var j = 0; j < queryEndpoint.length; j++)
                            if (queryEndpoint[j] == template.queryStringParameters[i]) {
                                isFound = true;
                                break;
                            }
                        if (isFound == false)
                            return false;
                    }
                }
                else
                    return false;
            return true;
        };

        self.readEndpoints = function (data, releasedDatasets) {
            var arr = [];
            
            if ((data != null) && (data.result != null) && (data.result.items != null)) {
                var items = data.result.items;
                for (var i = 0; i < items.length; i++)
                    if ((items[i].endpointDefaultViewer || items[i].defaultViewer)!=null)
                        arr.push(self.endpointItem(
                            items[i]._about,
                            items[i].moniker || items[i].name,
                            items[i].note || items[i].comment,
                            items[i].ddpDatasetName,
                            items[i].ddpIsMainEndpoint,
                            items[i].uriTemplate,
                            items[i].exampleUri || items[i].exampleRequestPath,
                            items[i].type,
                            items[i].textQueryProperty,
                            items[i].maxPageSize,
                            items[i].endpointDefaultViewer || items[i].defaultViewer,
                            items[i].endpointViewers || items[i].viewer,
                            items[i].sparqlSelector || items[i].selector,
                            releasedDatasets.indexOf(items[i].ddpDatasetName) >= 0
                            ));

                var endpointSibling;
                for (var i = 0; i < arr.length; i++) {
                    endpointSibling = ko.utils.arrayFirst(arr, function (item) { return (item.endpointType == "ItemEndpoint") && (item.ddpDatasetName == arr[i].ddpDatasetName) && (item.ddpIsMainEndpoint == true); });
                    if (endpointSibling != null)
                        arr[i].itemEndpointUri = endpointSibling.uriTemplate;
                    endpointSibling = ko.utils.arrayFirst(arr, function (item) { return (item.endpointType == "ListEndpoint") && (item.ddpDatasetName == arr[i].ddpDatasetName) && (item.ddpIsMainEndpoint == true); });
                    if (endpointSibling != null)
                        arr[i].listEndpointUri = endpointSibling.uriTemplate;
                }
                sessionStorage.setItem("endpoints", JSON.stringify(arr));
            }
            return arr;
        };

        self.getAllEndpoints = function () {
            var endpoints = sessionStorage.getItem("endpoints");

            if (endpoints != null)
                return JSON.parse(endpoints);
            else
                return null;
        };

    }
    return endpointClass;
});