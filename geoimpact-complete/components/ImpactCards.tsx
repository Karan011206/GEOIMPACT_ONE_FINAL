"use client";
import { useEffect, useState } from "react";

type Trend = "up" | "down" | "flat";
type CategoryData = { change: number; trend: Trend; signals?: number };
type PredictionResponse = {
  fuel: CategoryData;
  food: CategoryData;
  logistics: CategoryData;
  generatedAt?: string;
  error?: string;
};

export default function ImpactCards() {
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const loadPredictions = async () => {
      try {
        const res = await fetch("/api/predictions", { cache: "no-store" });
        const payload = (await res.json()) as PredictionResponse;
        if (isCancelled) return;
        if (!res.ok) {
          setError(payload.error || "Failed to load predictions.");
          return;
        }
        setError("");
        setData(payload);
      } catch {
        if (!isCancelled) setError("Failed to load predictions.");
      }
    };

    loadPredictions();
    const intervalId = window.setInterval(loadPredictions, 60_000);
    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  if (error) return <div className="card">{error}</div>;
  if (!data) return <div className="card">Loading live predictions...</div>;

  const cards = [
    { icon: "⛽", label: "Fuel", value: data.fuel.change, trend: data.fuel.trend },
    { icon: "🌾", label: "Food", value: data.food.change, trend: data.food.trend },
    { icon: "🚢", label: "Logistics", value: data.logistics.change, trend: data.logistics.trend },
  ];

  return (
    <div className="grid grid-3">
      {cards.map((item) => (
        <div key={item.label} className="card kpi-card">
          <div className="kpi-label">{item.icon} {item.label}</div>
          <div className="kpi-value">{item.value}%</div>
          <div className={`kpi-trend ${item.trend === "up" ? "up" : item.trend === "down" ? "down" : "flat"}`}>
            Trend: {item.trend}
          </div>
        </div>
      ))}
    </div>
  );
}
