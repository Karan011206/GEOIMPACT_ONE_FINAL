"use client";
import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { fetchAirNews } from "@/src/services/newsService";
import { fetchDelhiAqiForecast } from "@/src/services/forecastService";
import { fetchIndoreAqi } from "@/src/services/aqiService";
import { fetchIndoreAirQuality } from "@/src/services/airQualityService";
import { toRelativeTime } from "@/src/utils/aqiUtils";

export default function GeoImpactRiskPanel({ currentAqi = 0, showNews = true }) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [delhiTrend, setDelhiTrend] = useState([]);
  const [liveMetrics, setLiveMetrics] = useState({
    aqi: "--",
    pm25: "--",
    co: "--"
  });

  useEffect(() => {
    if (showNews) {
      fetchAirNews().then((items) => setNews((items || []).slice(0, 4))).catch(console.error);
    }
    // Replaces OpenWeather: use Open‑Meteo air quality metrics (single location, no API key).
    Promise.allSettled([fetchIndoreAqi(), fetchIndoreAirQuality(), fetchDelhiAqiForecast()])
      .then(([indoreAqiRes, airRes, delhiForecastRes]) => {
        const indoreAqi = indoreAqiRes.status === "fulfilled" ? indoreAqiRes.value : null;
        const air = airRes.status === "fulfilled" ? airRes.value : null;
        const delhiForecast = delhiForecastRes.status === "fulfilled" ? delhiForecastRes.value : null;

        const delhiTimes = delhiForecast?.hourly?.time || [];
        const coValues = delhiForecast?.hourly?.carbon_monoxide || [];
        const currentHour = new Date().toISOString().slice(0, 13);

        let delhiIndex = delhiTimes.findIndex((t) => String(t).slice(0, 13) === currentHour);
        if (delhiIndex === -1) {
          delhiIndex = Math.max(
            0,
            delhiTimes.findIndex((t) => new Date(t).getTime() >= Date.now())
          );
        }

        const liveCo = coValues[delhiIndex] ?? coValues[0];
        const liveAqi = Number.isFinite(indoreAqi?.aqi) ? indoreAqi.aqi : null;
        const livePm25 = Number.isFinite(air?.pm25) ? air.pm25 : null;

        setLiveMetrics({
          aqi: Number.isFinite(liveAqi) ? Math.round(liveAqi) : "--",
          pm25: Number.isFinite(livePm25) ? `${Math.round(livePm25)} ug/m3` : "--",
          co: Number.isFinite(liveCo) ? `${Math.round(liveCo)} ug/m3` : "--"
        });

        if (delhiForecast?.hourly?.european_aqi?.length) {
          const values = delhiForecast.hourly.european_aqi;
          const trend = Array.from({ length: 7 }).map((_, day) => {
            const dayIndex = day * 24 + 12;
            return {
              day: new Date(delhiTimes[dayIndex] || Date.now()).toLocaleDateString([], { weekday: "short" }),
              aqi: Math.round(values[dayIndex] || 0)
            };
          });
          setDelhiTrend(trend);
        }

      })
      .catch(console.error);

    fetch("/api/live-aqi-chart?city=Delhi", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data?.points) ? data.points : null;
      })
      .then((points) => {
        if (!points?.length) return;
        setDelhiTrend(points.map((p) => ({ day: p.day, aqi: Math.round(p.aqi || 0) })));
      })
      .catch(console.error);
  }, [showNews]);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("/api/risk-explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question,
          currentAqi
        })
      });
      const data = await res.json();
      setResponse(data?.reply || data?.error || "Unable to reach AI. Please try again.");
    } catch (error) {
      console.error(error);
      setResponse("Unable to reach AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="risk-panel">
      <div>
        <div className="risk-title">GeoImpact Air Ai</div>
        <div className="risk-sub">Air Intelligence</div>
      </div>
      {showNews ? (
        <div className="risk-inner">
          {news.map((item, idx) => (
            <div key={item.url || item.title || idx} className="risk-news-row">
              <div>{item.title}</div>
              <div className="risk-sub">{item.description}</div>
              <div className="risk-sub">{toRelativeTime(item.publishedAt)}</div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="grid grid-3">
        <div className="risk-chip">AQI: {liveMetrics.aqi}</div>
        <div className="risk-chip">PM2.5: {liveMetrics.pm25}</div>
        <div className="risk-chip">CO: {liveMetrics.co}</div>
      </div>
      <div className="risk-inner" style={{ height: 280 }}>
        <div className="risk-sub">Delhi Live AQI Trend (7 Days)</div>
        <ResponsiveContainer>
          <LineChart data={delhiTrend}>
            <XAxis dataKey="day" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151" }} />
            <Line dataKey="aqi" stroke="#60A5FA" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="risk-inner">
        <div>🤖 AI Explanation</div>
        <div className="row mt-12">
          <input placeholder="Ask GeoImpact AI..." value={question} onChange={(e) => setQuestion(e.target.value)} />
          <button className="primary-btn" onClick={ask}>{loading ? "Loading..." : "Ask"}</button>
        </div>
        {response ? <p>{response}</p> : null}
      </div>
    </div>
  );
}
