export default function RouteInput({ form, setForm, onFind }) {
  return (
    <div className="card">
      <h3>Find Clean Air Route</h3>
      <div className="stack">
        <input value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} placeholder="From location" />
        <input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="To location" />
        <button className="primary-btn" onClick={onFind}>Find Safe Routes</button>
      </div>
    </div>
  );
}
