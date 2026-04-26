"use client";

// Library-based pollution heatmap (Leaflet.heat) using WAQI station lat/lon + AQI.
// Click stations to fetch temperature and show in detail panel.

import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { getAqiColor, getAqiLevel } from "@/src/utils/aqiUtils";
import { getTemperature } from "@/src/services/temperatureService";

const INDORE_CENTER = [22.7196, 75.8577];

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function useLeafletHeatLayer(points) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (!Array.isArray(points) || points.length === 0) return;

    // leaflet.heat expects [lat, lng, intensity]
    const layer = L.heatLayer(points, {
      // Wider + smoother so the heat layer spans the map where pollution is higher.
      radius: 85,
      blur: 55,
      maxZoom: 16,
      minOpacity: 0.25,
      // Use AQI scale directly so high-pollution areas dominate.
      max: 220,
      gradient: {
        0.2: "#22c55e", // green
        0.4: "#eab308", // yellow
        0.6: "#f97316", // orange
        0.8: "#ef4444", // red
        1.0: "#7f1d1d" // dark red
      }
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);
}

function HeatLayer({ points }) {
  useLeafletHeatLayer(points);
  return null;
}

function FitToStations({ stations }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const list = Array.isArray(stations) ? stations : [];
    const coords = list
      .map((s) => [toNumber(s?.lat), toNumber(s?.lon)])
      .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon));
    if (coords.length < 2) return;
    map.fitBounds(coords, { padding: [20, 20] });
  }, [map, stations]);
  return null;
}

function haversineKm(aLat, aLon, bLat, bLon) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const sLat1 = (aLat * Math.PI) / 180;
  const sLat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(sLat1) * Math.cos(sLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function ClickSelect({ stations, onPick }) {
  useMapEvents({
    click: (e) => {
      const lat = e?.latlng?.lat;
      const lon = e?.latlng?.lng;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

      // Pick nearest WAQI station to clicked point (single pick; no multi-coordinate fetching).
      const list = Array.isArray(stations) ? stations : [];
      let best = null;
      let bestD = Infinity;

      for (const s of list) {
        const sLat = toNumber(s?.lat);
        const sLon = toNumber(s?.lon);
        if (!Number.isFinite(sLat) || !Number.isFinite(sLon)) continue;
        const d = haversineKm(lat, lon, sLat, sLon);
        if (d < bestD) {
          bestD = d;
          best = s;
        }
      }

      // Avoid selecting a far-away station if user clicks outside area.
      if (!best || bestD > 25) return;
      onPick?.(best, bestD);
    }
  });
  return null;
}

export default function PollutionHeatmap({ stations = [], onSelect }) {
  const stationList = useMemo(() => (Array.isArray(stations) ? stations : []).filter(Boolean), [stations]);
  const [loadingKey, setLoadingKey] = useState(null);

  const heatPoints = useMemo(() => {
    // Spread heat "all over" the map by expanding each station into a small influence area.
    // Still uses only WAQI live stations; no grid/multi-coordinate API fetching.
    const points = [];
    const offsets = [
      [0, 0, 1],
      // near ring
      [0.012, 0.0, 0.6],
      [-0.012, 0.0, 0.6],
      [0.0, 0.014, 0.6],
      [0.0, -0.014, 0.6],
      [0.01, 0.01, 0.45],
      [0.01, -0.01, 0.45],
      [-0.01, 0.01, 0.45],
      [-0.01, -0.01, 0.45],
      // far ring (fills the map more)
      [0.02, 0.0, 0.3],
      [-0.02, 0.0, 0.3],
      [0.0, 0.022, 0.3],
      [0.0, -0.022, 0.3],
      [0.017, 0.017, 0.24],
      [0.017, -0.017, 0.24],
      [-0.017, 0.017, 0.24],
      [-0.017, -0.017, 0.24]
    ];

    for (const s of stationList) {
      const lat = toNumber(s?.lat);
      const lon = toNumber(s?.lon);
      const aqi = toNumber(s?.aqi);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(aqi)) continue;
      const base = Math.max(0, Math.min(500, aqi));
      for (const [dLat, dLon, w] of offsets) {
        points.push([lat + dLat, lon + dLon, base * w]);
      }
    }

    return points;
  }, [stationList]);

  const handleClick = async (s, idx) => {
    const key = String(s?.uid ?? s?.station?.name ?? idx);
    const lat = toNumber(s?.lat);
    const lon = toNumber(s?.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      onSelect?.({ ...s, temperatureC: null });
      return;
    }

    try {
      setLoadingKey(key);
      const temperatureC = await getTemperature(lat, lon);
      onSelect?.({ ...s, temperatureC });
    } catch (e) {
      console.error("TEMP_LOAD_ERROR:", e);
      onSelect?.({ ...s, temperatureC: null });
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="card">
      <h3>Pollution Heatmap</h3>
      <div style={{ height: 420, borderRadius: 14, overflow: "hidden" }}>
        <MapContainer center={INDORE_CENTER} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <HeatLayer points={heatPoints} />
          <FitToStations stations={stationList} />
          <ClickSelect
            stations={stationList}
            onPick={(s) => handleClick(s, 0)}
          />
        </MapContainer>
      </div>
      <div className="small-muted mt-12">
        Heatmap uses WAQI station AQI (Leaflet heat layer). Click on the map to select the nearest station and load its
        temperature in the details panel.
      </div>
    </div>
  );
}

