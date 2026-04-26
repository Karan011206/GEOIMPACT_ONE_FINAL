import { getAqiColor, getAqiLevel } from "@/src/utils/aqiUtils";

export default function HourlyForecast({ points = [] }) {
  return (
    <div className="card">
      <h3>Next 6 Hours Forecast</h3>
      <div className="forecast-row">
        {points.map((point, idx) => {
          const color = getAqiColor(point.aqi);
          return (
            <div key={idx} className="hour-card">
              <div>{point.time}</div>
              <div style={{ color: color.text }}>{point.aqi}</div>
              <span className="pill" style={{ background: color.bg, color: color.text }}>{getAqiLevel(point.aqi)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
