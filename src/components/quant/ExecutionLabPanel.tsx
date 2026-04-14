"use client";

import { useEffect, useMemo, useState } from "react";
import type { Candle } from "@/lib/quant/strategyLab";
import { simulateExecutionPlan } from "@/lib/quant/executionLab";

export default function ExecutionLabPanel() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("15m");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [totalQty, setTotalQty] = useState(2);
  const [sliceCount, setSliceCount] = useState(8);
  const [aggrBps, setAggrBps] = useState(8);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/crypto/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=240`,
          { cache: "no-store" },
        );
        const json = await res.json();
        if (!active) return;
        if (!json?.ok) {
          setError(json?.message ?? "Unable to load execution candles");
          return;
        }
        setCandles(json.data ?? []);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Unable to load execution candles");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [symbol, interval]);

  const plan = useMemo(
    () =>
      simulateExecutionPlan({
        candles,
        totalQty,
        slices: sliceCount,
        side,
        aggressivenessBps: aggrBps,
      }),
    [candles, totalQty, sliceCount, side, aggrBps],
  );

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
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
          </select>
          <select value={side} onChange={(e) => setSide(e.target.value as "BUY" | "SELL")} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
          <input type="number" value={totalQty} min={0.01} step={0.01} onChange={(e) => setTotalQty(Math.max(0.01, Number(e.target.value) || 0.01))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Total Qty" />
          <input type="number" value={sliceCount} min={1} max={40} onChange={(e) => setSliceCount(Math.min(40, Math.max(1, Number(e.target.value) || 1)))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Slices" />
          <input type="number" value={aggrBps} min={0} max={80} onChange={(e) => setAggrBps(Math.min(80, Math.max(0, Number(e.target.value) || 0)))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="Aggressiveness (bps)" />
        </div>
        {error ? <p className="mt-3 text-xs text-rose-700">{error}</p> : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Avg Fill Price</p>
          <p className="mt-1 text-xl font-semibold">{plan.avgFillPrice.toFixed(4)}</p>
        </div>
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Benchmark Price</p>
          <p className="mt-1 text-xl font-semibold">{plan.benchmarkPrice.toFixed(4)}</p>
        </div>
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Slippage</p>
          <p className={`mt-1 text-xl font-semibold ${plan.slippagePct <= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {plan.slippagePct.toFixed(3)}%
          </p>
        </div>
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Estimated Notional</p>
          <p className="mt-1 text-xl font-semibold">{plan.estimatedCost.toFixed(2)}</p>
        </div>
      </section>

      <section className="app-card rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Slice-by-slice execution simulation</h3>
          {loading ? <span className="text-xs text-gray-500">Refreshing candles...</span> : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="py-2">Time</th>
                <th className="py-2 text-right">Market Px</th>
                <th className="py-2 text-right">Slice Qty</th>
                <th className="py-2 text-right">Fill Px</th>
                <th className="py-2 text-right">Notional</th>
              </tr>
            </thead>
            <tbody>
              {plan.slices.length ? (
                plan.slices.map((s) => (
                  <tr key={`${s.time}-${s.qty}`} className="border-t border-gray-100">
                    <td className="py-2">{new Date(s.time).toLocaleString()}</td>
                    <td className="py-2 text-right">{s.marketPrice.toFixed(4)}</td>
                    <td className="py-2 text-right">{s.qty.toFixed(4)}</td>
                    <td className="py-2 text-right">{s.fillPrice.toFixed(4)}</td>
                    <td className="py-2 text-right">{s.notional.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-gray-100">
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    No slices generated yet.
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
