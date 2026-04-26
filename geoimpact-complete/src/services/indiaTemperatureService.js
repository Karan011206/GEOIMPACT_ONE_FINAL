// Fetches real-time temperature data for major Indian cities
// Used by the India temperature heatmap

const OPEN_METEO_FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";

// Major Indian cities with their coordinates
const INDIAN_CITIES = [
  { name: "Delhi", lat: 28.6139, lon: 77.2090 },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
  { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
  { name: "Chennai", lat: 13.0827, lon: 80.2707 },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
  { name: "Hyderabad", lat: 17.3850, lon: 78.4867 },
  { name: "Pune", lat: 18.5204, lon: 73.8567 },
  { name: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
  { name: "Jaipur", lat: 26.9124, lon: 75.7873 },
  { name: "Lucknow", lat: 26.8467, lon: 80.9462 },
  { name: "Kanpur", lat: 26.4499, lon: 80.3319 },
  { name: "Nagpur", lat: 21.1458, lon: 79.0882 },
  { name: "Indore", lat: 22.7196, lon: 75.8577 },
  { name: "Thane", lat: 19.2183, lon: 72.9781 },
  { name: "Bhopal", lat: 23.2599, lon: 77.4126 },
  { name: "Visakhapatnam", lat: 17.6868, lon: 83.2185 },
  { name: "Pimpri-Chinchwad", lat: 18.6298, lon: 73.7997 },
  { name: "Patna", lat: 25.5941, lon: 85.1376 },
  { name: "Vadodara", lat: 22.3072, lon: 73.1812 },
  { name: "Ghaziabad", lat: 28.6692, lon: 77.4538 },
  { name: "Ludhiana", lat: 30.9010, lon: 75.8573 },
  { name: "Agra", lat: 27.1767, lon: 78.0081 },
  { name: "Nashik", lat: 19.9975, lon: 73.7898 },
  { name: "Faridabad", lat: 28.4089, lon: 77.3178 },
  { name: "Meerut", lat: 28.9845, lon: 77.7064 },
  { name: "Rajkot", lat: 22.3039, lon: 70.8022 },
  { name: "Kalyan-Dombivali", lat: 19.2403, lon: 73.1355 },
  { name: "Vasai-Virar", lat: 19.4912, lon: 72.8397 },
  { name: "Varanasi", lat: 25.3176, lon: 82.9739 },
  { name: "Srinagar", lat: 34.0837, lon: 74.7973 },
  { name: "Dhanbad", lat: 23.7957, lon: 86.4304 },
  { name: "Jodhpur", lat: 26.2389, lon: 73.0243 },
  { name: "Kochi", lat: 9.9312, lon: 76.2673 },
  { name: "Coimbatore", lat: 11.0168, lon: 76.9558 },
  { name: "Kota", lat: 25.2138, lon: 75.8648 },
  { name: "Guwahati", lat: 26.1445, lon: 91.7362 },
  { name: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  { name: "Hubli-Dharwad", lat: 15.3647, lon: 75.1240 },
  { name: "Cuttack", lat: 20.4625, lon: 85.8830 },
  { name: "Raipur", lat: 21.2514, lon: 81.6296 },
  { name: "Madurai", lat: 9.9252, lon: 78.1198 },
  { name: "Vijayawada", lat: 16.5062, lon: 80.6480 },
  { name: "Aurangabad", lat: 19.8762, lon: 75.3433 }
];

export async function getTemperatureForCity(lat, lon) {
  const url = `${OPEN_METEO_FORECAST_BASE}?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(
    lon
  )}&current=temperature_2m&timezone=Asia%2FKolkata`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Open‑Meteo temperature request failed: ${res.status}`);
  const data = await res.json();
  const t = Number(data?.current?.temperature_2m);
  return Number.isFinite(t) ? t : null;
}

export async function getAllIndiaTemperatures() {
  const temperaturePromises = INDIAN_CITIES.map(async (city) => {
    try {
      const temperature = await getTemperatureForCity(city.lat, city.lon);
      return {
        ...city,
        temperature,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Failed to fetch temperature for ${city.name}:`, error);
      return {
        ...city,
        temperature: null,
        error: true,
        timestamp: new Date().toISOString()
      };
    }
  });

  const results = await Promise.allSettled(temperaturePromises);
  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value)
    .filter(city => city.temperature !== null);
}

export function getIndianCities() {
  return INDIAN_CITIES;
}

export function getTemperatureColor(temp) {
  if (temp === null || temp === undefined) return '#6b7280';
  
  if (temp <= 10) return '#3b82f6'; // Blue - Cold
  if (temp <= 20) return '#06b6d4'; // Cyan - Cool
  if (temp <= 25) return '#10b981'; // Green - Mild
  if (temp <= 30) return '#eab308'; // Yellow - Warm
  if (temp <= 35) return '#f97316'; // Orange - Hot
  if (temp <= 40) return '#ef4444'; // Red - Very Hot
  return '#7f1d1d'; // Dark Red - Extreme
}

export function getTemperatureLevel(temp) {
  if (temp === null || temp === undefined) return 'Unknown';
  
  if (temp <= 10) return 'Cold';
  if (temp <= 20) return 'Cool';
  if (temp <= 25) return 'Mild';
  if (temp <= 30) return 'Warm';
  if (temp <= 35) return 'Hot';
  if (temp <= 40) return 'Very Hot';
  return 'Extreme';
}
