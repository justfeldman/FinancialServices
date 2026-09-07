# Finch — Personal Finance Tracker

A personal finance app: log income/expenses, track an investment portfolio
against live market prices, and see a net-worth dashboard. Single-user
accounts with email/password login.

## Stack

- **Server**: Node.js + Express, SQLite (via `better-sqlite3`), JWT auth in an
  httpOnly cookie.
- **Client**: React + Vite.
- **Market data**: [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
  `GLOBAL_QUOTE` endpoint for live investment prices. Optional — the app
  works without it, falling back to a manual price you set per holding.

## Setup

```bash
# Server
cd server
cp .env.example .env   # fill in JWT_SECRET, optionally ALPHAVANTAGE_API_KEY
npm install
npm run dev             # http://localhost:4000

# Client (separate terminal)
cd client
npm install
npm run dev              # http://localhost:5173
```

The client dev server proxies `/api` requests to the server, and the server
allows credentialed requests from `CLIENT_ORIGIN` (defaults to
`http://localhost:5173`).

### Enabling live investment prices

Sign up for a free Alpha Vantage API key and set `ALPHAVANTAGE_API_KEY` in
`server/.env`. Until it's set, the Investments page shows a banner and falls
back to any manual price you entered for a holding. Quotes are cached
server-side for 5 minutes per symbol to stay within the free tier's rate
limits.

## Notes on the data model

- **Net worth** on the dashboard is a simple proxy: all-time income minus
  all-time expenses ("cash net"), plus current portfolio value. There's no
  separate bank-account balance concept yet.
- **Cost basis** on a holding is the total amount you paid for that position
  (not a per-share figure).
- Data lives in a local SQLite file (`server/data.sqlite`, gitignored).
