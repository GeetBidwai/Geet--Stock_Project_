import { useState } from "react";

function PortfolioCreateForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim() || !sector.trim()) {
      setError("Portfolio name and sector are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await onSubmit({ name: name.trim(), sector: sector.trim() });
      setName("");
      setSector("");
    } catch {
      setError("Could not create portfolio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Portfolio name (e.g. Core Healthcare)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Sector (e.g. Healthcare)"
        value={sector}
        onChange={(e) => setSector(e.target.value)}
      />
      <button type="submit" disabled={saving}>
        {saving ? "Creating..." : "Create"}
      </button>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}

export default PortfolioCreateForm;
