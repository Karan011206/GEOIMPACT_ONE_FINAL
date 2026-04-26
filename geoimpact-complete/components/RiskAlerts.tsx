"use client";
import { useEffect, useState } from "react";

type Alert = {
  id: number;
  title: string;
  risk: string;
  score: number;
  description: string;
  time: string;
  source?: string;
};

export default function RiskAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const loadAlerts = async () => {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" });
        const payload = (await res.json()) as Alert[] | { error?: string };
        if (isCancelled) return;

        if (!res.ok || !Array.isArray(payload)) {
          const message =
            !Array.isArray(payload) && payload.error
              ? payload.error
              : "Failed to load risk alerts.";
          setError(message);
          return;
        }

        setError("");
        setAlerts(payload);
      } catch {
        if (!isCancelled) setError("Failed to load risk alerts.");
      }
    };

    loadAlerts();
    const intervalId = window.setInterval(loadAlerts, 60_000);
    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="card">
      <h3 className="panel-title">🚨 Risk Alerts</h3>
      <p className="muted">Real-time disruptions impacting import and commodity flow</p>
      {error ? <p className="muted">{error}</p> : null}
      <div className="grid">
        {alerts.map(a => (
          <div key={a.id} className="card">
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <strong>{a.title}</strong>
              <span className={`badge ${a.risk.toLowerCase()}`}>{a.risk}</span>
            </div>
            <p style={{opacity:.8}}>{a.description}</p>
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <span>Score: {a.score}</span>
              <span style={{opacity:.6}}>{a.time}</span>
            </div>
            {a.source ? <div style={{opacity:.6}}>Source: {a.source}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
