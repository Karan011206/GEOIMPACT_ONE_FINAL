// Fetches real-time temperature for a single location (no API key).
// Used by the temperature heatmap clicks on the Live Map section.

const OPEN_METEO_FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";

export async function getTemperature(lat, lon) {
  const url = `${OPEN_METEO_FORECAST_BASE}?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(
    lon
  )}&current=temperature_2m&timezone=Asia%2FKolkata`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Open‑Meteo temperature request failed: ${res.status}`);
  const data = await res.json();
  const t = Number(data?.current?.temperature_2m);
  return Number.isFinite(t) ? t : null;
}

