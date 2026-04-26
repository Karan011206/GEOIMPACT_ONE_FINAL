"use client";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { getAqiColor } from "@/src/utils/aqiUtils";

export default function AqiTrendChart({ points = [] }) {
  return (
    <div className="card trend-chart">
      <h3>📊 Today's AQI Trend</h3>
      <div style={{ height: 240 }}>
        <ResponsiveContainer>
          <BarChart data={points} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis 
              dataKey="hour" 
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ color: '#1e293b', fontWeight: 600 }}
            />
            <Bar 
              dataKey="aqi" 
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
              animationBegin={0}
            >
              {points.map((item, idx) => (
                <Cell 
                  key={idx} 
                  fill={getAqiColor(item.aqi).border}
                  className="trend-bar"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
