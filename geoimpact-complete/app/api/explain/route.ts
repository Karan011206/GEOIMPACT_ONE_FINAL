export const dynamic = "force-dynamic";

const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 900;
const PREFERRED_MODELS = [
  GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite"
];
const MAX_RETRIES_PER_MODEL = 2;

type GeminiApiResponse = {
  error?: { message?: string };
  promptFeedback?: { blockReason?: string };
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

type ListModelsResponse = {
  models?: Array<{
    name?: string;
    supportedGenerationMethods?: string[];
  }>;
};

function extractGeminiText(data: GeminiApiResponse): string {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part?.text?.trim() || "")
    .filter(Boolean)
    .join(" ")
    .trim();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAvailableGenerateModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models",
      {
        headers: { "x-goog-api-key": apiKey },
        cache: "no-store",
      }
    );
    if (!res.ok) return [];

    const data = (await res.json()) as ListModelsResponse;
    const supported = (data.models || [])
      .filter((m) =>
        (m.supportedGenerationMethods || []).includes("generateContent")
      )
      .map((m) => m.name?.replace("models/", "").trim() || "")
      .filter(Boolean);
    return supported;
  } catch {
    return [];
  }
}

function normalizeLine(line: string) {
  return line.trim().replace(/^[\-\*\d\.\)\s]+/, "");
}

function getFallbackExplanation(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // Check if it's AQI related
  const aqiKeywords = ['aqi', 'air quality', 'pollution', 'pm2.5', 'pm10', 'air pollution', 'breathing', 'health', 'temperature', 'weather'];
  const isAqiRelated = aqiKeywords.some(keyword => lowerQuery.includes(keyword));
  
  if (!isAqiRelated) {
    return "- Sorry, I can only assist with AQI and air quality-related topics.";
  }
  
  // Provide contextual fallback responses
  if (lowerQuery.includes('health')) {
    return "- Poor air quality can cause respiratory issues, especially for sensitive groups.\n- Monitor AQI levels and limit outdoor activities when pollution is high.\n- Use air purifiers indoors and wear N95 masks if going outside during high pollution.";
  } else if (lowerQuery.includes('temperature') || lowerQuery.includes('weather')) {
    return "- Higher temperatures can worsen air quality by increasing ozone formation.\n- Wind helps disperse pollutants, while stagnant air traps them.\n- Temperature inversions in cold weather can trap pollutants near ground level.";
  } else if (lowerQuery.includes('pm2.5') || lowerQuery.includes('pm10')) {
    return "- PM2.5 are fine particles that can penetrate deep into lungs and bloodstream.\n- PM10 are larger particles that primarily affect respiratory system.\n- Both come from vehicle emissions, industrial processes, and construction activities.";
  } else if (lowerQuery.includes('safe') || lowerQuery.includes('protect')) {
    return "- Stay indoors when AQI exceeds 150, especially if you have respiratory conditions.\n- Use N95 masks for outdoor protection during high pollution days.\n- Keep windows closed and use air purifiers with HEPA filters indoors.";
  } else {
    return "- Monitor daily AQI levels using reliable air quality monitoring apps.\n- Limit outdoor activities during high pollution periods (AQI > 100).\n- Support air quality improvement by using public transport and reducing emissions.";
  }
}

function toStructuredBullets(text: string) {
  const cleaned = text
    .replace(/\r/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  const existingLines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const alreadyBulleted = existingLines.filter((line) => /^[-*]/.test(line));
  if (alreadyBulleted.length > 0) {
    return alreadyBulleted.slice(0, 3).map((line) => `- ${normalizeLine(line)}`).join("\n");
  }

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) return "";
  return sentences.slice(0, 3).map((line) => `- ${normalizeLine(line)}`).join("\n");
}

