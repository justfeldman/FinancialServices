import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/signup", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password || password.length < 8) {
    return res.status(400).json({
      error: "Email and a password of at least 8 characters are required",
    });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = db
    .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
    .run(email, passwordHash);

  const token = signToken(result.lastInsertRowid);
  res.cookie("token", token, COOKIE_OPTS);
  res.status(201).json({ id: result.lastInsertRowid, email });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user.id);
  res.cookie("token", token, COOKIE_OPTS);
  res.json({ id: user.id, email: user.email });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", COOKIE_OPTS);
  res.status(204).end();
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(req.userId);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  res.json(user);
});

export default router;
