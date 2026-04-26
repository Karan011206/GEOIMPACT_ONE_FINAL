"use client";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getAqiColor } from "@/src/utils/aqiUtils";

export default function WeeklyChart({ data = [] }) {
  return (
    <div className="card">
      <h3>7-Day AQI Forecast</h3>
      <div style={{ height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="aqi">
              {data.map((d, i) => <Cell key={i} fill={getAqiColor(d.aqi).border} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
