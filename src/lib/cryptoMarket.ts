import { fetchBinance, sanitizeSymbol } from "@/lib/binance";

type MarketRow = {
  symbol: string;
  price: number;
  changePercent24h: number;
  quoteVolume: number;
};

type KlineRow = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

async function fetchJson(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function toKucoinSymbol(symbol: string) {
  const clean = sanitizeSymbol(symbol);
  if (clean.endsWith("USDT")) return `${clean.slice(0, -4)}-USDT`;
  if (clean.endsWith("USDC")) return `${clean.slice(0, -4)}-USDC`;
  return clean;
}

function kucoinType(interval: string) {
  if (interval === "1m") return "1min";
  if (interval === "5m") return "5min";
  if (interval === "15m") return "15min";
  if (interval === "1h") return "1hour";
  if (interval === "4h") return "4hour";
  return "1day";
}

export async function getMarkets(quote: string, limit: number) {
  try {
    const tickers = (await fetchBinance("/api/v3/ticker/24hr")) as Array<{
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
      quoteVolume: string;
    }>;
    const data = tickers
      .filter((t) => t.symbol.endsWith(quote))
      .map((t) => ({
        symbol: t.symbol,
        price: Number(t.lastPrice),
        changePercent24h: Number(t.priceChangePercent),
        quoteVolume: Number(t.quoteVolume),
      }))
      .sort((a, b) => b.quoteVolume - a.quoteVolume)
      .slice(0, limit);
    return { provider: "binance", data };
  } catch {
    const json = (await fetchJson("https://api.kucoin.com/api/v1/market/allTickers")) as {
      data?: { ticker?: Array<{ symbol: string; last: string; changeRate: string; volValue: string }> };
    };
    const data = (json.data?.ticker ?? [])
      .filter((t) => t.symbol.endsWith(`-${quote}`))
      .map((t) => ({
        symbol: t.symbol.replace("-", ""),
        price: Number(t.last),
        changePercent24h: Number(t.changeRate) * 100,
        quoteVolume: Number(t.volValue),
      }))
      .sort((a, b) => b.quoteVolume - a.quoteVolume)
      .slice(0, limit);
    return { provider: "kucoin", data };
  }
}

export async function getKlines(symbol: string, interval: string, limit: number) {
  const clean = sanitizeSymbol(symbol);
  try {
    const rows = (await fetchBinance(
      `/api/v3/klines?symbol=${encodeURIComponent(clean)}&interval=${encodeURIComponent(interval)}&limit=${limit}`,
    )) as Array<[number, string, string, string, string, string]>;
    const data: KlineRow[] = rows.map((r) => ({
      openTime: r[0],
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
    }));
    return { provider: "binance", data };
  } catch {
    const pair = toKucoinSymbol(clean);
    const type = kucoinType(interval);
    const json = (await fetchJson(
      `https://api.kucoin.com/api/v1/market/candles?type=${encodeURIComponent(type)}&symbol=${encodeURIComponent(pair)}`,
    )) as { data?: Array<[string, string, string, string, string, string]> };
    const data: KlineRow[] = (json.data ?? [])
      .slice(0, limit)
      .reverse()
      .map((r) => ({
        openTime: Number(r[0]) * 1000,
        open: Number(r[1]),
        close: Number(r[2]),
        high: Number(r[3]),
        low: Number(r[4]),
        volume: Number(r[5]),
      }));
    return { provider: "kucoin", data };
  }
}

export async function getSpotPrice(fromAsset: string, toAsset: string) {
  const pair = `${sanitizeSymbol(fromAsset)}${sanitizeSymbol(toAsset)}`;
  try {
    const priceResp = (await fetchBinance(`/api/v3/ticker/price?symbol=${encodeURIComponent(pair)}`)) as {
      price: string;
    };
    return { provider: "binance", pair, rate: Number(priceResp.price) };
  } catch {
    const kucoinPair = toKucoinSymbol(pair);
    const json = (await fetchJson(
      `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${encodeURIComponent(kucoinPair)}`,
    )) as { data?: { price?: string } };
    return { provider: "kucoin", pair, rate: Number(json.data?.price ?? 0) };
  }
}

export type { MarketRow, KlineRow };
