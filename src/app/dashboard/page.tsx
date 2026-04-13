"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MarketIndexCard from "@/components/ui/MarketIndexCard";
import MarketTable from "@/components/ui/MarketTable";
import MoversList from "@/components/ui/MoversList";
import type {
  IpoItem,
  MarketIndex,
  MarketOverviewResponse,
  MarketStock,
  StraddleRow,
} from "@/types/market";
import type { TradingStats } from "@/types/trading";

export default function DashboardPage() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [stocks, setStocks] = useState<MarketStock[]>([]);
  const [ipos, setIpos] = useState<IpoItem[]>([]);
  const [straddleRows, setStraddleRows] = useState<StraddleRow[]>([]);
  const [asOf, setAsOf] = useState<string>("");
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [overviewRes, ipoRes, statsRes, straddleRes] = await Promise.all([
          fetch("/api/market/overview", { cache: "no-store" }),
          fetch("/api/market/ipos", { cache: "no-store" }),
          fetch("/api/trading/stats", { cache: "no-store" }),
          fetch("/api/market/straddle", { cache: "no-store" }),
        ]);
        const json: MarketOverviewResponse = await overviewRes.json();
        const ipoJson = await ipoRes.json();
        const statsJson = await statsRes.json();
        const straddleJson = await straddleRes.json();
        if (!overviewRes.ok || !json.ok) {
          throw new Error(json.message ?? "Failed to load market overview");
        }
        if (!active) return;
        setIndices(json.indices);
        setStocks(json.stocks);
        setIpos((ipoJson?.data ?? []).slice(0, 8));
        setAsOf(json.asOf);
        if (statsJson?.ok && statsJson.data) {
          setStats(statsJson.data);
        }
        if (straddleJson?.ok) {
          setStraddleRows(straddleJson.rows ?? []);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load data");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const topGainers = useMemo(
    () => [...stocks].sort((a, b) => b.pChange - a.pChange).slice(0, 5),
    [stocks],
  );
  const topLosers = useMemo(
    () => [...stocks].sort((a, b) => a.pChange - b.pChange).slice(0, 5),
    [stocks],
  );
  const topStraddles = useMemo(
    () =>
      [...straddleRows]
        .sort((a, b) => b.straddlePrice - a.straddlePrice)
        .slice(0, 8),
    [straddleRows],
  );
  const maxStraddle = useMemo(
    () =>
      topStraddles.length
        ? Math.max(...topStraddles.map((r) => r.straddlePrice))
        : 1,
    [topStraddles],
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="rounded-2xl border border-gray-200 bg-black p-6 text-white shadow-sm">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-200">
          Live Markets
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">
              Indian Market Overview
            </h1>
            <p className="mt-1 text-sm text-slate-200">
              NIFTY, SENSEX, sector indices, daily movers, broader companies,
              and IPO updates.
            </p>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-100">
            {asOf
              ? `Updated ${new Date(asOf).toLocaleTimeString()}`
              : "Updating..."}
          </div>
        </div>
      </div>

      {stats ? (
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-700">
          <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            Paper cash: ₹
            {stats.cash.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </span>
          <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            Holdings: {stats.holdingsCount}
          </span>
          <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            Trades: {stats.trades.count} (₹
            {stats.trades.totalValue.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}{" "}
            notional)
          </span>
          <span className="rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
            Orders: {stats.orders.open} open / {stats.orders.filled} filled /{" "}
            {stats.orders.cancelled} cancelled
          </span>
        </div>
      ) : null}

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Key Indices</h2>
          <p className="mt-1 text-sm text-gray-600">
            Real-time index movement snapshot.
          </p>
        </div>
        {loading ? (
          <p className="text-xs text-gray-500">Refreshing market feed...</p>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {indices.map((idx) => (
          <MarketIndexCard key={idx.key} item={idx} />
        ))}
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <MoversList title="Top Gainers" items={topGainers} positive />
        <MoversList title="Top Losers" items={topLosers} positive={false} />
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-[1fr_330px]">
        {loading && stocks.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            Loading listed companies...
          </div>
        ) : (
          <MarketTable
            items={stocks}
            title="Broad Market Companies (NIFTY 50 + NEXT 50 + MIDCAP 100 + BANK)"
          />
        )}
        <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">IPO Watch</h3>
          <p className="mt-1 text-xs text-gray-500">
            Recent and upcoming IPO windows.
          </p>
          <ul className="mt-3 space-y-2">
            {ipos.map((ipo) => (
              <li
                key={`${ipo.symbol}-${ipo.issueStartDate}`}
                className="rounded-lg border border-gray-100 p-2.5"
              >
                <p className="text-sm font-medium text-gray-900">
                  {ipo.name || ipo.symbol || "IPO"}
                </p>
                <p className="mt-1 text-xs text-gray-600">
                  {ipo.issueStartDate} to {ipo.issueEndDate}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Band: {ipo.priceBand || "-"}
                </p>
              </li>
            ))}
            {!ipos.length ? (
              <li className="text-xs text-gray-500">
                IPO feed unavailable right now.
              </li>
            ) : null}
          </ul>
        </article>
      </section>
    </main>
  );
}
