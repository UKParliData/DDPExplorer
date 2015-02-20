define(["knockout", "jquery", "Scripts/modules/classes/generic"], function (ko, $, genericClass) {
    var resourceClass = function (resourceEndpoint) {
        var self = this;

        self.genericClass = new genericClass;

        self.giveMeItemEndpoint = function (restUri) {
            var result = restUri.slice(0, restUri.length - 1).join("/");
            return result;
        }

        self.propertyItem = function (label, value, shortname, uri) {
            var internalUri = uri;
            var itemValue = value._value == "" ? "" : value._value || value;
            
            if ((shortname.dataType == 'resource') && (typeof itemValue == "object") && (Array.isArray(itemValue)==false))
                itemValue = itemValue._about;

            if ((internalUri != null) && (internalUri.indexOf("http://data.parliament.uk/") == 0)) {
                internalUri = internalUri.replace("http://data.parliament.uk/", "");
                if (internalUri.indexOf("resources/") == 0) {
                    if ((shortname.itemEndpoint != null) &&
                        (shortname.itemEndpoint.uriTemplate != null) &&
                        (shortname.itemEndpoint.uriTemplate.restUri != null) &&
                        (shortname.itemEndpoint.uriTemplate.restUri.length > 1))
                        internalUri = self.genericClass.endpointUri + internalUri.replace("resources", self.giveMeItemEndpoint(shortname.itemEndpoint.uriTemplate.restUri));
                    else
                        if ((shortname.dataType == "headresource") && (resourceEndpoint.itemEndpointUri != null))
                            internalUri = self.genericClass.endpointUri + internalUri.replace("resources", self.giveMeItemEndpoint(resourceEndpoint.itemEndpointUri.restUri));
                }
                else
                    if ((internalUri.indexOf("members/") == 0) || (internalUri.indexOf("terms/") == 0))
                        internalUri = self.genericClass.endpointUri + internalUri;
            }
            
            return {
                label: label,
                value: itemValue,
                dataType: shortname.dataType,
                fullUri: uri,
                internalUri: internalUri,
                description: shortname.description || null,
                isVisible: ko.observable(true)
            }
        };

        self.giveMeLabelForResource = function (properties, shortname) {
            var label = self.propertyItem(shortname.label, properties._about, shortname, properties._about);
            if (properties.label)
                label.value = properties.label._value || properties.label;
            else
                if (properties.prefLabel)
                    label.value = properties.prefLabel._value || properties.prefLabel;
                else
                    if (properties.title)
                        label.value = properties.title._value || properties.title;

            return label;
        };

        self.cleanUpProperties = function (properties) {
            var index = [-1, -1, -1];
            for (var i = properties.length - 1; i >= 0; i--) {
                if ((properties[i].resource) && (properties[i].properties.length == 0))
                    properties.splice(i, 1);
                else
                    if (properties[i].resource) {
                        index = [-1, -1, -1];
                        for (var j = 0; j < properties[i].properties.length; j++) {
                            if (properties[i].properties[j].label == "label") {
                                index[0] = j;
                                break;
                            }
                            if (properties[i].properties[j].label == "pref label") {
                                index[1] = j;
                                continue;
                            }
                            if (properties[i].properties[j].label == "title") {
                                index[2] = j;
                                continue;
                            }
                        }
                        if (index[0] >= 0)
                            properties[i].properties.splice(index[0], 1);
                        else
                            if (index[1] >= 0)
                                properties[i].properties.splice(index[1], 1);
                            else
                                if (index[2] >= 0)
                                    properties[i].properties.splice(index[2], 1);
                    }
            }
            return properties;
        };

        self.mergeProperties = function (properties) {
            var result = [];
            var matchingProperties = [];
            var value = null;
            var singleProperty = {};
            
            for (var i = 0; i < properties.length; i++) {
                singleProperty = {};
                $.extend(singleProperty, properties[i]);
                if ((singleProperty.resource) && (singleProperty.resource.fullUri.indexOf("http://data.parliament.uk/resources/") == 0)) {
                    var siblings = ko.utils.arrayFilter(properties, function (item) { return ((item.resource) && (item.resource.fullUri == singleProperty.resource.fullUri)); });
                    if (siblings != null) {
                        matchingProperties = [];
                        for (var j = 0; j < siblings.length; j++)
                            if (siblings[j].properties.length == 1)
                                matchingProperties.push(siblings[j].properties[0]);
                        ko.utils.arrayForEach(properties, function (item) {
                            if ((item.resource) && (item.resource.fullUri == singleProperty.resource.fullUri))
                                item.properties = [];
                        });
                        singleProperty.properties = matchingProperties;
                    }
                }
                result.push(singleProperty);
            }

            for (var i =0;i< result.length ; i++)
                if ((result[i].resource) && (result[i].properties.length > 0))
                    result[i].properties = self.mergeProperties(result[i].properties);
            result = self.cleanUpProperties(result);

            return result;
        };

        self.resourceItem = function (properties, shortnames, resourceShortname) {
            var arr = [];
            var label = null;
            var value = null;
            var headShortname = {};
            
            if (resourceShortname == null)
                headShortname = { dataType: "headresource" };
            else
                $.extend(headShortname, resourceShortname, { dataType: "complexresource" });
            label = self.giveMeLabelForResource(properties, headShortname);

            for (var i = 0; i < shortnames.length; i++) {
                if ((Array.isArray(shortnames[i])) && (properties[shortnames[i][0].name]) && (shortnames[i].length > 1)) {
                    if ((Array.isArray(properties[shortnames[i][0].name]) == false) && (properties[shortnames[i][0].name]._about != null)) {
                        var shortnameArr = shortnames[i].slice(1);
                        value = self.resourceItem(properties[shortnames[i][0].name], shortnameArr.length == 1 ? shortnameArr : [shortnameArr], shortnames[i][0]);
                        if (value != null) {
                            value.dataType = value.resource.dataType;
                            arr.push(value);
                        }
                    }
                    else
                        for (var j = 0; j < properties[shortnames[i][0].name].length; j++) {
                            if (properties[shortnames[i][0].name][j]._about != null) {
                                value = self.resourceItem(properties[shortnames[i][0].name][j], shortnames[i].slice(1), shortnames[i][0]);
                                if (value != null) {
                                    value.dataType = value.resource.dataType;
                                    arr.push(value);
                                }
                            }
                        }
                }
                else
                    if (Array.isArray(shortnames[i]) == false) {
                        if (properties[shortnames[i].name] != null) {
                            value = self.propertyItem(shortnames[i].label, properties[shortnames[i].name], shortnames[i], properties[shortnames[i].name]._about || null);
                            arr.push(value);
                            if (headShortname.name != null)
                                properties = properties[shortnames[i].name];
                        }
                        else
                            if (headShortname.name != null)
                                return null;
                    }
            }

            return {
                resource: label,
                properties: arr
            }
        };

    }
    return resourceClass;
});