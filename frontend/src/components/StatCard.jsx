function StatCard({ label, value, hint, tone = "default" }) {
  return (
    <article className={`tv-card card stat-card tone-${tone}`}>
      <p className="stat-label">{label}</p>
      <h3>{value}</h3>
      {hint ? <span className="stat-hint">{hint}</span> : null}
    </article>
  );
}

export default StatCard;
