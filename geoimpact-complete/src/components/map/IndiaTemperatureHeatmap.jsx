"use client";

// Temperature heatmap for India using Leaflet.heat with live temperature data
// Shows real-time temperature across major Indian cities

import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { getAllIndiaTemperatures, getTemperatureColor, getTemperatureLevel } from "@/src/services/indiaTemperatureService";

const INDIA_CENTER = [20.5937, 78.9629]; // Center of India

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
      // Wider radius to cover more area between cities
      radius: 120,
      blur: 75,
      maxZoom: 16,
      minOpacity: 0.3,
      // Temperature scale (10-50°C range)
      max: 50,
      gradient: {
        0.2: "#3b82f6", // Blue - Cold
        0.3: "#06b6d4", // Cyan - Cool  
        0.4: "#10b981", // Green - Mild
        0.5: "#eab308", // Yellow - Warm
        0.6: "#f97316", // Orange - Hot
        0.8: "#ef4444", // Red - Very Hot
        1.0: "#7f1d1d"  // Dark Red - Extreme
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

function FitToIndia() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    // Fit bounds to show entire India
    const indiaBounds = [[6.0, 68.0], [38.0, 98.0]]; // Rough bounds of India
    map.fitBounds(indiaBounds, { padding: [20, 20] });
  }, [map]);
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

function ClickSelect({ cities, onPick }) {
  useMapEvents({
    click: (e) => {
      const lat = e?.latlng?.lat;
      const lon = e?.latlng?.lng;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

      // Pick nearest city to clicked point
      const list = Array.isArray(cities) ? cities : [];
      let best = null;
      let bestD = Infinity;

      for (const city of list) {
        const cityLat = toNumber(city?.lat);
        const cityLon = toNumber(city?.lon);
        if (!Number.isFinite(cityLat) || !Number.isFinite(cityLon)) continue;
        const d = haversineKm(lat, lon, cityLat, cityLon);
        if (d < bestD) {
          bestD = d;
          best = city;
        }
      }

      // Avoid selecting a far-away city if user clicks outside area
      if (!best || bestD > 50) return;
      onPick?.(best, bestD);
    }
  });
  return null;
}

export default function IndiaTemperatureHeatmap({ onSelect }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const loadTemperatureData = async () => {
      try {
        setLoading(true);
        setError(null);
        const temperatureData = await getAllIndiaTemperatures();
        setCities(temperatureData);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Failed to load temperature data:', err);
        setError('Failed to load temperature data');
      } finally {
        setLoading(false);
      }
    };

    loadTemperatureData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadTemperatureData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const heatPoints = useMemo(() => {
    if (!Array.isArray(cities) || cities.length === 0) return [];

    // Create heat points with temperature intensity
    const points = [];
    const offsets = [
      [0, 0, 1],
      // near ring
      [0.05, 0.0, 0.7],
      [-0.05, 0.0, 0.7],
      [0.0, 0.06, 0.7],
      [0.0, -0.06, 0.7],
      [0.04, 0.04, 0.5],
      [0.04, -0.04, 0.5],
      [-0.04, 0.04, 0.5],
      [-0.04, -0.04, 0.5],
      // far ring (fills the map more)
      [0.08, 0.0, 0.3],
      [-0.08, 0.0, 0.3],
      [0.0, 0.1, 0.3],
      [0.0, -0.1, 0.3],
      [0.07, 0.07, 0.2],
      [0.07, -0.07, 0.2],
      [-0.07, 0.07, 0.2],
      [-0.07, -0.07, 0.2]
    ];

    for (const city of cities) {
      const lat = toNumber(city?.lat);
      const lon = toNumber(city?.lon);
      const temp = toNumber(city?.temperature);
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(temp)) continue;
      
      const normalizedTemp = Math.max(10, Math.min(50, temp)); // Normalize to 10-50°C range
      for (const [dLat, dLon, w] of offsets) {
        points.push([lat + dLat, lon + dLon, normalizedTemp * w]);
      }
    }

    return points;
  }, [cities]);

  const handleClick = (city, distance) => {
    onSelect?.({
      ...city,
      distance,
      temperatureColor: getTemperatureColor(city.temperature),
      temperatureLevel: getTemperatureLevel(city.temperature)
    });
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diff = Math.floor((now - lastUpdated) / 1000); // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return `${Math.floor(diff / 3600)} hours ago`;
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3>India Temperature Heatmap</h3>
        <div className="flex items-center gap-2">
          {loading && <span className="text-sm text-gray-500">Loading...</span>}
          {lastUpdated && !loading && (
            <span className="text-xs text-gray-500">Updated: {formatLastUpdated()}</span>
          )}
        </div>
      </div>
      
      <div style={{ height: 500, borderRadius: 14, overflow: "hidden" }}>
        <MapContainer 
          center={INDIA_CENTER} 
          zoom={5} 
          style={{ height: "100%", width: "100%" }} 
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <HeatLayer points={heatPoints} />
          <FitToIndia />
          <ClickSelect
            cities={cities}
            onPick={handleClick}
          />
        </MapContainer>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Temperature Scale</span>
          <span className="text-xs text-gray-500">°C</span>
        </div>
        <div className="flex items-center gap-1 h-6">
          <div className="flex-1 bg-blue-500 rounded-l"></div>
          <div className="flex-1 bg-cyan-500"></div>
          <div className="flex-1 bg-green-500"></div>
          <div className="flex-1 bg-yellow-500"></div>
          <div className="flex-1 bg-orange-500"></div>
          <div className="flex-1 bg-red-500"></div>
          <div className="flex-1 bg-red-900 rounded-r"></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>10°C</span>
          <span>20°C</span>
          <span>25°C</span>
          <span>30°C</span>
          <span>35°C</span>
          <span>40°C</span>
          <span>50°C</span>
        </div>
      </div>
      
      <div className="small-muted mt-4">
        {error ? (
          <span className="text-red-500">{error}</span>
        ) : (
          <span>
            Heatmap shows live temperature data from {cities.length} major Indian cities. 
            Click on the map to select the nearest city and view detailed temperature information.
            Data refreshes every 5 minutes.
          </span>
        )}
      </div>
    </div>
  );
}
