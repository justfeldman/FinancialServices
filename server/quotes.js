const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

export function hasQuoteProvider() {
  return Boolean(process.env.ALPHAVANTAGE_API_KEY);
}

// Alpha Vantage's free tier is heavily rate-limited, so cache each symbol's
// quote for a few minutes instead of fetching on every request.
export async function getQuote(symbol) {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  if (!apiKey) {
    return { symbol, price: null, error: "no_api_key" };
  }

  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.quote;
  }

  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "GLOBAL_QUOTE");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", apiKey);

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      return { symbol, price: null, error: "fetch_failed" };
    }
    const data = await resp.json();
    const raw = data["Global Quote"]?.["05. price"];
    const price = raw ? Number(raw) : null;

    if (data.Note || data.Information) {
      // Rate limit or informational message instead of a quote.
      return { symbol, price: null, error: "rate_limited" };
    }
    if (!price) {
      return { symbol, price: null, error: "not_found" };
    }

    const quote = { symbol, price, error: null };
    cache.set(symbol, { quote, fetchedAt: Date.now() });
    return quote;
  } catch {
    return { symbol, price: null, error: "fetch_failed" };
  }
}

export async function getQuotes(symbols) {
  const unique = [...new Set(symbols)];
  const results = await Promise.all(unique.map(getQuote));
  return Object.fromEntries(results.map((q) => [q.symbol, q]));
}
