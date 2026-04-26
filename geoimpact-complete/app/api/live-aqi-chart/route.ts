export const dynamic = "force-dynamic";

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

type Point = {
  day: string;
  aqi: number;
};

function extractText(data: GeminiResponse): string {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p?.text || "").join("\n").trim();
}

function stripCodeFences(text: string): string {
  return text.replace(/```json|```/gi, "").trim();
}

function normalizeDayLabel(value: string): string {
  const raw = (value || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString([], { weekday: "short" });
  }
  return raw.slice(0, 3);
}

function parsePoints(text: string): Point[] {
  try {
    const parsed = JSON.parse(stripCodeFences(text));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        day: normalizeDayLabel(String(item?.day || "")),
        aqi: Number(item?.aqi)
      }))
      .filter((item) => item.day && Number.isFinite(item.aqi))
      .slice(0, 7);
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ error: "Missing GEMINI_API_KEY." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const city = (searchParams.get("city") || "Delhi").trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash-lite";

  const prompt = `Using live web sources, return ONLY valid JSON array with exactly 7 objects for AQI trend of ${city}, India.
Each object must be {"day":"Mon","aqi":123}.
Rules:
- Use real recent AQI observations (latest 7 days).
- day must be 3-letter weekday label.
- aqi must be integer between 0 and 500.
- Output ONLY raw JSON array with no markdown and no commentary.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 400 }
    }),
    cache: "no-store"
  });

  const data = (await res.json()) as GeminiResponse;
  if (!res.ok) {
    return Response.json({ error: data?.error?.message || "Gemini request failed." }, { status: 502 });
  }

  const text = extractText(data);
  const points = parsePoints(text);
  if (points.length < 3) {
    return Response.json({ error: "Gemini returned invalid AQI chart data.", raw: text }, { status: 502 });
  }

  return Response.json({ city, points, source: "gemini-live-web" }, { status: 200 });
}
