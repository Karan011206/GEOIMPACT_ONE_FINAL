export const dynamic = "force-dynamic";

type WaqiDailyPoint = {
  day?: string;
  avg?: number;
};

type WaqiFeed = {
  aqi?: number;
  forecast?: {
    daily?: {
      pm25?: WaqiDailyPoint[];
    };
  };
};

type WaqiMapStation = {
  uid?: number;
  aqi?: string | number;
  lat?: number;
  lon?: number;
};

function clampAqi(value: number) {
  return Math.max(0, Math.min(500, Math.round(value)));
}

function buildWeeklyForecast(points: WaqiDailyPoint[]) {
  return points
    .filter((p) => p?.day && Number.isFinite(p?.avg))
    .slice(0, 7)
    .map((p) => ({
      day: new Date(String(p.day)).toLocaleDateString([], { weekday: "short" }),
      aqi: clampAqi(Number(p.avg))
    }));
}

export async function GET() {
  const token =
    process.env.WAQI_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_WAQI_TOKEN?.trim() ||
    process.env.VITE_WAQI_TOKEN?.trim();
  if (!token) {
    return Response.json({ error: "Missing WAQI_TOKEN in environment." }, { status: 503 });
  }

  try {
    const feedFromIndore = await fetch(`https://api.waqi.info/feed/indore/?token=${encodeURIComponent(token)}`, {
      cache: "no-store"
    });
    let json = await feedFromIndore.json();

    if (!feedFromIndore.ok || json?.status !== "ok") {
      const boundsRes = await fetch(
        `https://api.waqi.info/map/bounds/?latlng=22.5,75.5,23.0,76.2&token=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      );
      const boundsJson = await boundsRes.json();
      const stations = Array.isArray(boundsJson?.data) ? (boundsJson.data as WaqiMapStation[]) : [];
      const bestStation = stations.find((s) => Number.isFinite(Number(s?.uid)));
      const uid = bestStation?.uid;

      if (!uid) {
        return Response.json({ error: json?.data || "WAQI feed unavailable." }, { status: 502 });
      }

      const uidRes = await fetch(`https://api.waqi.info/feed/@${uid}/?token=${encodeURIComponent(token)}`, {
        cache: "no-store"
      });
      json = await uidRes.json();
      if (!uidRes.ok || json?.status !== "ok") {
        return Response.json({ error: json?.data || "WAQI feed unavailable." }, { status: 502 });
      }
    }

    const waqi = (json?.data || {}) as WaqiFeed;
    const pm25Daily = waqi?.forecast?.daily?.pm25 || [];
    const weeklyForecast = buildWeeklyForecast(pm25Daily);

    return Response.json({ waqi, hourlyTrend: [], weeklyForecast }, { status: 200 });
  } catch (error) {
    console.error("WAQI_INDORE_ROUTE_ERROR:", error);
    return Response.json({ error: "WAQI feed unavailable." }, { status: 502 });
  }
}
