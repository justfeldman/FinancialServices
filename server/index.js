import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import transactionsRoutes from "./routes/transactions.js";
import holdingsRoutes from "./routes/holdings.js";
import dashboardRoutes from "./routes/dashboard.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Copy server/.env.example to server/.env and fill it in.");
  process.exit(1);
}

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/holdings", holdingsRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
