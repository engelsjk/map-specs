var VectorTile = require('@mapbox/vector-tile').VectorTile;
var Protobuf = require('pbf');
var tilecover = require('@mapbox/tile-cover');
var tilebelt = require('@mapbox/tilebelt');

window.checkCached = async function (url, waitTimeMs = 4) {
    const ac = new AbortController()
    const promise = fetch(url, { signal: ac.signal })
        .then(() => true)
        .catch(() => false)
    return promise
}

window.decodeTileStats = async function (url) {
    const promise = fetch(url)
        .then(response => {
            return response.arrayBuffer()
        })
        .then(buffer => {
            var tile = new VectorTile(new Protobuf(buffer));
            console.log(tile);
            return tileStats(tile);
        })
        .catch(error => {
            console.error(error);
        });
    return promise;
}

function tileStats(tile) {
    var tileStats = {
        tile: "",
        layers: []
    };
    for (const [k, v] of Object.entries(tile.layers)) {
        var layer = {
            name: v.name,
            numKeys: v._keys.length,
            numFeatures: v._features.length,
        }
        tileStats.layers.push(layer);
    }
    return tileStats;
}

window.tileFromURL = function (re, url) {
    var s = re.exec(url);
    if (s.length != 1) {
        console.log("error: url should have one tile string");
        return "";
    }
    var t = s[0].slice(1);
    return t;
}

window.drawTiles = function (source) {
    var coverTiles = getCoverTiles();
    var features = coverTiles.map(getTileFeature);
    source.setData({
        type: 'FeatureCollection',
        features: features
    });
}

function getCoverTiles() {
    var extentsGeom = getExtentsGeom();
    var zoom = Math.ceil(map.getZoom());
    tiles = tilecover.tiles(extentsGeom, { min_zoom: zoom, max_zoom: zoom });
    return tiles;
}

function getTileFeature(tile) {
    var feature = {
        type: 'Feature',
        properties: null,
        geometry: tilebelt.tileToGeoJSON(tile)
    };
    return feature;
}

function getExtentsGeom() {
    var e = map.getBounds();
    var box = [
        e.getSouthWest().toArray(),
        e.getNorthWest().toArray(),
        e.getNorthEast().toArray(),
        e.getSouthEast().toArray(),
        e.getSouthWest().toArray()
    ].map(coords => {
        if (coords[0] < -180) return [-179.99999, coords[1]]
        if (coords[0] > 180) return [179.99999, coords[1]]
        return coords
    });

    return {
        type: 'Polygon',
        coordinates: [box]
    };
}


