function ChartCard({ title, subtitle, children, action }) {
  return (
    <section className="tv-card card chart-card chart-shell">
      <div className="section-head">
        <div>
          <h3 className="chart-title">{title}</h3>
          {subtitle ? <p className="section-copy">{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="chart-inner">{children}</div>
    </section>
  );
}

export default ChartCard;
