import { getAqiRecommendation } from "@/src/utils/aqiUtils";

export default function HealthRecommendations({ aqi = 0, morningGood = false }) {
  return (
    <div className="card">
      <h3>Health Recommendations</h3>
      <div className="stack">
        <div className="advice red">{getAqiRecommendation(aqi)}</div>
        <div className="advice amber">Sensitive groups should carry inhalers and avoid high traffic corridors.</div>
        <div className="advice green">{morningGood ? "Best time outside: early morning windows." : "No low-risk outdoor window detected today."}</div>
        <div className="advice blue">{aqi > 150 ? "Mask: N95 strongly recommended." : "Mask: carry standard mask in busy areas."}</div>
      </div>
    </div>
  );
}
