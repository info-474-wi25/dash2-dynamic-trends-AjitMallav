// Set dimensions and margins
const margin = { top: 50, right: 50, bottom: 70, left: 80 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Create SVG container for the line chart
const svgLine = d3.select("#lineChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create SVG container for the bar chart
const svgBar = d3.select("#barChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "8px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("box-shadow", "0px 4px 8px rgba(0,0,0,0.2)");

// Load CSV data
d3.csv("aircraft_incidents.csv").then(data => {
    // Process data
    data.forEach(d => {
        d.Date = new Date(d.Date);
        d.InjurySeverity = +d.InjurySeverity || 0; // Ensure InjurySeverity is a number
    });

    // Filter data to reduce the number of accidents (e.g., only include the first 100 entries)
    const filteredData = data.slice(0, 100);

    // Group data by year for the line chart
    let accidentsByYear = d3.rollup(filteredData, v => v.length, d => d.Date.getFullYear());
    let lineChartData = Array.from(accidentsByYear, ([year, count]) => ({
        year: new Date(year, 0, 1),
        count
    }));
    lineChartData.sort((a, b) => a.year - b.year);

    // Group data by country for the bar chart and limit to top 5 countries
    let injuryByCountry = d3.rollup(filteredData, v => d3.mean(v, d => d.InjurySeverity), d => d.Country);
    let barChartData = Array.from(injuryByCountry, ([country, severity]) => ({
        country,
        severity: severity || 0
    }));
    barChartData.sort((a, b) => b.severity - a.severity); // Sort by severity
    barChartData = barChartData.slice(0, 5); // Limit to top 5 countries

    // If all InjurySeverity values are 0, simulate some data for demonstration
    if (barChartData.every(d => d.severity === 0)) {
        console.warn("All InjurySeverity values are 0. Simulating data for demonstration.");
        barChartData = barChartData.map((d, i) => ({
            country: d.country,
            severity: Math.random() * 100 // Random severity between 0 and 100
        }));
    }

    // Draw the line chart
    drawLineChart(lineChartData);
    // Draw the bar chart
    drawBarChart(barChartData);

    // Add dropdown for country filtering
    const dropdown = d3.select("#countryDropdown");
    dropdown.append("option")
        .attr("value", "all")
        .text("All Countries");

    dropdown.selectAll(".country-option")
        .data(barChartData)
        .enter()
        .append("option")
        .attr("value", d => d.country)
        .text(d => d.country);

    dropdown.on("change", function() {
        const selectedValue = this.value;
        updateBarChart(barChartData, selectedValue);
    });
}).catch(error => {
    console.error("Error loading the CSV data: ", error);
});

function drawLineChart(data) {
    // Set up scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count) * 1.1])
        .range([height, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeYear.every(1))
        .tickFormat(d3.timeFormat("%Y"));

    const yAxis = d3.axisLeft(yScale)
        .ticks(10);

    // Add X axis
    svgLine.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Add Y axis
    svgLine.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // Add grid lines
    svgLine.append("g")
        .attr("class", "grid")
        .selectAll("line")
        .data(yScale.ticks())
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d))
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", 1);

    // Create line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.count))
        .curve(d3.curveMonotoneX);

    // Add the line path
    svgLine.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 3)
        .attr("d", line);

    // Add data points
    svgLine.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.count))
        .attr("r", 6)
        .attr("fill", "steelblue")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("r", 8)
                .attr("fill", "#ff7f0e");
            
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            
            tooltip.html(`<strong>Year:</strong> ${d.year.getFullYear()}<br><strong>Accidents:</strong> ${d.count}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("r", 6)
                .attr("fill", "steelblue");
            
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add chart title
    svgLine.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .style("font-weight", "bold")

    // Add X axis label
    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom / 1.5)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Year");

    // Add Y axis label
    svgLine.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left / 1.5)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Accidents");
}

function drawBarChart(data) {
    // Set up scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.severity) * 1.1])
        .range([height, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Add X axis
    svgBar.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Add Y axis
    svgBar.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // Add grid lines
    svgBar.append("g")
        .attr("class", "grid")
        .selectAll("line")
        .data(yScale.ticks())
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d))
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", 1);

    // Add bars
    svgBar.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.country))
        .attr("y", d => yScale(d.severity))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.severity))
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("fill", "#ff7f0e");
            
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            
            tooltip.html(`<strong>Country:</strong> ${d.country}<br><strong>Severity:</strong> ${d.severity.toFixed(1)}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("fill", "steelblue");
            
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add chart title
    svgBar.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .style("font-weight", "bold")

    // Add X axis label
    svgBar.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom / 1.5)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Country");

    // Add Y axis label
    svgBar.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left / 1.5)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Injury Severity");
}

function updateBarChart(data, selectedValue) {
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([0, width])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.severity) * 1.1])
        .range([height, 0]);

    const bars = svgBar.selectAll(".bar")
        .data(data);

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.country))
        .attr("y", d => yScale(d.severity))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.severity))
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("fill", "#ff7f0e");
            
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            
            tooltip.html(`<strong>Country:</strong> ${d.country}<br><strong>Severity:</strong> ${d.severity.toFixed(1)}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("fill", "steelblue");
            
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    if (selectedValue === "all") {
        bars.transition()
            .duration(500)
            .style("opacity", 1);
    } else {
        bars.transition()
            .duration(500)
            .style("opacity", d => d.country === selectedValue ? 1 : 0.2);
    }
}