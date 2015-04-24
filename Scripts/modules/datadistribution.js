define(["knockout", "jquery", "d3", "Scripts/modules/classes/generic", "Scripts/modules/classes/shortname", "Scripts/text!modules/datadistribution.html"], function (ko, $, d3, genericClass, shortnameClass, htmlText) {
    return {
        viewModel: function (params) {
            var self = this;

            self.endpoint = ko.unwrap(params.endpoint);
            self.selectedDate = ko.observable(null);
            self.selectedNumber = ko.observable(null);
            self.isLoading = ko.observable(true);
            self.selectedMonth = ko.observable(null);
            self.totalNumber = null;            
            self.dates = [];
            self.querystring = {
                _view: "basic",
                _properties: "ddpModified",
                _pageSize: self.endpoint.maxPageSize,
                _page: 0,
                "exists-ddpModified": true
            };
            
            self.genericClass = new genericClass;            
            self.shortnameClass = new shortnameClass([]);

            self.getDateOnly = function (dateText) {
                var date = new Date(dateText);                

                date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

                return {
                    fullDate: date,
                    dateText: date.getUTCFullYear().toString() + " " + self.genericClass.months[date.getUTCMonth()]
                };
            };

            self.doneLoad = function (data) {
                var date;

                if ((data != null) && (data.result != null)) {
                    if (self.totalNumber == null)
                        self.totalNumber = data.result.totalResults * 1;
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
                if ((data != null) && (data.result != null) && (self.totalNumber > ((data.result.startIndex * 1) + self.querystring._pageSize))) {
                    self.querystring._page++;
                    self.genericClass.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, self.querystring, self.doneLoad, self.genericClass.errorOnLoad);
                }
                else {
                    if (self.dates.length > 0) {
                        self.isLoading(false);
                        self.drawMonthlyDistributionChart();
                    }
                }
            };

            self.drawMonthlyDistributionChart = function () {
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
                self.renderMonthlyDistributionChart(combinedDates);
            };

            self.renderMonthlyDistributionChart = function (data) {
                var margin = { top: 40, right: 40, bottom: 40, left: 60 };
                var width = d3.select("#distributionChart").node().getBoundingClientRect().width - margin.left - margin.right;
                var height = 600 - margin.top - margin.bottom;

                $("#distributionChart").empty();

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
                    .on("click", function (d) {
                        self.selectedDate(null);
                        self.selectedNumber(null);
                        self.drawDailyDistributionChart(d.dates, d.date);
                        self.selectedMonth(d.dateText);
                        return;
                    })
                    .transition()
                    .duration(1500)
                    .attr("r", function (d) { return d3.max([Math.sqrt(height - y(d.count)),3]); })
                    .delay(function (d) { return (d.count % 100) * 30; });                
            };

            self.drawDailyDistributionChart = function (dates, monthDate) {
                var combinedDates = [];
                var lastDay = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0)).getUTCDate();
                var tempDate;
                var arr=[];

                for (var i = 0; i < lastDay; i++) {
                    arr = ko.utils.arrayFilter(dates, function (item) {
                        return item.getUTCDate() == i + 1;
                    });
                    tempDate = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), i + 1));
                    combinedDates.push({
                        index: i + 1,
                        date: tempDate,
                        dateText: (tempDate.getUTCDate() < 10 ? "0" + tempDate.getUTCDate().toString() : tempDate.getUTCDate().toString()) + " " + self.genericClass.months[tempDate.getUTCMonth()] + " " + tempDate.getUTCFullYear().toString(),
                        dayText: (i + 1) == 1 ? "1st" : (i + 1) == 2 ? "2nd" : (i + 1) == 3 ? "3rd" : (i + 1) + "th",
                        count: arr.length
                    });
                }                
                self.renderDailyDistributionChart(combinedDates);
            };

            self.renderDailyDistributionChart = function (data) {
                var margin = { top: 40, right: 40, bottom: 40, left: 60 };
                var width = d3.select("#distributionChart").node().getBoundingClientRect().width - margin.left - margin.right;
                var height = 600 - margin.top - margin.bottom;
                
                $("#distributionChart").empty();
                var x = d3.scale.ordinal()
                    .domain(data.map(function (d) { return d.dayText; }))
                    .rangeRoundBands([0, width], .1);

                var y = d3.scale.linear()
                    .domain([
                        0,
                        d3.max(data, function (item) { return item.count; })
                    ])
                    .range([height, 0]);

                var xAxis = d3.svg.axis()
                    .scale(x)                    
                    .innerTickSize(0)
                    .tickValues(["1st","5th","10th","15th","20th","25th",data[data.length-1].dayText])
                    .orient("bottom");

                var yAxis = d3.svg.axis()
                    .scale(y)
                    .ticks(5)
                    .tickFormat(d3.format("d"))
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

                svg.selectAll(".data-bar")
                    .data(data)
                    .enter()
                    .append("rect")
                    .attr("class", "data-bar")
                    .attr("width", x.rangeBand())
                    .attr("height", 0)
                    .attr("x", function (d) { return x(d.dayText); })
                    .attr("y", height)
                    .on("mouseover", function (d) {
                        self.selectedDate(d.dateText);
                        self.selectedNumber(d.count);
                        return;
                    })
                    .on("mousemove", function () {
                        return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                    })
                    .on("mouseout", function () {
                        self.selectedDate(null);
                        self.selectedNumber(null);
                        return;
                    })
                    .on("click", function (d) {
                        self.showResultsForSelectedDate(d.date);
                    })
                    .transition()
                    .duration(1500)
                    .attr("height", function (d) { return height - y(d.count); })
                    .attr("y", function (d) { return y(d.count); })
                    .delay(function (d) { return (d.count % 100) * 30; });
            };

            self.showResultsForSelectedDate = function (date) {
                var shortnames = self.shortnameClass.getAllShortnames();
                var querystring = {};

                querystring["min-ddpModified"] = self.genericClass.formatDate("yyyy-MM-ddTHH:mm:ss.fffffffZ", date);
                date.setUTCDate(date.getUTCDate() + 1);
                querystring["maxEx-ddpModified"] = self.genericClass.formatDate("yyyy-MM-ddTHH:mm:ss.fffffffZ", date);

                window.conductorVM.parameters({
                    endpointUrl: self.endpoint.uriTemplate.fullUri,
                    querystring: querystring,
                    endpoint: self.endpoint,
                    viewerName: self.endpoint.defaultViewer.name,
                    shortnames: shortnames
                });
                window.conductorVM.selectedComponent("search-result");
            };

            self.showAll = function () {
                self.selectedMonth(null);
                self.drawMonthlyDistributionChart();
            };

            self.init = function () {
                self.genericClass.getDataFromOwlim(self.endpoint.uriTemplate.fullUri, self.querystring, self.doneLoad, self.genericClass.errorOnLoad);
            };

            self.init();

        },
        template: htmlText
    }
});