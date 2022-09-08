d3.csv("./data/one-year-of-recipes.csv", parseCSV).then(function (data) {

    /*
    ONE YEAR OF RECIPES FROM FOOD.COM
    Adapted from:
    https://www.kaggle.com/shuyangli94/food-com-recipes-and-user-interactions
    */
    console.log(data)


    /*
    BEGIN BY DEFINING THE DIMENSIONS OF THE SVG and CREATING THE SVG CANVAS
    */
    const width = document.querySelector("#chart").clientWidth;
    const height = document.querySelector("#chart").clientHeight;
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    /* 
    CREATE AN ARRAY OF NODES 
    
    Here, each node is a unique recipe.

    */
    let nodes = [];
    data.forEach(d => {
        let datum = {};
        datum.id = d.id;
        datum.minutes = d.minutes;
        datum.name = d.name;
        datum.tag = d.tag;
        nodes.push(datum);
    });

    console.log(nodes);
    /*
    CREATE AN ARRAY OF LINKS

    In this example, we are creating links between nodes based
    on ingredients: two recipes will be connected if
    they have at least one shared ingredient between them

    */
    let links = [];
    for (let i = 0; i < data.length - 1; i++) {
        let recipeA = data[i];
        let ingredientsA = recipeA.ingredients;
        for (let j = i + 1; j < data.length; j++) {
            let recipeB = data[j];
            let ingredientsB = recipeB.ingredients;
            let sharedIngredients = ingredientsA.filter(d => {
                return ingredientsB.includes(d);
            });
            if (sharedIngredients.length > 0) {
                links.push({ source: recipeA.id, target: recipeB.id, ingredients: sharedIngredients });
            }

        }
    }
    console.log(links);

    /*
    FILTER THE LINKS

    If we show all the links between recipes, the resulting network diagram
    is a hairball and hard to interpret;
    here, we will selectively filter out only those links where
    two recipes have more than 3 shared ingredients between them

    */
    links = links.filter(function (d) {
        return d.ingredients.length > 3;
    });


    /*
    DEFINE SCALES

    We will use these scales to control various visual features of the links and nodes:
    thickness of link, radius of circle, and color of each circle
    */

    const weightScale = d3.scaleLinear()
        .domain([4, d3.max(links, d => { return d.ingredients.length; })])
        .range([1, 10]);

    const rScale = d3.scaleSqrt()
        .domain([1, d3.max(nodes, d => { return d.minutes; })])
        .range([5, 15]);

    const colorScale = d3.scaleOrdinal(d3.schemeDark2)
        .domain(["15-minutes", "30-minutes", "60-minutes", "over60"]);

    /* INITIALIZE THE FORCE SIMULATION */
    let simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d =>  d.id))
        .force("charge", d3.forceManyBody().strength(-32))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(d => rScale(d.minutes)));

    /* DRAW THE LINKS */
    let link = svg.append("g")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
            .attr("stroke", "#CECECE")
            .attr("stroke-width", d => weightScale(d.ingredients.length));

    /* DRAW THE NODES */
    let node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("r", d => rScale(d.minutes))
            .attr("fill", d => colorScale(d.tag));

    /* TICK THE SIMULATION */
    simulation.on("tick", function() {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

    });


    /* ADD A TOOLTIP TO THE NODES */
    let tooltip = d3.select("#chart")
        .append("div")
        .attr("class","tooltip");

    node.on("mouseover", function(d) {
        let cx = d.x + 20;
        let cy = d.y - 10;

        tooltip.style("visibility", "visible")
            .style("left", cx + "px")
            .style("top", cy + "px")
            .html(d.name + "<br>" + d.minutes + " minutes");

        node.attr("opacity",0.2);
        link.attr("opacity",0.2);

        d3.select(this).attr("opacity",1);

        let connected = link.filter((e) => {
            return e.source.id === d.id || e.target.id === d.id;
        });
        connected.attr("opacity",1);
        connected.each((e) => {
            node.filter((f) => {
                return f.id === e.source.id || f.id === e.target.id;
            }).attr("opacity",1);
        });

    }).on("mouseout", function() {
        tooltip.style("visibility","hidden");
        node.attr("opacity",1);
        link.attr("opacity",1);
    });

});

/* 
CREATE A PARSE FUNCTION

Here, the parse function will only select specific columns of interest
from the CSV file (we don't need all of them!) and also extract the ingredients
list into a friendlier format
*/
function parseCSV(data) {
    let d = {};
    d.name = data.name;
    d.id = data.id;
    d.name = data.name;
    d.minutes = +data.minutes;
    d.ingredients = data.ingredients.split(",");
//grabbing value of tags column, take string value, and break it up into an array of individual values delimited by the comma that is specified

//checking to see if the tag is found somewhere in that array called tags
    let tags = data.tags.split(",");
  //console.log(tags);
    if(tags.indexOf("15-minutes-or-less") >= 0) {
        d.tag = "15-minutes";
    } else if(tags.indexOf("30-minutes-or-less") >= 0) {
        d.tag = "30-minutes";
    } else if(tags.indexOf("60-minutes-or-less") >= 0) {
        d.tag = "60-minutes";
    } else {
        d.tag = "over60";
    }
    
    return d;
}
