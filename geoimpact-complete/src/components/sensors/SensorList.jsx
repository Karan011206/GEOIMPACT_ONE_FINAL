import { getAqiColor } from "@/src/utils/aqiUtils";

export default function SensorList({ sensors = [] }) {
  return (
    <div className="card">
      <h3>Sensor List</h3>
      <div className="stack">
        {sensors.map((sensor, i) => {
          const color = getAqiColor(sensor.aqi || 0);
          return (
            <div key={`${sensor.id}-${i}`} className="row sensor-row">
              <div><span className={`dot ${sensor.status}`} /> {sensor.id} · {sensor.loc}</div>
              <div className="pill" style={{ background: color.bg, color: color.text }}>{sensor.aqi || "--"} AQI</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
