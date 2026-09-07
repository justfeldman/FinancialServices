async function request(path, options = {}) {
  const resp = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (resp.status === 204) return null;

  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    throw new Error(data?.error || `Request failed (${resp.status})`);
  }
  return data;
}

export const api = {
  signup: (email, password) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  getTransactions: () => request("/transactions"),
  addTransaction: (tx) => request("/transactions", { method: "POST", body: JSON.stringify(tx) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: "DELETE" }),

  getHoldings: () => request("/holdings"),
  addHolding: (h) => request("/holdings", { method: "POST", body: JSON.stringify(h) }),
  deleteHolding: (id) => request(`/holdings/${id}`, { method: "DELETE" }),

  getDashboard: () => request("/dashboard"),
};
