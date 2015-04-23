define(["knockout", "jquery", "d3", "Scripts/modules/classes/generic", "Scripts/text!modules/datadistribution.html"], function (ko, $, d3, genericClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.endpoint = ko.unwrap(params.endpoint);
            self.selectedDate = ko.observable(null);
            self.selectedNumber = ko.observable(null);
            self.isLoading = ko.observable(true);
            self.totalNumber = null;            
            self.dates = [];
            self.querystring = {
                _view: "basic",
                _properties: "ddpModified",
                _pageSize: self.endpoint.maxPageSize,
                _page: 0
            };

            self.genericClass = new genericClass;            
            
            self.getDateOnly = function (dateText) {
                var date = new Date(dateText);
                var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

                return {
                    fullDate: date,
                    dateText: date.getUTCFullYear().toString() + " " + months[date.getUTCMonth()]
                };
            };

            self.doneLoad = function (data) {
                var date;
                
                if ((data != null) && (data.result != null)) {
                    if (self.totalNumber == null)
                        self.totalNumber=data.result.totalResults * 1;
                    if (data.result.items != null) {
                        for (var i = 0; i < data.result.items.length; i++)
                            if ((data.result.items[i].ddpModified) && (Array.isArray(data.result.items[i].ddpModified) == false)) {
                                date = self.getDateOnly(data.result.items[i].ddpModified._value || data.result.items[i].ddpModified);
                                self.dates.push({
                                    id: data.result.items[i]._about,
                                    date: date.fullDate,
                                    dateText: date.dateText
                                });
                            }
                    }
                }
                if ((data != null) && (data.result != null) && (self.totalNumber > ((data.result.startIndex * 1)+self.querystring._pageSize))) {
                    self.querystring._page++;
                    self.genericClass.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, self.querystring, self.doneLoad, self.genericClass.errorOnLoad);
                }
                else {
                    if (self.dates.length > 0) {
                        self.isLoading(false);
                        self.drawDistributionChart();
                    }
                }
            };

            self.drawDistributionChart = function () {
                var combinedDates = [];
                var isFound = false;

                for (var i = 0; i < self.dates.length; i++) {
                    isFound = false;
                    for (var j = 0; j < combinedDates.length; j++)
                        if (combinedDates[j].dateText == self.dates[i].dateText) {
                            combinedDates[j].count++;
                            combinedDates[j].ids.push(self.dates[i].id);
                            combinedDates[j].dates.push(self.dates[i].date);
                            isFound = true;
                            break;
                        }
                    if (isFound == false)
                        combinedDates.push({
                            index: combinedDates.length,
                            dateText: self.dates[i].dateText,
                            date: new Date(Date.UTC(self.dates[i].date.getUTCFullYear(), self.dates[i].date.getUTCMonth(), 1)),
                            ids: [self.dates[i].id],
                            dates: [self.dates[i].date],
                            count: 1
                        });
                }
                self.renderDistributionChart(combinedDates);
            };

            self.renderDistributionChart = function (data) {
                var margin = { top: 40, right: 40, bottom: 40, left: 60 };
                var width = d3.select("#distributionChart").node().getBoundingClientRect().width - margin.left - margin.right;
                var height = 600 - margin.top - margin.bottom;

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
                    .nice(10)
                    .range([height, 0]);

                var xAxis = d3.svg.axis()
                    .scale(x)
                    .ticks(d3.time.months)
                    .tickFormat(d3.time.format("%Y %b"))
                    .orient("bottom");
                
                var yAxis = d3.svg.axis()
                    .scale(y)
                    .innerTickSize(10)
                    .orient("left");

                var svg = d3.select("#distributionChart")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var tooltip = d3.select("#distributionChartTooltip");

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);                    

                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis);                    

                svg.selectAll(".data-bubble")
                    .data(data)
                    .enter()
                    .append("circle")
                    .attr("class", "data-bubble")
                    .attr("r", 0)
                    .attr("cx", function (d) { return x(d.date); })
                    .attr("cy", function (d) { return y(d.count); })
                    .on("mouseover", function (d) {
                        self.selectedDate(d.dateText);
                        self.selectedNumber(d.count);
                        return;
                    })
                    .on("mousemove", function () {
                        return tooltip.style("top",(d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                    })
                    .on("mouseout", function () {
	                    self.selectedDate(null);
	                    self.selectedNumber(null);
	                    return;
	                })                    
                    .transition()
                    .duration(1500)
                    .attr("r", function (d) { return Math.sqrt(height - y(d.count)); })                    
                    .delay(function (d) { return (d.count % 100) * 30; });                
            };

            self.init = function () {
                self.genericClass.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, self.querystring, self.doneLoad, self.genericClass.errorOnLoad);
            };

            self.init();

        },
        template: htmlText
    }
});