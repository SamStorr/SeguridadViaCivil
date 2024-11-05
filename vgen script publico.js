var datasets = [
    {
        nombre: "Agresiones",
        autoridades: [["Militares", "mil"],["Guardia Nacional","GN"], ["Ejército","SD"], ["Marina", "SM"]],
        parametros: [
                    [["Agresiones","tot"],["Militares fallecidos","autF"],["Militares heridos","autH"],["Civiles fallecidos","civF"],["Civiles heridos","civH"],["Detenidos","civD"],["Letalidad","let"],]
                ],
        dataEnt: d3.csv('https://raw.githubusercontent.com/SamStorr/SeguridadViaCivil/refs/heads/main/agresiones_ent_2007-2023.csv', function(d){
            return {
                anio: +d.anio,
                cve: d.ent,
                aut: d.aut,
                tot: +d.tot,
                autF: +d.aut_fal,
                autH: +d.aut_her,
                civF: +d.civ_fal,
                civH: +d.civ_her,
                civD: +d.civ_det,
                let: d.let == "#" ? Infinity: +d.let,
            }
        }),
        dataMun: d3.csv('https://raw.githubusercontent.com/SamStorr/SeguridadViaCivil/refs/heads/main/agresiones_mun_2007-2023.csv', function(d){
            return {
                anio: +d.anio,
                ent: d.ent,
                cve: d.ent + d.mun,
                aut: d.aut,
                tot: +d.tot,
                autF: +d.aut_fal,
                autH: +d.aut_her,
                civF: +d.civ_fal,
                civH: +d.civ_her,
                civD: +d.civ_det,
                let: d.let == "#" ? Infinity: +d.let,
            }
        }),
    },
    {   nombre: "Homicidios",
        autoridades: false,
        dataEnt: d3.csv('https://raw.githubusercontent.com/SamStorr/SeguridadViaCivil/refs/heads/main/homicidios_ent_2015-2022.csv', function(d){return {
            anio: +d.anio,
            cve: d.ent,
            abs: {
                    tot: {
                        off: +d.total,
                        hom: +d.total_hom,
                        muj: +d.total_muj,
                    },
                    arm: {
                        off: +d.armas,
                        hom: +d.armas_hom,
                        muj: +d.armas_muj,
                    }
                },
                tas: {
                    tot: {
                        off: +(+d.total / +(+d.pob_total / 100000)).toFixed(2),
                        hom: +(+d.total_hom / +(+d.pob_hom / 100000)).toFixed(2),
                        muj: +(+d.total_muj / +(+d.pob_muj / 100000)).toFixed(2),
                    },
                    arm: {
                        off: +(+d.armas / +(+d.pob_total / 100000)).toFixed(2),
                        hom: +(+d.armas_hom / +(+d.pob_hom / 100000)).toFixed(2),
                        muj: +(+d.armas_muj / +(+d.pob_muj / 100000)).toFixed(2),
                    }
                }
        }}),
        dataMun:     d3.csv('https://raw.githubusercontent.com/SamStorr/SeguridadViaCivil/refs/heads/main/homicidios_mun_2015-2022.csv', function(d){return {
            anio: +d.anio,
            ent: d.geo.substring(0, 2),
            cve: d.geo,
            abs: {
                tot: {
                    off: +d.total,
                    hom: +d.total_hom,
                    muj: +d.total_muj,
                },
                arm: {
                    off: +d.armas,
                    hom: +d.armas_hom,
                    muj: +d.armas_muj,
                }
            },
            tas: {
                tot: {
                    off: +(+d.total / +(+d.pob_total / 100000)).toFixed(2),
                    hom: +(+d.total_hom / +(+d.pob_hom / 100000)).toFixed(2),
                    muj: +(+d.total_muj / +(+d.pob_muj / 100000)).toFixed(2),
                },
                arm: {
                    off: +(+d.armas / +(+d.pob_total / 100000)).toFixed(2),
                    hom: +(+d.armas_hom / +(+d.pob_hom / 100000)).toFixed(2),
                    muj: +(+d.armas_muj / +(+d.pob_muj / 100000)).toFixed(2),
                }
            }
        }
    }),
        parametros: [ // debe de conformarse a la estructura definida en dataset y ordenados
            [["Total", "abs"], ["Por cada 100 mil habitantes","tas"]],
            [['Homicidios', 'tot'],['Homicidios con arma de fuego', 'arm']],
            [['Personas', 'off'],['Mujeres', 'muj'],['Hombres', 'hom']],
        ]        
    },
]

