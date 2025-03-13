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
    // Add debug info
    const debugInfo = d3.select("#debug-info");
    debugInfo.style("display", "block");
    debugInfo.append("h3").text("Debug Information");
    
    // Log initial data sample
    debugInfo.append("p").text(`CSV loaded with ${data.length} rows`);
    if (data.length > 0) {
        debugInfo.append("p").text(`First row sample: ${JSON.stringify(data[0])}`);
    }
    
    // Process data - parse dates to ensure they're valid
    let validDateCount = 0;
    data.forEach((d, i) => {
        if (d.Date) {
            const parsedDate = new Date(d.Date);
            if (!isNaN(parsedDate.getTime())) {
                d.Date = parsedDate;
                validDateCount++;
            } else {
                console.warn(`Invalid date at row ${i}: ${d.Date}`);
                d.Date = new Date(2000, 0, 1);
            }
        } else {
            console.warn(`Missing date at row ${i}`);
            d.Date = new Date(2000, 0, 1);
        }
        d.InjurySeverity = +d.InjurySeverity || 0;
    });
    
    debugInfo.append("p").text(`Valid dates found: ${validDateCount} of ${data.length}`);

    const filteredData = data.slice(0, 100);
    
    if (filteredData.length < 5) {
        debugInfo.append("p").text("WARNING: Not enough data, creating sample data");
        for (let i = 0; i < 5; i++) {
            filteredData.push({
                Date: new Date(2018 + i, 0, 1),
                InjurySeverity: 50 - i * 10,
                Country: `Country${i}`
            });
        }
    }

    // Group data by year for the line chart
    const yearGroups = {};
    filteredData.forEach(d => {
        const year = d.Date.getFullYear();
        if (!yearGroups[year]) {
            yearGroups[year] = [];
        }
        yearGroups[year].push(d);
    });
    
    let lineChartData = Object.entries(yearGroups).map(([year, values]) => ({
        year: new Date(parseInt(year), 0, 1),
        count: values.length
    }));
    
    lineChartData.sort((a, b) => a.year - b.year);
    
    debugInfo.append("p").text(`Line chart data points: ${lineChartData.length}`);
    debugInfo.append("pre").text(JSON.stringify(lineChartData, null, 2));
    
    if (lineChartData.length < 2) {
        debugInfo.append("p").style("color", "red").text("WARNING: Not enough data points for line chart. Adding sample data.");
        
        if (lineChartData.length === 1) {
            const existingYear = lineChartData[0].year.getFullYear();
            const existingCount = lineChartData[0].count;
            
            for (let i = 1; i <= 3; i++) {
                lineChartData.push({
                    year: new Date(existingYear + i, 0, 1),
                    count: Math.max(existingCount - (i * 10), 10)
                });
            }
        } else {
            for (let i = 0; i < 5; i++) {
                lineChartData.push({
                    year: new Date(2018 + i, 0, 1),
                    count: 100 - (i * 15)
                });
            }
        }
        
        lineChartData.sort((a, b) => a.year - b.year);
        debugInfo.append("p").text("Updated line chart data:");
        debugInfo.append("pre").text(JSON.stringify(lineChartData, null, 2));
    }

    // Group data by country for the bar chart
    let injuryByCountry = {};
    filteredData.forEach(d => {
        if (d.Country && d.Country.trim() !== "") {
            if (!injuryByCountry[d.Country]) {
                injuryByCountry[d.Country] = [];
            }
            injuryByCountry[d.Country].push(d.InjurySeverity);
        }
    });
    
    let barChartData = Object.entries(injuryByCountry).map(([country, values]) => ({
        country,
        severity: values.length > 0 ? d3.mean(values) : 0
    }));
    
    barChartData.sort((a, b) => b.severity - a.severity);
    barChartData = barChartData.slice(0, 5);
    
    if (barChartData.every(d => d.severity === 0)) {
        debugInfo.append("p").style("color", "red").text("WARNING: All severity values are 0. Creating sample data.");
        barChartData = barChartData.map((d, i) => ({
            country: d.country || `Country ${i+1}`,
            severity: 80 - (i * 15)
        }));
    }
    
    debugInfo.append("p").text(`Bar chart data points: ${barChartData.length}`);
    debugInfo.append("pre").text(JSON.stringify(barChartData, null, 2));

    // Draw the line chart
    drawLineChart(lineChartData);
    
    // Draw the bar chart
    drawBarChart(barChartData);

    // Add dropdown for country filtering
    const dropdown = d3.select("#countryDropdown");
    dropdown.selectAll("*").remove();
    
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
    d3.select("#lineChart").append("div")
        .style("color", "red")
        .style("padding", "20px")
        .style("font-weight", "bold")
        .text("Error loading data: " + error.message);
});

// Function to draw the line chart
function drawLineChart(data) {
    svgLine.selectAll("*").remove();
    
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.year))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count) * 1.1])
        .range([height, 0]);
    
    const xAxis = d3.axisBottom(xScale)
        .ticks(data.length)
        .tickFormat(d3.timeFormat("%Y"));

    const yAxis = d3.axisLeft(yScale)
        .ticks(10);

    svgLine.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .style("font-size", "12px");

    svgLine.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

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

    const lineGenerator = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.count))
        .curve(d3.curveLinear);

    svgLine.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 3)
        .attr("d", lineGenerator);

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

    svgLine.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
}

// Function to draw the bar chart
function drawBarChart(data) {
    svgBar.selectAll("*").remove();
    
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([0, width])
        .padding(0.1);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.severity)])
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale)
        .tickSize(0);

    const yAxis = d3.axisLeft(yScale)
        .ticks(10);

    svgBar.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    svgBar.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

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
            
            tooltip.html(`<strong>Country:</strong> ${d.country}<br><strong>Average Severity:</strong> ${d.severity}`)
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

    svgBar.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
}

// Update the bar chart based on selected country
function updateBarChart(data, selectedCountry) {
    svgBar.selectAll(".bar")
        .transition()
        .duration(500)
        .attr("fill", d => selectedCountry === "all" || d.country === selectedCountry ? "#ff7f0e" : "steelblue");
}
