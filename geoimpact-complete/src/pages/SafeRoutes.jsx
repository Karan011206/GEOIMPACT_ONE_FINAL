"use client";
import { useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import RouteInput from "@/src/components/routes/RouteInput";
import RouteOptions from "@/src/components/routes/RouteOptions";
import { fetchIndoreAqi } from "@/src/services/aqiService";
import { getAqiColor } from "@/src/utils/aqiUtils";

export default function SafeRoutes() {
  const [form, setForm] = useState({ from: "Vijay Nagar", to: "Rajwada" });
  const [routes, setRoutes] = useState([]);

  const onFind = async () => {
    const currentAqi = (await fetchIndoreAqi().catch(() => ({ aqi: 120 })))?.aqi || 120;
    setRoutes([
      { name: "Route A (Fastest)", exposure: currentAqi + 17, time: "12 min", path: "via AB Road" },
      { name: "Route B (Cleanest)", exposure: Math.round(currentAqi * 0.63), time: "18 min", path: "via Rajwada", recommended: true },
      { name: "Route C (Balanced)", exposure: Math.round(currentAqi * 0.83), time: "14 min", path: "via Nipania" }
    ]);
  };

  return (
    <div className="grid grid-2">
      <div>
        <RouteInput form={form} setForm={setForm} onFind={onFind} />
        <RouteOptions routes={routes} />
      </div>
      <div className="card">
        <h3>Route AQI Exposure</h3>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={routes}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
              <YAxis />
              <Bar dataKey="exposure">{routes.map((r, i) => <Cell key={i} fill={getAqiColor(r.exposure).border} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
