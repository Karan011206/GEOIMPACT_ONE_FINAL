export default function SimulatorForm({ model, setModel, onRun }) {
  return (
    <div className="card">
      <h3>Simulate Scenario</h3>
      <div className="stack">
        <select value={model.eventType} onChange={(e) => setModel({ ...model, eventType: e.target.value })}>
          <option>Traffic surge (+50%)</option>
          <option>Industrial accident</option>
          <option>Crop burning nearby</option>
          <option>Rainfall event</option>
          <option>Strong wind (&gt;20 km/h)</option>
        </select>
        <label>Duration: {model.duration}h</label>
        <input type="range" min="1" max="12" value={model.duration} onChange={(e) => setModel({ ...model, duration: Number(e.target.value) })} />
        <label>Severity: {["Low", "Medium", "High"][model.severity - 1]}</label>
        <input type="range" min="1" max="3" value={model.severity} onChange={(e) => setModel({ ...model, severity: Number(e.target.value) })} />
        <button className="primary-btn" onClick={onRun}>Run Simulation</button>
      </div>
    </div>
  );
}
