const margin = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
};

// Dynamically calculate width and height
const width = (window.innerWidth * 98 / 100) - margin.left - margin.right;
const height = (window.innerHeight * 98 / 100) - margin.top - margin.bottom;


// append the svg object to the body of the page
const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        `translate(${margin.left}, ${margin.top})`);

// read json data
d3.json("data.json").then(
    function (data) {

        // Give the data to this cluster layout:
        const root = d3.hierarchy(data).sum(function (d) {
            return d.value
        }) // Here the size of each leave is given in the 'value' field in input data

        // Then d3.treemap computes the position of each element of the hierarchy
        d3.treemap()
            .size([width, height])
            .paddingTop(28)
            .paddingRight(7)
            .paddingInner(0) // Padding between each rectangle
        //.paddingOuter(6)
        //.padding(20)
        (root)

        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "rgba(0, 0, 0, 0.9)")
            .style("color", "white")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("font-size", "18px")
            .style("pointer-events", "none");

        // prepare a color scale
        const colorScale = d3.scaleLinear()
            .domain([-3, -2, -1, 0, 1, 2, 3]) // Adjust range of returns as needed
            .range(["rgb(246, 53, 56)", "rgb(191, 64, 69)", "rgb(139, 68, 78)", 'rgb(65, 69, 84)',
                'rgb(53, 118, 78)', 'rgb(47, 158, 79)', 'rgb(48, 204, 90)'
            ]) // Red for negative, Blue for 0, Green for positive
            .interpolate(d3.interpolateRgb);
        const positiveColor = d3.scaleLinear()
            .domain([1000, 30, 20, 10, 0]) // Adjust range of returns as needed
            .range(["#27e60e", "#2ecc71", "#27ae60", "green", "#2980b9"])
            .interpolate(d3.interpolateRgb);
        const negativeColor = d3.scaleLinear()
            .domain([-30, -20, -10, 0]) // Adjust range of returns as needed
            .range(["red", "#c0392b", "#e74c3c", "#2980b9"])
            .interpolate(d3.interpolateRgb);

        // And a opacity scale
        const opacity = d3.scaleLinear()
            .domain([10, 30])
            .range([.5, 1])

        // use this information to add rectangles:
        svg
            .selectAll("rect")
            .data(root.leaves())
            .join("rect")
            .attr('x', function (d) {
                return d.x0;
            })
            .attr('y', function (d) {
                return d.y0;
            })
            .attr('width', function (d) {
                return d.x1 - d.x0;
            })
            .attr('height', function (d) {
                return d.y1 - d.y0;
            })
            .style("stroke", "white")
            .style("fill", function (d) {
                //return color(d.parent.data.name)
                if (d.data.return == 0)
                    return "#34495e"
                return d.data.return > 0 ? positiveColor(d.data.return) : negativeColor(d.data.return)
            })
            .style("opacity", function (d) {
                return opacity(d.data.value)
            })
            .on("mouseover", function (event, d) {
                const tooltipContent = `
                    <table>
                        <tr><td colspan="2" style="font-size: 1.5em; text-align: center;"><strong>${d.data.name}</strong></td></tr>
                        <tr><td><strong>Ticker:</strong></td><td style="text-align: right">${d.data.ticker}</td></tr>
                        <tr><td><strong>2024 Return:</strong></td><td style="text-align: right">${(d.data.return).toFixed(2).toLocaleString()} %</td></tr>
                        <tr><td><strong>Market Cap:</strong></td><td style="text-align: right">${(d.data.value).toLocaleString()} DH</td></tr>
                    </table>
                `;

                tooltip.style("visibility", "visible") // Show tooltip
                    .html(tooltipContent);
            })
            .on("mousemove", function (event) {
                const tooltipWidth = tooltip.node().offsetWidth;
                const tooltipHeight = tooltip.node().offsetHeight;

                // Calculate the position of the tooltip
                let left = event.pageX + 10;
                let top = event.pageY + 10;

                // Ensure the tooltip doesn't go out of the right edge
                if (left + tooltipWidth > window.innerWidth) {
                    left = event.pageX - tooltipWidth - 10;
                }

                // Ensure the tooltip doesn't go out of the bottom edge
                if (top + tooltipHeight > window.innerHeight) {
                    top = event.pageY - tooltipHeight - 10;
                }

                tooltip.style("top", `${top}px`)
                    .style("left", `${left}px`);
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden"); // Hide tooltip
            });

        // Add text labels
        svg.selectAll("text")
            .data(root.leaves())
            .join("text")
            .attr("x", function (d) {
                return (d.x0 + d.x1) / 2; // Center horizontally
            })
            .attr("y", function (d) {
                return (d.y0 + d.y1) / 2; // Center vertically
            })
            .text(function (d) {
                return d.data.ticker;
            })
            // .attr("font-size", "28px")
            .attr("font-size", function (d) {
                // Adjust the font size based on the width of the rect
                const width = d.x1 - d.x0;
                const height = d.y1 - d.y0;

                const fontSize = Math.max(0, Math.min(width, height) / 5); // Min font size of 12px
                return (fontSize > 10 ? fontSize : 0) + "px";
            })
            .attr("font-weight", "bold")
            .attr("fill", "white")
            .style('filter', 'drop-shadow(0px 4px 2px rgb(0 0 0 / 0.8))')
            .attr("text-anchor", "middle") // Center text horizontally
            .attr("dominant-baseline", "middle") // Center text vertically
            .on("mouseover", function (event, d) {
                const tooltipContent = `
                    <table>
                        <tr><td colspan="2" style="font-size: 1.5em; text-align: center;"><strong>${d.data.name}</strong></td></tr>
                        <tr><td><strong>Ticker:</strong></td><td style="text-align: right">${d.data.ticker}</td></tr>
                        <tr><td><strong>2024 Return:</strong></td><td style="text-align: right">${(d.data.return).toFixed(2).toLocaleString()} %</td></tr>
                        <tr><td><strong>Market Cap:</strong></td><td style="text-align: right">${(d.data.value).toLocaleString()} DH</td></tr>
                    </table>
                `;

                tooltip.style("visibility", "visible") // Show tooltip
                    .html(tooltipContent);
            })
            .on("mousemove", function (event) {
                const tooltipWidth = tooltip.node().offsetWidth;
                const tooltipHeight = tooltip.node().offsetHeight;

                // Calculate the position of the tooltip
                let left = event.pageX + 10;
                let top = event.pageY + 10;

                // Ensure the tooltip doesn't go out of the right edge
                if (left + tooltipWidth > window.innerWidth) {
                    left = event.pageX - tooltipWidth - 10;
                }

                // Ensure the tooltip doesn't go out of the bottom edge
                if (top + tooltipHeight > window.innerHeight) {
                    top = event.pageY - tooltipHeight - 10;
                }

                tooltip.style("top", `${top}px`)
                    .style("left", `${left}px`);
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden"); // Hide tooltip
            });

        // and to add the text labels
        svg
            .selectAll("vals")
            .data(root.leaves())
            .enter()
            .append("text")
            .attr("x", function (d) {
                // return d.x0 + 5
                return (d.x0 + d.x1) / 2; // Center horizontally
            }) // +10 to adjust position (more right)
            .attr("y", function (d) {
                // return d.y0 + 55
                const width = d.x1 - d.x0;
                const height = d.y1 - d.y0;

                const fontSize = Math.max(0, Math.min(width, height) / 8);

                return ((d.y0 + d.y1) / 2) + fontSize; // Center vertically
            }) // +20 to adjust position (lower)
            .text(function (d) {
                return (d.data.return > 0 ? "+" : "") + (d.data.return).toFixed(2).toLocaleString() + "%"
            })
            .attr("font-size", function (d) {
                // Adjust the font size based on the width of the rect
                const width = d.x1 - d.x0;
                const height = d.y1 - d.y0;

                const fontSize = Math.max(0, Math.min(width, height) / 15); // Min font size of 12px
                return (fontSize > 10 ? fontSize : 0) + "px";
            })
            .attr("font-weight", "bold")
            .style('filter', 'drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4))')
            .attr("fill", "white")
            .attr("text-anchor", "middle") // Center text horizontally
            .attr("dominant-baseline", "middle") // Center text vertically

            .on("mouseover", function (event, d) {
                const tooltipContent = `
                    <table>
                        <tr><td><strong>Ticker:</strong></td><td style="text-align: right">${d.data.ticker}</td></tr>
                        <tr><td><strong>Name:</strong></td><td style="text-align: right">${d.data.name}</td></tr>
                        <tr><td><strong>Return:</strong></td><td style="text-align: right">${(d.data.return).toFixed(2).toLocaleString()} %</td></tr>
                        <tr><td><strong>Value:</strong></td><td style="text-align: right">${(d.data.value).toLocaleString()} DH</td></tr>
                    </table>
                `;

                tooltip.style("visibility", "visible") // Show tooltip
                    .html(tooltipContent);
            })
            .on("mousemove", function (event) {
                const tooltipWidth = tooltip.node().offsetWidth;
                const tooltipHeight = tooltip.node().offsetHeight;

                // Calculate the position of the tooltip
                let left = event.pageX + 10;
                let top = event.pageY + 10;

                // Ensure the tooltip doesn't go out of the right edge
                if (left + tooltipWidth > window.innerWidth) {
                    left = event.pageX - tooltipWidth - 10;
                }

                // Ensure the tooltip doesn't go out of the bottom edge
                if (top + tooltipHeight > window.innerHeight) {
                    top = event.pageY - tooltipHeight - 10;
                }

                tooltip.style("top", `${top}px`)
                    .style("left", `${left}px`);
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden"); // Hide tooltip
            });

        // Add title for the 3 groups
        svg
            .selectAll("titles")
            .data(root.descendants().filter(function (d) {
                return d.depth == 1
            }))
            .enter()
            .append("text")
            .attr("x", function (d) {
                return d.x0
            })
            .attr("y", function (d) {
                return d.y0 + 21
            })
            .text(function (d) {
                return d.data.name
            })
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .attr("fill", "white")

        // Add title for the 3 groups
        svg
            .append("text")
            .attr("x", 0)
            .attr("y", 14) // +20 to adjust position (lower)
            .text(
                "Casablanca Stock Exchange categorized by sectors of activity. The size represents the market capitalization."
            )
            .attr("font-size", "20px")
            .attr("font-weight", "bold")
            .attr("fill", "white")

    })