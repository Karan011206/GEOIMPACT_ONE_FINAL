"use client";
import { useEffect, useState } from "react";
import AirQualityAlerts from "@/src/components/alerts/AirQualityAlerts";
import GeoImpactRiskPanel from "@/src/components/alerts/GeoImpactRiskPanel";
import { fetchIndoreAqi } from "@/src/services/aqiService";
import { fetchAirNews } from "@/src/services/newsService";

export default function AlertCenter() {
  const [aqi, setAqi] = useState(0);
  const [articles, setArticles] = useState([]);
  useEffect(() => {
    fetchIndoreAqi().then((d) => setAqi(d?.aqi || 0)).catch(console.error);
    fetchAirNews().then(setArticles).catch(console.error);
  }, []);
  return (
    <div className="stack-lg">
      <AirQualityAlerts articles={articles} />
      <GeoImpactRiskPanel currentAqi={aqi} showNews={false} />
    </div>
  );
}
