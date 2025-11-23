// main.js
const API = '/api';
const map = L.map('map').setView([-1.286389, 36.817223], 6);

// basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// layer configs (key must match server LAYERS keys)
const LAYERS = {
  county:      { label: 'Counties',       style:{ color:'#08519c', weight:1.5, fillOpacity:0.08 }, isPolygon:true },
  healthcare:  { label: 'Healthcare',     style:{ color:'#de2d26' }, radius:5, isPolygon:false },
  power:       { label: 'Power stations', style:{ color:'#ff7f00' }, radius:6, isPolygon:false },
  schools:     { label: 'Schools',        style:{ color:'#31a354' }, radius:4, isPolygon:false },
  universities:{ label: 'Universities',   style:{ color:'#6a51a3' }, radius:5, isPolygon:false }
};

// containers
const layerGroups = {};
const visible = {};         // track overlay visibility
const overlays = {};        // for control

// create groups and add to control (control created once)
const layerControl = L.control.layers(null, overlays, { collapsed: false }).addTo(map);

// legend
const legendDiv = L.DomUtil.create('div', 'legend');
document.body.appendChild(legendDiv);
function renderLegend(){
  legendDiv.innerHTML = '<strong>Layers</strong>';
  for(const k of Object.keys(LAYERS)){
    const cfg = LAYERS[k];
    const col = cfg.style.color || '#333';
    legendDiv.innerHTML += `<div class="item"><div class="sw" style="background:${col}"></div>${cfg.label}</div>`;
  }
}
renderLegend();

// prepare groups
for(const key of Object.keys(LAYERS)){
  layerGroups[key] = L.layerGroup();
  overlays[LAYERS[key].label] = layerGroups[key];
  layerControl.addOverlay(layerGroups[key], LAYERS[key].label);
  visible[key] = false;
}

// auto-bind popup
function bindPopupAuto(feature, layer){
  if(!feature || !feature.properties) return;
  const props = feature.properties;
  let html = '<div>';
  for(const k of Object.keys(props)){
    html += `<strong>${k}</strong>: ${props[k]}<br>`;
  }
  html += '</div>';
  layer.bindPopup(html);
}

// load full counties once (polygons)
(async function loadCountiesOnce(){
  try {
    const resp = await fetch(`${API}/county`);
    if(!resp.ok) throw new Error('HTTP ' + resp.status);
    const geojson = await resp.json();
    const layer = L.geoJSON(geojson, {
      style: LAYERS.county.style,
      onEachFeature: bindPopupAuto
    }).addTo(layerGroups.county);
    // show counties by default
    layerGroups.county.addTo(map);
    visible.county = true;
    // fit bounds if any
    try { map.fitBounds(layer.getBounds()); } catch(e){ /* ignore empty */ }
  } catch(err) {
    console.error('Failed to load counties:', err);
  }
})();

// BBOX loader for point layers
async function loadBBoxLayer(key){
  const cfg = LAYERS[key];
  const bounds = map.getBounds();
  const url = `${API}/${key}/bbox?xmin=${bounds.getWest()}&ymin=${bounds.getSouth()}&xmax=${bounds.getEast()}&ymax=${bounds.getNorth()}`;
  try {
    const resp = await fetch(url);
    if(!resp.ok) { console.warn('BBOX fetch failed', url, resp.status); return; }
    const geojson = await resp.json();
    // clear and add new
    layerGroups[key].clearLayers();
    if(!geojson || !geojson.features || geojson.features.length === 0) return;
    const layer = L.geoJSON(geojson, {
      pointToLayer: (f, latlng) => L.circleMarker(latlng, {
        radius: cfg.radius || 5,
        color: cfg.style.color,
        fillColor: cfg.style.color,
        fillOpacity: 0.8,
        weight: 1
      }),
      onEachFeature: bindPopupAuto
    });
    layerGroups[key].addLayer(layer);
  } catch(err) {
    console.error('Failed BBOX load for', key, err);
  }
}

// map events: overlay add/remove
map.on('overlayadd', (e) => {
  const key = findKeyByLabel(e.name);
  if(!key) return;
  visible[key] = true;
  if(LAYERS[key].isPolygon) return; // counties already loaded
  loadBBoxLayer(key);
});

map.on('overlayremove', (e) => {
  const key = findKeyByLabel(e.name);
  if(!key) return;
  visible[key] = false;
  layerGroups[key].clearLayers();
});

// moveend: reload visible point layers (debounced)
let t = null;
map.on('moveend', () => {
  if(t) clearTimeout(t);
  t = setTimeout(() => {
    for(const key of Object.keys(LAYERS)){
      if(visible[key] && !LAYERS[key].isPolygon) loadBBoxLayer(key);
    }
  }, 250);
});

function findKeyByLabel(label){
  for(const k of Object.keys(LAYERS)) if(LAYERS[k].label === label) return k;
  return null;
}
