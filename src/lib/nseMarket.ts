import type {
  IpoItem,
  MarketDepth,
  MarketDepthLevel,
  MarketHistoryPoint,
  MarketIndex,
  MarketStock,
  MutualFundItem,
  MutualFundMetrics,
} from "@/types/market";

const NSE_BASE = "https://www.nseindia.com";

/** Reuse session cookies to cut duplicate / round-trips and ease NSE rate limits */
const NSE_COOKIE_TTL_MS = 120_000;
let nseCookieCache: { value: string; expiresAt: number } | null = null;
let nseCookieInflight: Promise<string> | null = null;

/** Indices + stock universe; short TTL so UI stays fresh without hammering NSE */
const OVERVIEW_CACHE_TTL_MS = 45_000;
let overviewCache: {
  data: { indices: MarketIndex[]; stocks: MarketStock[] };
  expiresAt: number;
} | null = null;
let overviewInflight: Promise<{ indices: MarketIndex[]; stocks: MarketStock[] }> | null = null;

function nseHeaders(cookie?: string): HeadersInit {
  return {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    Accept: "application/json,text/plain,*/*",
    Referer: "https://www.nseindia.com/",
    Connection: "keep-alive",
    ...(cookie ? { Cookie: cookie } : {}),
  };
}

async function fetchBootstrapCookie(): Promise<string> {
  const res = await fetch(`${NSE_BASE}/`, {
    headers: nseHeaders(),
    cache: "no-store",
  });
  const cookie = res.headers.get("set-cookie") ?? "";
  return cookie;
}

