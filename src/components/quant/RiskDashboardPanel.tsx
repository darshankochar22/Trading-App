"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExecutedTrade, PortfolioSnapshot, TradeOrder, TradingStats } from "@/types/trading";
import { buildRiskSnapshot } from "@/lib/quant/risk";

function inr(v: number) {
  return v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function RiskDashboardPanel() {
  const [portfolio, setPortfolio] = useState<PortfolioSnapshot | null>(null);
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [trades, setTrades] = useState<ExecutedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [portfolioRes, statsRes, ordersRes, tradesRes] = await Promise.all([
          fetch("/api/trading/portfolio", { cache: "no-store" }),
          fetch("/api/trading/stats", { cache: "no-store" }),
          fetch("/api/trading/orders", { cache: "no-store" }),
          fetch("/api/trading/trades", { cache: "no-store" }),
        ]);
        const portfolioJson = await portfolioRes.json();
        const statsJson = await statsRes.json();
        const ordersJson = await ordersRes.json();
        const tradesJson = await tradesRes.json();
        if (!active) return;
        if (!portfolioRes.ok || !portfolioJson?.ok) throw new Error(portfolioJson?.message ?? "Failed to load portfolio");
        if (!statsRes.ok || !statsJson?.ok) throw new Error(statsJson?.message ?? "Failed to load stats");
        if (!ordersRes.ok || !ordersJson?.ok) throw new Error(ordersJson?.message ?? "Failed to load orders");
        if (!tradesRes.ok || !tradesJson?.ok) throw new Error(tradesJson?.message ?? "Failed to load trades");
        setPortfolio(portfolioJson.data ?? null);
        setStats(statsJson.data ?? null);
        setOrders(ordersJson.data ?? []);
        setTrades(tradesJson.data ?? []);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Unable to load risk data");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const id = setInterval(load, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const tradeReturnsPct = useMemo(() => {
    return trades
      .slice(-120)
      .map((t) => (t.value !== 0 ? ((t.side === "SELL" ? 1 : -1) * t.price * t.quantity) / t.value : 0) * 100);
  }, [trades]);

  const risk = useMemo(
    () => buildRiskSnapshot({ portfolio, recentTradeReturnsPct: tradeReturnsPct }),
    [portfolio, tradeReturnsPct],
  );
  const riskFlags = useMemo(() => {
    const flags: string[] = [];
    if (risk.concentrationTop1Pct > 35) flags.push("Top-1 concentration exceeds 35%");
    if (risk.concentrationTop3Pct > 70) flags.push("Top-3 concentration exceeds 70%");
    if (risk.cashRatioPct < 15) flags.push("Cash buffer below 15%");
    if (risk.estimatedVar95Pct > 4) flags.push("Estimated 1D VaR(95%) above 4%");
    return flags;
  }, [risk]);

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Gross Exposure</p>
          <p className="mt-1 text-xl font-semibold">₹{inr(risk.grossExposure)}</p>
        </div>
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Cash Ratio</p>
          <p className="mt-1 text-xl font-semibold">{risk.cashRatioPct.toFixed(2)}%</p>
        </div>
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Top-1 Concentration</p>
          <p className="mt-1 text-xl font-semibold">{risk.concentrationTop1Pct.toFixed(2)}%</p>
        </div>
        <div className="app-card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Top-3 Concentration</p>
          <p className="mt-1 text-xl font-semibold">{risk.concentrationTop3Pct.toFixed(2)}%</p>
        </div>
      </section>

      <section className="app-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900">Value at Risk and Stress</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">Estimated 1D VaR (95%)</p>
            <p className="mt-1 text-lg font-semibold text-rose-700">
              {risk.estimatedVar95Pct.toFixed(2)}% (₹{inr(risk.estimatedVar95Amount)})
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">Stress -5%</p>
            <p className="mt-1 text-lg font-semibold text-rose-700">₹{inr(risk.stress5PctLoss)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">Stress -10%</p>
            <p className="mt-1 text-lg font-semibold text-rose-700">₹{inr(risk.stress10PctLoss)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">Stress -15%</p>
            <p className="mt-1 text-lg font-semibold text-rose-700">₹{inr(risk.stress15PctLoss)}</p>
          </div>
        </div>
      </section>

      <section className="app-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900">Risk Ops Snapshot</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">Open Orders</p>
            <p className="mt-1 text-lg font-semibold">{stats?.orders.open ?? 0}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total Orders</p>
            <p className="mt-1 text-lg font-semibold">{stats?.orders.total ?? orders.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total Trades</p>
            <p className="mt-1 text-lg font-semibold">{stats?.trades.count ?? trades.length}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
            <p className="text-xs uppercase tracking-wide text-gray-500">Holdings</p>
            <p className="mt-1 text-lg font-semibold">{stats?.holdingsCount ?? portfolio?.holdings.length ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="app-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900">Risk Flags</h3>
        {riskFlags.length ? (
          <ul className="mt-3 space-y-2">
            {riskFlags.map((flag) => (
              <li key={flag} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {flag}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            No immediate risk thresholds breached.
          </p>
        )}
      </section>

      <section className="app-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-900">Position Concentration</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="py-2">Symbol</th>
                <th className="py-2 text-right">Current Value</th>
                <th className="py-2 text-right">Weight</th>
                <th className="py-2 text-right">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {(portfolio?.holdings ?? [])
                .slice()
                .sort((a, b) => b.currentValue - a.currentValue)
                .slice(0, 12)
                .map((h) => {
                  const weight =
                    risk.grossExposure > 0
                      ? (h.currentValue / risk.grossExposure) * 100
                      : 0;
                  return (
                    <tr key={h.symbol} className="border-t border-gray-100">
                      <td className="py-2 font-medium">{h.symbol}</td>
                      <td className="py-2 text-right">₹{inr(h.currentValue)}</td>
                      <td className="py-2 text-right">{weight.toFixed(2)}%</td>
                      <td
                        className={`py-2 text-right font-medium ${
                          h.pnl >= 0 ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        ₹{inr(h.pnl)} ({h.pnlPercent.toFixed(2)}%)
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {loading ? <p className="text-sm text-gray-500">Refreshing risk feeds...</p> : null}
    </div>
  );
}