const geoFiles =  [d3.json('https://raw.githubusercontent.com/SamStorr/SeguridadViaCivil/refs/heads/main/entidades.json'), d3.json('https://raw.githubusercontent.com/SamStorr/SeguridadViaCivil/refs/heads/main/00mun-11.json'), datasets[0].dataEnt, datasets[0].dataMun]

//Set initial parameters
var dataSelected = 0
var data = {}
var anios = []

function numberFormat(number){
    return ! (number % 1) ? d3.format(",")(number) : d3.format(",.1f")(number)
}

//current state values for highlight

var currentState = {
    nivelGeo: 0,
    cve: "00",
    anio: null,
    entidad: "República Mexicana",
    municipio: null,
    autoridad: null,
    autoridades: false,
    valueID: [],
    value: null, 
}

//area variables
var areaWidth = d3.select('#conLinea').style('width').slice(0, -2)
var areaHeight = d3.select('#conLinea').style('height').slice(0, -2)
const margin = {top: 25, right: 25, bottom: 25, left: 25}

// Add dataset selector
datasets.forEach(function(d, i){
    d3.select('#conSelData').append('div')
        .attr('id', `datSel${i}`)
        .attr('class', 'datSel')
        .text(d.nombre)
    .on('click', function(){
        Promise.all([d.dataEnt, d.dataMun]).then(output =>{
            dataSelected = i
            updateDataSel()
            data = [output[0], output[1]]
            setVar()
            updateCharts()
        })
    })
    d3.select("#anioSelector")
        .on('input', function(){
            currentState.anio = d3.select(this).property('value')
           updateSliderValue()
            updateCharts()
        })
    addFilters(d.parametros, i)
})

function updateSliderValue(){
    const slider = d3.select("#anioSelector")
    const value = slider.property('value') 
    const sliderValue = d3.select('#sliderValue')
    sliderValue.html(value)
    const percent = (value - slider.property('min')) / (slider.property('max') - slider.property('min'));
            const offset = percent * (slider.property('offsetWidth') - 40)
            console.log(offset)
            sliderValue
                .style('left', `${offset}px`)
}

updateDataSel()

// build filters when dataset is selected
function addFilters (d, index){
    const select1 = d3.select('#conParametros').append('div').attr('id', `conPara${index}`).attr('class', `conPara`)
    d.forEach((e, i) => {
        const select2 = select1.append('select').attr('name', `para${i}`).attr('class', 'selPara').attr('id', `sel${index}-${i}`)
        e.forEach(f => {
            select2.append('option').attr('value', f[1]).html(f[0])
        })
        select2.on('input', function(){
            updateCharts()
        }
    )
})
//sets listeners to selAut to update autSelected and color entidades
d3.select('#selAut').on('input', function(){
    currentState.autoridad = d3.select(this).property('value')
    updateCharts()
})
}

