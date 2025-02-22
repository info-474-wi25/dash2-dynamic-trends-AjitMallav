// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svg1 = d3.select("#lineChart1") // If you change this ID, you must change it in index.html too
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const svg2 = d3.select("#lineChart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// (If applicable) Tooltip element for interactivity
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// 2.a: LOAD...
d3.csv("aircraft_incidents.csv").then(data => {
    // 2.b: ... AND TRANSFORM DATA
    data.forEach(d => {
        d.Date = new Date(d.Date); // Parse date
        d.Fatalities = +d.Fatalities; // Convert to number
        d.Injuries = +d.Injuries; // Convert to number
    });

    // 3.a: SET SCALES FOR CHART 1
    const x1 = d3.scaleTime()
        .domain(d3.extent(data, d => d.Date))
        .range([0, width]);

    const y1 = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Fatalities)])
        .range([height, 0]);

    // 4.a: PLOT DATA FOR CHART 1
    svg1.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => x1(d.Date))
            .y(d => y1(d.Fatalities))
        );

    // 5.a: ADD AXES FOR CHART 1
    svg1.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x1));

    svg1.append("g")
        .call(d3.axisLeft(y1));

    // 6.a: ADD LABELS FOR CHART 1
    svg1.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Fatalities Over Time");

    // 7.a: ADD INTERACTIVITY FOR CHART 1
    svg1.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x1(d.Date))
        .attr("cy", d => y1(d.Fatalities))
        .attr("r", 3)
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Date: ${d.Date.toLocaleDateString()}<br>Fatalities: ${d.Fatalities}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));

    // ==========================================
    //         CHART 2 (if applicable)
    // ==========================================

    // 3.b: SET SCALES FOR CHART 2
    const x2 = d3.scaleTime()
        .domain(d3.extent(data, d => d.Date))
        .range([0, width]);

    const y2 = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Injuries)])
        .range([height, 0]);

    // 4.b: PLOT DATA FOR CHART 2
    svg2.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "crimson")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => x2(d.Date))
            .y(d => y2(d.Injuries))
        );

    // 5.b: ADD AXES FOR CHART 2
    svg2.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x2));

    svg2.append("g")
        .call(d3.axisLeft(y2));

    // 6.b: ADD LABELS FOR CHART 2
    svg2.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Injuries Over Time");

    // 7.b: ADD INTERACTIVITY FOR CHART 2
    svg2.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x2(d.Date))
        .attr("cy", d => y2(d.Injuries))
        .attr("r", 3)
        .attr("fill", "crimson")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(`Date: ${d.Date.toLocaleDateString()}<br>Injuries: ${d.Injuries}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));
});