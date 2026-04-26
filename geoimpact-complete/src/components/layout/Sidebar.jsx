"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { label: "MONITOR", items: [{ href: "/", label: "Dashboard" }, { href: "/map", label: "Live Map" }, { href: "/alerts", label: "Alerts" }] },
  { label: "PREDICT", items: [{ href: "/forecast", label: "AQI Forecast" }, { href: "/simulator", label: "Simulator" }] },
  { label: "NETWORK", items: [{ href: "/sensors", label: "Sensors" }, { href: "/routes", label: "Safe Routes" }] }
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="air-sidebar">
      <div>
        <div className="logo">GeoImpact Air AI</div>
        <div className="logo-sub">PS04 · Air Intelligence</div>
      </div>
      {sections.map((section) => (
        <div key={section.label} className="nav-section">
          <div className="nav-label">{section.label}</div>
          {section.items.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? "active" : ""}`}>
              {item.label}
            </Link>
          ))}
        </div>
      ))}
      <div className="side-footer">
        <div className="small-muted">Last sync: 2 min ago</div>
        <div><span className="dot" /> 24 sensors online</div>
      </div>
    </aside>
  );
}
