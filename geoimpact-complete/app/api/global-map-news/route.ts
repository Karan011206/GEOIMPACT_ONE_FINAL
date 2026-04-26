export const dynamic = "force-dynamic";

type CountrySeed = {
  id: string;
  country: string;
};

type NewsArticle = {
  title?: string;
  description?: string;
  publishedAt?: string;
  source?: { name?: string };
};

type NewsApiResponse = {
  status: string;
  articles?: NewsArticle[];
  message?: string;
};

type RiskLevel = "high" | "medium" | "low";

const NEWS_API_BASE = "https://newsapi.org/v2/everything";

const countries: CountrySeed[] = [
  { id: "usa", country: "United States" },
  { id: "brazil", country: "Brazil" },
  { id: "uk", country: "United Kingdom" },
  { id: "germany", country: "Germany" },
  { id: "uae", country: "United Arab Emirates" },
  { id: "russia", country: "Russia" },
  { id: "china", country: "China" },
  { id: "india", country: "India" },
  { id: "japan", country: "Japan" },
  { id: "south-africa", country: "South Africa" }
];

function scoreFromText(text: string): number {
  const highRisk = ["war", "attack", "sanction", "shortage", "ban", "blockade", "crisis"];
  const mediumRisk = ["delay", "strike", "surge", "inflation", "congestion", "disruption"];

  let score = 36;
  highRisk.forEach((kw) => {
    if (text.includes(kw)) score += 12;
  });
  mediumRisk.forEach((kw) => {
    if (text.includes(kw)) score += 7;
  });
  return Math.max(20, Math.min(96, score));
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 75) return "high";
  if (score >= 55) return "medium";
  return "low";
}

function indiaImpactFromText(text: string): string {
  if (text.includes("oil") || text.includes("energy") || text.includes("fuel")) {
    return "Potential fuel and freight cost pressure for India.";
  }
  if (text.includes("shipping") || text.includes("port") || text.includes("freight")) {
    return "Possible import lead-time delays for India.";
  }
  if (text.includes("food") || text.includes("grain") || text.includes("wheat") || text.includes("rice")) {
    return "May affect food inflation and edible imports in India.";
  }
  if (text.includes("chip") || text.includes("electronics") || text.includes("factory")) {
    return "Could disrupt electronics and manufacturing supply chains in India.";
  }
  return "Could influence trade costs and supply reliability for India.";
}

async function fetchCountryNews(apiKey: string, item: CountrySeed) {
  const query =
    `(${item.country}) AND (trade OR supply chain OR shipping OR port OR inflation OR fuel OR food OR sanctions OR disruption)`;
  const url = `${NEWS_API_BASE}?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=3&apiKey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json()) as NewsApiResponse;
  if (!res.ok || data.status !== "ok") {
    throw new Error(data.message || `Failed to fetch news for ${item.country}.`);
  }

  const top = data.articles?.[0];
  if (!top) {
    return {
      id: item.id,
      event: `No major live event found for ${item.country}.`,
      impactOnIndia: "No significant immediate impact signal for India.",
      riskScore: 24,
      riskLevel: "low" as RiskLevel,
      source: "News API"
    };
  }

  const title = top.title?.trim() || `Live update from ${item.country}`;
  const description = top.description?.trim() || "";
  const text = `${title} ${description}`.toLowerCase();
  const riskScore = scoreFromText(text);

  return {
    id: item.id,
    event: title,
    impactOnIndia: indiaImpactFromText(text),
    riskScore,
    riskLevel: riskFromScore(riskScore),
    source: top.source?.name || "News API"
  };
}

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { error: "Missing NEWS_API_KEY in environment." },
      { status: 503 }
    );
  }

  try {
    const result = await Promise.all(
      countries.map((item) => fetchCountryNews(apiKey, item))
    );
    return Response.json({ updatedAt: new Date().toISOString(), countries: result }, { status: 200 });
  } catch (error) {
    console.error("GLOBAL MAP NEWS ERROR:", error);
    return Response.json(
      { error: "Global map live news unavailable. Try again shortly." },
      { status: 502 }
    );
  }
}
