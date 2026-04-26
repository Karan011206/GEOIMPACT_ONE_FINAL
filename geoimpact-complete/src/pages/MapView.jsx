"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ZoneDetailPanel from "@/src/components/map/ZoneDetailPanel";
import { fetchNearbyStations } from "@/src/services/aqiService";
import { getAqiColor } from "@/src/utils/aqiUtils";

// Leaflet depends on `window`; load map client-side only.
const ZoneMap = dynamic(() => import("@/src/components/map/ZoneMap"), { ssr: false });
const PollutionHeatmap = dynamic(() => import("@/src/components/map/PollutionHeatmap"), { ssr: false });
const IndiaTemperatureHeatmap = dynamic(() => import("@/src/components/map/IndiaTemperatureHeatmap"), { ssr: false });

export default function MapView() {
  const [stations, setStations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [heatmapType, setHeatmapType] = useState('pollution'); // 'pollution' or 'temperature'
  
  useEffect(() => {
    fetchNearbyStations()
      .then((result) => setStations(Array.isArray(result) ? result : []))
      .catch((error) => {
        console.error(error);
        setStations([]);
      });
  }, []);
  
  const stationList = Array.isArray(stations) ? stations : [];
  
  const handleSelect = (data) => {
    setSelected(data);
  };
  
  return (
    <div className="stack-lg">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3>Map View</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setHeatmapType('pollution')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                heatmapType === 'pollution' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pollution Heatmap
            </button>
            <button
              onClick={() => setHeatmapType('temperature')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                heatmapType === 'temperature' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Temperature Heatmap
            </button>
          </div>
        </div>
        
        <div className="grid grid-2">
          <ZoneMap stations={stationList} selectedZoneId={selected?._zoneId || null} onSelect={handleSelect} />
          <ZoneDetailPanel zone={selected} />
        </div>
      </div>
      
      {heatmapType === 'pollution' ? (
        <PollutionHeatmap stations={stationList} onSelect={handleSelect} />
      ) : (
        <IndiaTemperatureHeatmap onSelect={handleSelect} />
      )}
      
      <div className="card">
        <h3>
          {heatmapType === 'pollution' ? 'Zone' : 'City'} Comparison
        </h3>
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            {heatmapType === 'pollution' ? (
              <BarChart data={stationList.slice(0, 7).map((s) => ({ name: s.station?.name?.slice(0, 10) || "Zone", aqi: s.aqi || 0 }))}>
                <XAxis dataKey="name" /><YAxis /><Tooltip />
                <Bar dataKey="aqi">{stationList.slice(0, 7).map((s, i) => <Cell key={i} fill={getAqiColor(s.aqi || 0).border} />)}</Bar>
              </BarChart>
            ) : (
              <BarChart data={stationList.slice(0, 7).map((s) => ({ 
                name: s.station?.name?.slice(0, 10) || "City", 
                value: s.temperatureC || 0,
                fill: s.temperatureColor || '#6b7280'
              }))}>
                <XAxis dataKey="name" /><YAxis />
                <Tooltip 
                  formatter={(value) => [`${value}°C`, 'Temperature']}
                />
                <Bar dataKey="value">
                  {stationList.slice(0, 7).map((s, i) => <Cell key={i} fill={s.temperatureColor || '#6b7280'} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
