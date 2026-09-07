import { Router } from "express";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function serialize(row) {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    category: row.category,
    description: row.description,
    occurredOn: row.occurred_on,
    createdAt: row.created_at,
  };
}

router.get("/", (req, res) => {
  const rows = db
    .prepare(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY occurred_on DESC, id DESC"
    )
    .all(req.userId);
  res.json(rows.map(serialize));
});

router.post("/", (req, res) => {
  const { type, amount, category, description, occurredOn } = req.body || {};

  if (!["income", "expense"].includes(type)) {
    return res.status(400).json({ error: "type must be 'income' or 'expense'" });
  }
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }
  if (!category || typeof category !== "string") {
    return res.status(400).json({ error: "category is required" });
  }
  if (!occurredOn || Number.isNaN(Date.parse(occurredOn))) {
    return res.status(400).json({ error: "occurredOn must be a valid date" });
  }

  const result = db
    .prepare(
      `INSERT INTO transactions (user_id, type, amount, category, description, occurred_on)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.userId, type, numericAmount, category, description || null, occurredOn);

  const row = db.prepare("SELECT * FROM transactions WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(serialize(row));
});

router.delete("/:id", (req, res) => {
  const result = db
    .prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.userId);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Transaction not found" });
  }
  res.status(204).end();
});

export default router;
