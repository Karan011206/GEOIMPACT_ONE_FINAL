export default function PredictionFactors({ airQuality }) {
  // Replaces OpenWeather-derived factors with Open‑Meteo air quality values (single location, no API key).
  const factors = [
    { label: "Traffic density", value: [7, 8, 9, 17, 18, 19].includes(new Date().getHours()) ? 82 : 54 },
    { label: "US AQI", value: Math.min(100, Math.round((airQuality?.aqi || 0) / 3)) },
    { label: "PM2.5", value: Math.min(100, Math.round((airQuality?.pm25 || 0) * 2)) },
    { label: "PM10", value: Math.min(100, Math.round((airQuality?.pm10 || 0) * 1.2)) }
  ];
  return (
    <div className="card">
      <h3>Prediction Factors</h3>
      <div className="stack">
        {factors.map((f) => (
          <div key={f.label}>
            <div className="row"><span>{f.label}</span><span>{f.value}%</span></div>
            <div className="bar-bg"><div className="bar" style={{ width: `${f.value}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
