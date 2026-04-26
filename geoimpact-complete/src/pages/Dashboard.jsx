"use client";
import { useEffect, useMemo, useState } from "react";
import MetricCard from "@/src/components/dashboard/MetricCard";
import AqiTrendChart from "@/src/components/dashboard/AqiTrendChart";
import ZoneAqiList from "@/src/components/dashboard/ZoneAqiList";
import AlertFeed from "@/src/components/dashboard/AlertFeed";
import HealthRecommendations from "@/src/components/dashboard/HealthRecommendations";
import { fetchIndoreAqi, fetchNearbyStations } from "@/src/services/aqiService";
import { fetchWaqiForecastLive } from "@/src/services/forecastService";
import { fetchAirNews } from "@/src/services/newsService";

export default function Dashboard() {
  const [state, setState] = useState({
    loading: true,
    stale: false,
    aqi: 0,
    waqi: null,
    stations: [],
    forecast: null,
    news: []
  });

  useEffect(() => {
    const load = async () => {
      // Real-time India feed: WAQI (Indore) + nearby WAQI stations + forecast + air news.
      const [waqiRes, stationsRes, forecastRes, newsRes] = await Promise.allSettled([
        fetchIndoreAqi(),
        fetchNearbyStations(),
        fetchWaqiForecastLive(),
        fetchAirNews()
      ]);

      if (waqiRes.status === "rejected") {
        console.error("WAQI_LOAD_ERROR:", waqiRes.reason);
      }

      if (stationsRes.status === "rejected") {
        console.error("STATIONS_LOAD_ERROR:", stationsRes.reason);
      }

      if (forecastRes.status === "rejected") {
        console.error("FORECAST_LOAD_ERROR:", forecastRes.reason);
      }

      if (newsRes.status === "rejected") {
        console.error("NEWS_LOAD_ERROR:", newsRes.reason);
      }

      setState({
        loading: false,
        stale:
          waqiRes.status === "rejected" ||
          stationsRes.status === "rejected" ||
          forecastRes.status === "rejected" ||
          newsRes.status === "rejected",
        aqi: waqiRes.status === "fulfilled" && Number.isFinite(waqiRes.value?.aqi) ? waqiRes.value.aqi : 0,
        waqi: waqiRes.status === "fulfilled" ? waqiRes.value : null,
        stations: stationsRes.status === "fulfilled" ? stationsRes.value : [],
        forecast: forecastRes.status === "fulfilled" ? forecastRes.value : null,
        news: newsRes.status === "fulfilled" ? newsRes.value : []
      });
    };
    load();
  }, []);

  const trend = useMemo(() => {
    const hourlyTrend = state.forecast?.hourlyTrend || [];
    if (hourlyTrend.length) {
      return hourlyTrend.map((point) => ({ hour: point.time, aqi: Math.round(point.aqi || state.aqi) }));
    }
    return [];
  }, [state.forecast, state.aqi]);

  if (state.loading) return <div className="skeleton-grid"><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>;

  return (
    <div className="stack-lg">
      <div className="grid grid-4">
        <MetricCard label="Overall AQI" value={state.waqi?.aqi || "--"} />
        <MetricCard label="PM2.5" value={state.waqi?.iaqi?.pm25?.v || "--"} unit="ug/m3" tone="light" />
        <MetricCard label="PM10" value={state.waqi?.iaqi?.pm10?.v || "--"} unit="ug/m3" tone="light" />
        <MetricCard label="CO" value={state.waqi?.iaqi?.co?.v || "--"} unit="ppm" tone="light" />
      </div>
      <div className="grid grid-4">
        <MetricCard label="Temperature" value={state.waqi?.iaqi?.t?.v ?? "--"} unit="°C" tone="light" />
        <MetricCard label="Humidity" value={state.waqi?.iaqi?.h?.v ?? "--"} unit="%" tone="light" />
        <MetricCard label="Wind" value={state.waqi?.iaqi?.w?.v ?? "--"} unit="m/s" tone="light" />
        <MetricCard label="Ozone (O3)" value={state.waqi?.iaqi?.o3?.v ?? "--"} unit="ug/m3" tone="light" />
      </div>
      <div className="grid grid-2">
        <AqiTrendChart points={trend} />
        <ZoneAqiList stations={state.stations} />
      </div>
      <div className="grid grid-2">
        <AlertFeed items={state.news} />
        <HealthRecommendations aqi={state.aqi} morningGood={trend.some((t) => t.hour.includes("AM") && t.aqi < 100)} />
      </div>
    </div>
  );
}
