// Create the 'basemap' tile layer that will be the background of our map.
var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Create the 'grayscale' tile layer as a second background of the map
var grayscale =  L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});

// Adding salellite layer 
var satellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'jpg'
});

// adding topographic layer 
var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// adding USGS Map
var USGS_USImageryTopo = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}', {
	maxZoom: 20,
	attribution: 'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
});
// Make a basement Object
let basemaps = {
  "Default": defaultMap,
  "GrayScale": grayscale, 
  "Satellite Map": satellite,
  "Topographic Map": OpenTopoMap,
  "USGS Topography": USGS_USImageryTopo
};
// Create the map object with center and zoom options.
var myMap = L.map("map", {
  center: [36.7783, -119.4179],
  zoom: 5,
  layers: [defaultMap],
  zoomControl: false
});
L.control.zoom({
  position: "topleft" 
}).addTo(myMap);
// add the 'basemap' tile layer to the map.
defaultMap.addTo(myMap);


// get the data from tectonic plate 
// declare variable to hold the tectonic plates layer 
let tectonicplates = new L.layerGroup();

// call the api to get the info for the tectonic layer
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/refs/heads/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
  //console.log(plateData); // chekcing if the data load 
  L.geoJson(plateData, {
    style: {
      color: "orange",
      weight: 2
    }
  }).addTo(tectonicplates);  
});
tectonicplates.addTo(myMap)

// create a variable to store the earthquake data layer 
let earthquakes = new L.layerGroup();
// Function to determine the color of a data point based on earthquake depth
/*function getColor(depth) {
  return depth > 90 ? "#ff0000" :
         depth > 70 ? "#ff6600" :
         depth > 50 ? "#ffcc00" :
         depth > 30 ? "#ccff33" :
         depth > 10 ? "#66ff66" :
                      "#00ff00";
} */
// Make a request that retrieves the earthquake geoJSON data.
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(
  function (earthquakeData){
  console.log(earthquakeData);
  // a function that chooses the color of the data point 
  function dataPointColor(depth){
    return depth > 90 ? "#ff0000" :
           depth > 70 ? "#ff6600" :
           depth > 50 ? "#ffcc00" :
           depth > 30 ? "#ccff33" :
           depth > 10 ? "#66ff66" :
                        "#00ff00";
  }

  // make a funciton that determines the size of the radius 
  function radiusSize(mag){
    if (mag == 0)
      return 1; // makes sure that a 0 mag earthquake shows up
    else 
    return mag * 5; // makes sure that the circle is pronounced in the map 
  }

  //add style to each datapoint 
  function dataStyle(feature)
  {
    return {
      opacity: 0.5, 
      fillOpacity: 0.7, 
      fillColor: dataPointColor(feature.geometry.coordinates[2]), 
      color: "#000000", 
      radius: radiusSize(feature.properties.mag),
      weight: 0.5
    }

  }

  // add the GeoJson data 
  L.geoJson(earthquakeData, {
    // make each feature a marker that is on the map
    pointToLayer: function(feature, latLng) {
      return L.circleMarker(latLng);
    }, 
    // set the style for eachmarker
    style: dataStyle,
    // add pipups 
    onEachFeature: function(feature, layer){
      var popupContent = `
            <h3>Earthquake Details</h3>
            <p><strong>Magnitude:</strong> ${feature.properties.mag}</p>
            <p><strong>Location:</strong> ${feature.properties.place}</p>
            <p><strong>Depth:</strong> ${feature.geometry.coordinates[2]} km</p>
      `;
      layer.bindPopup(popupContent);
    }

  }).addTo(earthquakes)
}

);
earthquakes.addTo(myMap);
// Add a control to the map that will allow the user to change which layers are visible.
let overlays = {
  "Tectonic Palates": tectonicplates,
  "Earthquake Data": earthquakes
};
L.control
  .layers(basemaps, overlays)
  .addTo(myMap);

// Create a legend control 
let legend = L.control({position: 'bottomright'});
// Legend content 
legend.onAdd = function () {
  let div = L.DomUtil.create('div', 'info legend');
  let depths = [-10, 10, 30, 50, 70, 90];
  let colors = [
        "#00ff00",  
        "#66ff66",  
        "#ccff33",  
        "#ffcc00",  
        "#ff6600",  
        "#ff0000"  
  ];
// Loop through depth intervals to generate a label with a colored square for each
for (let i = 0; i < depths.length; i++) {
  div.innerHTML += 
      '<i style="background:' + colors[i] + '; width: 18px; height: 18px; display: inline-block; margin-right: 5px;"></i> ' + 
      depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] + ' km<br>' : '+ km');
}

return div;
};
// Add the legend to the map
legend.addTo(myMap);