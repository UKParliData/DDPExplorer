define(["knockout", "jquery", "d3", "Scripts/modules/classes/generic", "Scripts/text!modules/datasetdashboard.html"], function (ko, $, d3, genericClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.endpoint = ko.unwrap(params.endpoint);
            self.shortnames = ko.unwrap(params.shortnames);
            self.isDataDistributionShown = ko.observable(false);
            self.isDataStructureShown = ko.observable(false);
            self.totalNumber = ko.observable(null);
            
            self.dates = [];
            self.querystring = {
                _view: "basic",
                _properties: "date",
                _pageSize: self.endpoint.maxPageSize,
                _page: 0
            };

            self.genericClass = new genericClass;

            self.showDataDistributionTab = function () {
                self.isDataDistributionShown(true);
                self.isDataStructureShown(false);
            };

            self.showDataStructureTab = function () {
                self.isDataDistributionShown(false);
                self.isDataStructureShown(true);
            };
            
            self.getDateOnly = function (dateText) {
                var date = new Date(dateText);
                date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
                
                var padDate = function (text) {
                    if (text.length == 2)
                        return text;
                    else
                        return "0" + text;
                }

                return {
                    fullDate: date,
                    dateText: date.getUTCFullYear().toString() + padDate((date.getUTCMonth() + 1).toString()) + padDate(date.getUTCDate().toString())
                };
            }

            self.doneLoad = function (data) {
                var date;

                if ((data != null) && (data.result != null)) {
                    if (self.totalNumber() == null)
                        self.totalNumber(data.result.totalResults * 1);
                    if (data.result.items != null) {
                        for (var i = 0; i < data.result.items.length; i++)
                            if ((data.result.items[i].date) && (Array.isArray(data.result.items[i].date) == false)) {
                                date = self.getDateOnly(data.result.items[i].date._value || data.result.items[i].date);
                                self.dates.push({
                                    id: data.result.items[i]._about,
                                    date: date.fullDate,
                                    dateText: date.dateText
                                });
                            }
                    }
                }
                /*if ((data != null) && (data.result != null) && (self.totalNumber() > ((data.result.startIndex * 1)+self.querystring._pageSize))) {
                    self.querystring._page++;
                    self.genericClass.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, self.querystring, self.doneLoad, self.genericClass.errorOnLoad);
                }
                else*/ {
                    window.conductorVM.isAppBusy(false);
                    if (self.dates.length > 0)
                        self.drawDistributionChart();
                }
            };

            self.drawDistributionChart = function () {
                var combinedDates = [];
                var isFound = false;

                for (var i = 0; i < self.dates.length; i++) {
                    isFound = false;
                    for (var j = 0; j < combinedDates.length; j++)
                        if (combinedDates[j].dateText.substring(0, 6) == self.dates[i].dateText.substring(0, 6)) {
                            combinedDates[j].count++;
                            combinedDates[j].ids.push(self.dates[i].id);
                            isFound = true;
                            break;
                        }
                    if (isFound == false)
                        combinedDates.push({
                            index: combinedDates.length,
                            dateText: self.dates[i].dateText,
                            date: new Date(Date.UTC(self.dates[i].date.getUTCFullYear(), self.dates[i].date.getUTCMonth(), 1)),
                            ids: [self.dates[i].id],
                            count: 1
                        });
                }
                self.renderDistributionChart(combinedDates);
            };

            self.renderDistributionChart = function (data) {
                var margin = { top: 40, right: 40, bottom: 40, left: 40 };
                var width = d3.select("main").node().getBoundingClientRect().width - margin.left - margin.right;
                var height = 500 - margin.top - margin.bottom;

                var x = d3.time.scale()
                    .domain([
                        d3.min(data, function (item) { return item.date; }),
                        d3.max(data, function (item) { return item.date; })
                    ])
                    .range([0, width]);

                var y = d3.scale.linear()
                    .domain([
                        0,
                        d3.max(data, function (item) { return item.count; })
                    ])
                    .range([height, 0]);

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .ticks(d3.time.months, 1)
                    .tickFormat(d3.time.format("%Y %b"))
                    .orient("bottom");

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .ticks(5)
                    .innerTickSize(10)
                    .orient("left");

                var svg = d3.select("#distributionChart")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var tooltip = d3.select(".tooltip.bottom");
                
                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);
                    /*.append("text")
                    .attr("class", "label")
                    .attr("x", width)
                    .attr("y", -6)
                    .style("text-anchor", "end")
                    .text("Date");*/

                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis);
                    /*.append("text")
                    .attr("class", "label")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                    .text("Number of records")*/

                svg.selectAll(".data-bubble")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("class", "data-bubble")
                    .attr("r", 0)
                    .attr("cx", function (d) { return x(d.date); })
                    .attr("cy", function (d) { return y(d.count); })
                    .on("mouseover", function (d) { return tooltip.style("visibility", "visible").select(".tooltip-inner").text(d.count); })
	                .on("mousemove", function () { return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px"); })
	                .on("mouseout", function () { return tooltip.style("visibility", "hidden"); })
                    .transition()
                    .duration(1500)
                    .attr("r", function (d) { return Math.sqrt(height - y(d.count)); })                    
                    .delay(function (d) { return (d.count % 100) * 30; });                
            };

            self.init = function () {
                var found=ko.utils.arrayFirst(self.shortnames, function (item) {
                    return item.uri = "http://purl.org/dc/terms/date";
                });
                self.isDataDistributionShown(found != null);
                self.isDataStructureShown(found == null);
                if (found != null) {
                    window.conductorVM.isAppBusy(true);                    
                    self.genericClass.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, self.querystring, self.doneLoad, self.genericClass.errorOnLoad);
                }
            };

            self.init();

        },
        template: htmlText
    }
});