export async function POST(req: Request) {
  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { query } = body;

  if (!query) {
    return Response.json(
      { error: "Query is required" },
      { status: 400 }
    );
  }
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { error: "Missing GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY)." },
      { status: 503 }
    );
  }

  try {
    const prompt = `You are an expert assistant specialized ONLY in Air Quality Index (AQI) and closely related topics.
You must ONLY answer questions related to:
- AQI values, categories, and standards
- Air pollutants (PM2.5, PM10, CO, NO2, SO2, O3)
- Temperature, humidity, wind, and their impact on AQI
- Health effects of air pollution
- Pollution sources
- Weather impact on air quality
- Air quality monitoring, APIs, and sensors
- AQI preventive/safety measures
- Air quality regulations and policies

STRICT RULES:
- If a question is NOT related to AQI or air quality, reply exactly:
"Sorry, I can only assist with AQI and air quality-related topics."
- Keep the answer concise, accurate, and practical.
- Avoid speculation. If specific data is unavailable, say so clearly.
- If the user asks AQI status/forecast, include a brief temperature-related note when relevant.

OUTPUT FORMAT:
- Maximum 3 short bullet points.
- No intro, no outro, no extra commentary.

User query: ${query}`;

    const availableModels = await getAvailableGenerateModels(apiKey);
    const preferredUnique = Array.from(new Set(PREFERRED_MODELS.filter(Boolean)));
    const modelOrder =
      availableModels.length > 0
        ? preferredUnique.filter((model) => availableModels.includes(model))
        : preferredUnique;

    const createRequest = async (model: string, text: string) => {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            tools: [{ google_search: {} }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: MAX_OUTPUT_TOKENS,
            },
          }),
        }
      );

      let data: GeminiApiResponse = {};
      try {
        data = (await res.json()) as GeminiApiResponse;
      } catch {
        data = {};
      }
      return { res, data };
    };

    let data: GeminiApiResponse | null = null;
    let text = "";
    let finishReason = "";
    let promptBlockReason = "";
    let successfulModel = GEMINI_MODEL;
    let lastErrorMessage = "";
    let hasSuccess = false;

    for (const model of modelOrder) {
      for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt += 1) {
        const { res, data: responseData } = await createRequest(model, prompt);

        if (res.ok) {
          data = responseData;
          text = extractGeminiText(responseData);
          finishReason = responseData?.candidates?.[0]?.finishReason || "";
          promptBlockReason = responseData?.promptFeedback?.blockReason || "";
          successfulModel = model;
          hasSuccess = true;
          break;
        }

        const message = responseData?.error?.message || "Gemini API failed.";
        lastErrorMessage = message;
        const lower = message.toLowerCase();
        const isTemporaryOverload =
          res.status === 429 ||
          res.status >= 500 ||
          lower.includes("high demand") ||
          lower.includes("overloaded") ||
          lower.includes("try again later");

        if (isTemporaryOverload && attempt < MAX_RETRIES_PER_MODEL - 1) {
          await sleep(800 * (attempt + 1));
          continue;
        }
        break;
      }
      if (hasSuccess) break;
    }

    if (!hasSuccess || !data) {
      return Response.json(
        {
          error: lastErrorMessage || "AI service is temporarily busy. Please try again in a few seconds.",
        },
        { status: 503 }
      );
    }

    let answer = toStructuredBullets(text);

    if (!answer && finishReason === "MAX_TOKENS") {
      // Retry once with stricter brevity if first output is truncated/empty.
      const { data: retryData } = await createRequest(
        successfulModel,
        `${prompt}\nKeep the answer to at most 3 concise bullet points.`
      );
      const retryText = extractGeminiText(retryData || {});
      answer = toStructuredBullets(retryText);
    }

    if (!answer) {
      return Response.json(
        {
          error: promptBlockReason === "SAFETY"
            ? "Response was blocked (SAFETY). Try rephrasing your question."
            : "No response generated. Please ask a shorter, more specific question.",
        },
        { status: 503 }
      );
    }

    return Response.json({ answer, source: "gemini" }, { status: 200 });

  } catch (error) {
    console.error("GEMINI ERROR:", error);
    return Response.json({ error: "AI service unavailable. Try again shortly." }, { status: 502 });
  }
}