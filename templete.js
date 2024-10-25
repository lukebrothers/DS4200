// Load the data
const iris = d3.csv("iris.csv");

// Once the data is loaded, proceed with plotting
iris.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.PetalLength = +d.PetalLength;
        d.PetalWidth = +d.PetalWidth;
    });

    // Part 2.1: Scatter plot with groups
    const margin = { top: 20, right: 120, bottom: 40, left: 60 }; // Increased left margin for y-axis
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container inside the scatterplot div
    const svg = d3.select("#scatterplot").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes with padding
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.PetalLength) + 0.5])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([-0.5, d3.max(data, d => d.PetalWidth) + 0.5])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.Species))
        .range(d3.schemeCategory10);

    // Add x-axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
            .ticks(8)
            .tickSize(-height)); // Add grid lines

    // Add y-axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale)
            .ticks(8)
            .tickSize(-width)); // Add grid lines

    // Style grid lines
    svg.selectAll(".tick line")
        .attr("stroke", "#e0e0e0")
        .attr("stroke-dasharray", "2,2");

    // Add circles for each data point
    svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScale(d.PetalLength))
        .attr("cy", d => yScale(d.PetalWidth))
        .attr("r", 5)
        .attr("fill", d => colorScale(d.Species));

    // Add x-axis label
    svg.append("text")
        .attr("class", "x label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 5)
        .style("text-anchor", "middle")
        .text("Petal Length");

    // Add y-axis label
    svg.append("text")
        .attr("class", "y label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .style("text-anchor", "middle")
        .text("Petal Width");

    // Add legend with adjusted position
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 10}, 0)`);

    const legendItems = legend.selectAll(".legend-item")
        .data(colorScale.domain())
        .enter().append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legendItems.append("circle")
        .attr("r", 6)
        .attr("fill", colorScale);

    legendItems.append("text")
        .attr("x", 10)
        .attr("y", 4)
        .text(d => d)
        .style("font-size", "12px");

    // Part 2.2: Side-by-side boxplot
    const boxplotMargin = { top: 20, right: 30, bottom: 40, left: 40 };
    const boxplotWidth = 600 - boxplotMargin.left - boxplotMargin.right;
    const boxplotHeight = 400 - boxplotMargin.top - boxplotMargin.bottom;

    // Create a new SVG container for the boxplot inside the boxplot div
    const boxplotSvg = d3.select("#boxplot").append("svg")
        .attr("width", boxplotWidth + boxplotMargin.left + boxplotMargin.right)
        .attr("height", boxplotHeight + boxplotMargin.top + boxplotMargin.bottom)
      .append("g")
        .attr("transform", `translate(${boxplotMargin.left},${boxplotMargin.top})`);

    // Set up scales for boxplot
    const xScaleBox = d3.scaleBand()
        .domain(data.map(d => d.Species))
        .range([0, boxplotWidth])
        .padding(0.1);

    const yScaleBox = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.PetalLength)])
        .range([boxplotHeight, 0]);

    // Add scales
    boxplotSvg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${boxplotHeight})`)
        .call(d3.axisBottom(xScaleBox));

    boxplotSvg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScaleBox));

    // Calculate quartiles
    const rollupFunction = function(groupData) {
        const values = groupData.map(d => d.PetalLength).sort(d3.ascending);
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const iqr = q3 - q1;
        return { q1, median, q3, iqr };
    };

    const quartilesBySpecies = d3.rollup(data, rollupFunction, d => d.Species);

    quartilesBySpecies.forEach((quartiles, species) => {
        const x = xScaleBox(species);
        const boxWidth = xScaleBox.bandwidth();

        // Draw vertical lines (whiskers)
        boxplotSvg.append("line")
            .attr("x1", x + boxWidth / 2)
            .attr("x2", x + boxWidth / 2)
            .attr("y1", yScaleBox(quartiles.q1 - 1.5 * quartiles.iqr))
            .attr("y2", yScaleBox(quartiles.q3 + 1.5 * quartiles.iqr))
            .attr("stroke", "black");

        // Draw box (rectangular shape)
        boxplotSvg.append("rect")
            .attr("x", x)
            .attr("y", yScaleBox(quartiles.q3))
            .attr("width", boxWidth)
            .attr("height", yScaleBox(quartiles.q1) - yScaleBox(quartiles.q3))
            .attr("fill", "lightblue");

        // Draw median line
        boxplotSvg.append("line")
            .attr("x1", x)
            .attr("x2", x + boxWidth)
            .attr("y1", yScaleBox(quartiles.median))
            .attr("y2", yScaleBox(quartiles.median))
            .attr("stroke", "black")
            .attr("stroke-width", 2);
    });

    // Add y-axis label for the boxplot
    boxplotSvg.append("text")
        .attr("class", "y label")
        .attr("transform", "rotate(-90)")
        .attr("y", -boxplotMargin.left + 20)
        .attr("x", -boxplotHeight / 2)
        .style("text-anchor", "middle")
        .text("Petal Length");
});