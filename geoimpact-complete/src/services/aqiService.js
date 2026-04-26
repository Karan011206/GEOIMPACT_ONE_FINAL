export async function fetchIndoreAqi() {
  const res = await fetch("/api/waqi/indore", { cache: "no-store" });
  if (!res.ok) throw new Error(`WAQI indore request failed: ${res.status}`);
  const data = await res.json();
  return data?.waqi || null;
}

export async function fetchNearbyStations() {
  const res = await fetch("/api/waqi/stations", { cache: "no-store" });
  if (!res.ok) throw new Error(`WAQI stations request failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.stations) ? data.stations : [];
}
