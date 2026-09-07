import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatCurrency } from "../format.js";

const emptyForm = { symbol: "", shares: "", costBasis: "", manualPrice: "" };

const QUOTE_ERROR_MESSAGES = {
  no_api_key: "Live prices are off — set ALPHAVANTAGE_API_KEY on the server to enable them.",
  rate_limited: "Market data provider rate-limited this request — showing manual price if set.",
  not_found: "Symbol not found by the market data provider.",
  fetch_failed: "Couldn't reach the market data provider — showing manual price if set.",
};

export default function Investments() {
  const [holdings, setHoldings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    return api
      .getHoldings()
      .then(setHoldings)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.addHolding({
        symbol: form.symbol.trim().toUpperCase(),
        shares: Number(form.shares),
        costBasis: Number(form.costBasis),
        manualPrice: form.manualPrice === "" ? null : Number(form.manualPrice),
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteHolding(id);
      setHoldings((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const anyMissingKey = holdings.some((h) => h.quoteError === "no_api_key");

  return (
    <div>
      <h1>Investments</h1>
      {error && <div className="error-banner">{error}</div>}
      {anyMissingKey && (
        <div className="notice-banner">{QUOTE_ERROR_MESSAGES.no_api_key}</div>
      )}

      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Symbol (e.g. AAPL)"
          value={form.symbol}
          onChange={(e) => setForm({ ...form, symbol: e.target.value })}
          required
        />
        <input
          type="number"
          step="0.0001"
          min="0.0001"
          placeholder="Shares"
          value={form.shares}
          onChange={(e) => setForm({ ...form, shares: e.target.value })}
          required
        />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Total cost basis ($)"
          value={form.costBasis}
          onChange={(e) => setForm({ ...form, costBasis: e.target.value })}
          required
        />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Manual price (fallback, optional)"
          value={form.manualPrice}
          onChange={(e) => setForm({ ...form, manualPrice: e.target.value })}
        />
        <button type="submit">Add holding</button>
      </form>

      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : holdings.length === 0 ? (
        <p className="empty-state">No holdings yet — add your first one above.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th className="align-right">Shares</th>
              <th className="align-right">Price</th>
              <th className="align-right">Value</th>
              <th className="align-right">Cost basis</th>
              <th className="align-right">Gain/loss</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr key={h.id}>
                <td>
                  {h.symbol}
                  {h.priceSource === "manual" && <span className="tag">manual</span>}
                  {h.priceSource === "unavailable" && <span className="tag warn">no price</span>}
                </td>
                <td className="align-right">{h.shares}</td>
                <td className="align-right">
                  {h.livePrice != null || h.manualPrice != null
                    ? formatCurrency(h.livePrice ?? h.manualPrice)
                    : "—"}
                </td>
                <td className="align-right">{formatCurrency(h.currentValue)}</td>
                <td className="align-right">{formatCurrency(h.costBasis)}</td>
                <td className={`align-right ${h.gain >= 0 ? "positive" : "negative"}`}>
                  {h.gain != null ? (
                    <>
                      {h.gain >= 0 ? "+" : ""}
                      {formatCurrency(h.gain)}{" "}
                      {h.gainPercent != null && `(${h.gainPercent.toFixed(1)}%)`}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="align-right">
                  <button className="btn-link" onClick={() => handleDelete(h.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
