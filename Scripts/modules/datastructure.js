define(["knockout", "d3", "Scripts/modules/classes/endpoint", "Scripts/modules/classes/shortname", "Scripts/modules/classes/apiviewer", "Scripts/text!modules/datastructure.html"], function (ko, d3, endpointClass, shortnameClass, apiViewerClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            var endpointUnit = new endpointClass();
            var shortnameUnit = new shortnameClass([]);
            var apiViewerUnit = null;

            self.apiViewers = ko.unwrap(params.apiViewers);
            self.ddpDatasetName = ko.unwrap(params.ddpDatasetName);

            self.viewer = [];
            self.totalNumberOfNodes = 0;

            self.getDatasetStructure = function (datasetName, levelDeep, viewer) {
                var arr = [];
                var node;
                var apiViewer = [];

                if ((viewer == null) || (viewer.length == 0))
                    viewer = ko.utils.arrayFirst(self.apiViewers, function (item) {
                        return item.ddpDatasetName == datasetName;
                    });
                
                if (viewer == null)
                    return;

                for (var i = 0; i < viewer.properties.length; i++) {                    
                    node = $.extend({}, viewer.properties[i]);
                    if ((levelDeep < 2) && (node.shortname.dataType == "resource") && (node.itemEndpoint != null)) {
                        if (node.itemEndpoint.ddpDatasetName == datasetName)
                            apiViewer = apiViewerUnit.convertViewerToAPIViewer(node.shortname.name, node.itemEndpoint.defaultViewer);
                        else
                            apiViewer = [];
                        node.children = self.getDatasetStructure(node.itemEndpoint.ddpDatasetName, levelDeep + 1, apiViewer);
                        self.totalNumberOfNodes += node.children.length;
                    }
                    self.totalNumberOfNodes += 1;
                    arr.push(node);
                }
                return arr;
            };

            self.renderDatasetTree = function () {
                var width = d3.select("#datasetStructure").node().getBoundingClientRect().width - 40;
                var height = self.totalNumberOfNodes * 15;

                if (height < 500)
                    height = 500;
                var tree = d3.layout.tree()
                    .size([height, width]);

                var diagonal = d3.svg.diagonal()
                    .projection(function (d) { return [d.y, d.x]; });                

                var root = {
                    name: self.ddpDatasetName,
                    shortname: {
                        dataType: "resource",
                        label: self.ddpDatasetName
                    },
                    legend: null,
                    children: self.viewer,
                    x0: 0,
                    y0: height/2
                };
                
                var nodes = tree.nodes(root).reverse();

                var links = tree.links(nodes);

                nodes.forEach(function (d) { d.y = d.depth * 250; });                

                var svg = d3.select("#datasetStructure")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(10,10)");

                var index = 0;

                var node = svg.selectAll("g.node")
                    .data(nodes, function (d) { return d.id || (d.id = ++index); });

                var nodeEnter = node.enter().append("g")
                    .attr("class", "node")
                    .attr("transform", function (d) { return "translate(" + root.y0 + "," + root.x0 + ")"; });

                nodeEnter.append("circle")
                    .attr("r", 5)
                    .style("fill", function (d) { return d.shortname.dataType == "resource" ? d.children ? "steelblue" : "lightsteelblue" : "#fff"; });

                nodeEnter.append("text")
                    .attr("x", 13)
                    .attr("dy", ".35em")
                    .style("font-weight", function (d) { return d.shortname.dataType == "resource" && d.children ? "bold" : ""; })
                    .text(function (d) { return d.shortname.label; });

                var nodeUpdate = node.transition()
                    .duration(1500)
                    .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; });

                var link = svg.selectAll("path.link")
                    .data(links, function (d) { return d.target.id; });

                link.enter().insert("path", "g")
                    .attr("class", "link")
                    .attr("d", function (d) {
                        var o = { x: root.x0, y: root.y0 };
                        return diagonal({ source: o, target: o });
                    });

                link.transition()
                    .duration(1500)
                    .attr("d", diagonal);

                nodes.forEach(function (d) {
                    d.x0 = d.x;
                    d.y0 = d.y;
                });
            };
            
            self.init = function () {
                var shortnames = shortnameUnit.getAllShortnames();
                var endpoints = endpointUnit.getAllEndpoints();

                apiViewerUnit = new apiViewerClass(shortnames, endpoints);
                self.viewer = self.getDatasetStructure(self.ddpDatasetName, 0, []);
                self.renderDatasetTree();
            };

            self.init();

        },
        template: htmlText
    }
});