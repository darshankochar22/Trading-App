"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar/Navbar";

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

function MiniLineChart({ data }: { data: Kline[] }) {
  const points = useMemo(() => {
    if (!data.length) return "";
    const width = 1000;
    const height = 320;
    const closes = data.map((d) => d.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const span = max - min || 1;
    return data
      .map((d, i) => {
        const x = (i / Math.max(data.length - 1, 1)) * width;
        const y = height - ((d.close - min) / span) * height;
        return `${x},${y}`;
      })
      .join(" ");
  }, [data]);

  return (
    <svg viewBox="0 0 1000 320" className="h-72 w-full rounded-lg border border-gray-200 bg-white">
      <polyline fill="none" stroke="#111827" strokeWidth="2.5" points={points} />
    </svg>
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

  useEffect(() => {
    let active = true;
    async function loadMarkets() {
      try {
        const res = await fetch("/api/crypto/markets?quote=USDT&limit=30", { cache: "no-store" });
        const json = await res.json();
        if (!active || !json?.ok) return;
        setMarkets(json.data ?? []);
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
      const res = await fetch(`/api/crypto/klines?symbol=${encodeURIComponent(selectedSymbol)}&interval=${interval}&limit=160`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!active || !json?.ok) return;
      setKlines(json.data ?? []);
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
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-6 py-8">
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
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Market Graph</h2>
              <div className="flex gap-2">
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
            <div className="mt-4">{loading ? <div className="h-72 animate-pulse rounded-lg bg-gray-100" /> : <MiniLineChart data={klines} />}</div>
            {selectedMarket ? (
              <p className="mt-3 text-sm text-gray-700">
                Last: <span className="font-medium">${selectedMarket.price.toFixed(4)}</span> | 24h:{" "}
                <span className={selectedMarket.changePercent24h >= 0 ? "text-emerald-700" : "text-rose-700"}>
                  {selectedMarket.changePercent24h.toFixed(2)}%
                </span>
              </p>
            ) : null}
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
      </main>
    </div>
  );
}
