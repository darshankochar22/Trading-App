"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import MarketTable from "@/components/ui/MarketTable";
import type { MarketStock } from "@/types/market";

type IndexApi = {
  ok: boolean;
  name?: string;
  stocks?: MarketStock[];
  breadth?: { advances: number; declines: number; unchanged: number; total: number };
  asOf?: string;
  message?: string;
};

const KEY_TO_NSE_INDEX: Record<string, string> = {
  "nifty-50": "NIFTY 50",
  "nifty-bank": "NIFTY BANK",
  "nifty-next-50": "NIFTY NEXT 50",
  "nifty-midcap-100": "NIFTY MIDCAP 100",
  "s-p-bse-sensex": "S&P BSE SENSEX",
  "nifty-fin-service": "NIFTY FIN SERVICE",
  "nifty-it": "NIFTY IT",
};

function pickIndexName(key: string) {
  return KEY_TO_NSE_INDEX[key] ?? key.replace(/-/g, " ").toUpperCase();
}

export default function IndexDetailsPage() {
  const params = useParams<{ key: string }>();
  const key = params?.key ?? "nifty-50";
  const indexName = useMemo(() => pickIndexName(String(key)), [key]);

  const [stocks, setStocks] = useState<MarketStock[]>([]);
  const [name, setName] = useState(indexName);
  const [breadth, setBreadth] = useState<IndexApi["breadth"] | null>(null);
  const [asOf, setAsOf] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/market/index?name=${encodeURIComponent(indexName)}`, { cache: "no-store" });
        const json: IndexApi = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.message ?? "Failed to load index");
        }
        if (!active) return;
        setName(json.name ?? indexName);
        setStocks(json.stocks ?? []);
        setBreadth(json.breadth ?? null);
        setAsOf(json.asOf ?? "");
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load index");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [indexName]);

  const topGainers = useMemo(() => [...stocks].sort((a, b) => b.pChange - a.pChange).slice(0, 5), [stocks]);
  const topLosers = useMemo(() => [...stocks].sort((a, b) => a.pChange - b.pChange).slice(0, 5), [stocks]);

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Index</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">{name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Constituents, movers, and market breadth from NSE.{" "}
            {asOf ? `Updated ${new Date(asOf).toLocaleTimeString()}` : null}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Back to dashboard
          </Link>
          <Link
            href="/dashboard/trade"
            className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-zinc-900"
          >
            Open trade
          </Link>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Constituents</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{stocks.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Advances</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{breadth?.advances ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Declines</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">{breadth?.declines ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Unchanged</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{breadth?.unchanged ?? 0}</p>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Top gainers</h2>
          <ul className="mt-3 space-y-2">
            {topGainers.map((s) => (
              <li key={s.symbol} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50">
                <div>
                  <Link href={`/dashboard/stocks/${s.symbol}`} className="text-sm font-medium text-gray-900 hover:underline">
                    {s.symbol}
                  </Link>
                  <p className="text-xs text-gray-500">{s.companyName}</p>
                </div>
                <p className="text-sm font-semibold text-emerald-700">+{s.pChange.toFixed(2)}%</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Top losers</h2>
          <ul className="mt-3 space-y-2">
            {topLosers.map((s) => (
              <li key={s.symbol} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-gray-50">
                <div>
                  <Link href={`/dashboard/stocks/${s.symbol}`} className="text-sm font-medium text-gray-900 hover:underline">
                    {s.symbol}
                  </Link>
                  <p className="text-xs text-gray-500">{s.companyName}</p>
                </div>
                <p className="text-sm font-semibold text-red-600">{s.pChange.toFixed(2)}%</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8">
        {loading && stocks.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
            Loading index constituents...
          </div>
        ) : (
          <MarketTable items={stocks} title={`${name} Constituents`} />
        )}
      </section>
    </main>
  );
}

