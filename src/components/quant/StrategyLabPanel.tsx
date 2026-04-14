"use client";

import { useEffect, useMemo, useState } from "react";
import {
  runSmaCrossoverBacktest,
  type BacktestResult,
  type Candle,
} from "@/lib/quant/strategyLab";

function formatInr(v: number) {
  return v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function EquityCurve({ points }: { points: BacktestResult["equityCurve"] }) {
  const path = useMemo(() => {
    if (!points.length) return "";
    const width = 1000;
    const height = 220;
    const min = Math.min(...points.map((p) => p.equity));
    const max = Math.max(...points.map((p) => p.equity));
    const span = Math.max(max - min, 1);
    return points
      .map((p, i) => {
        const x = (i / Math.max(points.length - 1, 1)) * width;
        const y = height - ((p.equity - min) / span) * height;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [points]);

  return (
    <svg viewBox="0 0 1000 220" className="h-56 w-full rounded-xl border border-gray-200 bg-white">
      <path d={path} fill="none" stroke="#111827" strokeWidth="2.2" />
    </svg>
  );
}

export default function StrategyLabPanel() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1h");
  const [fastPeriod, setFastPeriod] = useState(9);
  const [slowPeriod, setSlowPeriod] = useState(21);
  const [capital, setCapital] = useState(100000);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feeBps, setFeeBps] = useState(5);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/crypto/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=300`,
          { cache: "no-store" },
        );
        const json = await res.json();
        if (!active) return;
        if (!json?.ok) {
          setError(json?.message ?? "Unable to load historical candles");
          return;
        }
        setCandles((json.data ?? []) as Candle[]);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Unable to load historical candles");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [symbol, interval]);

  const result = useMemo(
    () =>
      runSmaCrossoverBacktest({
        candles,
        fastPeriod,
        slowPeriod,
        initialCapital: capital,
      }),
    [candles, fastPeriod, slowPeriod, capital],
  );
  const adjustedNetPnl = useMemo(() => {
    const tradedValue = result.trades.reduce(
      (acc, t) => acc + t.entryPrice * t.qty + t.exitPrice * t.qty,
      0,
    );
    const fees = tradedValue * (feeBps / 10000);
    return result.summary.netPnl - fees;
  }, [result.trades, result.summary.netPnl, feeBps]);

  return (
    <div className="space-y-6">
      <section className="app-card rounded-2xl p-5">
        <div className="grid gap-3 md:grid-cols-6">
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option>BTCUSDT</option>
            <option>ETHUSDT</option>
            <option>BNBUSDT</option>
            <option>SOLUSDT</option>
            <option>XRPUSDT</option>
          </select>
          <select value={interval} onChange={(e) => setInterval(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>
          <input
            type="number"
            min={2}
            value={fastPeriod}
            onChange={(e) => setFastPeriod(Math.max(2, Number(e.target.value) || 2))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Fast SMA"
          />
          <input
            type="number"
            min={3}
            value={slowPeriod}
            onChange={(e) => setSlowPeriod(Math.max(3, Number(e.target.value) || 3))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Slow SMA"
          />
          <input
            type="number"
            min={1000}
            value={capital}
            onChange={(e) => setCapital(Math.max(1000, Number(e.target.value) || 1000))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Initial capital"
          />
          <input
            type="number"
            min={0}
            value={feeBps}
            onChange={(e) => setFeeBps(Math.max(0, Number(e.target.value) || 0))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Fee (bps)"
          />
        </div>
        {slowPeriod <= fastPeriod ? (
          <p className="mt-3 text-xs text-rose-700">
            Slow SMA should be greater than Fast SMA for crossover logic.
          </p>
        ) : null}
        {error ? <p className="mt-3 text-xs text-rose-700">{error}</p> : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Final Capital</p>
          <p className="mt-1 text-xl font-semibold">₹{formatInr(result.summary.finalCapital)}</p>
        </div>
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Net P&amp;L</p>
          <p className={`mt-1 text-xl font-semibold ${result.summary.netPnl >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            ₹{formatInr(result.summary.netPnl)} ({result.summary.netPnlPct.toFixed(2)}%)
          </p>
        </div>
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Net P&amp;L (After Fees)
          </p>
          <p
            className={`mt-1 text-xl font-semibold ${
              adjustedNetPnl >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            ₹{formatInr(adjustedNetPnl)}
          </p>
        </div>
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Max Drawdown</p>
          <p className="mt-1 text-xl font-semibold text-rose-700">
            {result.summary.maxDrawdownPct.toFixed(2)}%
          </p>
        </div>
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Win Rate</p>
          <p className="mt-1 text-xl font-semibold">
            {result.summary.winRatePct.toFixed(2)}% ({result.summary.totalTrades} trades)
          </p>
        </div>
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Profit Factor</p>
          <p className="mt-1 text-xl font-semibold">
            {result.summary.profitFactor.toFixed(2)}
          </p>
        </div>
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Benchmark Return (Buy &amp; Hold)
          </p>
          <p
            className={`mt-1 text-xl font-semibold ${
              result.summary.benchmarkReturnPct >= 0
                ? "text-emerald-700"
                : "text-rose-700"
            }`}
          >
            {result.summary.benchmarkReturnPct.toFixed(2)}%
          </p>
        </div>
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Sharpe-like (trade returns)
          </p>
          <p className="mt-1 text-xl font-semibold">
            {result.summary.sharpeLike.toFixed(2)}
          </p>
        </div>
      </section>

      <section className="app-card rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Equity Curve</h3>
          {loading ? <span className="text-xs text-gray-500">Loading candles...</span> : null}
        </div>
        <EquityCurve points={result.equityCurve} />
      </section>

      <section className="app-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900">Recent Backtest Trades</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="py-2">Entry</th>
                <th className="py-2">Exit</th>
                <th className="py-2 text-right">Entry Price</th>
                <th className="py-2 text-right">Exit Price</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {result.trades.length ? (
                result.trades.slice(-12).reverse().map((t) => (
                  <tr key={`${t.entryTime}-${t.exitTime}`} className="border-t border-gray-100">
                    <td className="py-2">{new Date(t.entryTime).toLocaleString()}</td>
                    <td className="py-2">{new Date(t.exitTime).toLocaleString()}</td>
                    <td className="py-2 text-right">{t.entryPrice.toFixed(3)}</td>
                    <td className="py-2 text-right">{t.exitPrice.toFixed(3)}</td>
                    <td className="py-2 text-right">{t.qty.toFixed(4)}</td>
                    <td className={`py-2 text-right font-medium ${t.pnl >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      ₹{formatInr(t.pnl)} ({t.pnlPct.toFixed(2)}%)
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-gray-100">
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    No trades generated with current parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
