/* eslint-disable react/no-unknown-property */
"use client";

// Adds a real map view with zone polygons (Leaflet).
// This complements the existing heatmap grid by showing a region divided into zones.

import "leaflet/dist/leaflet.css";
import { MapContainer, Polygon, TileLayer, Tooltip } from "react-leaflet";
import { getAqiColor, getAqiLevel } from "@/src/utils/aqiUtils";

function makeRect([latMin, lonMin, latMax, lonMax]) {
  return [
    [latMin, lonMin],
    [latMin, lonMax],
    [latMax, lonMax],
    [latMax, lonMin]
  ];
}

const INDORE_CENTER = [22.7196, 75.8577];

// Smaller zones: divide the Indore bounds into a 4x4 grid.
// Zones use live WAQI station data (lat/lon + aqi) aggregated within each cell.
const INDORE_BOUNDS = { latMin: 22.5, lonMin: 75.5, latMax: 23.0, lonMax: 76.2 };
const GRID_SIZE = 4;

function buildGridZones(bounds, gridSize) {
  const zones = [];
  const latStep = (bounds.latMax - bounds.latMin) / gridSize;
  const lonStep = (bounds.lonMax - bounds.lonMin) / gridSize;

  for (let r = 0; r < gridSize; r += 1) {
    for (let c = 0; c < gridSize; c += 1) {
      const lat0 = bounds.latMin + r * latStep;
      const lat1 = bounds.latMin + (r + 1) * latStep;
      const lon0 = bounds.lonMin + c * lonStep;
      const lon1 = bounds.lonMin + (c + 1) * lonStep;
      const id = `Z${r + 1}${c + 1}`;
      zones.push({
        id,
        name: `Zone ${r + 1}-${c + 1}`,
        bounds: [lat0, lon0, lat1, lon1]
      });
    }
  }
  return zones;
}

const ZONES = buildGridZones(INDORE_BOUNDS, GRID_SIZE);

function isStationInBounds(station, boundsArr) {
  const [latMin, lonMin, latMax, lonMax] = boundsArr;
  const lat = Number(station?.lat);
  const lon = Number(station?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax;
}

function normalizeStationAqi(value) {
  // WAQI `aqi` can be number, string, or "-" (unknown)
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function aggregateZoneAqi(stations, zoneBounds) {
  const list = Array.isArray(stations) ? stations : [];
  const inside = list.filter((s) => isStationInBounds(s, zoneBounds));
  const values = inside.map((s) => normalizeStationAqi(s?.aqi)).filter((v) => Number.isFinite(v));
  if (!values.length) return null;
  // Minimal + stable: average AQI across stations inside the zone.
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export default function ZoneMap({ stations = [], selectedZoneId = null, onSelect }) {
  return (
    <div className="card">
      <h3>Live Map (Zones)</h3>
      <div style={{ height: 420, borderRadius: 14, overflow: "hidden" }}>
        <MapContainer center={INDORE_CENTER} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {ZONES.map((z) => {
            const zoneAqi = aggregateZoneAqi(stations, z.bounds);
            const safeAqi = Number.isFinite(zoneAqi) ? zoneAqi : 0;
            const color = getAqiColor(safeAqi);
            const isSelected = selectedZoneId === z.id;

            return (
              <Polygon
                key={z.id}
                pathOptions={{
                  color: color.border,
                  weight: isSelected ? 4 : 2,
                  fillColor: color.bg,
                  fillOpacity: 0.55
                }}
                positions={makeRect(z.bounds)}
                eventHandlers={{
                  click: () =>
                    onSelect?.({
                      aqi: Number.isFinite(zoneAqi) ? Math.round(zoneAqi) : null,
                      lat: (z.bounds[0] + z.bounds[2]) / 2,
                      lon: (z.bounds[1] + z.bounds[3]) / 2,
                      station: { name: z.name },
                      _zoneId: z.id
                    })
                }}
              >
                <Tooltip sticky>
                  <div style={{ minWidth: 140 }}>
                    <div style={{ fontWeight: 700 }}>{z.name}</div>
                    <div>AQI: {Number.isFinite(zoneAqi) ? Math.round(zoneAqi) : "--"}</div>
                    <div style={{ opacity: 0.8 }}>{getAqiLevel(safeAqi)}</div>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}
        </MapContainer>
      </div>

      <div className="row mt-12" style={{ justifyContent: "space-between" }}>
        <div className="small-muted">Click a zone to view details (zone AQI is aggregated from WAQI stations).</div>
        <div className="small-muted">Map source: OpenStreetMap</div>
      </div>
    </div>
  );
}

