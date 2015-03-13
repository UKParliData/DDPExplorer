define(["knockout", "jquery", "Scripts/modules/classes/generic"], function (ko, $, genericClass) {
    var resourceClass = function (resourceEndpoint) {
        var self = this;

        self.genericClass = new genericClass;

        self.giveMeItemEndpoint = function (restUri) {
            var result = null;

            if (restUri.indexOf("¬")==restUri.length-1)
                result = restUri.slice(0, restUri.length - 1).join("/");
            else
                result = "resources";
            return result;
        }

        self.parseUri = function (shortname, uri) {
            if ((uri != null) && (uri.indexOf("http://data.parliament.uk/") == 0)) {
                uri = uri.replace("http://data.parliament.uk/", "");
                if (uri.indexOf("resources/") == 0) {
                    if ((shortname.itemEndpoint != null) &&
                        (shortname.itemEndpoint.uriTemplate != null) &&
                        (shortname.itemEndpoint.uriTemplate.restUri != null) &&
                        (shortname.itemEndpoint.uriTemplate.restUri.length > 1))
                        uri = self.genericClass.endpointUri + uri.replace("resources", self.giveMeItemEndpoint(shortname.itemEndpoint.uriTemplate.restUri));
                    else
                        if ((shortname.dataType == "headresource") && (resourceEndpoint.itemEndpointUri != null))
                            uri = self.genericClass.endpointUri + uri.replace("resources", self.giveMeItemEndpoint(resourceEndpoint.itemEndpointUri.restUri));
                }
                else
                    if ((uri.indexOf("members/") == 0) || (uri.indexOf("terms/") == 0))
                        uri = self.genericClass.endpointUri + uri;
            }
            return uri;
        };

        self.propertyItem = function (label, value, shortname, uri) {
            var internalUri = uri;
            var itemValue = value._value == "" ? "" : value._value || value;
            
            if ((shortname.dataType == "resource") && (typeof itemValue == "object") && (Array.isArray(itemValue) == false))
                itemValue = self.giveMeResourceDescription(value);
            
            internalUri = self.parseUri(shortname, internalUri);
            
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

        self.giveMeResourceDescription = function (property) {
            if (property.label)
                return property.label._value || property.label;
            else
                if (property.prefLabel)
                    return property.prefLabel._value || property.prefLabel;
                else
                    if (property.title)
                        return property.title._value || property.title;
                    else
                        return property._about || property;
        };

        self.giveMeLabelForResource = function (property, shortname) {            
            var value = property._about ? property : { _about: property._value || property };
            var label = self.propertyItem(shortname.label, value._about, shortname, value._about);
            label.value = self.giveMeResourceDescription(value);

            return label;
        };

        self.cleanUpProperties = function (properties) {
            var index = [-1, -1, -1];
            for (var i = properties.length - 1; i >= 0; i--) {
                if ((properties[i].resource) && (properties[i].properties.length == 0))
                    properties.splice(i, 1);
                else
                    if (properties[i].resource) {
                        index = [-1, -1, -1, -1];
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
                            if (properties[i].properties[j].label == "_about") {
                                index[3] = j;
                                continue;
                            }
                        }
                        for (var j = 0; j < index.length; j++)
                            if (index[j] >= 0)
                                properties[i].properties.splice(index[j], 1);
                    }
            }
            return properties;
        };

        self.mergeProperties = function (properties) {
            var result = [];
            var matchingProperties = [];
            var found = null;
            var singleProperty = {};
            
            for (var i = 0; i < properties.length; i++) {
                singleProperty = {};
                $.extend(singleProperty, properties[i]);
                if ((singleProperty.resource) && 
                    ((singleProperty.resource.fullUri.indexOf("http://data.parliament.uk/resources/") == 0) ||
                    (singleProperty.resource.fullUri.indexOf("http://data.parliament.uk/members/") == 0) ||
                    (singleProperty.resource.fullUri.indexOf("http://data.parliament.uk/terms/") == 0))) {
                    var siblings = ko.utils.arrayFilter(properties, function (item) { return ((item.resource) && (item.resource.fullUri == singleProperty.resource.fullUri)); });
                    if (siblings != null) {
                        matchingProperties = [];
                        for (var j = 0; j < siblings.length; j++)
                            if (siblings[j].properties.length == 1) {
                                found = ko.utils.arrayFirst(matchingProperties, function (item) {
                                    return (item.label == siblings[j].properties[0].label) && (item.value == siblings[j].properties[0].value);
                                });
                                if (found == null)
                                    matchingProperties.push(siblings[j].properties[0]);
                            }
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
            var shortnameArr;
            var topShortname;
            
            if (resourceShortname == null)
                headShortname = { dataType: "headresource" };
            else
                $.extend(headShortname, resourceShortname, { dataType: "complexresource" });
            label = self.giveMeLabelForResource(properties, headShortname);
            if ((shortnames.length == 0) && (resourceShortname.dataType == "resource")) {
                value = self.propertyItem("_about", properties, resourceShortname, properties._about || null);
                arr.push(value);
            }
            else
                for (var i = 0; i < shortnames.length; i++) {
                    topShortname = shortnames[i].length > 1 ? shortnames[i][0] : shortnames[i];
                    shortnameArr = shortnames[i].length > 1 ? shortnames[i].slice(1) : [];
                    if ((properties[topShortname.name]) &&
                        (((Array.isArray(shortnames[i])) && (shortnames[i].length > 1)) || (shortnames[i].dataType == "resource"))) {
                        if (Array.isArray(properties[topShortname.name]) == false) {                            
                            value = self.resourceItem(properties[topShortname.name], shortnameArr, topShortname);
                            if (value != null) {
                                value.dataType = value.resource.dataType;
                                arr.push(value);
                            }
                        }
                        else
                            for (var j = 0; j < properties[topShortname.name].length; j++) {
                                if (properties[topShortname.name][j]._about != null) {
                                    value = self.resourceItem(properties[topShortname.name][j], shortnameArr, topShortname);
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