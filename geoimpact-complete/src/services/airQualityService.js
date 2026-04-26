// Replaces OpenWeather usage: fetch AQI/PM values from Open‑Meteo Air Quality (no API key).
const OPEN_METEO_AIR_QUALITY_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality";

function safeFirstNumber(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const n = Number(list[0]);
  return Number.isFinite(n) ? n : null;
}

export async function getAirQuality(lat, lon) {
  const url = `${OPEN_METEO_AIR_QUALITY_BASE}?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(
    lon
  )}&hourly=us_aqi,pm2_5,pm10&timezone=Asia%2FKolkata`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Open‑Meteo air quality request failed: ${res.status}`);

  const data = await res.json();

  // Requirement: use latest values at index 0.
  const aqi = safeFirstNumber(data?.hourly?.us_aqi);
  const pm25 = safeFirstNumber(data?.hourly?.pm2_5);
  const pm10 = safeFirstNumber(data?.hourly?.pm10);

  return { aqi, pm25, pm10 };
}

export async function fetchIndoreAirQuality() {
  // Single-location fetch only (no grid / no multiple coordinates).
  return getAirQuality(22.7196, 75.8577);
}

