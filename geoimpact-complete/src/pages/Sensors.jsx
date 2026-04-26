"use client";
import { useEffect, useMemo, useState } from "react";
import MetricCard from "@/src/components/dashboard/MetricCard";
import SensorList from "@/src/components/sensors/SensorList";
import { fetchIndoreAqi, fetchNearbyStations } from "@/src/services/aqiService";

const fallback = [
  { id: "S01", loc: "Vijay Nagar Market", status: "online" }, { id: "S02", loc: "Palasia Square", status: "online" },
  { id: "S03", loc: "AB Road Flyover", status: "online" }, { id: "S04", loc: "IIM Indore", status: "online" },
  { id: "S05", loc: "Rajwada Garden", status: "online" }, { id: "S06", loc: "Super Corridor", status: "online" },
  { id: "S07", loc: "Bhawarkuan", status: "warn" }, { id: "S08", loc: "Nipania", status: "online" },
  { id: "S09", loc: "Aerodrome Road", status: "online" }, { id: "S10", loc: "Lasudia Mori", status: "online" },
  { id: "S11", loc: "Kanadiya Road", status: "offline" }, { id: "S12", loc: "Rau", status: "offline" },
  { id: "S13", loc: "Simrol", status: "online" }, { id: "S14", loc: "Mhow Bypass", status: "warn" },
  { id: "S15", loc: "Manglia", status: "online" }, { id: "S16", loc: "Pithampur", status: "offline" }
];

export default function Sensors() {
  const [baseAqi, setBaseAqi] = useState(120);
  const [stations, setStations] = useState([]);
  useEffect(() => {
    fetchIndoreAqi().then((d) => setBaseAqi(d?.aqi || 120)).catch(console.error);
    fetchNearbyStations().then(setStations).catch(console.error);
  }, []);
  const sensors = useMemo(() => {
    const fromApi = stations.map((s, i) => ({ id: `W${i + 1}`, loc: s.station?.name || `Station ${i + 1}`, status: (s.aqi || 0) > 170 ? "warn" : "online", aqi: s.aqi || baseAqi }));
    const combined = fromApi.length >= 16 ? fromApi : [...fromApi, ...fallback.slice(0, 16 - fromApi.length).map((f, i) => ({ ...f, aqi: baseAqi + ((i % 5) - 2) * 10 }))];
    return combined;
  }, [stations, baseAqi]);

  return (
    <div className="stack-lg">
      <div className="grid grid-4">
        <MetricCard label="Total" value="28" tone="light" />
        <MetricCard label="Online" value="24" tone="light" />
        <MetricCard label="Offline" value="4" tone="light" />
        <MetricCard label="Coverage" value="86%" tone="light" />
      </div>
      <SensorList sensors={sensors} />
    </div>
  );
}
