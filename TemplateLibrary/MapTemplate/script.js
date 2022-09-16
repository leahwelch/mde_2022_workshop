/*
DEFINING THE DIMENSIONS OF THE SVG and CREATING THE SVG CANVAS
*/
const mapWidth = document.querySelector("#chart").clientWidth;
const mapHeight = document.querySelector("#chart").clientHeight;
const margin = { top: 50, left: 150, right: 50, bottom: 150 };
const svg = d3.select("#chart")
    .attr("width", mapWidth)
    .attr("height", mapHeight);

// HELPER FUNCTION TO HANDLE DIFFERENT NAMING CONVENTIONS FOR STATES
const TO_NAME = 1;
const TO_ABBREVIATED = 2;

function convertRegion(input, to) {
    var regions = [
        ['Alabama', 'AL'],
        ['Alaska', 'AK'],
        ['American Samoa', 'AS'],
        ['Arizona', 'AZ'],
        ['Arkansas', 'AR'],
        ['Armed Forces Americas', 'AA'],
        ['Armed Forces Europe', 'AE'],
        ['Armed Forces Pacific', 'AP'],
        ['California', 'CA'],
        ['Colorado', 'CO'],
        ['Connecticut', 'CT'],
        ['Delaware', 'DE'],
        ['District Of Columbia', 'DC'],
        ['Florida', 'FL'],
        ['Georgia', 'GA'],
        ['Guam', 'GU'],
        ['Hawaii', 'HI'],
        ['Idaho', 'ID'],
        ['Illinois', 'IL'],
        ['Indiana', 'IN'],
        ['Iowa', 'IA'],
        ['Kansas', 'KS'],
        ['Kentucky', 'KY'],
        ['Louisiana', 'LA'],
        ['Maine', 'ME'],
        ['Marshall Islands', 'MH'],
        ['Maryland', 'MD'],
        ['Massachusetts', 'MA'],
        ['Michigan', 'MI'],
        ['Minnesota', 'MN'],
        ['Mississippi', 'MS'],
        ['Missouri', 'MO'],
        ['Montana', 'MT'],
        ['Nebraska', 'NE'],
        ['Nevada', 'NV'],
        ['New Hampshire', 'NH'],
        ['New Jersey', 'NJ'],
        ['New Mexico', 'NM'],
        ['New York', 'NY'],
        ['North Carolina', 'NC'],
        ['North Dakota', 'ND'],
        ['Northern Mariana Islands', 'NP'],
        ['Ohio', 'OH'],
        ['Oklahoma', 'OK'],
        ['Oregon', 'OR'],
        ['Pennsylvania', 'PA'],
        ['Puerto Rico', 'PR'],
        ['Rhode Island', 'RI'],
        ['South Carolina', 'SC'],
        ['South Dakota', 'SD'],
        ['Tennessee', 'TN'],
        ['Texas', 'TX'],
        ['US Virgin Islands', 'VI'],
        ['Utah', 'UT'],
        ['Vermont', 'VT'],
        ['Virginia', 'VA'],
        ['Washington', 'WA'],
        ['West Virginia', 'WV'],
        ['Wisconsin', 'WI'],
        ['Wyoming', 'WY'],
    ];

    var i; // Reusable loop variable
    if (to == TO_ABBREVIATED) {
        input = input.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
        for (i = 0; i < regions.length; i++) {
            if (regions[i][0] == input) {
                return (regions[i][1]);
            }
        }
    } else if (to == TO_NAME) {
        input = input.toUpperCase();
        for (i = 0; i < regions.length; i++) {
            if (regions[i][1] == input) {
                return (regions[i][0]);
            }
        }
    }
}

