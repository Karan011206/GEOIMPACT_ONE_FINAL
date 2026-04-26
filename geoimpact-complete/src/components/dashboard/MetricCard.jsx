export default function MetricCard({ label, value, unit = "", tone = "light" }) {
  return (
    <div className={`metric-card ${tone === "light" ? "soft" : ""}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}{unit ? ` ${unit}` : ""}</div>
      <div className="metric-glow"></div>
    </div>
  );
}
