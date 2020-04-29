
// Define margins
var margin = { top: 20, right: 30, bottom: 30, left: 30 },
width =
    parseInt(d3.select("#map-chart-container").style("width")) - margin.left - margin.right,
height = width / 1.618;

// Calculate independent height & width for each of the charts
// var areaWidth = parseInt(d3.select("#area-chart-container").style("width")) - margin.left - margin.right,
// areaHeight = areaWidth / 1.618;

// var testbarWidth = parseInt(d3.select("#testbar-chart-container").style("width")) - margin.left - margin.right,
// testbarHeight = testbarWidth / 1.618;

var positivebarWidth = parseInt(d3.select("#positivebar-chart-container").style("width")) - margin.left - margin.right,
positivebarHeight = positivebarWidth / 1.618;

var deathbarWidth = parseInt(d3.select("#deathbar-chart-container").style("width")) - margin.left - margin.right,
deathbarHeight = positivebarWidth / 1.618;

// Define projection
var projection = d3.geoMercator()
    .scale(1)
    .translate([0, 0]),
    path = d3.geoPath(projection);

// Date parser and formatter
var parseDate = d3.timeParse("%m/%d/%y");
var parseDateReverse = d3.timeParse("%m-%d-%y")
var formatTime = d3.timeFormat("%m-%d-%y");
var formatTimeAxes = d3.timeFormat("%B %d")

// Define colors
var colors = {
    positives: "chocolate",
    negatives: "grey",
    deaths: "brown",
    positivesDelta: "chocolate",
    negativesDelta: "grey",
    deathsDelta: "brown"
}

