"use client";
import { useState } from "react";

export default function AIChat() {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const answerLines = answer
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const bulletLines = answerLines
    .filter((line) => line.startsWith("-"))
    .map((line) => line.replace(/^-+\s*/, ""));

  const askAI = async () => {
    if (!input) return;
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
        cache: "no-store",
      });
      const raw = await res.text();
      let data: { error?: string; answer?: string };
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        setAnswer(
          res.status === 404
            ? "API not found (404). Another app may be using this port—run `npm run dev` in the geoimpact-complete folder and open the exact Local URL shown in the terminal (e.g. http://localhost:3001)."
            : `The server returned ${res.status} but not JSON. Check the terminal running Next.js.`
        );
        return;
      }
      if (!res.ok || data.error) {
        setAnswer(
          typeof data.error === "string"
            ? data.error
            : "Something went wrong. Check the server console or your API key."
        );
        return;
      }
      setAnswer(data.answer ?? "No answer returned.");
    } catch {
      setAnswer("Network error. Is the dev server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="panel-title">🤖 AI Explanation</h3>
      <p className="muted">Ask for impact analysis, scenario comparison, or short-term outlook.</p>
      <div style={{display:"flex", gap:8}}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) askAI();
          }}
          placeholder="Ask GeoImpact AI..."
        />
        <button onClick={askAI}>{loading ? "Thinking..." : "Ask"}</button>
      </div>
      {loading && <p>Analyzing global data...</p>}
      {answer && bulletLines.length > 0 && (
        <ul style={{ margin: "10px 0 0", paddingLeft: 20, lineHeight: 1.5 }}>
          {bulletLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {answer && bulletLines.length === 0 && <p>{answer}</p>}
    </div>
  );
}
