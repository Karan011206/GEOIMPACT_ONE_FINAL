const AQI_NEWS_ROUTE = "/api/air-news";
const HAZARDOUS_KEYWORDS = ["hazardous", "severe", "toxic", "emergency", "very poor", "aqi 300", "aqi 400"];
const UNHEALTHY_KEYWORDS = ["unhealthy", "poor", "warning", "high pollution", "aqi 151", "aqi 200"];

function containsAny(text = "", keywords = []) {
  const source = text.toLowerCase();
  return keywords.some((keyword) => source.includes(keyword));
}

function inferRegion(text = "") {
  const source = text.toLowerCase();
  const knownRegions = ["indore", "delhi", "mumbai", "kolkata", "chennai", "india", "beijing", "london", "los angeles"];
  const region = knownRegions.find((name) => source.includes(name));
  if (!region) return "affected region";
  return region.charAt(0).toUpperCase() + region.slice(1);
}

export function getNewsLevel(title = "") {
  const text = title.toLowerCase();
  if (containsAny(text, HAZARDOUS_KEYWORDS)) return "danger";
  if (containsAny(text, UNHEALTHY_KEYWORDS)) return "warning";
  return "info";
}

function applyAlertPolicy(article) {
  const title = article?.title || "";
  const baseDescription = article?.description || "";
  const level = getNewsLevel(`${title} ${baseDescription}`);
  const region = inferRegion(`${title} ${baseDescription}`);

  if (level === "danger") {
    return {
      ...article,
      level,
      title: "🚨 Hazardous Air Quality Alert",
      description: `${region}: ${title || "Severe air quality conditions reported"}. Health warning: avoid outdoor activity, wear N95 masks, and keep vulnerable groups indoors.`
    };
  }

  if (level === "warning") {
    return {
      ...article,
      level,
      description: `${baseDescription || title}. Caution: limit prolonged outdoor exposure and use masks in traffic-heavy areas.`
    };
  }

  return {
    ...article,
    level,
    description: baseDescription || "Informational AQI update."
  };
}

export async function fetchAirNews() {
  const res = await fetch(AQI_NEWS_ROUTE, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`AQI news request failed with status ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data?.articles)) return [];
  return data.articles.map(applyAlertPolicy);
}