//Promise GeoData and first update of charts

    Promise.all(geoFiles).then(d=>{
        drawMaps(d[0], d[1])
        data = [d[2], d[3]]
        setVar()
        updateCharts()
    })

    //function to draw maps
    const mapWidth = 800;
    const mapHeight = 500;
    const initScale = 1500
    const projection = d3.geoAlbers()
    .rotate([102, 0])
    .center([0, 24.5])
    .parallels([29.5, 45.5])
    .scale(1500)
    .translate([mapWidth / 2, (mapHeight / 2)]);

    function drawMaps(ent, mun){
        const svg = d3.select('#conMapa')
        .append('svg')
        .attr('id', 'mapSVG')
        .attr('viewBox', `0 0 ${mapWidth} ${mapHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
        
        const background = svg.append("rect").attr('width', '100%').attr('height', '100%')
        .attr('fill-opacity', 0)
        .attr('name', 'México')
        .attr('id', 'oceano')
        .style('cursor', 'pointer')
        .on('click', reset)
        
        const entG = svg.append("g").attr("id", "entidades")
        const munG = svg.append("g").attr("id", "municipios")
        
        const entjson = topojson.feature(ent, ent.objects.entidades).features;
        const munjson = topojson.feature(mun, mun.objects.municipios).features;
        const path = d3.geoPath().projection(projection);    
        
        entG.selectAll("path")
        .data(entjson)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("id", d => 'shp' + d.properties.CVEGEO)
        .attr("class", "entidad")
        .attr('name', d => d.properties.NOMGEO)
        .style("stroke", "#333")
        .style("stroke-width", 0.4)
        .style("stroke-opacity", 0.5)
        .on('click', function(event, feature){
            if (feature.properties.value!==undefined)
            {entG.selectAll('path').classed('featureHover', false)
            d3.select(this).classed('featureHover', true)
            d3.select(this).raise()
            currentState.cve != feature.properties.CVEGEO ? stateClicked(event, feature) : reset()}
        })
        .on('mouseover', function(event, feature){
            if (currentState.nivelGeo == 0 && feature.properties.value !== undefined)
            {var id = feature.properties.CVEGEO
                d3.selectAll('path').classed('featureHover', false)
                d3.select(this)
                .classed('featureHover', true)
                .raise()
                var bar = d3.select(`#bar${id}`)
                bar.classed('barHover', true)
                var order = bar.style('order')
                d3.select('#barsCont').transition() 
                d3.select('#barsCont')
                .transition().delay(500).duration(1000) 
                .tween("uniquetweenname", scrollTopTween((order * 45) - 45));} 
            })
            .on('mouseout', function(event, feature){
                if (currentState.nivelGeo == 0)
                {var id = feature.properties.CVEGEO
                    d3.select(this)
                    .classed('featureHover', false)
                    var bar = d3.select(`#bar${id}`)
                    bar.classed('barHover', false)
                    d3.select('#barsCont').transition() 
                    d3.select('#barsCont')
                    .transition().delay(600).duration(1000) 
                    .tween("uniquetweenname", scrollTopTween(0)); }
                })
                ;
                
                const zoom = d3.zoom()
                .on("zoom", zoomed);
                
                svg.call(zoom);
                
                function zoomed (event){
                    svg.selectAll('path')
                    .attr("transform", event.transform);
                    svg.selectAll('rect')
                    .attr("transform", event.transform);
                    
                    var zoomLevel = +event.transform.k
                    const zoomTrigger = 2 
                    zoomLevel >= zoomTrigger && d3.selectAll('.municipio').empty() == false ? currentState.nivelGeo = 1 : currentState.nivelGeo = 0;
                    munG.style('display', zoomLevel >= zoomTrigger ? '' : 'none');
                    entG.style('opacity', currentState.nivelGeo == 1 && d3.selectAll('.municipio').empty() == false ? '50%' : '100%');
                    d3.select('#munBars').attr('class', zoomLevel >= zoomTrigger ? 'barsVisible' : 'barsHidden');
                    d3.select('#entBars').attr('class', zoomLevel >= zoomTrigger &&  currentState.nivelGeo == 1 && d3.select('#munBars').selectAll('.barGroup').empty() == false? 'barsHidden' : 'barsVisible');
                }
                
                function stateClicked (event, feature){
                    // Get the bounding box for the clicked feature

                    const bounds = path.bounds(feature);
                    
                    // Calculate the center and scale for zooming
                    const [x, y] = [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2];
                    const scale = 0.8 / Math.max((bounds[1][0] - bounds[0][0]) / mapWidth, (bounds[1][1] - bounds[0][1]) / mapHeight);
                    
                    svg.transition()
                    .duration(1000)    
                    .call(
                    zoom.transform,
                    d3.zoomIdentity.translate(mapWidth / 2, mapHeight / 2).scale(scale).translate(-x, -y),
                    d3.pointer(event, entG.node())
                    );
                    currentState.nivelGeo = 1
                    currentState.cve = feature.properties.CVEGEO
                    currentState.entidad = feature.properties.NOMGEO
                    currentState.value = feature.properties.value
                    setHighlight()
                    updateArea()
                    drawMunicipios()
                    //pauses transitions on municipios
                    d3.select('#col2').transition()
                }
                
                function reset() {
                    munG.selectAll('path').remove()
                    svg.transition()
                    .duration(1000)
                    .call(zoom.transform, d3.zoomIdentity);
                    entG.selectAll('path').style('fill-opacity', "100%")
                    currentState.nivelGeo = 0
                    currentState.cve = "00"
                    currentState.entidad = "República Mexicana"
                    setHighlight()
                    updateArea()
                    d3.selectAll('path').classed('featureHover', false)
                }
                
                function drawMunicipios(){
                    const municipios = munjson.filter(item => item.properties.CVE_ENT == currentState.cve)
                    munG.selectAll('path').remove()
                    munG.selectAll("path")
                    .data(municipios)
                    .enter().append("path")
                    .attr("d", path)
                    .attr("id", d => 'shp' + d.properties.CVEGEO)
                    .attr("class", "municipio")
                    .attr('name', d => d.properties.NOMGEO)
                    .style("fill", "red")
                    .style("stroke", "#333")
                    .style("stroke-width", 0.2)
                    .style("stroke-opacity", 0.5)
                    .on('mouseover', function(event, feature){    
                        if(feature.properties.value !== undefined)
                        {var id = feature.properties.CVEGEO
                        d3.select(this)
                        .classed('featureHover', true)
                        .raise()
                        var bar = d3.select(`#bar${id}`)
                        bar.classed('barHover', true)
                        var order = bar.style('order')
                        d3.select('#barsCont').transition() 
                        d3.select('#barsCont')
                        .transition().delay(500).duration(1000) 
                        .tween("uniquetweenname", scrollTopTween((order * 45) -100));}})
                    .on('mouseout', function(event, feature){
                        var id = feature.properties.CVEGEO
                        if(currentState.cve !== id){
                            d3.select(this)
                        .classed('featureHover', false)
                        }
                        var bar = d3.selectAll('.barGroup')
                        bar.classed('barHover', false)
                        d3.select('#barsCont').transition() 
                        d3.select('#barsCont')
                        .transition().delay(600).duration(1000) 
                        .tween("uniquetweenname", scrollTopTween(0));})
                    .on('click', function(event, feature){
                        if (feature.properties.value!==undefined)
                        {munG.selectAll('path').classed('featureHover', false)
                        d3.select(this).classed('featureHover', true).raise()
                        currentState.nivelGeo = 2
                        currentState.municipio = feature.properties.NOMGEO
                        currentState.cve = feature.properties.CVEGEO
                        setHighlight()
                        updateArea()
                    }
                    });
                    
                    colorShapes(data[1], 'municipio')
                    
                    updateBars('municipio')
                    }

