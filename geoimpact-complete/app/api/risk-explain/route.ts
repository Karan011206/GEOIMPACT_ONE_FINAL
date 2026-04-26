export const dynamic = "force-dynamic";

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

type ListModelsResponse = {
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }>;
};

const PREFERRED_MODELS = [
  process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash"
];

function extractGeminiText(data: GeminiResponse): string {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part?.text?.trim() || "")
    .filter(Boolean)
    .join(" ")
    .trim();
}

async function getAvailableGenerateModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey },
      cache: "no-store"
    });
    if (!res.ok) return [];
    const data = (await res.json()) as ListModelsResponse;
    return (data.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => m.name?.replace("models/", "").trim() || "")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getFallbackResponse(question: string, currentAqi: number): string {
  const lowerQuestion = question.toLowerCase();
  
  // Check if it's AQI related
  const aqiKeywords = ['aqi', 'air quality', 'pollution', 'pm2.5', 'pm10', 'air pollution', 'breathing', 'health'];
  const isAqiRelated = aqiKeywords.some(keyword => lowerQuestion.includes(keyword));
  
  if (!isAqiRelated) {
    return "Sorry, I can only assist with AQI and air quality-related topics.";
  }
  
  // Provide contextual fallback responses based on AQI level
  if (currentAqi <= 50) {
    return `Air quality is good (AQI: ${currentAqi}). Safe for outdoor activities. Continue normal monitoring.`;
  } else if (currentAqi <= 100) {
    return `Air quality is moderate (AQI: ${currentAqi}). Generally acceptable for most people. Sensitive groups should consider limiting prolonged outdoor exertion.`;
  } else if (currentAqi <= 150) {
    return `Air quality is unhealthy for sensitive groups (AQI: ${currentAqi}). Children, elderly, and those with respiratory conditions should reduce outdoor activities.`;
  } else if (currentAqi <= 200) {
    return `Air quality is unhealthy (AQI: ${currentAqi}). Everyone should reduce prolonged outdoor exposure. Consider wearing N95 masks if going outside.`;
  } else {
    return `Air quality is very unhealthy/hazardous (AQI: ${currentAqi}). Avoid all outdoor activities. Stay indoors with air purifiers if available.`;
  }
}

async function askGemini(question: string, currentAqi: number) {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY).");
  }

  const prompt = `You are an expert assistant specialized ONLY in Air Quality Index (AQI) and closely related topics.
Current Indore AQI: ${currentAqi}.

Allowed topics:
- AQI values, categories, standards
- PM2.5, PM10, CO, NO2, SO2, O3
- Temperature, humidity, wind, and how they influence AQI
- Health effects of air pollution
- Pollution sources
- Weather impact on air quality
- Air quality monitoring and sensors
- AQI preventive measures and regulations

STRICT RULES:
- If not AQI/air-quality related, reply exactly:
"Sorry, I can only assist with AQI and air quality-related topics."
- Keep response concise (2-3 sentences max).
- Avoid speculation; if data is unavailable, say so.
- For time-sensitive facts, use web-grounded retrieval and mention if live data was unavailable.
- If the user asks AQI status, include a short temperature-related insight when relevant.

Question: ${question}`;

  const availableModels = await getAvailableGenerateModels(apiKey);
  const preferredUnique = Array.from(new Set(PREFERRED_MODELS.filter(Boolean)));
  const uniqueModels =
    availableModels.length > 0
      ? preferredUnique.filter((model) => availableModels.includes(model))
      : preferredUnique;
  let lastError = "";

  for (const model of uniqueModels) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${prompt}\nReturn a complete answer in exactly 2 short sentences.` }] }],
            tools: [{ google_search: {} }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 240 }
          })
        }
      );

      const data = (await res.json()) as GeminiResponse;
      if (res.ok) {
        const text = extractGeminiText(data);
        if (text) return text;
        continue;
      }

      lastError = data?.error?.message || `Gemini request failed for ${model}.`;
      const lowered = lastError.toLowerCase();
      const canTryNextModel =
        res.status === 429 ||
        res.status >= 500 ||
        lowered.includes("quota") ||
        lowered.includes("rate limit") ||
        lowered.includes("resource exhausted") ||
        lowered.includes("not found") ||
        lowered.includes("not supported");

      if (!canTryNextModel) break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Network error occurred";
      // Continue to next model on network errors
      continue;
    }
  }

  // If all models fail, throw error instead of returning fallback
  throw new Error(lastError || "Gemini request failed.");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { question?: string; currentAqi?: number };
    const question = body?.question?.trim();
    const currentAqi = Number(body?.currentAqi || 0);

    if (!question) {
      return Response.json({ error: "Question is required." }, { status: 400 });
    }

    try {
      const geminiAnswer = await askGemini(question, currentAqi);
      if (geminiAnswer) {
        return Response.json({ 
          reply: geminiAnswer, 
          source: "gemini",
          isFallback: false 
        });
      }
    } catch (error) {
      console.error("RISK_EXPLAIN_ERROR:", error);
      const message = error instanceof Error ? error.message : "";
      if (message.toLowerCase().includes("quota") || message.toLowerCase().includes("rate")) {
        return Response.json(
          { error: "Gemini quota is temporarily exhausted. Please retry in a minute." },
          { status: 429 }
        );
      }
      return Response.json(
        { error: message || "AI service is temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    return Response.json({ error: "Unable to get AI response. Please try again." }, { status: 503 });
  } catch (error) {
    console.error("RISK_EXPLAIN_ROUTE_ERROR:", error);
    return Response.json({ error: "Service temporarily unavailable. Please try again." }, { status: 500 });
  }
}
