import { getAqiColor } from "@/src/utils/aqiUtils";

export default function RouteOptions({ routes = [] }) {
  return (
    <div className="card">
      <h3>Route Options</h3>
      <div className="stack">
        {routes.map((route) => {
          const color = getAqiColor(route.exposure);
          return (
            <div key={route.name} className={`route-card ${route.recommended ? "recommended" : ""}`}>
              <div className="row"><strong>{route.name}</strong><span>{route.time}</span></div>
              <div>{route.path}</div>
              <div className="pill" style={{ background: color.bg, color: color.text }}>AQI Exposure: {route.exposure}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
