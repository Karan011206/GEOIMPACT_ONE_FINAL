"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getAqiColor, getAqiLevel } from "@/src/utils/aqiUtils";
import ThemeToggle from "@/src/components/ThemeToggle";

const titles = {
  "/": ["Dashboard", "Hyperlocal air quality overview for Indore"],
  "/map": ["Live Map", "Zone-wise AQI heatmap and details"],
  "/alerts": ["Alert Center", "Air quality alerts and risk intelligence"],
  "/forecast": ["AQI Forecast", "Short and weekly predictions"],
  "/simulator": ["Simulator", "Scenario-driven AQI impact modeling"],
  "/sensors": ["Sensor Network", "Station status and AQI coverage"],
  "/routes": ["Safe Routes", "Lowest-exposure travel options"]
};

export default function Topbar({ aqi = 0, stale = false, liveClock = false }) {
  const pathname = usePathname();
  const [title, subtitle] = titles[pathname] || ["GeoImpact Air AI", "Air Intelligence Platform"];
  const colors = useMemo(() => getAqiColor(aqi), [aqi]);
  const [dateTime, setDateTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDateTime(new Date().toLocaleString());

    if (!liveClock) return undefined;

    const timer = setInterval(() => {
      setDateTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timer);
  }, [liveClock]);

  return (
    <header className="air-topbar">
      <div>
        <div className="page-title">{title}</div>
        <div className="small-muted">{subtitle}</div>
      </div>
      <div className="top-right">
        {stale ? <div className="stale-note">Data may be outdated</div> : null}
        <div className="aqi-pill" style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>
          AQI {aqi} · {getAqiLevel(aqi)}
        </div>
        <ThemeToggle />
        <div className="small-muted">{mounted ? dateTime : ""}</div>
      </div>
    </header>
  );
}
