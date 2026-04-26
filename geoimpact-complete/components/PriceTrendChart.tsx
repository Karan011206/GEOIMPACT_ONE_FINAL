"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  Line,
  Bar
} from "recharts";

type TrendPoint = {
  day: string;
  price: number;
  volume: number;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BASELINE_SERIES = [-1.2, -0.9, -0.5, -0.2, 0.1, 0.4, 0.75];

function createTrendData(latestPrice: number): TrendPoint[] {
  return DAY_LABELS.map((day, index) => {
    const delta = BASELINE_SERIES[index];
    const adjusted = Math.max(50, latestPrice + delta);
    return {
      day,
      price: Number(adjusted.toFixed(2)),
      volume: 320 + index * 22
    };
  });
}

export default function PriceTrendChart() {
  const [livePrice, setLivePrice] = useState<number>(95.5);
  const [city, setCity] = useState("Delhi");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    let isCancelled = false;

    const fetchLivePrice = async () => {
      try {
        const res = await fetch("/api/fuel-price?city=Delhi", {
          cache: "no-store"
        });
        if (!res.ok) return;

        const payload: {
          price?: number;
          city?: string;
          fetchedAt?: string;
        } = await res.json();

        if (isCancelled || typeof payload.price !== "number") return;

        setLivePrice(payload.price);
        setCity(payload.city || "Delhi");
        setLastUpdated(payload.fetchedAt || "");
      } catch {
        // Keep previous chart values when live fetch fails.
      }
    };

    fetchLivePrice();
    const intervalId = window.setInterval(fetchLivePrice, 60_000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const data = useMemo(() => createTrendData(livePrice), [livePrice]);

  return (
    <div className="card">
      <h3 className="panel-title">📈 Fuel Price Trend (7 days)</h3>
      <p className="muted">
        Live petrol price for {city}: INR {livePrice.toFixed(2)}/L
        {lastUpdated ? ` (updated ${new Date(lastUpdated).toLocaleTimeString()})` : ""}
      </p>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="day" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" stroke="#94a3b8" tickLine={false} axisLine={false} width={45} />
            <YAxis yAxisId="right" orientation="right" stroke="#6ee7b7" tickLine={false} axisLine={false} width={45} />
            <Tooltip
              contentStyle={{
                background: "rgba(15, 23, 42, 0.92)",
                border: "1px solid rgba(255,255,255,0.16)",
                borderRadius: "12px",
              }}
            />
            <Area yAxisId="left" type="monotone" dataKey="price" fill="url(#priceFill)" stroke="none" />
            <Bar yAxisId="right" dataKey="volume" fill="rgba(110, 231, 183, 0.28)" radius={[6, 6, 0, 0]} />
            <Line yAxisId="left" type="monotone" dataKey="price" stroke="#60a5fa" strokeWidth={3} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
