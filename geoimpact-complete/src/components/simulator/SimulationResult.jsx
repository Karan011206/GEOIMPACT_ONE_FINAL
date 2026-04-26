import { getAqiColor, getAqiLevel } from "@/src/utils/aqiUtils";

export default function SimulationResult({ result }) {
  if (!result) return <div className="card">Run a simulation to view predicted impact.</div>;
  const color = getAqiColor(result.simAqi);
  return (
    <div className="card">
      <h3>Predicted Impact</h3>
      <div className="aqi-pill" style={{ background: color.bg, color: color.text, borderColor: color.border }}>
        AQI {result.simAqi} · {getAqiLevel(result.simAqi)}
      </div>
      <div className="stack mt-12">
        <div>PM2.5 estimate: {Math.round(result.simAqi * 0.42)} ug/m3</div>
        <div>Affected zones: {result.affectedZones}</div>
        <div>Duration: {result.duration}h</div>
        <div className="small-muted">{result.advisory}</div>
      </div>
    </div>
  );
}
