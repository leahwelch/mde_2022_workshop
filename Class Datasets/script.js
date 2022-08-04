d3.csv("./data/US_Textile_Fiber_Trade.csv").then(function (data) {
    console.log(data);

    // //before we create our distribution, we need to set the xScale based on the possible values
    // const xScale = d3.scaleLinear()
    //     .domain([0, d3.max(data, d => d.value)])

    // //we need to create a binned dataset using the d3.histogram() method
    // const histogramValues = d3.histogram()
    //     .value(d => d.value) //sets the distribution based on a dimension of the data - value
    //     .domain(xScale.domain()) //based on the xScale
    //     .thresholds(xScale.ticks(100)) //how many bins

    // const bins = histogramValues(data)
    // console.log(bins)

});

//get the data in the right format
function parse(d) {
    return {
        fiber_type: d.fiber_type, //cotton, silk, wool, etc.
        import_export: d.import_export, //this is a binary value
        category: d.category, //yarn, apparel, home, etc.
        sub_category: d.sub_category, //type of yarn, type of home
        year: +d.year, //we want this as a number
        month: +d.month, //we want this as a number
        value: +d.value //we want this as a number
    }
}

