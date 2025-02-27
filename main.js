// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svg1_RENAME = d3.select("#lineChart1") // If you change this ID, you must change it in index.html too
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 2.a: LOAD...
d3.csv("aircraft_incidents.csv").then(data => {
    // 2.b: ... AND TRANSFORM DATA
    
    // Extract year and count accidents per year
    let accidentsByYear = d3.rollup(
        data,
        v => v.length,
        d => new Date(d.Date).getFullYear()
    );

    let processedData = Array.from(accidentsByYear, ([year, count]) => ({ year: new Date(year, 0, 1), count }));
    processedData.sort((a, b) => a.year - b.year);

    // 3.a: SET SCALES FOR CHART 1
    const xScale = d3.scaleTime()
        .domain(d3.extent(processedData, d => d.year))
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.count)])
        .range([height, 0]);

    // 4.a: PLOT DATA FOR CHART 1
    svg1_RENAME.append("path")
        .datum(processedData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.count))
        );

    // 5.a: ADD AXES FOR CHART 1
    svg1_RENAME.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
        .tickValues(d3.range(d3.min(processedData, d => d.year.getFullYear()), d3.max(processedData, d => d.year.getFullYear()) + 1, 5).map(y => new Date(y, 0, 1)))
        .tickFormat(d3.timeFormat("%Y"))
        )
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-45)");

    svg1_RENAME.append("g")
        .call(d3.axisLeft(yScale));

    // 6.a: ADD LABELS FOR CHART 1
    svg1_RENAME.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Year");
    
    svg1_RENAME.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .text("Number of Accidents");

    // 7.a: ADD INTERACTIVITY FOR CHART 1
    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("padding", "5px")
        .style("border", "1px solid #000")
        .style("border-radius", "5px")
        .style("visibility", "hidden");

    svg1_RENAME.selectAll("circle")
        .data(processedData)
        .enter().append("circle")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.count))
        .attr("r", 5)
        .attr("fill", "red")
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                .text(`${d.year.getFullYear()}: ${d.count} accidents`)
                .style("left", `${event.pageX + 5}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));
});


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