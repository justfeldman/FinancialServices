import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatCurrency } from "../format.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getDashboard().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <div className="page-loading">Loading…</div>;

  const { cashFlow, spendingByCategory, portfolio, netWorth } = data;

  return (
    <div>
      <h1>Dashboard</h1>

      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-label">Net worth</div>
          <div className="stat-value">{formatCurrency(netWorth)}</div>
          <div className="stat-hint">Cash net + investments</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cash net (all time)</div>
          <div className={`stat-value ${cashFlow.net >= 0 ? "positive" : "negative"}`}>
            {formatCurrency(cashFlow.net)}
          </div>
          <div className="stat-hint">
            {formatCurrency(cashFlow.income)} in · {formatCurrency(cashFlow.expenses)} out
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Portfolio value</div>
          <div className="stat-value">{formatCurrency(portfolio.value)}</div>
          <div className={`stat-hint ${portfolio.gain >= 0 ? "positive" : "negative"}`}>
            {portfolio.gain >= 0 ? "+" : ""}
            {formatCurrency(portfolio.gain)} vs. cost basis
          </div>
        </div>
      </div>

      <section className="panel">
        <h2>Spending by category</h2>
        {spendingByCategory.length === 0 ? (
          <p className="empty-state">No expenses logged yet.</p>
        ) : (
          <ul className="bar-list">
            {spendingByCategory.map((row) => {
              const max = spendingByCategory[0].total || 1;
              const pct = Math.max(4, Math.round((row.total / max) * 100));
              return (
                <li key={row.category}>
                  <div className="bar-list-row">
                    <span>{row.category}</span>
                    <span>{formatCurrency(row.total)}</span>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
