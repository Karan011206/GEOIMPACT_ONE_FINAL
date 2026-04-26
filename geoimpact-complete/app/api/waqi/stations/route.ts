export const dynamic = "force-dynamic";

const INDORE_BOUNDS = "22.5,75.5,23.0,76.2";

export async function GET() {
  const token =
    process.env.WAQI_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_WAQI_TOKEN?.trim() ||
    process.env.VITE_WAQI_TOKEN?.trim();
  if (!token) {
    return Response.json({ error: "Missing WAQI_TOKEN in environment." }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://api.waqi.info/map/bounds/?latlng=${INDORE_BOUNDS}&token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );
    const json = await res.json();
    if (!res.ok || json?.status !== "ok") {
      return Response.json({ error: json?.data || "WAQI stations unavailable." }, { status: 502 });
    }
    return Response.json({ stations: Array.isArray(json?.data) ? json.data : [] }, { status: 200 });
  } catch (error) {
    console.error("WAQI_STATIONS_ROUTE_ERROR:", error);
    return Response.json({ error: "WAQI stations unavailable." }, { status: 502 });
  }
}
