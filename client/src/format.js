export function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, { style: "currency", currency: "USD" });
}
