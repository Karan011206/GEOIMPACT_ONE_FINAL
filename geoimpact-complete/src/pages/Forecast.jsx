"use client";
import { useEffect, useMemo, useState } from "react";
import HourlyForecast from "@/src/components/forecast/HourlyForecast";
import WeeklyChart from "@/src/components/forecast/WeeklyChart";
import PredictionFactors from "@/src/components/forecast/PredictionFactors";
import { fetchWaqiForecastLive } from "@/src/services/forecastService";
import { fetchIndoreAirQuality } from "@/src/services/airQualityService";

export default function Forecast() {
  const [forecast, setForecast] = useState(null);
  const [airQuality, setAirQuality] = useState(null);
  useEffect(() => {
    fetchWaqiForecastLive().then(setForecast).catch(console.error);
    // Replaces OpenWeather: use Open‑Meteo Air Quality (no API key).
    fetchIndoreAirQuality().then(setAirQuality).catch((error) => {
      console.error("AIR_QUALITY_LOAD_ERROR:", error);
      setAirQuality(null);
    });
  }, []);

  const hourly = useMemo(() => {
    return (forecast?.hourlyTrend || []).map((point) => ({
      time: point.time,
      aqi: Math.round(point.aqi || 0)
    }));
  }, [forecast]);

  const weekly = useMemo(() => {
    return (forecast?.weeklyForecast || []).map((point) => ({
      day: point.day,
      aqi: Math.round(point.aqi || 0)
    }));
  }, [forecast]);

  if (!forecast) {
    return (
      <div className="skeleton-grid">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <HourlyForecast points={hourly.slice(0, 6)} />
      <div className="grid grid-2">
        <WeeklyChart data={weekly} />
        <PredictionFactors airQuality={airQuality} />
      </div>
    </div>
  );
}
