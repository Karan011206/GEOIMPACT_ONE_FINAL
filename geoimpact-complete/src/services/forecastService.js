import axios from "axios";

const AIR_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=22.7196&longitude=75.8577&hourly=us_aqi,pm2_5,pm10,carbon_monoxide,dust,european_aqi&forecast_days=7&timezone=Asia%2FKolkata";
const DELHI_AIR_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=28.6139&longitude=77.2090&hourly=us_aqi,pm2_5,pm10,carbon_monoxide,dust,european_aqi&forecast_days=7&timezone=Asia%2FKolkata";

export async function fetchAqiForecast() {
  const { data } = await axios.get(AIR_URL);
  return data;
}

export async function fetchDelhiAqiForecast() {
  const { data } = await axios.get(DELHI_AIR_URL);
  return data;
}

function clampAqi(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(500, Math.round(n)));
}

function toHourLabel(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(isoString || "");
  }
}

function buildHourlyTrendFromOpenMeteo(openMeteoData) {
  const time = openMeteoData?.hourly?.time;
  const aqi = openMeteoData?.hourly?.us_aqi || openMeteoData?.hourly?.european_aqi;
  if (!Array.isArray(time) || !Array.isArray(aqi) || time.length !== aqi.length) return [];
  return time.slice(0, 24).map((t, idx) => ({ time: toHourLabel(t), aqi: clampAqi(aqi[idx]) }));
}

function buildWeeklyForecastFromOpenMeteo(openMeteoData) {
  const time = openMeteoData?.hourly?.time;
  const aqi = openMeteoData?.hourly?.us_aqi || openMeteoData?.hourly?.european_aqi;
  if (!Array.isArray(time) || !Array.isArray(aqi) || time.length !== aqi.length) return [];

  const byDay = new Map();
  for (let i = 0; i < time.length; i += 1) {
    const d = new Date(time[i]);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toISOString().slice(0, 10);
    const arr = byDay.get(key) || [];
    arr.push(clampAqi(aqi[i]));
    byDay.set(key, arr);
  }

  return Array.from(byDay.entries())
    .slice(0, 7)
    .map(([dayIso, values]) => {
      const avg = values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
      return {
        day: new Date(dayIso).toLocaleDateString([], { weekday: "short" }),
        aqi: clampAqi(avg)
      };
    });
}

export async function fetchWaqiForecastLive() {
  try {
    const res = await fetch("/api/waqi/indore", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const base = {
        waqi: data?.waqi || null,
        hourlyTrend: Array.isArray(data?.hourlyTrend) ? data.hourlyTrend : [],
        weeklyForecast: Array.isArray(data?.weeklyForecast) ? data.weeklyForecast : []
      };

      // WAQI endpoint currently does not provide an hourly trend; fill from Open‑Meteo so UI is never empty.
      if (!base.hourlyTrend.length || !base.weeklyForecast.length) {
        const fallback = await fetchAqiForecast();
        return {
          ...base,
          hourlyTrend: base.hourlyTrend.length ? base.hourlyTrend : buildHourlyTrendFromOpenMeteo(fallback),
          weeklyForecast: base.weeklyForecast.length ? base.weeklyForecast : buildWeeklyForecastFromOpenMeteo(fallback)
        };
      }

      return base;
    }
  } catch {
    // fall through to open-meteo fallback
  }

  const fallback = await fetchAqiForecast();
  return {
    waqi: null,
    hourlyTrend: buildHourlyTrendFromOpenMeteo(fallback),
    weeklyForecast: buildWeeklyForecastFromOpenMeteo(fallback)
  };
}
