const koppenUrl = 'https://raw.githubusercontent.com/rjerue/koppen-map/main/raw-data.json';
const icaoUrl = './icaoCodes.json';
let koppenData = {};
let icaoData = [];
const colorZones = {
        "ET Polar-Tundra": "#B2B2B2",
        "EF Polar-Frost": "#686868",
        "Aw Tropical-Savanna": "#46A9FA",
        "BSh Arid-Steppe-Hot": "#F5A301",
        "BWh Arid-Desert-Hot": "#FE0000",
        "Af Tropical-Rainforest": "#0000FE",
        "Dsa Cold-Dry_Summer-Hot_Summer": "#FF00FE",
        "Am Tropical-Monsoon": "#0077FF",
        "Dwa Cold-Dry_Winter-Hot_Summer": "#ABB1FF",
        "BSk Arid-Steppe-Cold": "#FFDB63",
        "Dwb Cold-Dry_Winter-Warm_Summer": "#5A77DB",
        "Dfa Cold-Withouth_dry_season-Hot_Summer": "#00FFFF",
        "Dfb Cold-Withouth_dry_season-Warm_Summer": "#38C7FF",
        "Csb Temperate-Dry_Summer-Warm_Summer": "#C6C700",
        "Dfc Cold-Withouth_dry_season-Cold_Summer": "#007E7D",
        "Cfc Temperate-Withouth_dry_season-Cold_Summer": "#33C701",
        "BWk Arid-Desert-Cold": "#FE9695",
        "Cfa Temperate-Withouth_dry_season-Hot_Summer": "#C6FF4E",
        "Cfb Temperate-Withouth_dry_season-Warm_Summer": "#66FF33",
        "Csa Temperate-Dry_Summer-Hot_Summer": "#FFFF00",
        "Dwc Cold-Dry_Winter-Cold_Summer": "#4C51B5",
        "Dsb Cold-Dry_Summer-Warm_Summer": "#C600C7",
        "Cwa Temperate-Dry_Winter-Hot_Summer": "#96FF96",
        "Dsc Cold-Dry_Summer-Cold_Summer": "#963295",
        "Cwb Temperate-Dry_Winter-Warm_Summer": "#63C764",
        "Cwc Temperate-Dry_Winter-Cold_Summer": "#329633",
        "Dfa Cold-Withouth_dry_season-Very_Cold_Winter": "#00FFFF",
        "Dsd Cold-Dry_Summer-Very_Cold_Winter": "#966495",
        "Dwd Cold-Dry_Winter-Very_Cold_Winter": "#320087"
    }//we use it in tailwin config
function formatName(koppenZone) {
    let [code, description] = koppenZone.split(" ");
    description = description.replace(/[_|-]/gm, " ");

    return `${code} - ${description}`;
}
function haversineDistance(coords1, coords2, isMiles=true) {
  function toRad(x) {
    return x * Math.PI / 180;
  }

  var lon1 = coords1[0];
  var lat1 = coords1[1];

  var lon2 = coords2[0];
  var lat2 = coords2[1];

  var R = 6371; // km

  var x1 = lat2 - lat1;
  var dLat = toRad(x1);
  var x2 = lon2 - lon1;
  var dLon = toRad(x2)
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  if(isMiles) d /= 1.60934;

  return d;
}//from https://stackoverflow.com/a/30316500

async function start() {
    const koppenResponse = await fetch(koppenUrl);
    koppenData = await koppenResponse.json();
    
    const icaoResponse = await fetch(icaoUrl);
    icaoData = await icaoResponse.json();
    


}

function findIntersectionPoints(lineCoords, polygonCoords) {
    const line = turf.lineString(lineCoords);
    const poly = turf.polygon(polygonCoords);

    // Check if the line intersects the polygon
    if (turf.booleanIntersects(line, poly)) {
        // Find intersection points
        const intersections = turf.lineIntersect(line, poly);
        if (intersections.features.length > 0) {
            // Extract the coordinates of intersection points
            const intersectionPoints = intersections.features.map((feature) => {
                return feature.geometry.coordinates;
            });
            return intersectionPoints;
        }
    }

    return []; // No intersections found
}

