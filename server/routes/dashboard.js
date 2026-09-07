import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getQuotes, hasQuoteProvider } from "../quotes.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const totals = db
    .prepare(
      `SELECT type, COALESCE(SUM(amount), 0) as total
       FROM transactions WHERE user_id = ? GROUP BY type`
    )
    .all(req.userId);

  const income = totals.find((t) => t.type === "income")?.total ?? 0;
  const expenses = totals.find((t) => t.type === "expense")?.total ?? 0;

  const spendingByCategory = db
    .prepare(
      `SELECT category, COALESCE(SUM(amount), 0) as total
       FROM transactions WHERE user_id = ? AND type = 'expense'
       GROUP BY category ORDER BY total DESC`
    )
    .all(req.userId);

  const holdings = db.prepare("SELECT * FROM holdings WHERE user_id = ?").all(req.userId);
  const quotes = hasQuoteProvider() ? await getQuotes(holdings.map((h) => h.symbol)) : {};

  let portfolioValue = 0;
  let portfolioCostBasis = 0;
  for (const h of holdings) {
    const price = quotes[h.symbol]?.price ?? h.manual_price ?? null;
    if (price != null) portfolioValue += price * h.shares;
    portfolioCostBasis += h.cost_basis;
  }

  res.json({
    cashFlow: { income, expenses, net: income - expenses },
    spendingByCategory,
    portfolio: {
      value: portfolioValue,
      costBasis: portfolioCostBasis,
      gain: portfolioValue - portfolioCostBasis,
      holdingCount: holdings.length,
    },
    netWorth: income - expenses + portfolioValue,
  });
});

export default router;
