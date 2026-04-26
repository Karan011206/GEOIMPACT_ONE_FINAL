export const dynamic = "force-dynamic";

type NewsArticle = {
  title?: string;
  description?: string;
  publishedAt?: string;
  url?: string;
};

type NewsApiResponse = {
  status: string;
  articles?: NewsArticle[];
  message?: string;
};

type AlertLevel = "danger" | "warning" | "info";

const NEWS_API_BASE = "https://newsapi.org/v2/everything";
const AQI_KEYWORDS = [
  "aqi",
  "air quality",
  "air pollution",
  "pm2.5",
  "pm10",
  "smog",
  "wildfire",
  "industrial leak",
  "emissions",
  "pollution spike",
  "toxic air"
];
const HAZARDOUS_KEYWORDS = ["hazardous", "severe", "toxic", "emergency", "very poor", "aqi 300", "aqi 400"];
const UNHEALTHY_KEYWORDS = ["unhealthy", "poor", "warning", "high pollution", "aqi 151", "aqi 200"];

function containsAny(text = "", keywords: string[] = []) {
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

function getNewsLevel(text = ""): AlertLevel {
  const lower = text.toLowerCase();
  if (containsAny(lower, HAZARDOUS_KEYWORDS)) return "danger";
  if (containsAny(lower, UNHEALTHY_KEYWORDS)) return "warning";
  return "info";
}

function applyAlertPolicy(article: NewsArticle) {
  const title = article?.title || "";
  const baseDescription = article?.description || "";
  const level = getNewsLevel(`${title} ${baseDescription}`);
  const region = inferRegion(`${title} ${baseDescription}`);

  if (level === "danger") {
    return {
      ...article,
      level,
      title: "Hazardous Air Quality Alert",
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

export async function GET() {
  const apiKey =
    process.env.NEWS_API_KEY?.trim() ||
    process.env.GNEWS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GNEWS_TOKEN?.trim() ||
    process.env.VITE_GNEWS_TOKEN?.trim();
  if (!apiKey) {
    return Response.json(
      { error: "Missing News API key. Set NEWS_API_KEY (or VITE_GNEWS_TOKEN / NEXT_PUBLIC_GNEWS_TOKEN)." },
      { status: 503 }
    );
  }

  const query = "AQI OR air pollution OR smog OR PM2.5 OR PM10 OR wildfire OR industrial emissions India";
  const url = `${NEWS_API_BASE}?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as NewsApiResponse;
    if (!res.ok || data.status !== "ok") {
      console.error("AIR_NEWS_API_ERROR:", data?.message || res.statusText);
      return Response.json({ error: data?.message || "News API request failed." }, { status: 502 });
    }

    const filtered = (data.articles || []).filter((article) =>
      containsAny(`${article?.title || ""} ${article?.description || ""}`, AQI_KEYWORDS)
    );

    return Response.json({ articles: filtered.slice(0, 10).map(applyAlertPolicy) }, { status: 200 });
  } catch (error) {
    console.error("AIR_NEWS_ROUTE_ERROR:", error);
    return Response.json({ error: "News API unavailable." }, { status: 502 });
  }
}
