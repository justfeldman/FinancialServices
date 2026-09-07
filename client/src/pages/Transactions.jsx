import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatCurrency } from "../format.js";

const CATEGORIES = [
  "Salary",
  "Freelance",
  "Housing",
  "Groceries",
  "Transportation",
  "Utilities",
  "Entertainment",
  "Dining out",
  "Health",
  "Other",
];

const emptyForm = {
  type: "expense",
  amount: "",
  category: CATEGORIES[3],
  description: "",
  occurredOn: new Date().toISOString().slice(0, 10),
};

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    return api
      .getTransactions()
      .then(setTransactions)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.addTransaction({ ...form, amount: Number(form.amount) });
      setForm({ ...emptyForm, occurredOn: form.occurredOn });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Transactions</h1>
      {error && <div className="error-banner">{error}</div>}

      <form className="inline-form" onSubmit={handleSubmit}>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          type="date"
          value={form.occurredOn}
          onChange={(e) => setForm({ ...form, occurredOn: e.target.value })}
          required
        />
        <button type="submit">Add</button>
      </form>

      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : transactions.length === 0 ? (
        <p className="empty-state">No transactions yet — add your first one above.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th className="align-right">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.occurredOn}</td>
                <td>{t.category}</td>
                <td className="muted">{t.description || "—"}</td>
                <td className={`align-right ${t.type === "income" ? "positive" : "negative"}`}>
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </td>
                <td className="align-right">
                  <button className="btn-link" onClick={() => handleDelete(t.id)}>
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