function legend({
    color,
    title,
    tickSize = 6,
    width = 320,
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16 + tickSize,
    marginLeft = 10,
    ticks = width / 64,
    tickFormat,
    tickValues
} = {}) {

    let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x;

    // Continuous
    if (color.interpolate) {
        const n = Math.min(color.domain().length, color.range().length);

        x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));

        svg.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
    }

    // Sequential
    else if (color.interpolator) {
        x = Object.assign(color.copy()
            .interpolator(d3.interpolateRound(marginLeft, width - marginRight)), {
            range() {
                return [marginLeft, width - marginRight];
            }
        });

        svg.append("image")
            .attr("x", marginLeft)
            .attr("y", mapHeight - margin.bottom)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.interpolator()).toDataURL());

        // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
        if (!x.ticks) {
            if (tickValues === undefined) {
                const n = Math.round(ticks + 1);
                tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
            }
            if (typeof tickFormat !== "function") {
                tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
            }
        }
    }

    // Threshold
    else if (color.invertExtent) {
        const thresholds = color.thresholds ? color.thresholds() // scaleQuantize
            :
            color.quantiles ? color.quantiles() // scaleQuantile
                :
                color.domain(); // scaleThreshold

        const thresholdFormat = tickFormat === undefined ? d => d :
            typeof tickFormat === "string" ? d3.format(tickFormat) :
                tickFormat;

        x = d3.scaleLinear()
            .domain([-1, color.range().length - 1])
            .rangeRound([marginLeft, width - marginRight]);

        svg.append("g")
            .selectAll("rect")
            .data(color.range())
            .join("rect")
            .attr("x", (d, i) => x(i - 1))
            .attr("y", mapHeight - margin.bottom)
            .attr("width", (d, i) => x(i) - x(i - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", d => d);

        tickValues = d3.range(thresholds.length);
        tickFormat = i => thresholdFormat(thresholds[i], i);
    }

    // Ordinal
    else {
        x = d3.scaleBand()
            .domain(color.domain())
            .rangeRound([marginLeft, width - marginRight]);

        svg.append("g")
            .selectAll("rect")
            .data(color.domain())
            .join("rect")
            .attr("x", x)
            .attr("y", mapHeight - margin.bottom)
            .attr("width", Math.max(0, x.bandwidth() - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", color);

        tickAdjust = () => { };
    }

    svg.append("g")
        .attr("transform", `translate(0,${mapHeight - margin.bottom + 10})`)
        .call(d3.axisBottom(x)
            .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
            .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
            .tickSize(tickSize)
            .tickValues(tickValues))
        .call(tickAdjust)
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", marginLeft)
            .attr("y", marginTop + marginBottom - height - 6)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text(title));

    return svg.node();
}

function ramp(color, n = 256) {
    var canvas = document.createElement('canvas');
    canvas.width = n;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
        context.fillStyle = color(i / (n - 1));
        context.fillRect(i, 0, 1, 1);
    }
    return canvas;
}



/*
LOADING DATA FROM MULTIPLE FILES

To load data from multiple files using d3.csv(), d3.json(), etc.,
we create an array, the items of which are defined by what's returned
by those functions. It's like we're calling those functions separately
and then placing their returned values in an array for later use.
*/
var promises = [

    /*
    US Places of Worship, 2019
    Adapted from:
    https://data.world/awram/us-places-of-worship
    */
    d3.csv("./data/places_of_worship.csv", parse),
    /*
    US Atlas TopoJSON
    https://github.com/topojson/us-atlas/blob/master/README.md#counties-10m.json
    */
    d3.json("./data/counties-albers-10m.json"),
    /*
    US County Populations, 2010-2019
    https://www.census.gov/data/datasets/time-series/demo/popest/2010s-counties-total.html
    */
    d3.csv("./data/popData.csv", parsePop)
];

/*
PROMISE.ALL()

After we have created our array of promises, we can ask the browser
to wait until all file loading functions are complete before doing
anything with them -- using the Promise.all() construction.
*/
Promise.all(promises).then(function (data) {

    /*
    The data from each file loaded above are stored in an array 
    named `data` (at least, that's what we've named it here!).

    We can access the individual files' data by index position 
    inside that array.
    */

    console.log(data);

    //DEFINING DATA VARIABLES
    const worshipData = data[0];
    worshipData.forEach((d) => {
        if (isNaN(d.members)) {
            d.members = 0;
        }
    })
    console.log(worshipData)

    let nested = d3.nest()
        .key(d => d.state)
        .key(d => d.county)
        .rollup(d => d3.sum(d, g => g.members))
        .entries(worshipData)


    const counties = topojson.feature(data[1], data[1].objects.counties)
    const states = topojson.feature(data[1], data[1].objects.states)

    counties.features.forEach((d) => {
        d.countyName = d.properties.name.toUpperCase();
    })

    const populationData = data[2]

    //USE MAP() TO BRING THE POPULATION DIMENSION INTO THE TOPOJSON DATA USING THE COUNTY ID
    const map = new Map();
    counties.features.forEach(item => map.set(item.id, item));
    populationData.forEach(item => map.set(item.countyID, { ...map.get(item.countyID), ...item }));
    const mergedArr = Array.from(map.values());

    //CREATE THE PLACES OF WORSHIP PER CAPITA DIMENSION, BINDING THE NESTED PLACES OF WORSHIP DATA TO THE TOPOJSON
    //SINCE THERE IS AT LEAST 1 COUNTY NAME THAT EXISTS IN MULTIPLE STATES, WE NEED TO CHECK IF THE STATE AND COUNTY ARE THE SAME
    mergedArr.forEach((d) => {
        let name = d.countyName;
        let state = d.state;
        nested.forEach((v) => {
            v.values.forEach((p) => {
                if (name === p.key && state === v.key) {
                    d.value = p.value
                }
            })

        })
        d.perCapita = d.value / d.pop;
        if (isNaN(d.perCapita)) {
            d.perCapita = 0;
        }
    })
    console.log(mergedArr)

    const max = d3.max(mergedArr, d => d.perCapita);
    const min = d3.min(mergedArr, d => d.perCapita);


    //COLOR SCALE
    const color = d3.scaleSequential()
        .interpolator(d3.interpolateCividis)
        .domain([min, max])

    legend({
        color: d3.scaleSequential([min, max], d3.interpolateCividis),
        title: "Membership Per Capita"
    })

    /*
    MAKE THE BASE MAP
    */

    let path = d3.geoPath();
    let g = svg.append("g")
        .attr("transform", "translate(100,100)")
        .attr("transform", "scale(0.9)")


    // Bind TopoJSON data
    g.selectAll("path")
        .data(mergedArr) // Bind TopoJSON data elements
        // pass through what objects you want to use -- in this case we are doing county lines
        .enter().append("path")
        .attr("d", path)
        .style("fill", d => color(d.perCapita))

    //ADD THE STATE BOUNDARIES IN
    g.append("path")
        .datum(topojson.mesh(data[1], data[1].objects.states, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("d", path);


});



/* 
CREATE PARSE FUNCTIONS

*/


function parse(d) {
    return {
        id: d.ID,
        subtype: d.SUBTYPE,
        name: d.NAME,
        members: +d.MEMBERS,
        longitude: +d.X,
        latitude: +d.Y,
        county: d.COUNTY,
        state: convertRegion(d.STATE, TO_NAME)
    }
}

function parsePop(d) {
    return {
        countyID: d.STATE.concat(d.COUNTY),
        pop: +d.POPESTIMATE2019,
        state: d.STNAME
    }
}

