export const dynamic = "force-dynamic";

type Trend = "up" | "down" | "flat";

type CategoryPrediction = {
  change: number;
  trend: Trend;
  signals: number;
};

type NewsArticle = {
  title?: string;
  description?: string;
};

type NewsApiResponse = {
  status: string;
  articles?: NewsArticle[];
  message?: string;
};

const NEWS_API_BASE = "https://newsapi.org/v2/everything";

function toText(article: NewsArticle) {
  return `${article.title || ""} ${article.description || ""}`.toLowerCase();
}

function containsAny(text: string, keywords: string[]) {
  return keywords.some((kw) => text.includes(kw));
}

function computeCategoryPrediction(
  articles: NewsArticle[],
  categoryKeywords: string[],
  negativeKeywords: string[]
): CategoryPrediction {
  let totalSignals = 0;
  let negativeSignals = 0;

  for (const article of articles) {
    const text = toText(article);
    if (!containsAny(text, categoryKeywords)) continue;
    totalSignals += 1;
    if (containsAny(text, negativeKeywords)) negativeSignals += 1;
  }

  if (totalSignals === 0) {
    return { change: 0, trend: "flat", signals: 0 };
  }

  const disruptionRatio = negativeSignals / totalSignals;
  const centered = (disruptionRatio - 0.5) * 20;
  const change = Math.round(centered * 10) / 10;
  const trend: Trend = change > 1 ? "up" : change < -1 ? "down" : "flat";

  return { change, trend, signals: totalSignals };
}

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { error: "Missing NEWS_API_KEY in environment." },
      { status: 503 }
    );
  }

  const query =
    "(india OR global) AND (fuel OR oil OR diesel OR petrol OR food OR grain OR wheat OR rice OR logistics OR shipping OR port OR freight OR supply chain)";
  const url = `${NEWS_API_BASE}?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=100&apiKey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = (await res.json()) as NewsApiResponse;

    if (!res.ok || data.status !== "ok") {
      return Response.json(
        { error: data.message || "Failed to fetch news data." },
        { status: res.status || 502 }
      );
    }

    const articles = data.articles || [];

    const negativeKeywords = [
      "shortage",
      "disruption",
      "delay",
      "strike",
      "conflict",
      "war",
      "sanction",
      "surge",
      "spike",
      "inflation",
      "congestion",
      "bottleneck",
      "crisis",
      "ban",
      "cut"
    ];

    const fuel = computeCategoryPrediction(
      articles,
      ["fuel", "petrol", "diesel", "oil", "crude", "gasoline", "energy"],
      negativeKeywords
    );
    const food = computeCategoryPrediction(
      articles,
      ["food", "grain", "wheat", "rice", "edible oil", "agri", "agriculture"],
      negativeKeywords
    );
    const logistics = computeCategoryPrediction(
      articles,
      ["logistics", "shipping", "freight", "port", "container", "supply chain", "transport"],
      negativeKeywords
    );

    return Response.json(
      {
        fuel,
        food,
        logistics,
        generatedAt: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PREDICTIONS NEWS ERROR:", error);
    return Response.json(
      { error: "Prediction service unavailable. Try again shortly." },
      { status: 502 }
    );
  }
}
