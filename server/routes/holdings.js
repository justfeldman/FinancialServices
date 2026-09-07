import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getQuotes, hasQuoteProvider } from "../quotes.js";

const router = Router();
router.use(requireAuth);

function serialize(row) {
  return {
    id: row.id,
    symbol: row.symbol,
    shares: row.shares,
    costBasis: row.cost_basis,
    manualPrice: row.manual_price,
    createdAt: row.created_at,
  };
}

async function withQuotes(holdings) {
  const quotes = hasQuoteProvider() ? await getQuotes(holdings.map((h) => h.symbol)) : {};

  return holdings.map((h) => {
    const quote = quotes[h.symbol];
    const livePrice = quote?.price ?? null;
    const price = livePrice ?? h.manualPrice ?? null;
    const value = price != null ? price * h.shares : null;
    const gain = value != null ? value - h.costBasis : null;

    return {
      ...h,
      livePrice,
      priceSource: livePrice != null ? "live" : h.manualPrice != null ? "manual" : "unavailable",
      quoteError: quote?.error ?? (hasQuoteProvider() ? null : "no_api_key"),
      currentValue: value,
      gain,
      gainPercent: value != null && h.costBasis > 0 ? (gain / h.costBasis) * 100 : null,
    };
  });
}

router.get("/", async (req, res) => {
  const rows = db
    .prepare("SELECT * FROM holdings WHERE user_id = ? ORDER BY symbol ASC")
    .all(req.userId);
  res.json(await withQuotes(rows.map(serialize)));
});

router.post("/", (req, res) => {
  const { symbol, shares, costBasis, manualPrice } = req.body || {};

  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({ error: "symbol is required" });
  }
  const numericShares = Number(shares);
  if (!Number.isFinite(numericShares) || numericShares <= 0) {
    return res.status(400).json({ error: "shares must be a positive number" });
  }
  const numericCostBasis = Number(costBasis);
  if (!Number.isFinite(numericCostBasis) || numericCostBasis < 0) {
    return res.status(400).json({ error: "costBasis must be a non-negative number" });
  }
  const numericManualPrice =
    manualPrice === undefined || manualPrice === null || manualPrice === ""
      ? null
      : Number(manualPrice);
  if (numericManualPrice != null && (!Number.isFinite(numericManualPrice) || numericManualPrice < 0)) {
    return res.status(400).json({ error: "manualPrice must be a non-negative number" });
  }

  const result = db
    .prepare(
      `INSERT INTO holdings (user_id, symbol, shares, cost_basis, manual_price)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(req.userId, symbol.toUpperCase(), numericShares, numericCostBasis, numericManualPrice);

  const row = db.prepare("SELECT * FROM holdings WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(row && serialize(row));
});

router.delete("/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM holdings WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.userId);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Holding not found" });
  }
  res.status(204).end();
});

export default router;
