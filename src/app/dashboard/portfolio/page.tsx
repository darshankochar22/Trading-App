"use client";

import { useEffect, useState } from "react";
import DashboardHero from "@/components/dashboard/DashboardHero";
import AppContainer from "@/components/ui/AppContainer";
import type { PortfolioSnapshot } from "@/types/trading";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const res = await fetch("/api/trading/portfolio", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "Failed to load portfolio");
      setPortfolio(json.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh portfolio");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const bootstrapId = setTimeout(() => {
      void load();
    }, 0);
    const id = setInterval(load, 8000);
    return () => {
      clearTimeout(bootstrapId);
      clearInterval(id);
    };
  }, []);

  return (
    <AppContainer as="main" className="max-w-7xl py-10">
      <DashboardHero
        eyebrow="Portfolio Intelligence"
        title="Portfolio"
        description="Track holdings, P&L, and cash from executed trades with live updates."
      />
      <p className="mt-2 inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 shadow-sm">
        Auto-refresh every 8s
      </p>
      {error ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}

      {portfolio ? (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Cash" value={portfolio.cash} />
            <Card title="Invested" value={portfolio.invested} />
            <Card title="Current Value" value={portfolio.currentValue} />
            <Card title="Total P&L" value={portfolio.totalPnl} percent={portfolio.totalPnlPercent} />
            <Card title="Unrealized P&L" value={portfolio.unrealizedPnl ?? portfolio.totalPnl} />
            <Card title="Realized P&L" value={portfolio.realizedPnl ?? 0} />
            <Card title="Net P&L" value={portfolio.netPnl ?? (portfolio.totalPnl + (portfolio.realizedPnl ?? 0))} />
          </section>

          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Holdings</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-xs uppercase text-gray-500">
                  <tr>
                    <th className="py-2">Symbol</th>
                    <th className="py-2">Qty</th>
                    <th className="py-2">Avg</th>
                    <th className="py-2">LTP</th>
                    <th className="py-2">Invested</th>
                    <th className="py-2">Current</th>
                    <th className="py-2">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map((h) => (
                    <tr key={h.symbol} className="border-t border-gray-100">
                      <td className="py-2 font-medium">{h.symbol}</td>
                      <td className="py-2">{h.quantity}</td>
                      <td className="py-2">{h.avgPrice.toFixed(2)}</td>
                      <td className="py-2">{h.ltp.toFixed(2)}</td>
                      <td className="py-2">{h.invested.toFixed(2)}</td>
                      <td className="py-2">{h.currentValue.toFixed(2)}</td>
                      <td className={`py-2 ${h.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {h.pnl.toFixed(2)} ({h.pnlPercent.toFixed(2)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : loading ? (
        <p className="mt-6 text-sm text-gray-500">Loading portfolio...</p>
      ) : (
        <p className="mt-6 text-sm text-gray-500">No portfolio data yet.</p>
      )}
    </AppContainer>
  );
}

function Card({ title, value, percent }: { title: string; value: number; percent?: number }) {
  const positive = value >= 0;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{value.toFixed(2)}</p>
      {typeof percent === "number" ? (
        <p className={`mt-1 text-xs ${positive ? "text-green-600" : "text-red-600"}`}>
          {positive ? "+" : ""}
          {percent.toFixed(2)}%
        </p>
      ) : null}
    </div>
  );
}
