const koppenUrl = 'https://raw.githubusercontent.com/rjerue/koppen-map/main/raw-data.json';
let data = {};
const colorZones = {
    "ET Polar-Tundra": 734,
    "EF Polar-Frost": 241,
    "Aw Tropical-Savanna": "#46A9FA",
    "BSh Arid-Steppe-Hot": 214,
    "BWh Arid-Desert-Hot": "#FE0000",
    "Af Tropical-Rainforest": "#0000FE",
    "Dsa Cold-Dry_Summer-Hot_Summer": 36,
    "Am Tropical-Monsoon": "#0077FF",
    "Dwa Cold-Dry_Winter-Hot_Summer": 33,
    "BSk Arid-Steppe-Cold": 174,
    "Dwb Cold-Dry_Winter-Warm_Summer": 41,
    "Dfa Cold-Withouth_dry_season-Hot_Summer": 121,
    "Dfb Cold-Withouth_dry_season-Warm_Summer": 198,
    "Csb Temperate-Dry_Summer-Warm_Summer": 107,
    "Dfc Cold-Withouth_dry_season-Cold_Summer": 239,
    "Cfc Temperate-Withouth_dry_season-Cold_Summer": 63,
    "BWk Arid-Desert-Cold": "##FE9695",
    "Cfa Temperate-Withouth_dry_season-Hot_Summer": 224,
    "Cfb Temperate-Withouth_dry_season-Warm_Summer": 276,
    "Csa Temperate-Dry_Summer-Hot_Summer": 154,
    "Dwc Cold-Dry_Winter-Cold_Summer": 23,
    "Dsb Cold-Dry_Summer-Warm_Summer": 50,
    "Cwa Temperate-Dry_Winter-Hot_Summer": 84,
    "Dsc Cold-Dry_Summer-Cold_Summer": 27,
    "Cwb Temperate-Dry_Winter-Warm_Summer": 30,
    "Cwc Temperate-Dry_Winter-Cold_Summer": 2,
    "Dfa Cold-Withouth_dry_season-Very_Cold_Winter": 2,
    "Dsd Cold-Dry_Summer-Very_Cold_Winter": 1,
    "Dwd Cold-Dry_Winter-Very_Cold_Winter": 1
}

async function start() {
    const response = await fetch(koppenUrl);
    data = await response.json();


    line = [
        [
          11.972165916467617,
          15.088266317082812
        ],
        [
          -0.8707755531187331,
          3.063378137821431
        ]
      ]

    
    testAllZones(line);
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

function testAllZones(line) {
    for (let i = 0; i < data.features.length; i++) {

        const type = data.features[i].properties.climate;
        if (colorZones.hasOwnProperty(type)) {
            colorZones[type] += 1
        } else {
            colorZones[type] = 1;
        }


        const zone = data.features[i]
        const coords = zone.geometry.coordinates;

        const intersections = findIntersectionPoints(line, coords);
        if (intersections.length > 0) {
            console.log(zone);
        }
    }
}



start();
