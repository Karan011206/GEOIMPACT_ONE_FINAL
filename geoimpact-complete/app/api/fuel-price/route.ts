export const dynamic = "force-dynamic";

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

const DEFAULT_CITY = "Delhi";

function extractPrice(text: string): number | null {
  const normalized = text.replace(/,/g, "");
  const matches = normalized.match(/\d+(?:\.\d+)?/g);
  if (!matches) return null;

  for (const raw of matches) {
    const value = Number(raw);
    if (Number.isFinite(value) && value > 50 && value < 200) {
      return Number(value.toFixed(2));
    }
  }
  return null;
}

export async function GET(req: Request) {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

  if (!apiKey) {
    return Response.json(
      { error: "Missing GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY)." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city")?.trim() || DEFAULT_CITY;

  try {
    const prompt = `Find the latest petrol price in ${city}, India.
Return only one numeric value in INR per litre (example: 96.72).
No extra text.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0, maxOutputTokens: 40 },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return Response.json(
        { error: data?.error?.message || "Gemini API failed." },
        { status: res.status }
      );
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    const price = extractPrice(text);
    if (price === null) {
      return Response.json(
        { error: "Could not parse live fuel price.", raw: text },
        { status: 502 }
      );
    }

    return Response.json(
      {
        city,
        fuelType: "petrol",
        unit: "INR/L",
        price,
        fetchedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FUEL PRICE ERROR:", error);
    return Response.json(
      { error: "Fuel price service unavailable. Try again shortly." },
      { status: 502 }
    );
  }
}
