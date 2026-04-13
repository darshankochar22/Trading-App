"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import MarketDepthWidget from "@/components/ui/MarketDepthWidget";
import type { MarketDepth, MarketHistoryPoint } from "@/types/market";

export default function StockChartPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = (params?.symbol ?? "RELIANCE").toUpperCase();

  const [history, setHistory] = useState<MarketHistoryPoint[]>([]);
  const [depth, setDepth] = useState<MarketDepth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [historyRes, depthRes] = await Promise.all([
          fetch(`/api/market/history?symbol=${encodeURIComponent(symbol)}&days=120`, { cache: "no-store" }),
          fetch(`/api/market/depth?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" }),
        ]);
        const historyJson = await historyRes.json();
        const depthJson = await depthRes.json();
        if (!historyRes.ok || !historyJson.ok) {
          throw new Error(historyJson.message ?? "Failed to load chart history");
        }
        setHistory(historyJson.data ?? []);
        setDepth(depthJson.ok ? depthJson.data : null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load symbol data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [symbol]);

  const path = useMemo(() => {
    if (history.length < 2) return "";
    const width = 900;
    const height = 280;
    const pad = 24;
    const min = Math.min(...history.map((h) => h.close));
    const max = Math.max(...history.map((h) => h.close));
    const range = max - min || 1;
    return history
      .map((h, idx) => {
        const x = pad + (idx / (history.length - 1)) * (width - pad * 2);
        const y = height - pad - ((h.close - min) / range) * (height - pad * 2);
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [history]);

  const latest = history[history.length - 1]?.close ?? 0;

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-black">{symbol} Chart</h1>
          <p className="mt-1 text-sm text-gray-600">Historical close prices with live depth data.</p>
        </div>
        <Link href="/dashboard/trade" className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
          Back to Trade
        </Link>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Price Chart (120 Days)</h2>
          <p className="text-sm font-semibold text-gray-900">Last: {latest.toFixed(2)}</p>
        </div>
        {loading ? (
          <p className="mt-3 text-sm text-gray-500">Loading chart...</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <svg viewBox="0 0 900 280" className="h-[280px] w-full min-w-[900px] rounded-xl bg-gray-50">
              <path d={path} fill="none" stroke="#2563eb" strokeWidth="2.5" />
            </svg>
          </div>
        )}
      </section>

      <div className="mt-6">
        <MarketDepthWidget depth={depth} loading={loading && !depth} />
      </div>
    </main>
  );
}

