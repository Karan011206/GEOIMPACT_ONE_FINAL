import { getAqiColor, getAqiLevel, getAqiRecommendation } from "@/src/utils/aqiUtils";

export default function ZoneDetailPanel({ zone }) {
  if (!zone) return <div className="card">Select a zone to view details.</div>;
  const aqi = zone.aqi || 0;
  const color = getAqiColor(aqi);
  return (
    <div className="card">
      <h3>{zone.station?.name || "Zone Detail"}</h3>
      <div className="aqi-pill" style={{ background: color.bg, color: color.text, borderColor: color.border }}>
        AQI {aqi} · {getAqiLevel(aqi)}
      </div>
      <div className="stack mt-12">
        {Number.isFinite(Number(zone.temperatureC)) ? <div>Temperature: {Math.round(Number(zone.temperatureC))} °C</div> : null}
        <div>PM2.5: {Math.round(aqi * 0.42)} ug/m3</div>
        <div>PM10: {Math.round(aqi * 0.64)} ug/m3</div>
        <div className="small-muted">{getAqiRecommendation(aqi)}</div>
      </div>
    </div>
  );
}
