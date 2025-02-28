// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 100, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svg1 = d3.select("#lineChart1") // First chart container
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const svg2 = d3.select("#lineChart2") // Second chart container - make sure to add this div to your HTML
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create tooltip div for both charts
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("padding", "5px")
    .style("border", "1px solid #000")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("opacity", 0);

// 2.a: LOAD DATA
d3.csv("aircraft_incidents.csv").then(data => {
    // 2.b: TRANSFORM DATA FOR CHART 1
    
    // Parse dates
    data.forEach(d => {
        d.Date = new Date(d.Date);
    });
    
    // Extract year and count accidents per year
    let accidentsByYear = d3.rollup(
        data,
        v => v.length,
        d => d.Date.getFullYear()
    );

    let processedData = Array.from(accidentsByYear, ([year, count]) => ({ year: new Date(year, 0, 1), count }));
    processedData.sort((a, b) => a.year - b.year);

    // 3.a: SET SCALES FOR CHART 1
    const xScale = d3.scaleTime()
        .domain(d3.extent(processedData, d => d.year))
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.count) * 1.1]) // Add 10% padding
        .range([height, 0]);

    // 4.a: PLOT DATA FOR CHART 1
    svg1.append("path")
        .datum(processedData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.count))
        );

    // 5.a: ADD AXES FOR CHART 1
    svg1.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
            .tickValues(d3.range(
                d3.min(processedData, d => d.year.getFullYear()), 
                d3.max(processedData, d => d.year.getFullYear()) + 1, 
                5
            ).map(y => new Date(y, 0, 1)))
            .tickFormat(d3.timeFormat("%Y"))
        )
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-45)");

    svg1.append("g")
        .call(d3.axisLeft(yScale));

    // 6.a: ADD LABELS AND TITLE FOR CHART 1
    svg1.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Accidents per Year");
        
    svg1.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Year");
    
    svg1.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .text("Number of Accidents");

    // 7.a: ADD INTERACTIVITY FOR CHART 1
    svg1.selectAll("circle")
        .data(processedData)
        .enter().append("circle")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.count))
        .attr("r", 5)
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${d.year.getFullYear()}: ${d.count} accidents`)
                .style("left", `${event.pageX + 5}px`)
                .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add grid lines to Chart 1
    svg1.append("g")
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

    // 2.c: TRANSFORM DATA FOR CHART 2 - "Injury Severity per Country"
    // Group data by country and calculate average injury severity
    let countryData = [];
    
    // Assuming your CSV has columns for "Country" and "InjurySeverity"
    // If not, you may need to adjust this based on your actual data structure
    let injuryByCountry = d3.rollup(
        data,
        v => d3.mean(v, d => +d.InjurySeverity), // Calculate average injury severity
        d => d.Country
    );
    
    countryData = Array.from(injuryByCountry, ([country, severity]) => ({ 
        country: country, 
        severity: severity || 0 // Handle null values
    }));
    
    // Sort alphabetically by country
    countryData.sort((a, b) => d3.ascending(a.country, b.country));
    
    // 3.b: SET SCALES FOR CHART 2 - Bar Chart
    const xScale2 = d3.scaleBand()
        .domain(countryData.map(d => d.country))
        .range([0, width])
        .padding(0.2);
    
    const yScale2 = d3.scaleLinear()
        .domain([0, 100]) // Set maximum to 100 as shown in your example
        .range([height, 0]);
    
    // 4.b: PLOT DATA FOR CHART 2 - Bar Chart
    svg2.selectAll("bar")
        .data(countryData)
        .enter()
        .append("rect")
        .attr("x", d => xScale2(d.country))
        .attr("y", d => yScale2(d.severity))
        .attr("width", xScale2.bandwidth())
        .attr("height", d => height - yScale2(d.severity))
        .attr("fill", "steelblue");
    
    // 5.b: ADD AXES FOR CHART 2
    svg2.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale2))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-90)")
        .attr("y", 10)
        .attr("x", -10);
    
    svg2.append("g")
        .call(d3.axisLeft(yScale2));
    
    // 6.b: ADD LABELS AND TITLE FOR CHART 2
    svg2.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Injury Severity per Country");
        
    svg2.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Country");
    
    svg2.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .text("Injury Severity");
    
    // Add grid lines to Chart 2
    svg2.append("g")
        .attr("class", "grid")
        .selectAll("line")
        .data(yScale2.ticks())
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => yScale2(d))
        .attr("y2", d => yScale2(d))
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", 1);
    
    // 7.b: ADD INTERACTIVITY FOR CHART 2
    svg2.selectAll("rect")
        .on("mouseover", (event, d) => {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`${d.country}: ${d.severity.toFixed(1)} severity`)
                .style("left", `${event.pageX + 5}px`)
                .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", () => {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
});