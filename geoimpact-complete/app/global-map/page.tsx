"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then(mod => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then(mod => mod.CircleMarker),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("react-leaflet").then(mod => mod.Tooltip),
  { ssr: false }
);

type RiskLevel = "high" | "medium" | "low";

type CountryRisk = {
  id: string;
  country: string;
  lat: number;
  lng: number;
  riskLevel: RiskLevel;
  event: string;
  impactOnIndia: string;
  riskScore: number;
};

type LiveCountryUpdate = {
  id: string;
  event: string;
  impactOnIndia: string;
  riskScore: number;
  riskLevel: RiskLevel;
  source?: string;
};

type LiveMapApiResponse = {
  updatedAt: string;
  countries: LiveCountryUpdate[];
};

const countryRisks: CountryRisk[] = [
  {
    id: "usa",
    country: "United States",
    lat: 37.09,
    lng: -95.71,
    riskLevel: "medium",
    event: "Port congestion on West Coast",
    impactOnIndia: "Delayed electronics and machinery components.",
    riskScore: 61
  },
  {
    id: "brazil",
    country: "Brazil",
    lat: -14.23,
    lng: -51.92,
    riskLevel: "low",
    event: "Stable commodity exports",
    impactOnIndia: "Soybean supply steady.",
    riskScore: 32
  },
  {
    id: "uk",
    country: "United Kingdom",
    lat: 55.37,
    lng: -3.43,
    riskLevel: "low",
    event: "Currency stability",
    impactOnIndia: "Lower import uncertainty.",
    riskScore: 28
  },
  {
    id: "germany",
    country: "Germany",
    lat: 51.16,
    lng: 10.45,
    riskLevel: "medium",
    event: "Energy price fluctuations",
    impactOnIndia: "Higher equipment cost.",
    riskScore: 54
  },
  {
    id: "uae",
    country: "UAE",
    lat: 23.42,
    lng: 53.84,
    riskLevel: "medium",
    event: "Shipping delays",
    impactOnIndia: "Petrochemical delay.",
    riskScore: 58
  },
  {
    id: "russia",
    country: "Russia",
    lat: 61.52,
    lng: 105.31,
    riskLevel: "high",
    event: "Sanctions",
    impactOnIndia: "Trade insurance cost up.",
    riskScore: 82
  },
  {
    id: "china",
    country: "China",
    lat: 35.86,
    lng: 104.19,
    riskLevel: "high",
    event: "Factory slowdown",
    impactOnIndia: "Electronics supply risk.",
    riskScore: 86
  },
  {
    id: "india",
    country: "India",
    lat: 20.59,
    lng: 78.96,
    riskLevel: "low",
    event: "Stable demand",
    impactOnIndia: "Baseline market.",
    riskScore: 24
  },
  {
    id: "japan",
    country: "Japan",
    lat: 36.20,
    lng: 138.25,
    riskLevel: "low",
    event: "Stable output",
    impactOnIndia: "Auto parts steady.",
    riskScore: 35
  },
  {
    id: "south-africa",
    country: "South Africa",
    lat: -30.55,
    lng: 22.93,
    riskLevel: "medium",
    event: "Mining delays",
    impactOnIndia: "Metal supply delay.",
    riskScore: 57
  }
];

const levelLabel: Record<RiskLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Safe"
};

const levelColor: Record<RiskLevel, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e"
};

export default function GlobalMapPage() {
  const [selectedCountryId, setSelectedCountryId] = useState(countryRisks[0].id);
  const worldCenter: LatLngExpression = [20, 0];
  const [liveUpdates, setLiveUpdates] = useState<Record<string, LiveCountryUpdate>>({});
  const [liveError, setLiveError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadLiveUpdates = async () => {
      try {
        const res = await fetch("/api/global-map-news", { cache: "no-store" });
        const payload = (await res.json()) as LiveMapApiResponse | { error?: string };
        if (cancelled) return;

        if (!res.ok || !("countries" in payload) || !Array.isArray(payload.countries)) {
          setLiveError(("error" in payload && payload.error) || "Failed to load live country news.");
          return;
        }

        const nextById: Record<string, LiveCountryUpdate> = {};
        payload.countries.forEach((item) => {
          nextById[item.id] = item;
        });
        setLiveUpdates(nextById);
        setLiveError("");
      } catch {
        if (!cancelled) setLiveError("Failed to load live country news.");
      }
    };

    loadLiveUpdates();
    const intervalId = window.setInterval(loadLiveUpdates, 120000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const mergedCountries = useMemo(
    () =>
      countryRisks.map((item) => {
        const live = liveUpdates[item.id];
        if (!live) return item;
        return {
          ...item,
          event: live.event,
          impactOnIndia: live.impactOnIndia,
          riskScore: live.riskScore,
          riskLevel: live.riskLevel
        };
      }),
    [liveUpdates]
  );

  const selectedCountry = useMemo(
    () => mergedCountries.find(item => item.id === selectedCountryId) ?? mergedCountries[0],
    [mergedCountries, selectedCountryId]
  );

  return (
    <div className="section-shell">
      <div className="card">
        <h2 className="panel-title">Global Risk Map</h2>
        <p className="muted">
          🌍 Click on markers to see impact on India
        </p>
      </div>

      <div className="grid grid-2">
        
        {/* 🌍 REAL MAP */}
        <div className="card" style={{ minHeight: 420 }}>
          <div style={{ marginBottom: 12 }}>
            <strong>World Map</strong>
          </div>

          <MapContainer
            center={worldCenter}
            zoom={2}
            style={{
              height: 340,
              width: "100%",
              borderRadius: 12
            }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mergedCountries.map((item) => (
              <CircleMarker
                key={item.id}
                center={[item.lat, item.lng]}
                radius={8}
                pathOptions={{ color: levelColor[item.riskLevel] }}
                eventHandlers={{
                  click: () => setSelectedCountryId(item.id),
                }}
              >
                <Tooltip>{item.country}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* 📊 INFO PANEL */}
        <div className="card">
          <h3 className="panel-title">{selectedCountry.country}</h3>
          {liveError ? <div className="muted" style={{ marginBottom: 8 }}>{liveError}</div> : null}

          <span className={`badge ${selectedCountry.riskLevel}`}>
            {levelLabel[selectedCountry.riskLevel]} Risk
          </span>

          <div className="grid" style={{ marginTop: 12 }}>
            <div className="card">
              <div>Event</div>
              <div>{selectedCountry.event}</div>
            </div>

            <div className="card">
              <div>Impact on India</div>
              <div>{selectedCountry.impactOnIndia}</div>
            </div>

            <div className="card">
              <div>Risk Score</div>
              <div>{selectedCountry.riskScore}/100</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