const lineSVG = d3.select('#conLinea').append('svg')
    .attr('id', 'lineSVG')
    .attr('viewBox', `0 0 ${areaWidth} ${areaHeight}`)
    .attr("transform", `translate(${margin.left},${margin.top})`)

    const linesGroup = lineSVG
    .append('g').attr('class', 'linesGroup')
    .attr("transform", `translate(${margin.left},${margin.top})`)

lineSVG.append('text')
.attr('id', 'area-title')
.attr("transform", `translate(${0},${areaHeight})`)

const xAxisGroup = lineSVG.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(${margin.left},${areaHeight - margin.bottom})`)
        .attr('color', '#ffffff')
        .attr('font-size', '0.7em')

const lineG = lineSVG.append('g')
.attr("transform", `translate(${margin.left},${margin.top})`)

const circleGroup = lineG.append("g")
.attr("class", "circleGroup")

const rectGroup = lineG.append("g")
.attr("class", "rectGroup") 

const labelGroup = lineG.append("g")
.attr("class", "labelGroup")  

const legend = lineSVG.append('g')
.attr("id", "legend")

}

// update Charts - runs at start or when new data is selected

function updateCharts(){

    if (currentState.nivelGeo == 0) {
        colorShapes(data[0], 'entidad')
        updateBars('entidad') 
    }
    else{colorShapes(data[0], 'entidad')
    colorShapes(data[1], 'municipio')
    updateBars('entidad') 
    updateBars('municipio')}
    setHighlight()
    updateArea()
}

//when dataset changes need to check or reinitialize variables
function setVar(){
    //get range of years and change current year selected if not available
        anios = d3.extent(data[0].map(d => d.anio))
        
        if (currentState.anio < anios[0] || currentState.anio > anios[1]){
            currentState.anio = anios[1]
        } 
        d3.select('#anioSelector')
            .attr('min', anios[0])
            .attr('max', anios[1])
            .attr('value', currentState.anio)

        updateSliderValue()

    // get authorities and change if current authority is not available, if aut is NA then set to hidden, else visible

        currentState.autoridades = datasets[dataSelected].autoridades
        const autSel = d3.select('#selAut').selectAll('option')
        const getAutSel = d3.select('#selAut')

        autSel.remove()
        if (currentState.autoridades == false) {getAutSel.style('display', 'none')}
        else {
            getAutSel.style('display', '')
            getAutSel.selectAll('option').remove()
            currentState.autoridades.forEach(a => {
            getAutSel.append('option').attr('value', a[1]).html(a[0])
            })

            const valueList = currentState.autoridades.map(d => d [1])
            if (valueList.includes(currentState.autoridad)){
                getAutSel.property('value',currentState.autoridad)
            }
            else {
                currentState.autoridad = valueList[0]
                getAutSel.property('value', currentState.autoridad)
            }  
}
    //get Parametros
    currentState.parametros = datasets[dataSelected].parametros
}


// used to update style of data selectors
function updateDataSel(){
    d3.selectAll('.datSel').classed('active', false)
        d3.select(`#datSel${dataSelected}`).classed('active', true)
        d3.selectAll('.conPara').style('display', 'none')
        d3.select(`#conPara${dataSelected}`).style('display', '')
}


