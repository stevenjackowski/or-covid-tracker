
// Define margins
var margin = { top: 20, right: 0, bottom: 0, left: 0 },
width =
    parseInt(d3.select("#map-chart").style("width")) - margin.left - margin.right,
height = width / 1.8;

// Define projection
var projection = d3.geoMercator()
    .scale(1)
    .translate([0, 0]),
    path = d3.geoPath(projection);

// Date parser and formatter
var parseDate = d3.timeParse("%m/%d/%y");
var formatTime = d3.timeFormat("%Y-%m-%d");

// Define mapSvg canvas
var mapSvg = d3
    .select("#map-chart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Create the div for the tooltip
var div = d3.select("main").append("div")	
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
        var maxDate = d3.max(covdata, d => d.Date)
        var maxPositive = d3.max(covdata, d => d.Positives)
        // Update the last updated text
        $( "#last-update" ).first().text(formatTime(maxDate));

        var covdataToday = covdata.filter(d => formatTime(d.Date) == formatTime(maxDate));

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
        console.log(counties);

        // Radius Scaler for Bubbles
        var radius = d3.scaleSqrt()
            .domain([0, maxPositive])
            .range([0, 15]);

        // Function for the tooltip mouseover rendering
        function tooltipMouseOver(d) {
            // Get the highlighted county name
            var countyName = d3.select(this).data()[0].properties.NAME;

            // Draw thicker boarders on selected county
            // mapSvg.selectAll(".county")
            //     .filter(d => d.properties.NAME == countyName)
            //     .classed("county-hover", true);

            div.transition()		
                .duration(250)		
                .style("opacity", .7);		
            div.html(`<span style='margin-left: 2.5px;'><strong>` + d.properties.NAME + ` County</strong></span><br>
                    <table style="margin-top: 2.5px;">
                            <tr><td>Positives: <strong><span style="text-align: right; color: brown">  `  + d.properties.counts[0].positives + `</td></tr></strong>
                            <tr><td>Negatives: <strong><span style="text-align: right; color: darkseagreen">  ` + d.properties.counts[0].negatives + `</td></tr></strong>
                            <tr><td>Deaths: <strong><span style="text-align: right; color: darkorange">  ` + d.properties.counts[0].deaths + `</td></tr></strong>
                    </table>
                    `)	
                .style("left", (d3.event.pageX + 10) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");
        }
        
        function tooltipMouseOut(d) {
            // Remove thicker boarders for hover
            // mapSvg.selectAll(".county")
            //     .classed("county-hover", false);

            div.transition()		
                .duration(250)		
                .style("opacity", 0)	
            div.html('')
                .style("left", "-200px")
                .style("top", "-200px");
        }

        // Draw the map
        mapSvg.selectAll(".county")
            .data(counties)
            .enter().append("path")
            .attr("class", "county")
            .attr("d", path)
            .on("mouseover", tooltipMouseOver)					
            .on("mouseout", tooltipMouseOut);


        // Append bubbles
        mapSvg.append("g")
            .attr("class", "bubble")
            .selectAll("circle")
            .data(counties)
            .enter().append("circle")
            .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
            .attr("r", function(d) { return radius(d.properties.counts[0].positives)})
            .on("mouseover", tooltipMouseOver)					
            .on("mouseout", tooltipMouseOut);

        // Shade positive counties
        mapSvg.selectAll(".county")
            .filter(d => d.properties.counts[0].positives > 0 )
            .classed("county-positive", true);


    });
});
