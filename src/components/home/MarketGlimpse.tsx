"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { MarketOverviewResponse, MarketStock } from "@/types/market";

export default function MarketGlimpse() {
  const [data, setData] = useState<MarketOverviewResponse | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/market/overview", { cache: "no-store" });
        const json: MarketOverviewResponse = await res.json();
        if (!res.ok || !json.ok || !active) return;
        setData(json);
      } catch {
        // Keep hero section functional even if feed fails.
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const movers = useMemo(() => {
    const stocks = data?.stocks ?? [];
    const sorted = [...stocks].sort((a, b) => Math.abs(b.pChange) - Math.abs(a.pChange));
    return sorted.slice(0, 3);
  }, [data]);

  if (!data) return null;

  return (
    <section className="mt-16 w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Live Market Glimpse</h2>
        <Link href="/dashboard" className="text-xs font-medium text-blue-600 hover:underline">
          Open full dashboard
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {data.indices.slice(0, 3).map((idx) => (
          <div key={idx.key} className="rounded-lg border border-gray-100 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">{idx.name}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{idx.value.toLocaleString("en-IN")}</p>
            <p className={`text-xs ${idx.percentChange >= 0 ? "text-green-600" : "text-red-600"}`}>
              {idx.percentChange >= 0 ? "+" : ""}
              {idx.percentChange.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Big daily movers</p>
        <ul className="mt-2 space-y-1.5">
          {movers.map((s: MarketStock) => (
            <li key={s.symbol} className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">{s.symbol}</span>
              <span className={s.pChange >= 0 ? "text-green-600" : "text-red-600"}>
                {s.pChange >= 0 ? "+" : ""}
                {s.pChange.toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