// Takes ent or mundata as input, requires CVE, checks if dataset has authority, filters by anio and authority, then iterates through all the selected parameters to get values mapped to each entidad
function getGeoData (input, target){
    //for each of the parameters in the selected datasets, retrieves the value from the current filter settings and stores in array aP
    currentState.valueID = currentState.parametros.map((d,i) => d3.select(`#sel${dataSelected}-${i}`).property('value')) 

    currentState.valueNames = currentState.valueID.map((d,i) => {
        var name = currentState.parametros[i].find(e => e[1] == d)
        return name[0]
    })

    //constant to store true/false value for authorities in dataset
        const dataCon = {}
        var dataMax = 0
        //filters by authorities if needed
        currentState.autoridades !== false ? input = input.filter(d => d.aut == currentState.autoridad) : input = input
        // if filtering municipal data, ensures only data for that state is included
        currentState.cve !== "00" ? input = input.filter(d => d.ent == currentState.cve.slice(0,2) || d.cve.length !== 5) : input = input
input.map(e => {
            a = e
            //iterates through parameters to reach value stored
            currentState.valueID.forEach(f => {
                a = a[f]
            })
            if(a > dataMax && e.cve !== '00' && a !== Infinity){dataMax = a}
            if(e.anio == currentState.anio && a !== 0){dataCon[e.cve] = a}
        })

        if (currentState.nivelGeo !== 2 && target == 'entidad'){
            var val = dataCon[currentState.cve]
            if (val == undefined){val = 0}
            currentState.value = val
        }
        else if(currentState.nivelGeo == 2 && target == 'municipio'){
            var val = dataCon[currentState.cve]
            if (val == undefined){val = 0}
            currentState.value = val
        }

        return [dataCon, dataMax] 
        
    }