// Define mapSvg canvas
var mapSvg = d3
    .select("#map-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Add a chart title to the map
mapSvg.append("text")
    .attr("x", (width / 2))             
    .attr("y", 0)
    .attr("text-anchor", "middle")  
    .style("font-size", ".8rem") 
    .style("font-weight", "550")
    .text("Confirmed cases by Oregon county");

// Create the SVG group for the Cumulative Totals Area Chart
// var areaSvg = d3
//     .select("#area-chart")
//     .attr("width", areaWidth + margin.left + margin.right)
//     .attr("height", areaHeight + margin.top + margin.bottom)
//     .append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// // Add a chart title to the area chart
// areaSvg.append("text")
//     .attr("x", (areaWidth / 2))             
//     .attr("y", 0)
//     .attr("text-anchor", "middle")  
//     .style("font-size", ".8rem") 
//     .style("font-weight", "bold")
//     .text("Total cases over time");

// Create the SVG group for the Daily Tests Bar Chart
// var testBarSvg = d3 
//     .select("#testbar-chart")
//     .attr("width", testbarWidth + margin.left + margin.right)
//     .attr("height", testbarHeight + margin.top + margin.bottom)
//     .append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Create the SVG group for the Daily Reported Positives Bar Chart
var positiveBarSvg = d3 
    .select("#positivebar-chart")
    .attr("width", positivebarWidth + margin.left + margin.right)
    .attr("height", positivebarHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Add a chart title to the Daily Reported Positives Bar Chart
positiveBarSvg.append("text")
    .attr("x", (positivebarWidth / 2))             
    .attr("y", 0)
    .attr("text-anchor", "middle")  
    .style("font-size", ".8rem") 
    .style("font-weight", "550")
    .text("New reported positives by day");

// Create the SVG group for the Daily Reported Deaths Bar Chart
var deathBarSvg = d3 
    .select("#deathbar-chart")
    .attr("width", deathbarWidth + margin.left + margin.right)
    .attr("height", deathbarHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Add a chart title to the Daily Reported Deaths Bar Chart
deathBarSvg.append("text")
    .attr("x", (deathbarWidth / 2))             
    .attr("y", 0)
    .attr("text-anchor", "middle")  
    .style("font-size", ".8rem") 
    .style("font-weight", "550")
    .text("New reported deaths by day");

// Create the div for the tooltip
var mapTooltipDiv = d3.select("main").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);


d3.json("data/oregon-counties.json").then(function(topodata) {

    d3.csv("data/or-covid-timeseries.csv").then(function(covdata){

        // Calculate scale and translate to auto-fit the map to the screen
        var b = path.bounds(topojson.mesh(topodata)),
        s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

        // Update the projection to use computed scale & translate
        projection
            .scale(s)
            .translate(t);

        // Select the county feature from the topojson
        var counties = topojson.feature(topodata, topodata.objects.cb_2015_oregon_county_20m).features;

        // Parse dates 
        covdata.forEach(function(d, i) {
            d.Date = parseDate(d.Date);
        });

        // Calculate max values
        var maxDate = d3.max(covdata, d => d.Date);
        var maxPositive = d3.max(covdata, d => d.Positives);
        // Update the last updated text
        $( "#last-update" ).first().text(formatTime(maxDate));

        var covdataToday = covdata.filter(d => formatTime(d.Date) == formatTime(maxDate));

        // Calculate the sums for today
        var positiveTotal = d3.sum(covdataToday.map(d => d.Positives));
        var negativeTotal = d3.sum(covdataToday.map(d => d.Negatives));
        var deathsTotal = d3.sum(covdataToday.map(d => d.Deaths));

        $( "#num-positive" ).first().text(positiveTotal);
        $( "#num-negative" ).first().text(negativeTotal);
        $( "#num-death" ).first().text(deathsTotal);
        $( "#num-total" ).first().text(positiveTotal + negativeTotal);

        // TODO: Calculate the difference between current day and prior day for the data set

        // Add covid data to the feature array for the latest data
        counties.forEach(function(d, i) {
            d.properties.counts = covdataToday.filter(cd => cd.County == d.properties.NAME).map(d => {
                return {
                    date: d.Date,
                    positives: d.Positives,
                    deaths: d.Deaths,
                    negatives: d.Negatives
                }
            })
        });
  
        // Now sort the features by Positives
        counties.sort(function(a, b) { return b.properties.counts.positives - a.properties.counts.positives; })

        // Logger for debugging
        // console.log(counties);

        // Radius Scaler for Bubbles
        var radius = d3.scaleSqrt()
            .domain([0, maxPositive])
            .range([0, width/50]);

            d3.selection.prototype.moveToFront = function() {
                return this.each(function(){
                  this.parentNode.appendChild(this);
                });
              };

        // Function for the tooltip mouseover rendering
        function tooltipMouseOver(d) {
            // Get the highlighted county name
            var countyName = d.properties.NAME;

            // Draw thicker boarders on selected county
            var selected = mapSvg.selectAll(".county")
                .filter(d => d.properties.NAME == countyName)
                .classed("county-hover", true);
            selected.moveToFront();

            mapSvg.selectAll('.bubble').moveToFront();

            mapTooltipDiv.transition()		
                .duration(200)		
                .style("opacity", .7);		
            mapTooltipDiv.html(`<span style='margin-left: 2.5px;'><strong>` + d.properties.NAME + ` County</strong></span><br>
                    <table style="margin-top: 2.5px;">
                            <tr><td>Positives: <strong><span style="text-align: right; color: chocolate">  `  + d.properties.counts[0].positives + `</td></tr></strong>
                            <tr><td>Negatives: <strong><span style="text-align: right; color: darkgrey">  ` + d.properties.counts[0].negatives + `</td></tr></strong>
                            <tr><td>Deaths: <strong><span style="text-align: right; color: brown">  ` + d.properties.counts[0].deaths + `</td></tr></strong>
                    </table>
                    `)	
                .style("left", (d3.event.pageX - 40) + "px")		
                .style("top", (d3.event.pageY + 30) + "px");
        }
        
        function tooltipMouseOut(d) {
            // Remove thicker boarders for hover
            mapSvg.selectAll(".county")
                .classed("county-hover", false);

            mapTooltipDiv.transition()		
                .duration(250)		
                .style("opacity", 0);	
        }

        // Draw the map
        mapSvg.selectAll(".county")
            .data(counties)
            .enter().append("path")
            .attr("class", "county")
            .attr("d", path)
            .on("mousemove", tooltipMouseOver)					
            .on("mouseout", tooltipMouseOut);

        // Append bubbles
        mapSvg.append("g")
            .attr("class", "bubble")
            .selectAll("circle")
            .data(counties)
            .enter().append("circle")
            .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
            .attr("r", function(d) { return radius(d.properties.counts[0].positives)})
            .on("mousemove", tooltipMouseOver)					
            .on("mouseout", tooltipMouseOut);

        // Shade positive counties
        mapSvg.selectAll(".county")
            .filter(d => d.properties.counts[0].positives > 0 )
            .classed("county-positive", true);

        // Calculate Daily Totals for Area Chart
        var dailyTotals = d3.nest()
            .key(d => formatTime(d.Date)) // Date is converted to string for the Group By
            .rollup(function(v) {
                return {
                    positives: d3.sum(v, function(d) { return d.Positives }),
                    negatives: d3.sum(v, function(d) { return d.Negatives }),
                    deaths: d3.sum(v, function(d) { return d.Deaths })
                }
            })
            .entries(covdata)
            // Flatten the output
            .map(function(d, i, arr) {
                if (i > 0) {
                    return {
                        date: parseDateReverse(d.key), // Had to parse back into date after formatting to string
                        positives: d.value.positives,
                        negatives: d.value.negatives, 
                        deaths: d.value.deaths,
                        positivesDelta: d.value.positives - arr[i-1].value.positives,
                        negativesDelta: d.value.negatives - arr[i-1].value.negatives,
                        deathsDelta: d.value.deaths - arr[i-1].value.deaths
                    } 
                } else {
                    return {
                        date: parseDateReverse(d.key), // Had to parse back into date after formatting to string
                        positives: d.value.positives,
                        negatives: d.value.negatives, 
                        deaths: d.value.deaths,
                        positivesDelta: 0,
                        negativesDelta: 0,
                        deathsDelta: 0
                    } 
                }
            })

        // Key order controls the order that it renders on the chart
        // var keys = ["deaths", "positives"];
        var testBarKeys = ["positivesDelta", "negativesDelta"]

        // Create the Area Chart 
        // var areaSeries = d3.stack().keys(keys)(dailyTotals);
        var testBarSeries = d3.stack().keys(testBarKeys)(dailyTotals);
        var barWidth = Math.floor(width / dailyTotals.length)*.45;

        x = d3.scaleUtc()
            .domain(d3.extent(dailyTotals, function(d) {
                var newDate = new Date(d.date);
                newDate.setDate(newDate.getDate() + 1);
                return newDate;
            }))
            .range([0, positivebarWidth]);

        // y = d3.scaleLinear()
        //     .domain([0, d3.max(dailyTotals, d => d.positives + d.deaths)])
        //     .range([areaHeight - margin.bottom, margin.top])

        // var area = d3.area()
        //     .x(d => x(d.data.date))
        //     .y0(d => y(d[0]))
        //     .y1(d => y(d[1]))
        
        // areaSvg.append("g")
        //     .selectAll("path")
        //     .data(areaSeries)
        //     .join("path")
        //       .attr("fill", ({key}) => colors[key])
        //       .attr("d", area)
        //       .attr("class", "area")

        xAxis = g => g
            .attr("transform", `translate(0,${positivebarHeight - margin.bottom})`)
            .call(d3.axisBottom(x)
                .tickValues(d3.extent(dailyTotals, function(d) {
                    var newDate = new Date(d.date);
                    newDate.setDate(newDate.getDate() + 1);
                    return newDate;
                }))
                .tickFormat(formatTimeAxes))


        // yAxis = g => g
        //     .attr("transform", `translate(${margin.left},0)`)
        //     .call(d3.axisLeft(y))
            // .call(g => g.select(".domain").remove())
            // .call(g => g.select(".tick:last-of-type text").clone()
            //     .attr("x", 3)
            //     .attr("text-anchor", "start")
            //     .attr("font-weight", "bold")
            //     .text(data.y))
        
        // areaSvg.append("g")
        //       .call(xAxis);
        
        // areaSvg.append("g")
        //       .call(yAxis);

        // Create the Total Test Volume Bar Chart
        // y = d3.scaleLinear()
        //     .domain([0, d3.max(dailyTotals, d => d.positivesDelta + d.negativesDelta)])
        //     .range([testbarHeight - margin.bottom, margin.top])

        // testBarSvg.append("g")
        //     .selectAll("g")
        //     .data(testBarSeries)
        //     .join("g")
        //         .attr("fill", ({key}) => colors[key])
        //         .selectAll("rect")
        //         .data(d => d)
        //         .join("rect")
        //             .attr("x", (d, i) => x(d.data.date))
        //             .attr("y", d => y(d[1]))
        //             .attr("height", d => y(d[0]) - y(d[1]))
        //             .attr("width", barWidth)
        //             .attr("class", "rect")

        //     yAxisTestBar = g => g
        //         .attr("transform", `translate(${margin.left},0)`)
        //         .call(d3.axisLeft(y)
        //             .ticks(5))

        //     testBarSvg.append("g")
        //         .call(xAxis)
        //         // Rotate the text
        //         .selectAll("text")
        //         .style("text-anchor", "start");
          
        //     testBarSvg.append("g")
        //         .call(yAxisTestBar);

            // Create the Positive Results Chart
            yPositives = d3.scaleLinear()
                .domain([0, d3.max(dailyTotals, d => d.positivesDelta)])
                .range([positivebarHeight - margin.bottom, margin.top]);
            
            positiveBarSvg.selectAll("rect")
                .data(dailyTotals)
                .join("rect")
                    .style("fill", "chocolate")
                    .attr("x", function(d) { return x(d.date); })
                    .attr("width", barWidth)
                    .attr("y", function(d) { return yPositives(d.positivesDelta); })
                    .attr("height", function(d) { return positivebarHeight - margin.bottom - yPositives(d.positivesDelta); })
                    .attr("class", "rect");


            yAxisPositiveBar = g => g
                // .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(yPositives)
                    .ticks(5));

            positiveBarSvg.append("g")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "mid");

            // Add Y Gridlines
            positiveBarSvg.append("g")	
                .attr("class", "grid")
                .call(d3.axisLeft(yPositives).ticks(5)
                    .tickSize(-positivebarWidth)
                    .tickFormat("")
                );
              
            positiveBarSvg.append("g")
                .attr("class", "axis")
                .call(yAxisPositiveBar);

            // Create the Death Results Chart
            yDeaths = d3.scaleLinear()
                .domain([0, d3.max(dailyTotals, d => d.deathsDelta)])
                .range([deathbarHeight - margin.bottom, margin.top]);
            
            deathBarSvg.selectAll("rect")
                .data(dailyTotals)
                .join("rect")
                    .style("fill", "brown")
                    .attr("x", function(d) { return x(d.date); })
                    .attr("width", barWidth)
                    .attr("y", function(d) { return yDeaths(d.deathsDelta); })
                    .attr("height", function(d) { return deathbarHeight - margin.bottom - yDeaths(d.deathsDelta); })
                    .attr("class", "rect");

            yAxisDeathBar = g => g
                .call(d3.axisLeft(yDeaths)
                    .ticks(5));

            deathBarSvg.append("g")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "mid");

            // Add Y Gridlines
            deathBarSvg.append("g")	
                .attr("class", "grid")
                .call(d3.axisLeft(yDeaths).ticks(5)
                    .tickSize(-deathbarWidth)
                    .tickFormat("")
                )

            deathBarSvg.append("g")
                .attr("class", "axis")
                .call(yAxisDeathBar);

    });
});
