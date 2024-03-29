const viz = d3.select('.viz').node();

const width = viz.getBoundingClientRect().width * 90 / 100;
const height = viz.getBoundingClientRect().height * 90 / 100;

const svg = d3.select('svg').attr("width", width).attr("height", height);

var Tooltip = d3.select(".viz")
    .append("div")
    .attr("class", "tooltip")
    
var mouseover = function (d) {
    Tooltip.style("opacity", 1)
}
var mousemove = function (d) {
    Tooltip
        .html("<b>" + d.Region + ": </b></br>Magnitude: " + d.Mag + "</br>Depth: " + d.Depth + " km")
        .style("left", (d3.mouse(this)[0] + 20) + "px")
        .style("top", (d3.mouse(this)[1] + 20) + "px")
        .style("opacity", 1)
        .transition()
        .delay(2500)
        .style("opacity", 0)
        .style("left", (0) + "px")
        .style("top", (0) + "px")
}
var mouseleave = function (d) {
    Tooltip.style("opacity", 0)
}

function fill(region) {
    if (region.includes('morocco'))
        return "#c1272d"
    if (region.includes('spain'))
        return "#AD1519"
    if (region.includes('mauritania'))
        return "#00A95C"
    if (region.includes('algeria'))
        return "#FFFFFF"
    if (region.includes('portugal'))
        return "#006600"
    return "#ffffff"
}

function stroke(region) {
    if (region.includes('morocco'))
        return "#006233"
    if (region.includes('spain'))
        return "#FABD00"
    if (region.includes('mauritania'))
        return "#FFD700"
    if (region.includes('algeria'))
        return "#006633"
    if (region.includes('portugal'))
        return "#FF0000"
    return "#ffffff"
}
d3.select("#loading_screen").text('Loading map');


d3.json('https://cdn.jsdelivr.net/npm/morocco-map/data/provinces.json')
    .then(data => {
        d3.select("#loading_screen").text('Map loaded');
        const provinces = topojson.feature(data, data.objects.provinces);

        const projection = d3.geoMercator()
            .center([-10.017082026378086, 29.649726145087342])
            .scale(width > height ? height * 3 : width * 3)
            .translate([width / 2, height / 2])
        const pathGenerator = d3.geoPath().projection(projection);

        svg.selectAll('path').data(provinces.features)
            .enter().append('path')
            .attr('class', 'province')
            .attr('stroke', '#000')
            .attr('fill', '#7F8C8D')
            .attr('d', pathGenerator)
            .on("mouseleave", mouseleave)

        // Loading earthquakes:
        d3.select("#loading_screen").text('Loading data');
        d3.csv("https://raw.githubusercontent.com/wahnou/visualizations/master/earthquakes/IEB_export.csv")
        // d3.csv("IEB_export.csv")
            .then(eartquakes => {
                d3.select("#loading_screen").text('Data loaded');
                max_mag = d3.max(eartquakes, d => d.Mag)
                max_depth = d3.max(eartquakes, d => d.Depth)
                // Plot earthquakes
                svg
                    .selectAll("myCircles")
                    .data(eartquakes)
                    .enter()
                    .append("circle")
                    .attr("cx", function (d) {
                        return projection([d.Lon, d.Lat])[0]
                    })
                    .attr("cy", function (d) {
                        return projection([d.Lon, d.Lat])[1]
                    })
                    .style("fill", (d) => fill(d.Region.toLowerCase()))
                    .style("stroke", (d) => stroke(d.Region.toLowerCase()))
                    .attr("class", "earthquake")
                    .attr("depth", (d) => d.Depth)
                    .attr("stroke-width", 1)
                    .attr("fill-opacity", (d) => 1 - (d.Depth * 1 / max_depth))
                    .attr("class", (d) => d.Region.toLowerCase().replaceAll(" ", "_"))
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .attr("r", 0)


                function update() {
                    let sum = 0;
                    d3.selectAll(".checkbox").each(function (d) {
                        cb = d3.select(this);
                        grp = cb.property("value")
                        input_min_depth = d3.select("#minDepth").property("value");
                        input_max_depth = d3.select("#maxDepth").property("value");
                        input_min_mag = d3.select("#minMag").property("value");
                        input_max_mag = d3.select("#maxMag").property("value");
                        if (cb.property("checked")) {
                            svg.selectAll("[class*='" + grp + "']").transition().duration(1000).attr("r", function (d) {
                                if( 
                                    parseFloat(d.Depth) >= parseFloat(input_min_depth) &&
                                    parseFloat(d.Depth) <= parseFloat(input_max_depth) &&
                                    parseFloat(d.Mag) >= parseFloat(input_min_mag) &&
                                    parseFloat(d.Mag) <= parseFloat(input_max_mag)
                                ) {
                                    sum+=1;
                                    return d.Mag * 16 / max_mag
                                }
                                return 0
                            })

                        } else {
                            svg.selectAll("[class*='" + grp + "']").transition().duration(1000).attr("r", 0)
                        }
                    })
                    d3.select("#sum").text(sum)
                }

                d3.selectAll(".filterInput").on("change", update);
                
                update()
                d3.select("#loading_screen").style('display', 'none');

            })
    });