//each time data source or a parameter other than año is changed, get the max and minimum values for the data at state and 

var municipioMax
var entidadMax

function colorShapes(input, target){
    input = getGeoData(input, target)
    const max = input[1]
    target == 'municipio' ? municipioMax = max : entidadMax = max
    const areaData = input[0]
    var mapScale = d3.scaleSequential(d3.interpolateGnBu)
        .domain([0.1, max])

    d3.selectAll(`.${target}`).each(function(d){
    d3.select(this).classed('shpActive', true)
    var value = areaData[d.properties.CVEGEO]
    var id = d.properties.CVEGEO
    var color
    if(value == undefined){color = 'darkgray'; d3.select(this).classed('shpActive', false)}
    else if(value == Infinity){color = 'darkred'}
    else {color = mapScale(value)}
    d3.select(this).style('fill', color)
    d.properties.color = color
    d.properties.value = value
})
}

function updateBars(nivel){

var barGraph = d3.select(`#${nivel.slice(0, 3)}Bars`)
var barData = []
var values = []

d3.selectAll(`.${nivel}`).each(d => {
    var object = {
        CVE: d.properties.CVEGEO,
        nom: d.properties.NOMGEO,
        color: d.properties.color,
        value: d.properties.value,
    }
   barData.push(object)
})

barData = barData.filter(d => d.value !== undefined).sort((a, b) => b.value - a.value)

var barMax

nivel == 'municipio' ? barMax = municipioMax : barMax = entidadMax 

d3.select('#col3').property('scrollTop', 0)
    
        const x = d3.scaleLinear()
        .domain([0, barMax])
        .range([0, 100]);
    
    const y = d3.scaleBand()
        .domain(barData.map(d => d.CVE))
        .range([(barData.length * 40), 0])
    
    const bars = barGraph.selectAll(".barGroup")
        .data(barData, d => d.CVE)
    

    bars.exit().remove()

    bars.style('order', d => barData.indexOf(d))
    
    bars.select('.bar')
        .transition().duration(1000)
        .style("width", d => d.value == Infinity ? '15px' :`${x(d.value)}%`)
        .style('background-color', d => d.color)
        .style('justify-content', d => x(d.value) > 85 ? 'end' : 'start')
        .select('span')
            .text(d => d.value == Infinity ? 'Sin civiles heridos': numberFormat(d.value));
    
    const enterBars = bars.enter()
        .append("div")
                .attr("class", "barGroup")
                .attr('id', d => `bar${d.CVE}`)
                .style('order', d => barData.indexOf(d))
                .on('mouseover', function(){
                    d3.select(this).classed('barHover', true)
                    var CVE = d3.select(this).attr('id').slice(3)
                    d3.select(`#shp${CVE}`)
                        .classed("featureHover", true)
                        .raise()
                })
                .on('mouseout', function(){
                    d3.select(this).classed('barHover', false)
                    var CVE = d3.select(this).attr('id').slice(3)
                    d3.select(`#shp${CVE}`)
                        .classed("featureHover", false)
                })
                .on('click', function(){
                    var CVE = d3.select(this).attr('id').slice(3)
                })
                
        
        enterBars.append("div")
            .attr('class', 'bartext')
            .text(d => d.nom)
            .style('font-family', 'sans-serif')
        
            enterBars.append("div")
                .attr("class", "bar")
                .style("height", "15px")
                .style("width", d => d.value == Infinity ? '15px' :`${x(d.value)}%`)
                .style('background-color', d => d.color)
                .style('justify-content', d => x(d.value) > 85 ? 'end' : 'start')
                    .style('color', 'white')
                    .append('span').classed('barValue', true)
                    .style('margin-left', '100%')
                    .text(d => d.value == Infinity ? 'Sin civiles heridos': numberFormat(d.value));

                }
    
    
    function scrollTopTween(scrollTop) { 
        return function() { 
            var i = d3.interpolateNumber(this.scrollTop, scrollTop); 
            return function(t) { this.scrollTop = i(t); }; 
        }; 
    } 

