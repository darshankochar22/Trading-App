"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppTopShell from "@/components/layout/AppTopShell";
import AppContainer from "@/components/ui/AppContainer";

type MarketRow = {
  symbol: string;
  price: number;
  changePercent24h: number;
  quoteVolume: number;
};

type Kline = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type CryptoOrder = {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  quantity: number;
  price: number | null;
  status: "FILLED";
  createdAt: string;
};

type TradingCandlesProps = {
  data: Kline[];
  visibleCount: number;
  hoverOpenTime: number | null;
  onHoverCandle: (candle: Kline | null) => void;
};

function TradingCandles({
  data,
  visibleCount,
  hoverOpenTime,
  onHoverCandle,
}: TradingCandlesProps) {
  const chart = useMemo(() => {
    const candles = data.slice(-visibleCount);
    if (!candles.length) {
      return { candles: [], width: 1200, height: 460, lines: [] as number[] };
    }
    const width = 1200;
    const height = 460;
    const pad = 22;
    const max = Math.max(...candles.map((d) => d.high));
    const min = Math.min(...candles.map((d) => d.low));
    const span = Math.max(max - min, 1e-9);
    const lines = [0.15, 0.35, 0.55, 0.75].map((r) => pad + (height - pad * 2) * r);

    const y = (v: number) => pad + ((max - v) / span) * (height - pad * 2);
    const slot = (width - pad * 2) / candles.length;
    const bodyWidth = Math.max(3, Math.min(10, slot * 0.6));

    return {
      width,
      height,
      lines,
      candles: candles.map((d, i) => {
        const x = pad + i * slot + slot / 2;
        const openY = y(d.open);
        const closeY = y(d.close);
        const highY = y(d.high);
        const lowY = y(d.low);
        const up = d.close >= d.open;
        return {
          key: `${d.openTime}-${i}`,
          source: d,
          x,
          openY,
          closeY,
          highY,
          lowY,
          bodyY: Math.min(openY, closeY),
          bodyH: Math.max(Math.abs(closeY - openY), 2),
          bodyWidth,
          color: up ? "#059669" : "#dc2626",
          fill: up ? "rgba(5,150,105,0.16)" : "rgba(220,38,38,0.16)",
        };
      }),
    };
  }, [data, visibleCount]);

  function emitHover(clientX: number, rect: DOMRect) {
    if (!chart.candles.length) {
      onHoverCandle(null);
      return;
    }
    const x = clientX - rect.left;
    const normalized = Math.max(0, Math.min(1, x / Math.max(rect.width, 1)));
    const idx = Math.round(normalized * (chart.candles.length - 1));
    onHoverCandle(chart.candles[idx]?.source ?? null);
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        className="h-104 w-full touch-none rounded-xl border border-gray-200 bg-white"
        onMouseLeave={() => onHoverCandle(null)}
        onTouchEnd={() => onHoverCandle(null)}
      >
        {chart.lines.map((line, idx) => (
          <line key={`grid-${idx}`} x1={12} y1={line} x2={chart.width - 12} y2={line} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        {chart.candles.map((c) => (
          <g key={c.key}>
            <line x1={c.x} y1={c.highY} x2={c.x} y2={c.lowY} stroke={c.color} strokeWidth="1.4" />
            <rect
              x={c.x - c.bodyWidth / 2}
              y={c.bodyY}
              width={c.bodyWidth}
              height={c.bodyH}
              fill={c.fill}
              stroke={c.color}
              strokeWidth="1.2"
              rx="1"
            />
          </g>
        ))}
        {hoverOpenTime ? (
          <line
            x1={chart.candles.find((c) => c.source.openTime === hoverOpenTime)?.x ?? -10}
            y1={12}
            x2={chart.candles.find((c) => c.source.openTime === hoverOpenTime)?.x ?? -10}
            y2={chart.height - 12}
            stroke="#9ca3af"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ) : null}
      </svg>
      <div
        className="absolute inset-0"
        onMouseMove={(e) => emitHover(e.clientX, e.currentTarget.getBoundingClientRect())}
        onTouchStart={(e) => {
          if (e.touches[0]) emitHover(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) emitHover(e.touches[0].clientX, e.currentTarget.getBoundingClientRect());
        }}
      />
    </div>
  );
}

export default function CryptoPage() {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("15m");
  const [klines, setKlines] = useState<Kline[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState("0.01");
  const [price, setPrice] = useState("");
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [orders, setOrders] = useState<CryptoOrder[]>([]);
  const [swapFrom, setSwapFrom] = useState("BTC");
  const [swapTo, setSwapTo] = useState("USDT");
  const [swapAmount, setSwapAmount] = useState("1");
  const [swapResult, setSwapResult] = useState<string | null>(null);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [chartError, setChartError] = useState<string | null>(null);
  const [providerLabel, setProviderLabel] = useState<string>("binance");
  const [visibleCount, setVisibleCount] = useState(120);
  const [hoveredKline, setHoveredKline] = useState<Kline | null>(null);

  useEffect(() => {
    let active = true;
    async function loadMarkets() {
      try {
        const res = await fetch("/api/crypto/markets?quote=USDT&limit=30", { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        if (!json?.ok) {
          setMarketError(json?.message ?? "Unable to load markets");
          return;
        }
        setMarkets(json.data ?? []);
        setProviderLabel(String(json.provider ?? "binance"));
        setMarketError(null);
      } catch (error) {
        if (!active) return;
        setMarketError(error instanceof Error ? error.message : "Unable to load markets");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadMarkets();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadKlines() {
      try {
        const res = await fetch(`/api/crypto/klines?symbol=${encodeURIComponent(selectedSymbol)}&interval=${interval}&limit=160`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!active) return;
        if (!json?.ok) {
          setChartError(json?.message ?? "Unable to load chart");
          return;
        }
        setKlines(json.data ?? []);
        setProviderLabel(String(json.provider ?? "binance"));
        setChartError(null);
      } catch (error) {
        if (!active) return;
        setChartError(error instanceof Error ? error.message : "Unable to load chart");
      }
    }
    void loadKlines();
    return () => {
      active = false;
    };
  }, [selectedSymbol, interval]);

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      const res = await fetch("/api/crypto/orders", { cache: "no-store" });
      const json = await res.json();
      if (!active || !json?.ok) return;
      setOrders(json.data ?? []);
    }
    void loadOrders();
    return () => {
      active = false;
    };
  }, []);

  const selectedMarket = markets.find((m) => m.symbol === selectedSymbol) ?? null;
  const latestKline = klines.length ? klines[klines.length - 1] : null;
  const previousKline = klines.length > 1 ? klines[klines.length - 2] : null;
  const activeKline = hoveredKline ?? latestKline;
  const intervalChangePct =
    activeKline && previousKline && previousKline.close !== 0
      ? ((activeKline.close - previousKline.close) / previousKline.close) * 100
      : 0;

  async function placeOrder() {
    setOrderMessage(null);
    const payload = {
      symbol: selectedSymbol,
      side,
      orderType,
      quantity: Number(quantity),
      price: orderType === "LIMIT" ? Number(price) : null,
    };
    const res = await fetch("/api/crypto/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json?.ok) {
      setOrderMessage(json?.message ?? "Unable to place order");
      return;
    }
    setOrderMessage(`${side} order executed for ${selectedSymbol}`);
    setOrders((prev) => [json.data, ...prev]);
  }

  async function getSwapQuote() {
    setSwapResult(null);
    const res = await fetch(
      `/api/crypto/swap/quote?from=${encodeURIComponent(swapFrom)}&to=${encodeURIComponent(swapTo)}&amount=${encodeURIComponent(swapAmount)}`,
      { cache: "no-store" },
    );
    const json = await res.json();
    if (!json?.ok) {
      setSwapResult(json?.message ?? "Unable to fetch quote");
      return;
    }
    setSwapResult(`${json.data.inputAmount} ${swapFrom} ≈ ${json.data.outputAmount.toFixed(6)} ${swapTo}`);
  }

  return (
    <div className="app-page">
      <AppTopShell showTicker={false} />
      <AppContainer as="main" className="max-w-7xl py-8">
        <section className="rounded-2xl border border-gray-200 bg-black p-6 text-white">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-300">Crypto Exchange</p>
          <h1 className="mt-2 text-3xl font-semibold">Integrated Crypto Trading</h1>
          <p className="mt-2 text-sm text-gray-300">
            Separate crypto system with Binance market data, independent order APIs, and shared user authentication.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/20 px-3 py-1">Frontend route: /crypto</span>
            <span className="rounded-full border border-white/20 px-3 py-1">APIs: /api/crypto/*</span>
            <span className="rounded-full border border-white/20 px-3 py-1">User auth: shared /api/auth/me</span>
            <span className="rounded-full border border-white/20 px-3 py-1">Data provider: {providerLabel}</span>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Trading Chart</h2>
              <div className="flex gap-2">
                <div className="flex items-center rounded-lg border border-gray-300 bg-white">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((v) => Math.min(200, v + 20))}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    title="Zoom out"
                  >
                    -
                  </button>
                  <span className="border-x border-gray-300 px-2 text-xs text-gray-600">
                    {visibleCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setVisibleCount((v) => Math.max(40, v - 20))}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    title="Zoom in"
                  >
                    +
                  </button>
                </div>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {markets.map((m) => (
                    <option key={m.symbol} value={m.symbol}>
                      {m.symbol}
                    </option>
                  ))}
                </select>
                <select value={interval} onChange={(e) => setInterval(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                  <option value="4h">4h</option>
                  <option value="1d">1d</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-104 animate-pulse rounded-lg bg-gray-100" />
              ) : (
                <TradingCandles
                  data={klines}
                  visibleCount={visibleCount}
                  hoverOpenTime={hoveredKline?.openTime ?? null}
                  onHoverCandle={setHoveredKline}
                />
              )}
            </div>
            {chartError ? <p className="mt-2 text-xs text-rose-700">{chartError}</p> : null}
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Last</p>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedMarket ? `$${selectedMarket.price.toFixed(4)}` : "--"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">24h Move</p>
                <p className={`text-sm font-semibold ${selectedMarket && selectedMarket.changePercent24h >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {selectedMarket ? `${selectedMarket.changePercent24h.toFixed(2)}%` : "--"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">O / H / L / C</p>
                <p className="text-sm font-semibold text-gray-900">
                  {activeKline
                    ? `${activeKline.open.toFixed(2)} / ${activeKline.high.toFixed(2)} / ${activeKline.low.toFixed(2)} / ${activeKline.close.toFixed(2)}`
                    : "--"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Interval Move</p>
                <p className={`text-sm font-semibold ${intervalChangePct >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {activeKline ? `${intervalChangePct.toFixed(2)}%` : "--"}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Candle Volume</p>
                <p className="text-sm font-semibold text-gray-900">
                  {activeKline ? activeKline.volume.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "--"}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Trade / Swap</h2>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSide("BUY")}
                  className={`rounded-lg border px-3 py-2 text-sm ${side === "BUY" ? "border-black bg-black text-white" : "border-gray-300"}`}
                >
                  Buy
                </button>
                <button
                  type="button"
                  onClick={() => setSide("SELL")}
                  className={`rounded-lg border px-3 py-2 text-sm ${side === "SELL" ? "border-black bg-black text-white" : "border-gray-300"}`}
                >
                  Sell
                </button>
              </div>

              <select value={orderType} onChange={(e) => setOrderType(e.target.value as "MARKET" | "LIMIT")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="MARKET">Market</option>
                <option value="LIMIT">Limit</option>
              </select>

              <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              {orderType === "LIMIT" ? (
                <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Limit price" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              ) : null}

              <button type="button" onClick={() => void placeOrder()} className="w-full rounded-lg bg-black px-3 py-2 text-sm font-medium text-white">
                Place {side} Order
              </button>
              {orderMessage ? <p className="text-xs text-gray-700">{orderMessage}</p> : null}
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold">Swap Quote</h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <input value={swapFrom} onChange={(e) => setSwapFrom(e.target.value.toUpperCase())} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input value={swapTo} onChange={(e) => setSwapTo(e.target.value.toUpperCase())} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                <input value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <button type="button" onClick={() => void getSwapQuote()} className="mt-2 w-full rounded-lg border border-black px-3 py-2 text-sm">
                Get Swap Quote
              </button>
              {swapResult ? <p className="mt-2 text-xs text-gray-700">{swapResult}</p> : null}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top USDT Markets</h2>
            <Link href="/dashboard/architecture" className="text-sm text-gray-600 underline">
              Architecture
            </Link>
          </div>
          {marketError ? <p className="mt-2 text-xs text-rose-700">{marketError}</p> : null}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="py-2">Pair</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">24h %</th>
                  <th className="py-2 text-right">Quote Volume</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((m) => (
                  <tr key={m.symbol} className="border-t border-gray-100">
                    <td className="py-2 font-medium">{m.symbol}</td>
                    <td className="py-2 text-right">${m.price.toFixed(4)}</td>
                    <td className={`py-2 text-right ${m.changePercent24h >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {m.changePercent24h.toFixed(2)}%
                    </td>
                    <td className="py-2 text-right">{Math.round(m.quoteVolume).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Recent Crypto Orders (separate system)</h2>
          <p className="mt-1 text-xs text-gray-600">
            These are handled via dedicated crypto APIs and isolated from existing dashboard trading endpoints.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="py-2">Time</th>
                  <th className="py-2">Pair</th>
                  <th className="py-2">Side</th>
                  <th className="py-2">Type</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length ? (
                  orders.map((o) => (
                    <tr key={o.id} className="border-t border-gray-100">
                      <td className="py-2 text-gray-600">{new Date(o.createdAt).toLocaleString()}</td>
                      <td className="py-2 font-medium">{o.symbol}</td>
                      <td className={`py-2 ${o.side === "BUY" ? "text-emerald-700" : "text-rose-700"}`}>{o.side}</td>
                      <td className="py-2">{o.orderType}</td>
                      <td className="py-2 text-right">{o.quantity}</td>
                      <td className="py-2 text-right">{o.price ? `$${o.price.toFixed(4)}` : "MARKET"}</td>
                      <td className="py-2 text-right">{o.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-gray-100">
                    <td colSpan={7} className="py-6 text-center text-gray-500">
                      No crypto orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </AppContainer>
    </div>
  );
}
