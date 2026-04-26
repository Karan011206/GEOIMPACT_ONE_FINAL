export const dynamic = "force-dynamic";

type RiskLevel = "High" | "Medium" | "Low";

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

const NEWS_API_BASE = "https://newsapi.org/v2/everything";
const ALERT_CONTEXT_KEYWORDS = [
  "fuel",
  "petrol",
  "diesel",
  "oil",
  "crude",
  "food",
  "grain",
  "wheat",
  "rice",
  "edible oil",
  "logistics",
  "shipping",
  "ship",
  "freight",
  "port",
  "container",
  "cargo",
  "supply chain",
  "transport",
  "import",
  "export"
];

const ALERT_IMPACT_KEYWORDS = [
  "price rise",
  "price jump",
  "price spike",
  "price drop",
  "price fall",
  "inflation",
  "shortage",
  "disruption",
  "delay",
  "blocked",
  "blockade",
  "congestion",
  "strike",
  "reroute",
  "ban",
  "sanction",
  "cut",
  "supply shock"
];

const IRRELEVANT_TOPICS = [
  "football",
  "cricket",
  "movie",
  "celebrity",
  "entertainment",
  "fashion",
  "gaming",
  "music",
  "recipe"
];

function relativeTime(isoDate: string | undefined): string {
  if (!isoDate) return "just now";
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "just now";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function scoreFromText(text: string): number {
  const highRisk = ["war", "attack", "sanction", "shortage", "ban", "crisis"];
  const mediumRisk = ["delay", "strike", "surge", "inflation", "congestion", "disruption"];
  const lowRisk = ["monitor", "watch", "concern"];

  let score = 45;
  highRisk.forEach((kw) => {
    if (text.includes(kw)) score += 10;
  });
  mediumRisk.forEach((kw) => {
    if (text.includes(kw)) score += 6;
  });
  lowRisk.forEach((kw) => {
    if (text.includes(kw)) score += 2;
  });
  return Math.max(20, Math.min(98, score));
}

function containsAny(text: string, keywords: string[]) {
  return keywords.some((kw) => text.includes(kw));
}

function isRelevantAlert(text: string): boolean {
  if (containsAny(text, IRRELEVANT_TOPICS)) return false;
  const hasContext = containsAny(text, ALERT_CONTEXT_KEYWORDS);
  const hasImpact = containsAny(text, ALERT_IMPACT_KEYWORDS);
  return hasContext && hasImpact;
}

function isContextRelevantAlert(text: string): boolean {
  if (containsAny(text, IRRELEVANT_TOPICS)) return false;
  return containsAny(text, ALERT_CONTEXT_KEYWORDS);
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 75) return "High";
  if (score >= 55) return "Medium";
  return "Low";
}

export async function GET() {
  const apiKey = process.env.NEWS_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { error: "Missing NEWS_API_KEY in environment." },
      { status: 503 }
    );
  }

  const strictQuery =
    "(fuel OR petrol OR diesel OR oil OR food OR grain OR wheat OR rice OR logistics OR shipping OR freight OR port OR supply chain OR cargo) AND (price OR inflation OR disruption OR delay OR blocked OR congestion OR shortage OR strike OR sanction) AND (india OR global)";
  const broadQuery =
    "(fuel OR petrol OR diesel OR oil OR food OR grain OR logistics OR shipping OR freight OR port OR supply chain) AND (india OR global)";
  const strictUrl = `${NEWS_API_BASE}?q=${encodeURIComponent(strictQuery)}&language=en&sortBy=publishedAt&pageSize=30&apiKey=${encodeURIComponent(apiKey)}`;
  const broadUrl = `${NEWS_API_BASE}?q=${encodeURIComponent(broadQuery)}&language=en&sortBy=publishedAt&pageSize=30&apiKey=${encodeURIComponent(apiKey)}`;

  try {
    const strictRes = await fetch(strictUrl, { cache: "no-store" });
    const strictData = (await strictRes.json()) as NewsApiResponse;

    if (!strictRes.ok || strictData.status !== "ok") {
      return Response.json(
        { error: strictData.message || "Failed to fetch live alerts." },
        { status: strictRes.status || 502 }
      );
    }

    let alerts = (strictData.articles || [])
      .map((article) => {
      const title = article.title?.trim() || "Market risk update";
      const description =
        article.description?.trim() ||
        `Live update from ${article.source?.name || "news feed"}.`;
      const combinedText = `${title} ${description}`.toLowerCase();
      return { article, title, description, combinedText };
      })
      .filter((item) => isRelevantAlert(item.combinedText))
      .map((item) => {
      const { article, title, description, combinedText } = item;
      const score = scoreFromText(combinedText);
      const risk = riskFromScore(score);

      return {
        id: 0,
        title,
        risk,
        score,
        description,
        time: relativeTime(article.publishedAt),
        source: article.source?.name || "News API",
        publishedAt: article.publishedAt || null
      };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((alert, index) => ({ ...alert, id: index + 1 }));

    // Fallback: if strict impact filter returns empty, use broader context-only set.
    if (alerts.length === 0) {
      const broadRes = await fetch(broadUrl, { cache: "no-store" });
      const broadData = (await broadRes.json()) as NewsApiResponse;
      if (broadRes.ok && broadData.status === "ok") {
        alerts = (broadData.articles || [])
          .map((article) => {
            const title = article.title?.trim() || "Market risk update";
            const description =
              article.description?.trim() ||
              `Live update from ${article.source?.name || "news feed"}.`;
            const combinedText = `${title} ${description}`.toLowerCase();
            return { article, title, description, combinedText };
          })
          .filter((item) => isContextRelevantAlert(item.combinedText))
          .map((item) => {
            const { article, title, description, combinedText } = item;
            const score = scoreFromText(combinedText);
            const risk = riskFromScore(score);
            return {
              id: 0,
              title,
              risk,
              score,
              description,
              time: relativeTime(article.publishedAt),
              source: article.source?.name || "News API",
              publishedAt: article.publishedAt || null
            };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 6)
          .map((alert, index) => ({ ...alert, id: index + 1 }));
      }
    }

    return Response.json(alerts, { status: 200 });
  } catch (error) {
    console.error("ALERTS NEWS ERROR:", error);
    return Response.json(
      { error: "Alerts service unavailable. Try again shortly." },
      { status: 502 }
    );
  }
}
