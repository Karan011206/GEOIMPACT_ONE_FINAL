"use client";
import { useEffect, useState } from "react";
import SimulatorForm from "@/src/components/simulator/SimulatorForm";
import SimulationResult from "@/src/components/simulator/SimulationResult";
import { fetchIndoreAqi } from "@/src/services/aqiService";

export default function Simulator() {
  const [baseAqi, setBaseAqi] = useState(120);
  const [model, setModel] = useState({ eventType: "Traffic surge (+50%)", duration: 4, severity: 2 });
  const [result, setResult] = useState(null);
  useEffect(() => { fetchIndoreAqi().then((d) => setBaseAqi(d?.aqi || 120)).catch(console.error); }, []);

  const onRun = () => {
    let simAqi;
    if (model.eventType === "Rainfall event") simAqi = Math.round(baseAqi * 0.6);
    else if (model.eventType === "Strong wind (>20 km/h)") simAqi = Math.round(baseAqi * 0.75);
    else {
      const multiplier = model.severity === 1 ? 1.1 : model.severity === 2 ? 1.35 : 1.6;
      simAqi = Math.round(baseAqi * multiplier);
    }
    const affectedZones = model.severity === 1 ? 3 : model.severity === 2 ? 6 : "10+";
    const advisory = simAqi > 200 ? "Emergency advisory. Issue public health alert." : simAqi > 150 ? "Health advisory. Recommend N95 masks outdoors." : simAqi > 100 ? "Monitor situation. Sensitive groups take precautions." : "No immediate action required.";
    setResult({ simAqi, affectedZones, advisory, duration: model.duration });
  };

  return <div className="grid grid-2"><SimulatorForm model={model} setModel={setModel} onRun={onRun} /><SimulationResult result={result} /></div>;
}