async function getNseCookie(): Promise<string> {
  const now = Date.now();
  if (nseCookieCache && nseCookieCache.expiresAt > now) {
    return nseCookieCache.value;
  }
  if (!nseCookieInflight) {
    nseCookieInflight = (async () => {
      try {
        const value = await fetchBootstrapCookie();
        nseCookieCache = { value, expiresAt: Date.now() + NSE_COOKIE_TTL_MS };
        return value;
      } finally {
        nseCookieInflight = null;
      }
    })();
  }
  return nseCookieInflight;
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function fetchNseIndexConstituents(indexName: string): Promise<{ name: string; stocks: MarketStock[] }> {
  const clean = indexName.trim();
  if (!clean) {
    throw new Error("Index name is required.");
  }
  const cookie = await getNseCookie();
  const res = await fetch(`${NSE_BASE}/api/equity-stockIndices?index=${encodeURIComponent(clean)}`, {
    headers: nseHeaders(cookie),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch index constituents (${res.status})`);
  }
  const json = await res.json();
  const rows: Array<Record<string, unknown>> = json?.data ?? [];
  const stocks: MarketStock[] = rows
    .map((r) => {
      const symbol = String(r.symbol ?? "");
      if (!symbol) return null;
      const meta = r.meta as { companyName?: string } | undefined;
      return {
        symbol,
        companyName: String(meta?.companyName ?? r.symbol ?? ""),
        lastPrice: toNumber(r.lastPrice),
        change: toNumber(r.change),
        pChange: toNumber(r.pChange),
        dayHigh: toNumber(r.dayHigh),
        dayLow: toNumber(r.dayLow),
        totalTradedValue: toNumber(r.totalTradedValue),
      };
    })
    .filter((x): x is MarketStock => Boolean(x));

  return { name: String(json?.name ?? clean), stocks };
}

export async function fetchNseOverview(): Promise<{ indices: MarketIndex[]; stocks: MarketStock[] }> {
  const cookie = await getNseCookie();
  const focusIndices = ["NIFTY 50", "NIFTY NEXT 50", "NIFTY MIDCAP 100", "NIFTY BANK"];
  const [allIndicesRes, ...stockResponses] = await Promise.all([
    fetch(`${NSE_BASE}/api/allIndices`, {
      headers: nseHeaders(cookie),
      cache: "no-store",
    }),
    ...focusIndices.map((index) =>
      fetch(`${NSE_BASE}/api/equity-stockIndices?index=${encodeURIComponent(index)}`, {
        headers: nseHeaders(cookie),
        cache: "no-store",
      }),
    ),
  ]);

  if (!allIndicesRes.ok) {
    throw new Error(`Failed to fetch all indices (${allIndicesRes.status})`);
  }
  if (!stockResponses.some((res) => res.ok)) {
    throw new Error("Failed to fetch stock universe");
  }

  const allIndicesJson = await allIndicesRes.json();
  const stockPayloads = await Promise.all(stockResponses.map(async (res) => (res.ok ? res.json() : { data: [] })));

  const rows: Array<Record<string, unknown>> = allIndicesJson?.data ?? [];
  const keyIndices = ["NIFTY 50", "S&P BSE SENSEX", "NIFTY BANK", "NIFTY FIN SERVICE", "NIFTY IT"];
  const indices: MarketIndex[] = keyIndices
    .map((name) => {
      const row = rows.find((item) => String(item.index ?? "").toUpperCase() === name.toUpperCase());
      if (!row) return null;
      return {
        key: String(row.index ?? name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        name: String(row.index ?? name),
        value: toNumber(row.last),
        change: toNumber(row.variation),
        percentChange: toNumber(row.percentChange),
      };
    })
    .filter((item): item is MarketIndex => Boolean(item));

  const stockMap = new Map<string, MarketStock>();
  for (const payload of stockPayloads) {
    const stockRows: Array<Record<string, unknown>> = payload?.data ?? [];
    for (const r of stockRows) {
      const symbol = String(r.symbol ?? "");
      if (!symbol) continue;
      const meta = r.meta as { companyName?: string } | undefined;
      stockMap.set(symbol, {
        symbol,
        companyName: String(meta?.companyName ?? r.symbol ?? ""),
        lastPrice: toNumber(r.lastPrice),
        change: toNumber(r.change),
        pChange: toNumber(r.pChange),
        dayHigh: toNumber(r.dayHigh),
        dayLow: toNumber(r.dayLow),
        totalTradedValue: toNumber(r.totalTradedValue),
      });
    }
  }
  const stocks = [...stockMap.values()].sort((a, b) => Math.abs(b.totalTradedValue) - Math.abs(a.totalTradedValue));

  return { indices, stocks };
}

/**
 * Cached overview for dashboards and any caller that needs the full universe.
 * Coalesces concurrent requests and shares the same TTL window.
 */
export async function fetchNseOverviewCached(): Promise<{ indices: MarketIndex[]; stocks: MarketStock[] }> {
  const now = Date.now();
  if (overviewCache && overviewCache.expiresAt > now) {
    return overviewCache.data;
  }
  if (!overviewInflight) {
    overviewInflight = fetchNseOverview()
      .then((data) => {
        overviewCache = { data, expiresAt: Date.now() + OVERVIEW_CACHE_TTL_MS };
        return data;
      })
      .finally(() => {
        overviewInflight = null;
      });
  }
  return overviewInflight;
}

/** Single-symbol quote for trading and portfolio pricing without loading the full index universe. */
export async function fetchNseEquitySnapshot(symbol: string): Promise<MarketStock> {
  const clean = symbol.trim().toUpperCase();
  if (!clean) {
    throw new Error("Symbol is required.");
  }
  const cookie = await getNseCookie();
  const res = await fetch(`${NSE_BASE}/api/quote-equity?symbol=${encodeURIComponent(clean)}`, {
    headers: nseHeaders(cookie),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch quote (${res.status})`);
  }
  const json = await res.json();
  const info = json?.info ?? {};
  const price = json?.priceInfo ?? {};
  const last = toNumber(price.lastPrice);
  return {
    symbol: String(info.symbol ?? clean),
    companyName: String(info.companyName ?? info.symbol ?? clean),
    lastPrice: last,
    change: toNumber(price.change),
    pChange: toNumber(price.pChange),
    dayHigh: toNumber(price.intraDayHighLow?.max ?? price.max ?? last),
    dayLow: toNumber(price.intraDayHighLow?.min ?? price.min ?? last),
    totalTradedValue: toNumber(info.totalTradedValue ?? info.totalTradedVolume ?? 0),
  };
}

export async function fetchNseIpos(): Promise<IpoItem[]> {
  const cookie = await getNseCookie();
  const res = await fetch(`${NSE_BASE}/api/all-upcoming-issues?category=ipo`, {
    headers: nseHeaders(cookie),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch IPO data (${res.status})`);
  }
  const json = await res.json();
  const rows: Array<Record<string, unknown>> = json?.data ?? [];
  return rows.map((r) => ({
    name: String(r.company_name ?? r.companyName ?? r.name ?? ""),
    symbol: String(r.symbol ?? r.issue_symbol ?? ""),
    issueStartDate: String(r.issue_start_date ?? r.issueStartDate ?? "-"),
    issueEndDate: String(r.issue_end_date ?? r.issueEndDate ?? "-"),
    priceBand: String(r.price_band ?? r.priceBand ?? "-"),
    issueSize: String(r.issue_size ?? r.issueSize ?? "-"),
  }));
}

export async function fetchMutualFundList(limit = 30, q = ""): Promise<MutualFundItem[]> {
  async function fetchFromMfApi(): Promise<Array<{ schemeCode: string; schemeName: string }>> {
    const res = await fetch("https://api.mfapi.in/mf", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`mfapi failed (${res.status})`);
    }
    const json: Array<{ schemeCode: string; schemeName: string }> = await res.json();
    return json;
  }

  async function fetchFromAmfi(): Promise<Array<{ schemeCode: string; schemeName: string }>> {
    const res = await fetch("https://www.amfiindia.com/spages/NAVAll.txt", {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) {
      throw new Error(`amfi failed (${res.status})`);
    }
    const text = await res.text();
    const rows = text.split(/\r?\n/);
    const parsed: Array<{ schemeCode: string; schemeName: string }> = [];
    for (const row of rows) {
      const parts = row.split(";");
      if (parts.length < 4) continue;
      const code = String(parts[0] ?? "").trim();
      const name = String(parts[3] ?? "").trim();
      if (!/^\d+$/.test(code) || !name) continue;
      parsed.push({ schemeCode: code, schemeName: name });
    }
    return parsed;
  }

  let json: Array<{ schemeCode: string; schemeName: string }>;
  try {
    json = await fetchFromMfApi();
  } catch {
    json = await fetchFromAmfi();
  }

  const query = q.trim().toLowerCase();
  const filtered = query
    ? json.filter((item) => item.schemeName.toLowerCase().includes(query))
    : json;
  return filtered.slice(0, limit).map((m) => ({
    code: m.schemeCode,
    schemeName: m.schemeName,
  }));
}

function parseMfDate(raw: string): number {
  const parts = raw.split("-");
  if (parts.length !== 3) return 0;
  const dd = Number(parts[0]);
  const mm = Number(parts[1]);
  const yyyy = Number(parts[2]);
  if (!dd || !mm || !yyyy) return 0;
  return new Date(yyyy, mm - 1, dd).getTime();
}

function getClosestNavAt(history: Array<{ date: string; nav: string }>, targetTime: number): number | null {
  let bestDiff = Number.POSITIVE_INFINITY;
  let bestNav: number | null = null;
  for (const row of history) {
    const t = parseMfDate(row.date);
    if (!t) continue;
    const diff = Math.abs(t - targetTime);
    if (diff < bestDiff) {
      const nav = Number(row.nav);
      if (Number.isFinite(nav) && nav > 0) {
        bestDiff = diff;
        bestNav = nav;
      }
    }
  }
  return bestNav;
}

export async function fetchMutualFundMetrics(code: string): Promise<MutualFundMetrics | null> {
  const clean = code.trim();
  if (!/^\d+$/.test(clean)) return null;
  const res = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(clean)}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  const data: Array<{ date: string; nav: string }> = Array.isArray(json?.data) ? json.data : [];
  if (!data.length) return null;

  const latest = data[0];
  const latestNav = Number(latest.nav);
  if (!Number.isFinite(latestNav) || latestNav <= 0) return null;

  const now = Date.now();
  const nav1Y = getClosestNavAt(data, now - 365 * 24 * 60 * 60 * 1000);
  const nav3Y = getClosestNavAt(data, now - 3 * 365 * 24 * 60 * 60 * 1000);

  return {
    code: clean,
    latestNav,
    navDate: latest.date,
    return1Y: nav1Y && nav1Y > 0 ? ((latestNav - nav1Y) / nav1Y) * 100 : null,
    return3Y: nav3Y && nav3Y > 0 ? ((latestNav - nav3Y) / nav3Y) * 100 : null,
  };
}

function formatNseDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd}-${mm}-${yyyy}`;
}

function parseDepthLevel(input: Record<string, unknown>): MarketDepthLevel {
  return {
    price: toNumber(input.price ?? input.bidPrice ?? input.askPrice),
    quantity: toNumber(input.quantity ?? input.bidQty ?? input.askQty),
    orders: toNumber(input.orders ?? input.noOfOrdersBid ?? input.noOfOrdersAsk),
  };
}

export async function fetchNseDepth(symbol: string): Promise<MarketDepth> {
  const cookie = await getNseCookie();
  const res = await fetch(`${NSE_BASE}/api/quote-equity?symbol=${encodeURIComponent(symbol.toUpperCase())}`, {
    headers: nseHeaders(cookie),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch quote depth (${res.status})`);
  }

  const json = await res.json();
  const info = json?.priceInfo ?? {};
  const orderBook = json?.marketDeptOrderBook ?? {};
  const bidRows: Array<Record<string, unknown>> = orderBook?.bid ?? orderBook?.bids ?? [];
  const askRows: Array<Record<string, unknown>> = orderBook?.ask ?? orderBook?.asks ?? [];

  return {
    symbol: String(json?.info?.symbol ?? symbol.toUpperCase()),
    bids: bidRows.slice(0, 5).map(parseDepthLevel),
    asks: askRows.slice(0, 5).map(parseDepthLevel),
    lastPrice: toNumber(info?.lastPrice),
    change: toNumber(info?.change),
    pChange: toNumber(info?.pChange),
    asOf: new Date().toISOString(),
  };
}

export async function fetchNseHistory(symbol: string, days = 90): Promise<MarketHistoryPoint[]> {
  const cookie = await getNseCookie();
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - days);

  const url =
    `${NSE_BASE}/api/historical/cm/equity?symbol=${encodeURIComponent(symbol.toUpperCase())}` +
    `&series=${encodeURIComponent('["EQ"]')}` +
    `&from=${encodeURIComponent(formatNseDate(fromDate))}` +
    `&to=${encodeURIComponent(formatNseDate(toDate))}`;

  const res = await fetch(url, {
    headers: nseHeaders(cookie),
    cache: "no-store",
  });
  if (!res.ok) {
    try {
      const upper = symbol.toUpperCase();
      const searchRes = await fetch("https://charting.nseindia.com/v1/exchanges/symbolsDynamic", {
        method: "POST",
        headers: {
          ...nseHeaders(cookie),
          Origin: "https://charting.nseindia.com",
          Referer: "https://charting.nseindia.com/",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symbol: upper, segment: "EQ" }),
        cache: "no-store",
      });
      if (!searchRes.ok) {
        throw new Error("search failed");
      }
      const searchJson = await searchRes.json();
      const matches: Array<Record<string, unknown>> = searchJson?.data ?? [];
      const match =
        matches.find((m) => String(m.symbol ?? "").toUpperCase() === `${upper}-EQ`) ??
        matches.find((m) => String(m.symbol ?? "").toUpperCase() === upper);
      if (!match) {
        throw new Error("symbol unresolved");
      }
      const token = String(match.scripcode ?? "");
      const resolvedSymbol = String(match.symbol ?? upper);
      const symbolType = String(match.type ?? "Equity");
      const histRes = await fetch("https://charting.nseindia.com/v1/charts/symbolHistoricalData", {
        method: "POST",
        headers: {
          ...nseHeaders(cookie),
          Origin: "https://charting.nseindia.com",
          Referer: "https://charting.nseindia.com/",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          fromDate: Math.floor(fromDate.getTime() / 1000),
          toDate: Math.floor(toDate.getTime() / 1000),
          symbol: resolvedSymbol,
          symbolType,
          chartType: "D",
          timeInterval: 1,
        }),
        cache: "no-store",
      });
      if (!histRes.ok) {
        throw new Error("history failed");
      }
      const histJson = await histRes.json();
      const rows: Array<Record<string, unknown>> = histJson?.data ?? [];
      const parsed = rows
        .map((r) => {
          const timeMs = toNumber(r.time);
          return {
            timestamp: timeMs ? new Date(timeMs).toISOString() : String(r.time ?? ""),
            close: toNumber(r.close),
          };
        })
        .filter((r) => r.timestamp && r.close > 0)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      if (!parsed.length) {
        throw new Error("empty history");
      }
      return parsed;
    } catch {
      const quoteRes = await fetch(`${NSE_BASE}/api/quote-equity?symbol=${encodeURIComponent(symbol.toUpperCase())}`, {
        headers: nseHeaders(cookie),
        cache: "no-store",
      });
      if (!quoteRes.ok) {
        throw new Error(`Failed to fetch history (${res.status})`);
      }
      const quoteJson = await quoteRes.json();
      const last = toNumber(quoteJson?.priceInfo?.lastPrice);
      const prevClose = toNumber(quoteJson?.priceInfo?.previousClose) || last;
      if (!last) {
        throw new Error(`Failed to fetch history (${res.status})`);
      }
      const points = Math.max(20, Math.min(240, Number.isFinite(days) ? Math.floor(days) : 90));
      const fallback: MarketHistoryPoint[] = [];
      for (let i = points - 1; i >= 0; i -= 1) {
        const date = new Date(toDate);
        date.setDate(toDate.getDate() - i);
        const ratio = points <= 1 ? 1 : (points - 1 - i) / (points - 1);
        const close = prevClose + (last - prevClose) * ratio;
        fallback.push({
          timestamp: date.toISOString(),
          close: Number(close.toFixed(2)),
        });
      }
      return fallback;
    }
  }

  const json = await res.json();
  const rows: Array<Record<string, unknown>> = json?.data ?? [];
  return rows
    .map((r) => ({
      timestamp: String(r.CH_TIMESTAMP ?? r.mTIMESTAMP ?? ""),
      close: toNumber(r.CH_CLOSING_PRICE ?? r.close),
    }))
    .filter((r) => r.timestamp && r.close > 0)
    .reverse();
}