function setHighlight(){

    var text4a = ""
    var text4b = currentState.valueNames !== undefined ? currentState.valueNames.join(', '): ""
    var autSelected = d3.select('#selAut').property('value')
    currentState.autoridades !== false ? text4a = currentState.autoridades.find(d => d[1] == autSelected)[0] + ": ": text4a =  ""

    var val
    currentState.value == Infinity ? val = "Sin heridos" : val = numberFormat(currentState.value)

    d3.select('#text1').html(`${currentState.nivelGeo !== 2 ? currentState.entidad: currentState.municipio}`)
    d3.select('#text2').html(`${currentState.nivelGeo == 2 ? currentState.entidad: ""}`)
    d3.select('#text3a').html(`${currentState.anio}: `)
    d3.select('#text3b').html(`${val}`)
    d3.select('#text4').html((text4a + text4b).toUpperCase())
}


function updateArea(){

    const g = d3.select('#areaG')
    var input
    currentState.nivelGeo !== 2 ? input = data[0].filter(d => d.cve == currentState.cve) : input = data[1].filter(d => d.cve == currentState.cve)

    var anioArray = []
    for(i = anios[0]; i <= anios[1]; i++){
        anioArray.push(i)
    }

    var areaData = []

    var lineSelected
    var seriesNames

    if (currentState.autoridades == false) {
        slicerLevel = currentState.parametros.length - 1
        seriesNames = currentState.parametros[slicerLevel]
        lineSelected = currentState.valueID[slicerLevel]
        seriesNames.forEach(d => {
            series = {nombre: d[0],
                id: d[1],
                values: [],
            }

            anioArray.forEach(a => {
                var filter = input.find(i => i.anio == a)
                if (filter == undefined){filter = 0}
                else{
                    currentState.valueID.slice(0, -1).forEach(v => {
                        filter = filter[v]
                    })
                    filter = filter[d[1]]
                }
                filter == undefined ? filter = 0 : filter = filter
        object = {
            anio: a,
            value: filter,
        }
        series.values.push(object)
            }
            )

            areaData.push(series)
        })
    }
    else {
        seriesNames = currentState.autoridades.map(d => d[0])
        currentState.autoridades.forEach(d => {
        series = {values: []}
        lineSelected = currentState.autoridad
        series.nombre = d[0]
        series.id = d[1]
        anioArray.forEach(a => {
        var filter = input.find(i => i.aut == d[1] && i.anio == a)
        if (filter == undefined){filter = 0}
        else
        {currentState.valueID.forEach(v => {
            filter = filter[v]
        })}
        filter == undefined ? filter = 0 : filter = filter
        object = {
            anio: a,
            value: filter,
        }
        series.values.push(object)
        })
        areaData.push(series
        )
    })
    }
   
    var xScale = d3.scaleLinear()
    .range([0, areaWidth- margin.left - margin.right])
    .domain(anios)
    
    const xAxis = d3.axisBottom()
                   .scale(xScale)
                   .ticks(anioArray.length)
                   .tickFormat(d3.format("d"))

    d3.select('.x-axis').transition().call(xAxis)
    
    console.log(areaData)

    var yMaxes = []
    areaData.forEach(d => {

        yMaxes.push(d3.max(d.values, e => {
            if (e.value !== Infinity){
                return e.value
            }
        }))
    })

    const yScaleConst = d3.scaleLinear()
    .range([areaHeight - margin.top - margin.bottom, 0])
    .domain([0, d3.max(yMaxes)])

    function yScale(input){
        var store 
        input == Infinity ? store = yScaleConst(0) : store = yScaleConst(input)
        return store
    }

    var seriesNames = areaData.map(function(d){ return d.nombre})


    const color = d3.scaleOrdinal()
    .domain(seriesNames)
    .range(d3.schemeDark2);


    const legendItems = d3.select('#legend')
        .selectAll('.legend-item')
        .data(seriesNames, d => d)

        const legendEnter = legendItems.enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendEnter.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 12)
        .attr('height', 12)
        .attr('rx', 2)
        .attr('fill', d => color(d));

    legendEnter.append('text')
        .attr('x', 20)
        .attr('y', 7)
        .attr('dy', '0.35em')
        .text(d => d);

    // Merge enter and update selections
    legendItems.merge(legendEnter)
        .select('rect')
        .transition()
        .duration(500)
        .attr('fill', d => color(d));

    legendItems.merge(legendEnter)
        .select('text')
        .text(d => d);

    // Remove old legend items
    legendItems.exit().remove();

    // Define the line generator
    const line = d3.line()
        .x(d => xScale(d.anio))
        .y(d => yScale(d.value));