function loadFlights() {
    const startICAO = document.querySelector('input[name="from"]').value;
    const endICAO = document.querySelector('input[name="to"]').value;

    let [start, end] = [{}, {}];

    for (let i = 0; i < icaoData.length; i++) {
        const icao = icaoData[i].icao;

        if (icao === startICAO.toUpperCase()) {
            start = icaoData[i];
        }
        if (icao === endICAO.toUpperCase()) {
            end = icaoData[i];
        }
    }

    const startCoordinates = [start.latitude, start.longitude].reverse();
    const endCoordinates = [end.latitude, end.longitude].reverse();

    const totalDistance = haversineDistance(startCoordinates, endCoordinates);

    document.querySelector("#start-name").innerHTML = start.airport;
    document.querySelector("#end-name").innerHTML = end.airport;

    const line = [startCoordinates, endCoordinates];

    intersections = testAllZones(line);
    let zoneDistances = {}; // Track total distance within each zone

    // Calculate total distance within each zone
    intersections.forEach((instance) => {
        const zoneName = instance.name;
        const distance = instance.distance;
        if (zoneDistances.hasOwnProperty(zoneName)) {
            zoneDistances[zoneName] += distance;
        } else {
            zoneDistances[zoneName] = distance;
        }
    });

    let htmlRenders = [];
    const oceanicDistance = totalDistance - Object.values(zoneDistances).reduce((a, b) => a + b, 0);;
    // Calculate percentage and render HTML
    zoneDistances["XXX Ocean"] = oceanicDistance;
    for (const zoneName in zoneDistances) {
        if (zoneDistances.hasOwnProperty(zoneName)) {
            const distance = zoneDistances[zoneName];
            const percentage = (distance / totalDistance) * 100;
            htmlRenders.push(`
                <div class="flex flex-row mx-3">
                    <div class="h-16 w-16 flex items-center justify-center" style="background-color: ${colorZones[zoneName]}">
                        <span class="text-sm text-center">
                            ${distance.toFixed(1)} mi
                            <br>
                            ${percentage.toFixed(0)}%
                        </span>
                    </div>
                    <span class="w-44">${formatName(zoneName)}</span>
                </div>
            `);
        }
    }

    document.querySelector('#zones').innerHTML = htmlRenders.join('') + Array(
        Object.values(zoneDistances).length%(Math.floor(document.body.clientWidth/240))
    ).fill(`<div class="flex flex-row mx-3">
                    <div class="h-16 w-16 flex items-center justify-center" style="background-color: undefined">
                        <span class="text-sm text-center">
                            
                            <br>
                        
                        </span>
                    </div>
                    <span class="w-44"></span>
                </div>`);
}


function testAllZones(line) {
    let intersectedZones = []; //store all zone data and intersected points
    for (let i = 0; i < koppenData.features.length; i++) {

        const type = koppenData.features[i].properties.climate; //its name

        const zone = koppenData.features[i]
        const coords = zone.geometry.coordinates;
        
        let intersections = findIntersectionPoints(line, coords);
        if (intersections.length > 0) {
            if (intersections.length == 1) {//Starting and ending points only have one intersection point since they start within a zone
                const dist_to_start = haversineDistance(intersections[0], line[0]);
                const dist_to_end = haversineDistance(intersections[0], line[1]);

                if (dist_to_start < dist_to_end) {
                    intersections.push(line[0]);
                } else {
                    intersections.push(line[1])
                }

            }
            intersectedZones.push({
                intersections: intersections, 
                geojson: zone, 
                name: type,
                distance:haversineDistance(intersections[0],intersections[1])})
        }
    }
    return intersectedZones;
}



start();
