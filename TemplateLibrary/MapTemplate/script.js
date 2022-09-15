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
    
    let nested = d3.nest()
        .key(d=>d.state)
        .key(d => d.county)
        .rollup(v => v.length)
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
                if(name === p.key && state === v.key) {
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

    //COLOR SCALE
    const color = d3.scaleSequential()
        .interpolator(d3.interpolatePlasma)
        .domain([d3.max(mergedArr, d => d.perCapita),-0.0005])

    /*
    DEFINING THE DIMENSIONS OF THE SVG and CREATING THE SVG CANVAS
    */
    const width = document.querySelector("#chart").clientWidth;
    const height = document.querySelector("#chart").clientHeight;
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);


    /*
    MAKE THE BASE MAP
    */

    let path = d3.geoPath();
    let g = svg.append("g").attr("transform", `translate(100,100)`)


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

