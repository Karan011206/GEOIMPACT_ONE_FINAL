"use client";
import { getAqiColor } from "@/src/utils/aqiUtils";

export default function ZoneAqiList({ stations = [] }) {
  const stationList = Array.isArray(stations) ? stations : [];
  return (
    <div className="card zone-list">
      <h3>🌍 Zone AQI Levels</h3>
      <div className="stack">
        {stationList.slice(0, 5).map((s, idx) => {
          const color = getAqiColor(s.aqi || 0).border;
          const aqiLevel = getAqiColor(s.aqi || 0).level;
          return (
            <div key={`${s.station?.name || s.uid}-${idx}`} className="zone-item">
              <div className="row zone-row">
                <div className="zone-info">
                  <span className="zone-name">{s.station?.name || `Zone ${idx + 1}`}</span>
                  <span className="zone-level">{aqiLevel}</span>
                </div>
                <span className="zone-aqi" style={{ color }}>{s.aqi || "--"}</span>
              </div>
              <div className="bar-bg zone-bar-bg">
                <div 
                  className="bar zone-bar" 
                  style={{ 
                    width: `${Math.min(100, (s.aqi || 0) / 3)}%`, 
                    background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`
                  }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