const lines = d3.select('.linesGroup')
    .selectAll('.line')
    .data(areaData, d => d.nombre)

    lines.transition().duration(1000)
    .attr("d", d => line(d.values))
    .attr("stroke", d => color(d.nombre));

    lines.enter().append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("stroke", d => color(d.nombre))
            .attr("d", d => line(d.values))

    lines.exit().transition().duration(1000).attr("opacity", 0).remove()


var circleData = areaData.flatMap(d => d.values.map(value => ({ ...value, nombre: d.nombre, id: d.id})))


const circles = d3.select('.circleGroup')
.selectAll('.lineCircle')
.data(circleData)

circles.enter().append('circle')
    .attr('class', 'lineCircle')
    .classed(d => d.id, true)
    .attr('r', 3)
    .attr("cx", d => xScale(d.anio))
    .attr("cy", d => yScale(d.value))
    .attr("fill", d => color(d.nombre))

const circleUpdate = d3.selectAll('.lineCircle')
    .data(circleData, d => d.nombre)

circles.transition().duration(1000)
    .attr("cx", d => xScale(d.anio))
    .attr("cy", d => yScale(d.value))
    .attr("fill", d => color(d.nombre))

circles.exit().remove()

const labelData = circleData.filter(d => d.id == lineSelected)


const rects = d3.select('.rectGroup')
.selectAll('.labelRect')
.data(labelData)

const charWidth = 11

function getLabelText(input){
    var store
    input == Infinity ? store = "NA" : store = numberFormat(input)
    return store
}

rects.enter().append('rect')
.attr("class", "labelRect")
    .attr("x", d => xScale(d.anio) - (getLabelText(d.value).length * charWidth) / 2) // Center rect around point
    .attr("y", d => yScale(d.value) - 25) // Position above the point
    .attr("width", d => getLabelText(d.value).length * charWidth)
    .attr("height", 20)
    .attr('rx', 2)
    .attr("fill", d => color(d.nombre))
    .attr("opacity", 0.8);

const rectUpdate = d3.selectAll('.labelRect')
    .data(labelData, d => d.nombre)

rects.transition().duration(1000)
.attr("x", d => xScale(d.anio) - (getLabelText(d.value).length * charWidth) / 2) // Center rect around point
    .attr("y", d => yScale(d.value) - 25) // Position above the point
    .attr("width", d => getLabelText(d.value).length * charWidth)
    .attr("height", 20)
    .attr('rx', 2)
    .attr("fill", d => color(d.nombre))

rects.exit().remove()


const labels = d3.select('.labelGroup')
.selectAll('.label')
.data(labelData)

labels.enter().append('text')
.attr("class", "label")
    .attr("x", d => xScale(d.anio))
        .attr("y", d => yScale(d.value) - 10)
        .attr("text-anchor", "middle")
        .text(d => getLabelText(d.value))
        .attr("fill", "white")
        .attr("font-size", "14px")
        .attr("font-family", "Roboto")

const labelUpdate = d3.selectAll('.label')
    .data(labelData, d => d.nombre)

labels.transition().duration(1000)
    .attr("y", d => yScale(d.value) - 10)
    .attr("x", d => xScale(d.anio))
        .text(d => getLabelText(d.value))

labels.exit().remove()

}
